# Manual do Usuário — Cariri em Foco

## 1.Introdução

Este manual apresenta de forma simples e objetiva como utilizar o portal de notícias Cariri em Foco e o painel analítico Cariri em Dados.
O conteúdo foi elaborado para usuários sem conhecimento técnico, garantindo navegação intuitiva e compreensão das funcionalidades disponíveis.
O sistema é composto por três áreas principais:

- Portal de notícias.
- Painel de dados estatísticos.
- Área administrativa da redação (acesso restrito).

## 2. Portal de notícias

O portal pode ser acessado em:  `http://localhost:8080`.
A página inicial reúne as notícias da região do Cariri, organizadas por editorias.

### 2.1 Ler uma notícia
1. Clique no título ou na imagem da matéria desejada.]
2. A página de leitura exibirá:
- Título.
- Subtítulo.
- Autor.
- Data de publicação.
- Imagem principal.
- Conteúdo completo.

### 2.2 Filtrar por editoria
Na barra superior, selecione uma das editoriais disponíveis:
- Política.
- Economia.
- Cultura.
- Esporte.
Ao clicar, a lista de notícias é filtrada automaticamente.

### 2.3 Navegação em dispositivos móveis
- Toque no ícone de menu ☰ para abrir as editorias.
- As notícias são exibidas em layout responsivo, adaptado para telas menores.

## 3. Painel Analítico — Cariri em Dados

Acesse o painel em:  `http://localhost:8080/cariri-em-dados.html`. 
O painel apresenta estatísticas criminais históricas da região do Cariri, com gráficos, indicadores e tabela detalhada.

### 3.1 Cartões de Resumo (KPIs)
Os cartões exibem informações consolidadas, como:
- Total de ocorrências.
- Município com maior número de registros.
- Categoria de crime predominante.
Os valores mudam automaticamente conforme os filtros aplicados.

### 3.2 Filtros
Na parte superior do painel, selecione:
- Município.
- Categoria de crime.
Todos os gráficos e tabelas são atualizados instantaneamente.

### 3.3 Gráficos
O painel inclui:
- Gráfico de barras: ocorrências por município.
- Gráfico de rosca: distribuição por categoria.
- Gráficos temporais: evolução mensal e anual (quando aplicável)
Os gráficos são interativos e respondem aos filtros selecionados.

### 3.4 Tabela detalhada
A tabela exibe registros individuais de ocorrências, incluindo:
- Data.
- Município.
- Categoria.
- Período.
- Informações complementares.
Use os botões **Anterior** e **Próximo** para navegar entre páginas.

## 4. Área Administrativa da Redação (Acesso Restrito)

A área administrativa é destinada exclusivamente à equipe editorial para cadastrar, editar e excluir notícias.

### 4.1 Entrar no sistema
1. Acesse `http://localhost:8080/login.html`.
2. Informe o e-mail e a senha fornecidos pela administração.
3. Clique em **Entrar no Painel**. Em caso de erro, uma mensagem será exibida.

### 4.2 Cadastrar uma notícia
1. No painel, preencha o formulário "Cadastrar nova notícia".
2. **Título** e **Conteúdo** são obrigatórios; os demais campos são opcionais.
3. Clique em **Publicar**. A notícia aparecerá na lista ao lado.

### 4.3 Editar ou excluir
- **Editar:** clique em "Editar" no item desejado, altere os campos e clique em
  **Publicar**. Use "Cancelar edição" para descartar as alterações.
- **Excluir:** clique em "Excluir" e confirme. A ação é permanente.

### 4.4 Sair
Clique em **Sair** no canto superior direito para encerrar a sessão com
segurança. A sessão também expira automaticamente após algumas horas.

## 5. Dúvidas frequentes

- **Esqueci a senha:** solicite uma nova à administração do sistema.
- **A página não carrega os dados:** verifique se o sistema (Docker) está em
  execução e recarregue a página.
- **Fui redirecionado para o login:** sua sessão expirou; basta entrar de novo.
- **As notícias não aparecem no portal:** Verifique se foram publicadas corretamente no painel administrativo.

## 6. Considerações Finais

Este manual foi elaborado para facilitar o uso do portal e do painel analítico, garantindo que qualquer usuário — técnico ou não — consiga navegar, consultar dados e operar a área administrativa com segurança e eficiência.
