# Relatório Final — Projeto Integrado III

## Cariri em Foco & Cariri em Dados

**Disciplinas:** TBD0016 – Programação para Web · TBD0020 – Projeto Integrado III
**Equipe:** Aline Pereira de Lima · Diego Gomes Pereira · Ermeson David dos Santos
Silva · Fernando Pablo Silva Oliveira

> Observação: substitua os campos entre colchetes pelos dados finais da equipe
> antes da entrega (datas, links do repositório e do vídeo).

---

## 1. Introdução

O projeto teve como objetivo desenvolver uma plataforma web que integra um portal
jornalístico regional (**Cariri em Foco**) a um painel de inteligência de dados de
segurança pública (**Cariri em Dados**). O sistema disponibiliza notícias por
editorias e permite a exploração interativa de estatísticas criminais históricas
da região do Cariri cearense, extraídas da Secretaria da Segurança Pública e
Defesa Social do Ceará (SSPDS-CE).

## 2. Objetivos

- Disponibilizar um portal de notícias responsivo, organizado por editorias.
- Oferecer um painel analítico com indicadores, gráficos e tabela detalhada, com
  filtros por município e categoria de crime.
- Prover uma API REST desacoplada que alimenta o frontend.
- Persistir e processar com eficiência a base histórica de ocorrências.
- Disponibilizar uma área administrativa autenticada para gestão de conteúdo.

## 3. Metodologia e organização

O desenvolvimento foi conduzido em três sprints (Scrum), com revisão e
retrospectiva ao final de cada uma:

| Sprint | Período | Foco |
|--------|---------|------|
| 1 | Fundação | Requisitos, arquitetura, modelagem do banco, protótipos, backlog. |
| 2 | Desenvolvimento | API REST, CRUDs, autenticação, integração front-back, Docker. |
| 3 | Finalização | Testes, correções, documentação, deploy, apresentação. |

O versionamento foi feito em repositório GitHub compartilhado, com uso de
branches, Pull Requests e Code Review.

## 4. Arquitetura da solução

Arquitetura desacoplada em três serviços orquestrados por Docker Compose:
frontend (Nginx), backend (Flask/API REST) e banco de dados (PostgreSQL). A
comunicação ocorre exclusivamente por chamadas assíncronas HTTP/JSON, com o Nginx
atuando como proxy reverso do caminho `/api/`. Os detalhes estão no *Manual
Técnico* (`docs/manual-tecnico.md`).

## 5. Tecnologias utilizadas

Frontend em HTML5, CSS3 e JavaScript (ES6+) com Chart.js para os gráficos;
backend em Python 3.12 com Flask, Flask-CORS, SQLAlchemy, PyJWT e Werkzeug; ETL
com Pandas, NumPy e PyArrow; banco PostgreSQL 15; orquestração com Docker e
Docker Compose.

## 6. Funcionalidades entregues

- Navegação por editorias e leitura de notícias (RF01, RF02).
- Painel de dados com KPIs, gráficos interativos e tabela paginada (RF03–RF07).
- Filtragem dinâmica por município e categoria (RF04).
- API REST com 14 endpoints, incluindo autenticação JWT (RF09).
- Área administrativa autenticada com CRUD de notícias.
- Base normalizada (3FN) com índices para desempenho (RNF02, RNF04).
- Containerização completa (RNF05).

## 7. Modelo de dados

Seis tabelas em 3FN: `municipio`, `categoria_crime`, `ocorrencia`,
`detalhe_vitima`, `usuario` e `noticia`, com integridade referencial garantida
por chaves estrangeiras e índices de apoio às consultas do dashboard.

## 8. Testes e qualidade

Foi implementada uma suíte automatizada com pytest, dividida em: (i) testes
unitários das funções puras de filtragem, paginação e geração/validação de
tokens JWT; e (ii) testes de integração que exercem os endpoints reais da API
(saúde, autenticação, CRUD de notícias e leitura do dashboard). Os testes
unitários são independentes de infraestrutura; os de integração são executados
contra o banco em contêiner e ignorados automaticamente quando o banco não está
disponível.

## 9. Resultados

O sistema atende aos requisitos funcionais e não funcionais especificados,
com o portal e o painel integrados à API e ao banco, autenticação funcional e
execução orquestrada por Docker. [Descreva aqui métricas observadas, como tempo
de resposta dos filtros e volume de registros carregados.]

## 10. Dificuldades e aprendizados

[Preencha com os principais desafios da equipe — por exemplo, higienização dos
microdados no ETL, integração entre serviços via Docker, e padronização do
fluxo de trabalho no Git — e o que foi aprendido em cada frente.]

## 11. Trabalhos futuros

- Expor as notícias cadastradas no painel administrativo também no portal público.
- Recuperação de senha e gestão de múltiplos usuários com papéis.
- Cache de consultas agregadas e testes de carga.

## 12. Conclusão

[Síntese final: retome o objetivo, afirme o cumprimento do escopo das três
sprints e destaque o valor do produto para a região.]

## 13. Referências

- Documento de Requisitos (`docs/requisitos.md`).
- Documentação da API (`docs/api.md`).
- Manual Técnico (`docs/manual-tecnico.md`) e Manual do Usuário
  (`docs/manual-usuario.md`).
- Secretaria da Segurança Pública e Defesa Social do Ceará (SSPDS-CE).
