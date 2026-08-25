// Instâncias globais dos gráficos para permitir destruição e recriação dinâmica
let chartCidades = null;
let chartTipos = null;
let chartAno = null;
let chartPeriodo = null;
let chartSazonalidade = null;
let chartGenero = null;

// Controle de Paginação
let paginaAtual = 1;
const itensPorPagina = 10;

document.addEventListener('DOMContentLoaded', () => {
    inicializarDashboard();

    // Eventos de alteração nos seletores de filtro
    document.getElementById('select-cidade')?.addEventListener('change', () => {
        paginaAtual = 1;
        atualizarDashboard();
    });

    document.getElementById('select-crime')?.addEventListener('change', () => {
        paginaAtual = 1;
        atualizarDashboard();
    });

    // Eventos dos botões de paginação
    document.getElementById('btn-anterior')?.addEventListener('click', () => {
        if (paginaAtual > 1) {
            paginaAtual--;
            carregarTabela();
        }
    });

    document.getElementById('btn-proximo')?.addEventListener('click', () => {
        paginaAtual++;
        carregarTabela();
    });
});

async function inicializarDashboard() {
    await carregarFiltros();
    await atualizarDashboard();
}

// 1. Carrega as opções dos seletores de filtro vindo do banco de dados
async function carregarFiltros() {
    try {
        const res = await fetch(`${API_URL}/filtros`);
        const data = await res.json();

        const selectCidade = document.getElementById('select-cidade');
        if (selectCidade) {
            selectCidade.innerHTML = '<option value="">Todas as Cidades</option>';
            data.municipios.forEach(m => {
                selectCidade.innerHTML += `<option value="${m.id}">${m.nome}</option>`;
            });
        }

        const selectCrime = document.getElementById('select-crime');
        if (selectCrime) {
            selectCrime.innerHTML = '<option value="">Todos os Tipos</option>';
            data.categorias.forEach(c => {
                selectCrime.innerHTML += `<option value="${c.id}">${c.nome}</option>`;
            });
        }
    } catch (err) {
        console.error('Erro ao carregar filtros da API:', err);
    }
}

// Retorna os parâmetros de busca formatados para a URL
function obterParametrosFiltro() {
    const muniId = document.getElementById('select-cidade')?.value;
    const catId = document.getElementById('select-crime')?.value;

    let params = new URLSearchParams();
    if (muniId) params.append('municipio_id', muniId);
    if (catId) params.append('categoria_id', catId);

    return params.toString();
}

// Função principal que orquestra a atualização de todo o painel
async function atualizarDashboard() {
    carregarKPIs();
    carregarGraficoCidades();
    carregarGraficoTipos();
    carregarGraficoAno();
    carregarGraficoPeriodo();
    carregarGraficoSazonalidade();
    carregarPerfilVitimas();
    carregarTabela();
}

// 2. Preenche os Cards de Resumo (KPIs e Métricas)
async function carregarKPIs() {
    try {
        const query = obterParametrosFiltro();
        const possuiCrimeSelecionado = Boolean(document.getElementById('select-crime')?.value);
        const cardCrime = document.getElementById('card-kpi-crime');
        const cardIdade = document.getElementById('card-kpi-idade');
        const cardArmas = document.getElementById('card-kpi-armas');
        const cardDrogas = document.getElementById('card-kpi-drogas');

        if (cardCrime) cardCrime.hidden = false;
        if (cardIdade) cardIdade.hidden = true;
        if (cardArmas) cardArmas.hidden = true;
        if (cardDrogas) cardDrogas.hidden = true;

        // Total Geral, Armas e Drogas apreendidas
        const resKpis = await fetch(`${API_URL}/kpis?${query}`);
        const dataKpis = await resKpis.json();
        
        const elTotal = document.getElementById('kpi-total');
        if (elTotal) elTotal.innerText = (dataKpis.total_ocorrencias || 0).toLocaleString('pt-BR');

        const elArmas = document.getElementById('kpi-armas');
        const elDrogas = document.getElementById('kpi-drogas');
        if (elArmas && elDrogas) {
            const armas = Number(dataKpis.total_armas) || 0;
            const drogas = Number(dataKpis.total_drogas_kg) || 0;
            if (cardArmas) cardArmas.hidden = !possuiCrimeSelecionado || armas === 0;
            if (cardDrogas) cardDrogas.hidden = !possuiCrimeSelecionado || drogas === 0;
            elArmas.innerText = `${armas} armas`;
            elDrogas.innerText = `${drogas.toFixed(1)} kg`;
        }

        // Cidade com maior número de ocorrências
        const resMuni = await fetch(`${API_URL}/ocorrencias/municipio?${query}`);
        const dataMuni = await resMuni.json();
        const elCidadeTop = document.getElementById('kpi-cidade-top');
        if (elCidadeTop) {
            elCidadeTop.innerText = dataMuni.length > 0 ? dataMuni[0].municipio : '--';
        }

    } catch (err) {
        console.error('Erro ao carregar KPIs:', err);
    }
}

// 3. Gráfico 1: Ocorrências por Município (Barras)
async function carregarGraficoCidades() {
    try {
        const query = obterParametrosFiltro();
        const res = await fetch(`${API_URL}/ocorrencias/municipio?${query}`);
        const data = await res.json();

        const labels = data.slice(0, 10).map(item => item.municipio);
        const valores = data.slice(0, 10).map(item => item.total);

        if (chartCidades) chartCidades.destroy();

        const ctx = document.getElementById('graficoCidades')?.getContext('2d');
        if (!ctx) return;

        chartCidades = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Ocorrências',
                    data: valores,
                    backgroundColor: '#2D6A4F'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } }
            }
        });
    } catch (err) {
        console.error('Erro ao carregar gráfico de cidades:', err);
    }
}

// 4. Gráfico 2: Distribuição por Tipo de Crime (Doughnut)
async function carregarGraficoTipos() {
    try {
        const query = obterParametrosFiltro();
        const res = await fetch(`${API_URL}/ocorrencias/categoria?${query}`);
        const data = await res.json();

        const labels = data.map(item => item.categoria);
        const valores = data.map(item => item.total);

        if (chartTipos) chartTipos.destroy();

        const ctx = document.getElementById('graficoTipos')?.getContext('2d');
        if (!ctx) return;

        chartTipos = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: valores,
                    backgroundColor: [
                        '#0d6efd', '#dc3545', '#ffc107', '#0dcaf0',
                        '#6c757d', '#198754', '#6f42c1', '#fd7e14', '#20c997'
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false
            }
        });
    } catch (err) {
        console.error('Erro ao carregar gráfico de tipos:', err);
    }
}

// 5. Gráfico 3: Evolução Temporal por Ano (Linha)
async function carregarGraficoAno() {
    try {
        const query = obterParametrosFiltro();
        const res = await fetch(`${API_URL}/ocorrencias/evolucao-anual?${query}`);
        const data = await res.json();

        if (chartAno) chartAno.destroy();

        const ctx = document.getElementById('graficoEvolucaoAno')?.getContext('2d');
        if (!ctx) return;

        chartAno = new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.map(item => item.ano),
                datasets: [{
                    label: 'Ocorrências por Ano',
                    data: data.map(item => item.total),
                    borderColor: '#B8101F',
                    backgroundColor: 'rgba(184, 16, 31, 0.1)',
                    borderWidth: 2,
                    tension: 0.2,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false
            }
        });
    } catch (err) {
        console.error('Erro ao carregar gráfico de evolução anual:', err);
    }
}

// 6. Gráfico 4: Período / Turno da Ocorrência (Barras)
async function carregarGraficoPeriodo() {
    try {
        const query = obterParametrosFiltro();
        const res = await fetch(`${API_URL}/ocorrencias/periodo?${query}`);
        const data = await res.json();

        if (chartPeriodo) chartPeriodo.destroy();

        const ctx = document.getElementById('graficoPeriodo')?.getContext('2d');
        if (!ctx) return;

        chartPeriodo = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: data.map(item => item.periodo),
                datasets: [{
                    label: 'Total de Registros',
                    data: data.map(item => item.total),
                    backgroundColor: '#1A1A1A'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } }
            }
        });
    } catch (err) {
        console.error('Erro ao carregar gráfico de período:', err);
    }
}

// 7. Gráfico 5: Sazonalidade Mensal (Barras)
async function carregarGraficoSazonalidade() {
    try {
        const query = obterParametrosFiltro();
        const res = await fetch(`${API_URL}/ocorrencias/sazonalidade-mes?${query}`);
        const data = await res.json();

        if (chartSazonalidade) chartSazonalidade.destroy();

        const ctx = document.getElementById('graficoSazonalidade')?.getContext('2d');
        if (!ctx) return;

        chartSazonalidade = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: data.map(item => {
                    const mes = Number(item.mes_num);
                    return new Date(2000, mes - 1, 1).toLocaleDateString('pt-BR', { month: 'long' });
                }),
                datasets: [{
                    label: 'Volume Acumulado por Mês',
                    data: data.map(item => item.total),
                    backgroundColor: '#666666'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } }
            }
        });
    } catch (err) {
        console.error('Erro ao carregar gráfico de sazonalidade:', err);
    }
}

// 8. Gráfico 6 & KPI: Perfil das Vítimas (Gênero e Idade Média)
async function carregarPerfilVitimas() {
    try {
        const query = obterParametrosFiltro();
        const res = await fetch(`${API_URL}/ocorrencias/perfil-vitimas?${query}`);
        const data = await res.json();

        // Preenche o KPI da Idade Média
        const elIdade = document.getElementById('kpi-idade-media');
        const elCrimeTop = document.getElementById('kpi-crime-top');
        const tituloCrime = document.getElementById('titulo-kpi-crime');
        const possuiCrimeSelecionado = Boolean(document.getElementById('select-crime')?.value);
        const possuiIdadeMedia = possuiCrimeSelecionado
            && data.idade_media !== '--'
            && data.idade_media !== null;

        if (elIdade) {
            elIdade.innerText = possuiIdadeMedia
                ? `${data.idade_media} anos` 
                : '--';
        }

        if (possuiIdadeMedia && elCrimeTop && tituloCrime) {
            const cardCrime = document.getElementById('card-kpi-crime');
            if (cardCrime) cardCrime.hidden = false;
            tituloCrime.innerText = 'Idade Média da Vítima';
            elCrimeTop.innerText = `${data.idade_media} anos`;
        } else if (elCrimeTop && tituloCrime) {
            const cardCrime = document.getElementById('card-kpi-crime');
            if (!possuiCrimeSelecionado) {
                if (cardCrime) cardCrime.hidden = false;
                const resCat = await fetch(`${API_URL}/ocorrencias/categoria?${query}`);
                const dataCat = await resCat.json();
                tituloCrime.innerText = 'Crime Predominante';
                elCrimeTop.innerText = dataCat.length > 0 ? dataCat[0].categoria : '--';
            } else {
                const resKpis = await fetch(`${API_URL}/kpis?${query}`);
                const dataKpis = await resKpis.json();
                const possuiApreensao = Number(dataKpis.total_armas) > 0
                    || Number(dataKpis.total_drogas_kg) > 0;

                if (possuiApreensao) {
                    if (cardCrime) cardCrime.hidden = true;
                } else {
                    const resPeriodo = await fetch(`${API_URL}/ocorrencias/periodo?${query}`);
                    const dataPeriodo = await resPeriodo.json();
                    if (cardCrime) cardCrime.hidden = false;
                    tituloCrime.innerText = 'Turno mais perigoso';
                    elCrimeTop.innerText = dataPeriodo.length > 0 ? dataPeriodo[0].periodo : '--';
                }
            }
        }

        if (chartGenero) chartGenero.destroy();

        const ctx = document.getElementById('graficoGenero')?.getContext('2d');
        if (!ctx) return;

        chartGenero = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: data.generos.map(g => g.genero),
                datasets: [{
                    data: data.generos.map(g => g.total),
                    backgroundColor: ['#2D6A4F', '#B8101F', '#ffc107', '#6c757d']
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false
            }
        });
    } catch (err) {
        console.error('Erro ao carregar perfil das vítimas:', err);
    }
}

// 9. Preenche a Tabela Detalhada das Ocorrências com Paginação
async function carregarTabela() {
    try {
        const query = obterParametrosFiltro();
        const res = await fetch(`${API_URL}/ocorrencias/detalhada?${query}&page=${paginaAtual}&per_page=${itensPorPagina}`);
        const data = await res.json();

        const tbody = document.getElementById('tabela-corpo');
        if (!tbody) return;

        tbody.innerHTML = '';

        data.registros.forEach(item => {
            tbody.innerHTML += `
                <tr>
                    <td><strong>${item.municipio}</strong></td>
                    <td>${item.categoria}</td>
                    <td>${item.data_hora}</td>
                    <td>${item.natureza || item.meio_empregado || '-'}</td>
                </tr>
            `;
        });

        // Atualiza os controles de paginação
        const elInfoPagina = document.getElementById('info-pagina');
        if (elInfoPagina) {
            elInfoPagina.innerText = `Página ${data.pagina_atual} de ${data.total_paginas.toLocaleString('pt-BR')}`;
        }

        const btnAnt = document.getElementById('btn-anterior');
        if (btnAnt) btnAnt.disabled = data.pagina_atual <= 1;

        const btnProx = document.getElementById('btn-proximo');
        if (btnProx) btnProx.disabled = data.pagina_atual >= data.total_paginas;
    } catch (err) {
        console.error('Erro ao carregar tabela:', err);
    }
}