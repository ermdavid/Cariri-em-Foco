document.addEventListener('DOMContentLoaded', () => {
    const linksDeCategoria = document.querySelectorAll('#menu-principal a[data-categoria], .coluna-footer a[data-categoria]');
    const cards = document.querySelectorAll('.conteudo-principal .card-noticia[data-categoria]');
    const destaque = document.querySelector('.secao-destaque');
    const categoriaDestaque = destaque?.querySelector('[data-categoria]')?.dataset.categoria;
    const main = document.querySelector('main');
    const layoutNoticias = document.querySelector('.layout-noticias');
    const conteudoPrincipal = document.querySelector('.conteudo-principal');
    const elementosCardDestaque = destaque ? {
        article: destaque.querySelector('.noticia-destaque'),
        imagem: destaque.querySelector('.destaque-imagem'),
        conteudo: destaque.querySelector('.card-conteudo-noticia-destaque'),
        titulo: destaque.querySelector('.noticia-destaque-titulo'),
        resumo: destaque.querySelector('.noticia-destaque-resumo'),
        meta: destaque.querySelector('.noticia-destaque-meta')
    } : null;

    if (!linksDeCategoria.length || !cards.length) return;

    function aplicarFiltro(categoria) {
        const modoGrade = categoria !== 'todas' && categoriaDestaque === categoria;

        if (modoGrade && conteudoPrincipal && destaque?.parentElement !== conteudoPrincipal) {
            conteudoPrincipal.prepend(destaque);
        } else if (categoria === 'todas' && main && destaque?.parentElement !== main) {
            main.insertBefore(destaque, layoutNoticias);
        }

        destaque?.classList.toggle('em-grade', modoGrade);
        if (elementosCardDestaque) {
            elementosCardDestaque.article?.classList.toggle('card-noticia', modoGrade);
            elementosCardDestaque.imagem?.classList.toggle('card-imagem', modoGrade);
            elementosCardDestaque.conteudo?.classList.toggle('card-conteudo', modoGrade);
            elementosCardDestaque.titulo?.classList.toggle('card-titulo', modoGrade);
            elementosCardDestaque.resumo?.classList.toggle('card-resumo', modoGrade);
            elementosCardDestaque.meta?.classList.toggle('card-noticia-meta', modoGrade);
        }

        cards.forEach(card => {
            card.hidden = categoria !== 'todas' && card.dataset.categoria !== categoria;
        });

        if (destaque) {
            destaque.hidden = categoria !== 'todas' && !modoGrade;
        }

        linksDeCategoria.forEach(link => {
            const selecionado = link.dataset.categoria === categoria;
            link.parentElement.classList.toggle('ativo', selecionado);
            link.setAttribute('aria-current', selecionado ? 'page' : 'false');
        });
    }

    linksDeCategoria.forEach(link => {
        link.addEventListener('click', event => {
            event.preventDefault();
            aplicarFiltro(link.dataset.categoria);
        });
    });

    const categoriaInicial = new URLSearchParams(window.location.search).get('categoria');
    if (categoriaInicial && [...linksDeCategoria].some(link => link.dataset.categoria === categoriaInicial)) {
        aplicarFiltro(categoriaInicial);
    }
});
