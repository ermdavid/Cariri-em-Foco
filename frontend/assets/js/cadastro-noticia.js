const token = localStorage.getItem('token');
if (!token) {
    window.location.href = 'login.html';
}

const formularioNoticia = document.getElementById('formNoticia');

const converterParaBase64 = arquivo => new Promise((resolve, reject) => {
    if (!arquivo) {
        resolve(null);
        return;
    }

    const leitor = new FileReader();
    leitor.onload = () => resolve(leitor.result);
    leitor.onerror = reject;
    leitor.readAsDataURL(arquivo);
});

formularioNoticia?.addEventListener('submit', async evento => {
    evento.preventDefault();

    const botaoAcionado = evento.submitter;
    const status = botaoAcionado?.dataset.status || 'rascunho';
    const arquivoImagem = document.getElementById('imagem').files[0];

    try {
        botaoAcionado.disabled = true;

        const dadosNoticia = {
            Titulo: document.getElementById('titulo').value.trim(),
            Subtitulo: document.getElementById('subtitulo').value.trim(),
            Resumo: document.getElementById('resumo').value.trim(),
            palavrasChaves: document.getElementById('palavra-chave').value
                .split(',')
                .map(tag => tag.trim())
                .filter(Boolean),
            Conteúdo: document.getElementById('conteudo').value.trim(),
            Categoria: document.getElementById('categoria').value,
            status,
            imagem: await converterParaBase64(arquivoImagem)
        };

        const resposta = await fetch('/api/noticias', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify(dadosNoticia)
        });

        const resultado = await resposta.json();
        if (!resposta.ok) {
            throw new Error(resultado.erro || 'Erro ao processar a notícia.');
        }

        alert(`Notícia ${status === 'publicado' ? 'publicada' : 'salva como rascunho'} com sucesso!`);
        formularioNoticia.reset();
    } catch (erro) {
        console.error('Erro ao enviar notícia:', erro);
        alert(erro.message || 'Não foi possível conectar ao servidor.');
    } finally {
        botaoAcionado.disabled = false;
    }
});