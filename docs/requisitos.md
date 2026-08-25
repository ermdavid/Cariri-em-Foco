# Documento de Requisitos de Software

## 1. Visão Geral e Objetivo

O sistema consiste em um portal jornalístico regional (**Cariri em Foco**) integrado a uma plataforma de inteligência de dados de segurança pública (**Cariri em Dados**).

O objetivo principal é disponibilizar notícias da região do Cariri e permitir a exploração interativa de estatísticas criminais históricas extraídas da Secretaria da Segurança Pública e Defesa Social do Ceará (SSPDS-CE).

---

## 2. Perfil de Usuários

### Leitor Geral
Usuário que navega pelo portal para ler notícias locais por editorias.

### Pesquisador / Analista de Dados
Usuário que explora a página **Cariri em Dados**, utilizando filtros para analisar índices criminais, gráficos e tabelas.

### Administrador / Sistema (Backend)
Processo responsável por executar scripts de ETL, manter a integridade do banco de dados SQL e responder às requisições REST da aplicação.

---

## 3. Requisitos Funcionais (RF)

### RF01 – Navegação por Editoriais
**Descrição:** O sistema deve exibir a lista de notícias filtradas por editorias (Política, Economia, Meio Ambiente e Esportes) na página inicial.

### RF02 – Leitura de Notícia
**Descrição:** O sistema deve exibir o texto completo da matéria, título, subtítulo, autor, data e imagem na página de destaque.

### RF03 – Visualização do Dashboard de Dados
**Descrição:** O sistema deve disponibilizar uma página dedicada contendo painel interativo com métricas de ocorrências criminais na região.

### RF04 – Filtragem Dinâmica de Crimes
**Descrição:** O sistema deve permitir ao usuário filtrar as estatísticas criminais por município do Cariri e por categoria de crime (ex.: Maria da Penha, Furtos e Entorpecentes).

### RF05 – Exibição de Métricas Consolidadas (KPIs)
**Descrição:** O painel de dados deve apresentar cards com resumo numérico contendo:
- Total de Ocorrências;
- Crime Predominante;
- Município com maior volume de ocorrências.

### RF06 – Gráficos Estatísticos Interativos
**Descrição:** O painel deve renderizar gráficos dinâmicos (barras, pizza/rosca ou linhas) com a distribuição dos crimes por cidade e por categoria.

### RF07 – Tabela de Detalhamento de Ocorrências
**Descrição:** O sistema deve exibir uma tabela paginada e ordenada com as ocorrências registradas, permitindo a leitura dos dados brutos consolidados.

### RF08 – Exibição de Perfil Sociodemográfico
**Descrição:** O sistema deve apresentar recortes de idade, gênero e raça/etnia apenas para as categorias que possuem microdados de vítimas (CVLI, Crimes Sexuais, Maria da Penha, Indígenas e Homofobia/Transfobia).

### RF09 – Provedor de API REST
**Descrição:** O backend em Python deve disponibilizar endpoints em formato JSON para fornecimento dos dados filtrados ao frontend JavaScript.

### RF10 – Autenticação da Redação
**Descrição:** O sistema deve oferecer autenticação por e-mail e senha para a equipe editorial, emitindo um token de sessão (JWT) e protegendo as rotas de escrita de conteúdo. As senhas devem ser armazenadas exclusivamente como hash.

### RF11 – Gestão de Notícias (CRUD)
**Descrição:** Usuários autenticados devem poder cadastrar, editar e excluir notícias por meio de um painel administrativo, enquanto a leitura das notícias permanece pública.

---

## 4. Requisitos Não Funcionais (RNF)

### RNF01 – Interface e Responsividade
**Descrição:** O frontend deve ser construído em HTML5, CSS3 e JavaScript, garantindo visualização adequada em desktops e dispositivos móveis.

### RNF02 – Desempenho de Consulta
**Descrição:** As requisições de filtros no dashboard devem retornar respostas do backend em menos de 2 segundos, utilizando índices SQL apropriados.

### RNF03 – Arquitetura Desacoplada
**Descrição:** O frontend e o backend devem ser desacoplados, comunicando-se exclusivamente por chamadas assíncronas `fetch()` via HTTP/JSON.

### RNF04 – Normalização do Banco de Dados
**Descrição:** O banco de dados relacional deve seguir até a Terceira Forma Normal (3FN), utilizando chaves estrangeiras para garantir integridade referencial.

### RNF05 – Containerização
**Descrição:** Toda a aplicação (Backend Python e Banco de Dados SQL) deve ser executada de forma orquestrada utilizando Docker e Docker Compose.

### RNF06 – Suporte a Múltiplos Volumes de Dados
**Descrição:** O banco de dados deve ser capaz de armazenar e processar com eficiência aproximadamente **163 mil registros históricos limpos**.

---

## 5. Regras de Negócio

### RN01 – Restrição Geográfica
O painel **Cariri em Dados** deve computar e exibir exclusivamente ocorrências pertencentes aos municípios integrantes da região do Cariri cearense.

### RN02 – Omissão de Campos Inexistentes
Caso uma categoria de crime não possua atributos sociodemográficos (por exemplo, Furtos ou Crimes contra Animais), a interface gráfica não deve exibir gráficos de perfil de vítima (gênero, raça/etnia e idade), evitando apresentar valores nulos ao usuário.

### RN03 – Preservação da Linha do Tempo
Categorias de crimes com registros iniciados em anos mais recentes (por exemplo, 2019 ou 2021) devem coexistir no mesmo banco de dados sem comprometer a visualização temporal de categorias com histórico desde 2008.
