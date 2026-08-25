# Roteiro do Vídeo Demonstrativo e dos Slides

## Parte A — Roteiro do vídeo (sugestão: 5 a 7 minutos)

1. **Abertura (0:00–0:30)** — Nome do projeto, equipe e disciplinas. Uma frase
   sobre o problema: informação e dados de segurança da região do Cariri em um só
   lugar.
2. **Visão geral (0:30–1:15)** — Explique a arquitetura em três serviços
   (frontend Nginx, backend Flask, banco PostgreSQL) mostrando o diagrama do
   Manual Técnico.
3. **Subindo o sistema (1:15–2:00)** — Mostre `docker compose up -d --build` e os
   contêineres no ar (`docker compose ps`). Comente o ETL e o seed automáticos.
4. **Portal de notícias (2:00–3:00)** — Navegue pela home, filtre por editoria e
   abra uma matéria. Destaque a responsividade reduzindo a janela.
5. **Cariri em Dados (3:00–4:15)** — Aplique filtros por cidade e categoria;
   mostre os KPIs, os dois gráficos e a tabela paginada se atualizando.
6. **Área da redação (4:15–5:15)** — Faça login, cadastre uma notícia, edite e
   exclua. Mostre a proteção: tentar acessar o painel sem token redireciona ao
   login.
7. **Qualidade (5:15–6:00)** — Rode `pytest -v` e mostre os testes passando.
   Comente os índices do banco (RNF02).
8. **Encerramento (6:00–)** — Resumo do que foi entregue e agradecimento.

## Parte B — Estrutura sugerida dos slides

1. **Capa** — Projeto, equipe, disciplinas, data.
2. **Problema e objetivo** — Por que o portal + painel de dados.
3. **Escopo das sprints** — Tabela das três sprints e o que cada uma entregou.
4. **Arquitetura** — Diagrama dos três serviços e o fluxo HTTP/JSON.
5. **Tecnologias** — Stack de frontend, backend, dados e orquestração.
6. **Modelo de dados** — As seis tabelas e os índices; menção à 3FN.
7. **API REST** — Os 14 endpoints agrupados (health, auth, notícias, dashboard).
8. **Autenticação** — JWT + hash de senha; rotas protegidas.
9. **Demonstração** — Capturas do portal, do painel e do painel da redação.
10. **Testes e qualidade** — Unitários + integração; captura do pytest.
11. **Resultados** — Requisitos atendidos; métricas observadas.
12. **Dificuldades e aprendizados**.
13. **Trabalhos futuros**.
14. **Encerramento** — Repositório, agradecimentos, perguntas.

## Parte C — Perguntas prováveis na defesa (prepare respostas)

- Por que a arquitetura desacoplada e como o CORS foi resolvido?
- Como as senhas são protegidas? O que há dentro do token JWT?
- Como os índices ajudam a cumprir o RNF02 de desempenho?
- Como o ETL higieniza os microdados antes de carregar no banco?
- Qual a estratégia de testes e o que os testes de integração cobrem?
- O que fica como trabalho futuro e por quê?
