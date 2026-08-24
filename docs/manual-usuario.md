# Manual do Usuário — Cariri em Foco

Este manual descreve como utilizar o portal e o painel de dados. Não requer
conhecimento técnico.

## 1. Portal de notícias

Acesse `http://localhost:8080`. A página inicial reúne as notícias da região do
Cariri, organizadas por editorias.

- **Ler uma notícia:** clique no título ou na imagem da matéria desejada.
- **Filtrar por editoria:** use o menu superior (Política, Economia, Cultura,
  Esporte). A lista é filtrada imediatamente e o destaque principal é ajustado.
- **Navegação em celular:** toque no ícone de menu (☰) para abrir as seções.

## 2. Painel "Cariri em Dados"

Acesse `http://localhost:8080/cariri-em-dados.html`. O painel apresenta
estatísticas de segurança pública da região.

- **Cartões de resumo (KPIs):** mostram o total de ocorrências, o município com
  maior volume e o crime predominante conforme os filtros ativos.
- **Filtros:** selecione uma cidade e/ou uma categoria de crime nos seletores.
  Todos os gráficos e a tabela se atualizam automaticamente.
- **Gráficos:** o gráfico de barras exibe as ocorrências por cidade; o gráfico
  de rosca mostra a distribuição por categoria.
- **Tabela detalhada:** lista as ocorrências individuais. Use os botões
  "Anterior" e "Próximo" para navegar entre as páginas.

## 3. Área da redação (acesso restrito)

Destinada à equipe editorial para cadastrar e gerenciar notícias.

### 3.1 Entrar no sistema
1. Acesse `http://localhost:8080/login.html`.
2. Informe o e-mail e a senha fornecidos pela administração.
3. Clique em **Entrar no Painel**. Em caso de erro, uma mensagem será exibida.

### 3.2 Cadastrar uma notícia
1. No painel, preencha o formulário "Cadastrar nova notícia".
2. **Título** e **Conteúdo** são obrigatórios; os demais campos são opcionais.
3. Clique em **Publicar**. A notícia aparecerá na lista ao lado.

### 3.3 Editar ou excluir
- **Editar:** clique em "Editar" no item desejado, altere os campos e clique em
  **Publicar**. Use "Cancelar edição" para descartar as alterações.
- **Excluir:** clique em "Excluir" e confirme. A ação é permanente.

### 3.4 Sair
Clique em **Sair** no canto superior direito para encerrar a sessão com
segurança. A sessão também expira automaticamente após algumas horas.

## 4. Dúvidas frequentes

- **Esqueci a senha:** solicite uma nova à administração do sistema.
- **A página não carrega os dados:** verifique se o sistema (Docker) está em
  execução e recarregue a página.
- **Fui redirecionado para o login:** sua sessão expirou; basta entrar de novo.
