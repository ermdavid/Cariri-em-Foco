document.addEventListener('DOMContentLoaded', () => {
    inicializarHome();
});

async function inicializarHome() {
    try {
        await carregarNoticiasDoBanco();
    } catch (err) {
        // Se algo der errado, os cards estáticos do HTML continuam valendo.
        console.error('Não foi possível carregar as notícias do banco:', err);
    } finally {
        // O filtro precisa rodar DEPOIS que os cards (novos ou estáticos) existem.
        configurarFiltroCategorias();
    }
}

/* ------------------------------------------------------------------ *
 * Carregamento e renderização
 * ------------------------------------------------------------------ */

async function carregarNoticiasDoBanco() {
    const resposta = await fetch(`${API_URL}/noticias?per_page=30`);
    if (!resposta.ok) throw new Error(`HTTP ${resposta.status}`);

    const dados = await resposta.json();
    const registros = dados.registros || [];

    // Sem notícias no banco: não mexe no HTML, deixa o fallback estático.
    if (registros.length === 0) return;

    const destaque = registros[0];          // a mais recente vira manchete
    const demais = registros.slice(1);       // o resto vira card

    renderizarDestaque(destaque);
    renderizarCards(demais);
}

function renderizarDestaque(noticia) {
    const artigo = document.querySelector('.secao-destaque .noticia-destaque');
    if (!artigo) return;

    const slug = slugCategoria(noticia.categoria);
    artigo.dataset.categoria = slug;

    const img = artigo.querySelector('.destaque-imagem img');
    if (img) {
        img.src = noticia.imagem_url || IMAGEM_PLACEHOLDER;
        img.alt = noticia.titulo || 'Notícia em destaque';
    }

    definirTexto(artigo, '.categoria-tag', rotuloCategoria(slug));

    const linkTitulo = artigo.querySelector('.noticia-destaque-titulo a');
    if (linkTitulo) {
        linkTitulo.textContent = noticia.titulo || '';
        linkTitulo.href = `noticia.html?id=${noticia.id}`;
    }

    definirTexto(artigo, '.noticia-destaque-resumo', noticia.subtitulo || '');
    definirTexto(artigo, '.noticia-destaque-meta .autor-nome', noticia.autor || 'Redação Cariri em Foco');
    definirTexto(artigo, '.noticia-destaque-meta .autor-tempo', noticia.publicado_em || '');
}

function renderizarCards(lista) {
    const container = document.querySelector('.conteudo-principal');
    if (!container) return;

    container.innerHTML = '';

    if (lista.length === 0) return;

    lista.forEach(noticia => {
        container.appendChild(construirCard(noticia));
    });
}

function construirCard(noticia) {
    const slug = slugCategoria(noticia.categoria);

    const artigo = document.createElement('article');
    artigo.className = 'card-noticia';
    artigo.dataset.categoria = slug;

    // Imagem
    const divImagem = document.createElement('div');
    divImagem.className = 'card-imagem';
    const img = document.createElement('img');
    img.src = noticia.imagem_url || IMAGEM_PLACEHOLDER;
    img.alt = noticia.titulo || 'Notícia';
    img.loading = 'lazy';
    divImagem.appendChild(img);

    // Conteúdo
    const divConteudo = document.createElement('div');
    divConteudo.className = 'card-conteudo';

    const tag = document.createElement('span');
    tag.className = 'categoria-tag';
    tag.textContent = rotuloCategoria(slug);

    const titulo = document.createElement('h2');
    titulo.className = 'card-titulo';
    const link = document.createElement('a');
    link.href = `noticia.html?id=${noticia.id}`;
    link.textContent = noticia.titulo || '';
    titulo.appendChild(link);

    const resumo = document.createElement('p');
    resumo.className = 'card-resumo';
    resumo.textContent = noticia.subtitulo || '';

    const meta = document.createElement('footer');
    meta.className = 'card-noticia-meta';
    const autor = document.createElement('span');
    autor.className = 'autor-nome';
    autor.textContent = noticia.autor || 'Redação Cariri em Foco';
    const divisor = document.createElement('span');
    divisor.className = 'divisor';
    divisor.textContent = '•';
    const tempo = document.createElement('span');
    tempo.className = 'autor-tempo';
    tempo.textContent = noticia.publicado_em || '';
    meta.append(autor, divisor, tempo);

    divConteudo.append(tag, titulo, resumo, meta);
    artigo.append(divImagem, divConteudo);
    return artigo;
}

/* ------------------------------------------------------------------ *
 * Filtro por categoria (adaptado do antigo filtro-noticias.js)
 * ------------------------------------------------------------------ */

function configurarFiltroCategorias() {
    const links = document.querySelectorAll('#menu-principal a[data-categoria], .coluna-footer a[data-categoria]');
    const destaque = document.querySelector('.secao-destaque');
    const categoriaDestaque = destaque?.querySelector('[data-categoria]')?.dataset.categoria;

    if (!links.length) return;

    function aplicar(categoria) {
        const cards = document.querySelectorAll('.conteudo-principal .card-noticia[data-categoria]');

        cards.forEach(card => {
            card.hidden = categoria !== 'todas' && card.dataset.categoria !== categoria;
        });

        if (destaque) {
            destaque.hidden = categoria !== 'todas' && categoriaDestaque !== categoria;
        }

        links.forEach(link => {
            const ativo = link.dataset.categoria === categoria;
            link.parentElement?.classList.toggle('ativo', ativo);
            link.setAttribute('aria-current', ativo ? 'page' : 'false');
        });
    }

    links.forEach(link => {
        link.addEventListener('click', evento => {
            // Só intercepta os links da própria home (sem trocar de página).
            if (link.getAttribute('href')?.startsWith('index.html')) {
                evento.preventDefault();
                aplicar(link.dataset.categoria);
            }
        });
    });

    // Aplica filtro inicial se veio ?categoria= na URL (ex.: vindo do rodapé).
    const categoriaInicial = new URLSearchParams(window.location.search).get('categoria');
    if (categoriaInicial && [...links].some(l => l.dataset.categoria === categoriaInicial)) {
        aplicar(categoriaInicial);
    }
}

/* ------------------------------------------------------------------ *
 * Utilitários de categoria (compartilhados com a página de detalhe)
 * ------------------------------------------------------------------ */

// Normaliza a categoria vinda do banco para o "slug" que o menu usa.
// Ex.: "Esporte" -> "esportes", "Política" -> "politica".
function slugCategoria(cat) {
    if (!cat) return 'geral';
    const base = cat.toString().trim().toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, ''); // remove acentos
    const mapa = {
        'politica': 'politica',
        'economia': 'economia',
        'cultura': 'cultura',
        'esporte': 'esportes',
        'esportes': 'esportes',
        'meio ambiente': 'meio-ambiente',
        'meio-ambiente': 'meio-ambiente',
    };
    return mapa[base] || base.replace(/\s+/g, '-');
}

// Devolve o rótulo bonito (com acento) a partir do slug.
function rotuloCategoria(slug) {
    const rotulos = {
        'politica': 'Política',
        'economia': 'Economia',
        'cultura': 'Cultura',
        'esportes': 'Esporte',
        'meio-ambiente': 'Meio Ambiente',
        'geral': 'Geral',
    };
    return rotulos[slug] || (slug.charAt(0).toUpperCase() + slug.slice(1));
}

// Preenche o texto de um elemento filho, se ele existir.
function definirTexto(raiz, seletor, texto) {
    const el = raiz.querySelector(seletor);
    if (el) el.textContent = texto;
}

// Placeholder leve (SVG embutido) para notícias sem imagem.
const IMAGEM_PLACEHOLDER =
    'data:image/svg+xml;charset=UTF-8,' +
    encodeURIComponent(
        '<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400">' +
        '<rect width="600" height="400" fill="#e5e5e5"/>' +
        '<text x="50%" y="50%" font-family="sans-serif" font-size="28" fill="#9a9a9a" ' +
        'text-anchor="middle" dominant-baseline="middle">Cariri em Foco</text></svg>'
    );
