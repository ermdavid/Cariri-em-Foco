document.getElementById('formLogin')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const senha = document.getElementById('senha').value;
    const msgErro = document.getElementById('mensagemErro');

    msgErro.style.display = 'none';

    try {
        // Usa a variável global API_URL para montar o endereço
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, senha })
        });

        const data = await response.json();

        if (response.ok) {
            // Armazena o Token JWT e as informações do usuário
            localStorage.setItem('token', data.token);
            localStorage.setItem('usuario', JSON.stringify(data.usuario));
            
            // Redireciona para a área administrativa
            window.location.href = 'admin_cadastrar_noticia.html';
        } else {
            msgErro.innerText = data.erro || 'E-mail ou senha incorretos.';
            msgErro.style.display = 'block';
        }
    } catch (err) {
        msgErro.innerText = 'Erro de conexão com o servidor.';
        msgErro.style.display = 'block';
    }
});