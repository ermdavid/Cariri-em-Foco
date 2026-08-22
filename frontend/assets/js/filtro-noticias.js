document.addEventListener('DOMContentLoaded', () => {
    const linksDeCategoria = document.querySelectorAll('#menu-principal a[data-categoria], .coluna-footer a[data-categoria]');
    const cards = document.querySelectorAll('.conteudo-principal .card-noticia[data-categoria]');
    const destaque = document.querySelector('.secao-destaque');

    if (!linksDeCategoria.length || !cards.length) return;

    function aplicarFiltro(categoria) {
        cards.forEach(card => {
            card.hidden = categoria !== 'todas' && card.dataset.categoria !== categoria;
        });

        if (destaque) destaque.hidden = categoria !== 'todas';

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
