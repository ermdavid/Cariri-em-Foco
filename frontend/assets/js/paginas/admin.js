const token = localStorage.getItem('token');

if (!token) {
    window.location.href = 'login.html';
}

const headersAuth = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
};

document.addEventListener('DOMContentLoaded', () => {
    // Exibe o usuário logado
    try {
        const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');
        const el = document.getElementById('usuario-logado');
        if (el && usuario.nome) el.innerText = usuario.nome;
    } catch (e) { /* ignora */ }

    document.getElementById('btn-sair')?.addEventListener('click', sair);
    document.getElementById('form-noticia')?.addEventListener('submit', salvarNoticia);
    document.getElementById('btn-cancelar')?.addEventListener('click', limparFormulario);

    carregarNoticias();
});

function sair() {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    window.location.href = 'login.html';
}

function exibirMensagem(texto, tipo) {
    const el = document.getElementById('mensagem');
    if (!el) return;
    el.innerText = texto;
    el.className = `admin-mensagem ${tipo}`;
    el.style.display = 'block';
    setTimeout(() => { el.style.display = 'none'; }, 4000);
}

async function carregarNoticias() {
    const lista = document.getElementById('lista-noticias');
    try {
        const res = await fetch(`${API_URL}/noticias?per_page=50`);
        const data = await res.json();

        if (!data.registros || data.registros.length === 0) {
            lista.innerHTML = '<p class="carregando">Nenhuma notícia cadastrada.</p>';
            return;
        }

        lista.innerHTML = '';
        data.registros.forEach(n => {
            const item = document.createElement('div');
            item.className = 'item-noticia';
            item.innerHTML = `
                <div class="item-info">
                    <strong>${n.titulo}</strong>
                    <span>${n.categoria || 'sem editoria'} • ${n.publicado_em || ''}</span>
                </div>
                <div class="item-acoes">
                    <button class="btn-editar" data-id="${n.id}">Editar</button>
                    <button class="btn-excluir" data-id="${n.id}">Excluir</button>
                </div>
            `;
            lista.appendChild(item);
        });

        lista.querySelectorAll('.btn-editar').forEach(b =>
            b.addEventListener('click', () => editarNoticia(b.dataset.id)));
        lista.querySelectorAll('.btn-excluir').forEach(b =>
            b.addEventListener('click', () => excluirNoticia(b.dataset.id)));
    } catch (err) {
        lista.innerHTML = '<p class="carregando">Erro ao carregar notícias.</p>';
    }
}

async function salvarNoticia(e) {
    e.preventDefault();

    const id = document.getElementById('noticia-id').value;
    const payload = {
        titulo: document.getElementById('titulo').value,
        subtitulo: document.getElementById('subtitulo').value,
        categoria: document.getElementById('categoria').value,
        autor: document.getElementById('autor').value,
        imagem_url: document.getElementById('imagem_url').value,
        conteudo: document.getElementById('conteudo').value,
    };

    const url = id ? `${API_URL}/noticias/${id}` : `${API_URL}/noticias`;
    const metodo = id ? 'PUT' : 'POST';

    try {
        const res = await fetch(url, {
            method: metodo,
            headers: headersAuth,
            body: JSON.stringify(payload),
        });

        if (res.status === 401) return sair();

        const data = await res.json();
        if (res.ok) {
            exibirMensagem(data.mensagem || 'Notícia salva.', 'sucesso');
            limparFormulario();
            carregarNoticias();
        } else {
            exibirMensagem(data.erro || 'Erro ao salvar.', 'erro');
        }
    } catch (err) {
        exibirMensagem('Erro de conexão com o servidor.', 'erro');
    }
}

async function editarNoticia(id) {
    try {
        const res = await fetch(`${API_URL}/noticias/${id}`);
        const n = await res.json();
        if (!res.ok) return exibirMensagem('Notícia não encontrada.', 'erro');

        document.getElementById('noticia-id').value = n.id;
        document.getElementById('titulo').value = n.titulo || '';
        document.getElementById('subtitulo').value = n.subtitulo || '';
        document.getElementById('categoria').value = n.categoria || '';
        document.getElementById('autor').value = n.autor || '';
        document.getElementById('imagem_url').value = n.imagem_url || '';
        document.getElementById('conteudo').value = n.conteudo || '';

        document.getElementById('titulo-form').innerText = 'Editar notícia';
        document.getElementById('btn-cancelar').hidden = false;
        window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
        exibirMensagem('Erro ao carregar notícia.', 'erro');
    }
}

async function excluirNoticia(id) {
    if (!confirm('Deseja realmente excluir esta notícia?')) return;

    try {
        const res = await fetch(`${API_URL}/noticias/${id}`, {
            method: 'DELETE',
            headers: headersAuth,
        });
        if (res.status === 401) return sair();

        const data = await res.json();
        if (res.ok) {
            exibirMensagem(data.mensagem || 'Notícia excluída.', 'sucesso');
            carregarNoticias();
        } else {
            exibirMensagem(data.erro || 'Erro ao excluir.', 'erro');
        }
    } catch (err) {
        exibirMensagem('Erro de conexão com o servidor.', 'erro');
    }
}

function limparFormulario() {
    document.getElementById('form-noticia').reset();
    document.getElementById('noticia-id').value = '';
    document.getElementById('titulo-form').innerText = 'Cadastrar nova notícia';
    document.getElementById('btn-cancelar').hidden = true;
}
