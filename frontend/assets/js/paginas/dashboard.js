let chartCidades = null;
let chartTipos = null;

let paginaAtual = 1;
const itensPorPagina = 10;

document.addEventListener('DOMContentLoaded', () => {
    carregarFiltros();
    atualizarDashboard();

    // Eventos nos filtros
    document.getElementById('select-cidade')?.addEventListener('change', () => {
        paginaAtual = 1;
        atualizarDashboard();
    });

    document.getElementById('select-crime')?.addEventListener('change', () => {
        paginaAtual = 1;
        atualizarDashboard();
    });

    // Controles de paginação
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

// 1. Carrega as opções de filtro vindo do banco de dados
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

// Retorna os parâmetros de query string selecionados
function obterParametrosFiltro() {
    const muniId = document.getElementById('select-cidade')?.value;
    const catId = document.getElementById('select-crime')?.value;

    let params = new URLSearchParams();
    if (muniId) params.append('municipio_id', muniId);
    if (catId) params.append('categoria_id', catId);

    return params.toString();
}

// Atualiza todos os componentes do dashboard
async function atualizarDashboard() {
    carregarKPIs();
    carregarGraficoCidades();
    carregarGraficoTipos();
    carregarTabela();
}

// 2. Preenche os cards de KPIs
async function carregarKPIs() {
    try {
        const query = obterParametrosFiltro();

        const resKpis = await fetch(`${API_URL}/kpis?${query}`);
        const dataKpis = await resKpis.json();
        
        const elTotal = document.getElementById('kpi-total');
        if (elTotal) elTotal.innerText = dataKpis.total_ocorrencias.toLocaleString('pt-BR');

        const resMuni = await fetch(`${API_URL}/ocorrencias/municipio?${query}`);
        const dataMuni = await resMuni.json();
        const elCidadeTop = document.getElementById('kpi-cidade-top');
        if (elCidadeTop) {
            elCidadeTop.innerText = dataMuni.length > 0 ? dataMuni[0].municipio : '--';
        }

        const resCat = await fetch(`${API_URL}/ocorrencias/categoria?${query}`);
        const dataCat = await resCat.json();
        const elCrimeTop = document.getElementById('kpi-crime-top');
        if (elCrimeTop) {
            elCrimeTop.innerText = dataCat.length > 0 ? dataCat[0].categoria : '--';
        }
    } catch (err) {
        console.error('Erro ao carregar KPIs:', err);
    }
}

// 3. Renderiza o gráfico de barras por Município
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
                    backgroundColor: '#198754'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                }
            }
        });
    } catch (err) {
        console.error('Erro ao carregar gráfico de cidades:', err);
    }
}

// 4. Renderiza o gráfico donut por Categoria de Crime
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

// 5. Preenche a tabela com dados paginados
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