document.addEventListener('DOMContentLoaded', () => {
    const nav = document.querySelector('nav');
    const toggle = document.querySelector('.nav-toggle');

    if (!nav || !toggle) {
        return;
    }

    toggle.addEventListener('click', () => {
        const isOpen = nav.classList.toggle('is-open');
        toggle.setAttribute('aria-expanded', String(isOpen));
        toggle.setAttribute('aria-label', isOpen ? 'Fechar menu' : 'Abrir menu');
    });
});


document.addEventListener('DOMContentLoaded', () => {
    const nav = document.querySelector('nav');
    const toggle = document.querySelector('.nav-toggle');

    if (!nav || !toggle) {
        return;
    }

    toggle.addEventListener('click', () => {
        const isOpen = nav.classList.toggle('is-open');
        toggle.setAttribute('aria-expanded', String(isOpen));
        toggle.setAttribute('aria-label', isOpen ? 'Fechar menu' : 'Abrir menu');
    });
});


const API_URL = '/api';

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

        // Total de ocorrências
        const resKpis = await fetch(`${API_URL}/kpis?${query}`);
        const dataKpis = await resKpis.json();
        
        const elTotal = document.getElementById('kpi-total');
        if (elTotal) elTotal.innerText = dataKpis.total_ocorrencias.toLocaleString('pt-BR');

        // Cidade com maior número de ocorrências
        const resMuni = await fetch(`${API_URL}/ocorrencias/municipio?${query}`);
        const dataMuni = await resMuni.json();
        const elCidadeTop = document.getElementById('kpi-cidade-top');
        if (elCidadeTop) {
            elCidadeTop.innerText = dataMuni.length > 0 ? dataMuni[0].municipio : '--';
        }

        // Crime com maior prevalência
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

        // Atualiza indicadores de paginação
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

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('form-contato');
    if (!form) {
        return;
    }

    const campos = {
        nome: document.getElementById('contato-nome'),
        email: document.getElementById('contato-email'),
        telefone: document.getElementById('contato-telefone'),
        assunto: document.getElementById('contato-assunto'),
        mensagem: document.getElementById('contato-mensagem')
    };

    const statusFormulario = document.getElementById('status-formulario');
    const contadorMensagem = document.getElementById('contador-mensagem');
    const MENSAGEM_MIN = 15;
    const MENSAGEM_MAX = 600;

    const REGEX_NOME = /^[A-Za-zÀ-ÖØ-öø-ÿ' -]{3,80}$/;
    const REGEX_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    const REGEX_TELEFONE = /^[\d\s()+-]{8,20}$/;

    // Regras de validação de cada campo. Cada função retorna uma mensagem de
    // erro (string) ou uma string vazia quando o valor é válido.
    const validadores = {
        nome(valor) {
            if (!valor.trim()) return 'Informe o seu nome.';
            if (!REGEX_NOME.test(valor.trim())) return 'Use apenas letras e espaços (mínimo 3 caracteres).';
            return '';
        },
        email(valor) {
            if (!valor.trim()) return 'Informe um e-mail para retorno.';
            if (!REGEX_EMAIL.test(valor.trim())) return 'Digite um e-mail em um formato válido, ex.: nome@email.com.';
            return '';
        },
        telefone(valor) {
            if (!valor.trim()) return ''; // campo opcional
            if (!REGEX_TELEFONE.test(valor.trim())) return 'Digite um telefone válido (apenas números, espaços, ( ) e -).';
            return '';
        },
        assunto(valor) {
            if (!valor) return 'Selecione o assunto da mensagem.';
            return '';
        },
        mensagem(valor) {
            const tamanho = valor.trim().length;
            if (!tamanho) return 'Escreva sua mensagem.';
            if (tamanho < MENSAGEM_MIN) return `Sua mensagem precisa ter pelo menos ${MENSAGEM_MIN} caracteres.`;
            if (tamanho > MENSAGEM_MAX) return `Sua mensagem pode ter no máximo ${MENSAGEM_MAX} caracteres.`;
            return '';
        }
    };

    function exibirErro(nomeCampo, mensagemErro) {
        const campo = campos[nomeCampo];
        const spanErro = document.getElementById(`erro-${nomeCampo}`);
        if (!campo) return;

        if (mensagemErro) {
            campo.classList.add('campo-invalido');
            campo.setAttribute('aria-invalid', 'true');
            if (spanErro) spanErro.textContent = mensagemErro;
        } else {
            campo.classList.remove('campo-invalido');
            campo.removeAttribute('aria-invalid');
            if (spanErro) spanErro.textContent = '';
        }
    }

    function validarCampo(nomeCampo) {
        const campo = campos[nomeCampo];
        if (!campo) return true;
        const mensagemErro = validadores[nomeCampo](campo.value);
        exibirErro(nomeCampo, mensagemErro);
        return mensagemErro === '';
    }

    // Validação em tempo real (ao sair do campo e ao digitar, quando já há erro)
    Object.keys(campos).forEach((nomeCampo) => {
        const campo = campos[nomeCampo];
        if (!campo) return;

        campo.addEventListener('blur', () => validarCampo(nomeCampo));
        campo.addEventListener('input', () => {
            if (campo.classList.contains('campo-invalido')) {
                validarCampo(nomeCampo);
            }
        });
    });

    // Contador de caracteres da mensagem
    if (campos.mensagem && contadorMensagem) {
        const atualizarContador = () => {
            const restantes = MENSAGEM_MAX - campos.mensagem.value.length;
            contadorMensagem.textContent = `${campos.mensagem.value.length}/${MENSAGEM_MAX} caracteres`;
            contadorMensagem.classList.toggle('contador-limite', restantes < 0);
        };
        campos.mensagem.addEventListener('input', atualizarContador);
        atualizarContador();
    }

    function mostrarStatus(tipo, mensagem) {
        if (!statusFormulario) return;
        statusFormulario.textContent = mensagem;
        statusFormulario.className = `status-formulario status-${tipo}`;
        statusFormulario.hidden = false;
        statusFormulario.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    form.addEventListener('submit', (evento) => {
        evento.preventDefault();

        const nomesCampos = Object.keys(campos);
        const resultados = nomesCampos.map((nomeCampo) => validarCampo(nomeCampo));
        const formularioValido = resultados.every(Boolean);

        if (!formularioValido) {
            mostrarStatus('erro', 'Não foi possível enviar. Corrija os campos destacados em vermelho.');
            const primeiroCampoInvalido = nomesCampos.find((nomeCampo) => campos[nomeCampo]?.classList.contains('campo-invalido'));
            campos[primeiroCampoInvalido]?.focus();
            return;
        }

        // Não há back-end de envio real: simulamos a confirmação para o usuário.
        const nomeDigitado = campos.nome.value.trim().split(' ')[0];
        mostrarStatus('sucesso', `Obrigado, ${nomeDigitado}! Sua mensagem foi enviada com sucesso. Nossa equipe responderá em breve pelo e-mail informado.`);

        form.reset();
        nomesCampos.forEach((nomeCampo) => exibirErro(nomeCampo, ''));
        if (contadorMensagem) contadorMensagem.textContent = `0/${MENSAGEM_MAX} caracteres`;
    });
});
