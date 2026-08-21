function criarElemento(tag, texto, classe) {
    const elemento = document.createElement(tag);
    elemento.textContent = texto || '';
    if (classe) elemento.className = classe;
    return elemento;
}

function obterUrlImagem(caminho) {
    if (!caminho) return '';
    return caminho.startsWith('/imagens/')
        ? `/api${caminho}`
        : caminho;
}

function criarCardNoticia(noticia) {
    const artigo = document.createElement('article');
    artigo.className = 'card-noticia';

    const imagemContainer = document.createElement('div');
    imagemContainer.className = 'card-imagem';
    if (noticia.imagemUrl) {
        const imagem = document.createElement('img');
        imagem.src = obterUrlImagem(noticia.imagemUrl);
        imagem.alt = noticia.titulo;
        imagemContainer.appendChild(imagem);
    }

    const conteudo = document.createElement('div');
    conteudo.className = 'card-conteudo';
    conteudo.appendChild(criarElemento('span', noticia.tipoNoticia, 'categoria-tag'));

    const titulo = criarElemento('h2', '', 'card-titulo');
    const link = document.createElement('a');
    link.href = `noticia.html?id=${encodeURIComponent(noticia.id)}`;
    link.textContent = noticia.titulo;
    titulo.appendChild(link);
    conteudo.appendChild(titulo);
    conteudo.appendChild(criarElemento('p', noticia.resumo, 'card-resumo'));

    const meta = criarElemento('footer', '', 'card-noticia-meta');
    meta.appendChild(criarElemento('span', 'Redação Cariri em Foco', 'autor-nome'));
    meta.appendChild(criarElemento('span', '•', 'divisor'));
    meta.appendChild(criarElemento('span', 'Publicado', 'autor-tempo'));
    conteudo.appendChild(meta);

    artigo.append(imagemContainer, conteudo);
    return artigo;
}

async function carregarNoticiasPublicadas() {
    const destaqueTitulo = document.querySelector('.noticia-destaque-titulo a');
    const destaqueResumo = document.querySelector('.noticia-destaque-resumo');
    const destaqueCategoria = document.querySelector('.card-conteudo-noticia-destaque .categoria-tag');
    const listaNoticias = document.querySelector('.conteudo-principal');

    try {
        const resposta = await fetch('/api/noticias');
        if (!resposta.ok) throw new Error('Não foi possível carregar as notícias.');

        const noticias = await resposta.json();
        listaNoticias.replaceChildren();

        if (noticias.length === 0) {
            destaqueTitulo.textContent = 'Nenhuma notícia publicada';
            destaqueResumo.textContent = 'As notícias publicadas aparecerão aqui.';
            return;
        }

        const destaque = noticias[0];
        destaqueCategoria.textContent = destaque.tipoNoticia || 'Notícias';
        destaqueTitulo.textContent = destaque.titulo;
        destaqueTitulo.href = `noticia.html?id=${encodeURIComponent(destaque.id)}`;
        destaqueResumo.textContent = destaque.resumo || destaque.conteudo;

        noticias.slice(1).forEach(noticia => {
            listaNoticias.appendChild(criarCardNoticia(noticia));
        });
    } catch (erro) {
        console.error('Erro ao carregar notícias:', erro);
        destaqueTitulo.textContent = 'Não foi possível carregar as notícias';
        destaqueResumo.textContent = 'Verifique se o backend está em execução.';
    }
}

carregarNoticiasPublicadas();
