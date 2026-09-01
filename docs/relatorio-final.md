# Relatório Final — Projeto Integrado III

## Cariri em Foco & Cariri em Dados

**Disciplinas:** TBD0016 – Programação para Web · TBD0020 – Projeto Integrado III
**Equipe:** Aline Pereira de Lima · Diego Gomes Pereira · Ermeson David dos Santos
Silva · Fernando Pablo Silva Oliveira



---

## 1. Introdução

O presente relatório descreve o desenvolvimento da plataforma integrada Cariri em Foco (portal jornalístico regional) e Cariri em Dados (painel analítico de segurança pública). O projeto foi concebido para atender às necessidades de comunicação, transparência e análise de dados da região do Cariri cearense, oferecendo:
-Publicação de notícias por editorias;
-Visualização interativa de estatísticas criminais;
-API REST desacoplada para integração entre serviços;
-Área administrativa autenticada para gestão de conteúdo.
Os dados utilizados no painel analítico foram extraídos da Secretaria da Segurança Pública e Defesa Social do Ceará (SSPDS-CE), tratados via processo de ETL e armazenados em banco relacional PostgreSQL.

## 2. Objetivos

### Objetivo Geral
Desenvolver uma plataforma web integrada que combine jornalismo regional com inteligência de dados, permitindo acesso público a notícias e estatísticas criminais históricas.

### Objetivos específicos
- Criar e disponibilizar um portal de notícias responsivo, organizado por editorias.
- Oferecer um painel analítico com indicadores, gráficos e tabela detalhada, com
  filtros por município e categoria de crime.
- Disponibilizar uma API REST padronizada em JSON para o frontend.
- Processar e armazenar microdados criminais em banco relacional normalizado.
- Desenvolver área administrativa com autenticação JWT e CRUD de notícias.
- Containerizar toda a solução via Docker Compose.

## 3. Metodologia e organização

O desenvolvimento foi conduzido em três sprints (Scrum), com revisão e
retrospectiva ao final de cada uma:

| Sprint | Período | Foco |
|--------|---------|------|
| 1 | Fundação | Requisitos, arquitetura, modelagem do banco, protótipos, backlog. |
| 2 | Desenvolvimento | API REST, CRUDs, autenticação, integração front-back, Docker. |
| 3 | Finalização | Testes, correções, documentação, deploy, apresentação. |

### Ferramentas de Trabalho
- Versionamento: Git + GitHub;
- Comunicação: Issues, Pull Requests e Code Review;
- Testes: pytest;
- Deploy local: Docker Compose

## 4. Arquitetura da solução

A solução adota arquitetura desacoplada, com três serviços independentes e orquestrados por Docker Compose :
### Frontend (Nginx + HTML/CSS/JS)
- Portal de notícias
- Painel analítico
- Proxy reverso para o backend (evita CORS)

### Backend (Flask + Python 3.12)
- API REST
- Autenticação JWT
- SQL parametrizado via SQLAlchemy
- Funções puras para filtros, paginação e tokens

## Banco de Dados (PostgreSQL 15)
- Modelo em 3FN
- Índices para desempenho
- Objetos de banco (view, function, trigger) aplicados automaticamente
- ETL com Pandas + PyArrow

A comunicação ocorre exclusivamente por chamadas assíncronas HTTP/JSON, com o Nginx atuando como proxy reverso do caminho `/api/`. Os detalhes estão no *Manual Técnico* (`docs/manual-tecnico.md`).

## 5. Tecnologias utilizadas

### Frontend (Nginx + HTML/CSS/JS)
-HTML5, CSS3, JavaScript (ES6+)
-Chart.js (gráficos)
-Nginx (servidor web e proxy reverso)

### Backend (Flask + Python 3.12)
- Python 3.12
- Flask
- Flask-CORS
- SQLAlchemy
- PyJWT
- Werkzeug (hash de senha)

### Banco e ETL
- PostgreSQL 15
- Pandas
- Numpy
- PyArrow

### Infraestrutura
- Docker
- Docker compose

## 6. Funcionalidades entregues

### Portal de Notícias
- Navegação por editorias e leitura de notícias (RF01, RF02).

### Painel Cariri em Dados

- Painel de dados com KPIs, gráficos interativos e tabela paginada (RF03–RF07).
- Filtragem dinâmica por município e categoria (RF04).
- API REST com 14 endpoints, incluindo autenticação JWT (RF09).
- Área administrativa autenticada com CRUD de notícias.
- Perfil sociodemográfico (RF08).

### API REST
- 14 endpoints documentados (RF09).
- Autenticação JWT (RF10).

### Área Administrativa
- CRUD de notícias (RF11).
- Sessão autenticada.
- Proteção por token.

### Banco de Dados
- Modelo em 3FN (RNF04).
- Índices para desempenho (RNF02).
- Suporte a grandes volumes (RNF06).

### Infraestrutura
- Containerização completa (RNF05).

## 7. Modelo de dados

- Seis tabelas em 3FN: `municipio`, `categoria_crime`, `ocorrencia`, `detalhe_vitima`, `usuario` e `noticia`.
- Integridade referencial garantida por chaves estrangeiras.
- Índices de apoio às consultas do dashboard.
- Dados tratados via ETL antes da carga.

## 8. Testes e qualidade

Foi implementada uma suíte automatizada com pytest, dividida em: 
- (i) testes unitários das funções puras de filtragem, paginação e geração/validação de tokens JWT;
- (ii) testes de integração que exercem os endpoints reais da API (saúde, autenticação, CRUD de notícias e leitura do dashboard).
- Os testes unitários são independentes de infraestrutura; os de integração são executados contra o banco em contêiner e ignorados automaticamente quando o banco não está disponível.

## 9. Resultados

O sistema final atende aos requisitos funcionais e não funcionais definidos no Documento de Requisitos. Entre os resultados observados:
- Desempenho: consultas do dashboard retornam em menos de 2 segundos.
- Volume de dados: mais de 160 mil registros processados e armazenados.
- Banco de Dados: criação de banco para repositório de notícias.
- Integração: portal, painel e API funcionando de forma sincronizada.
- Usabilidade: interface responsiva e intuitiva.
- Segurança: autenticação JWT e hash de senha implementados corretamente.

## 10. Dificuldades e aprendizados

### Principais Desafios
- Higienização dos microdados da SSPDS-CE.
- Integração entre serviços via Docker.
- Padronização do fluxo de trabalho no Git.
- Criação de índices eficientes para consultas analíticas.
- Implementação de autenticação JWT.

### Aprendizados
- Boas práticas de containerização.
- Modelagem de banco orientada a desempenho.
- Desenvolvimento de APIs REST escaláveis.
- Organização de projeto em equipe com GitHub.
- Importância de testes automatizados.

## 11. Trabalhos futuros

- Expor as notícias cadastradas no painel administrativo também no portal público.
- Implementar recuperação de senha.
- Criar papéis de usuário (admin, editor, leitor).
- Adicionar cache para consultas agregadas.
- Realizar testes de carga e stress.
- Expandir painel para outras regiões do Ceará.

## 12. Conclusão

O projeto Cariri em Foco & Cariri em Dados cumpriu integralmente o escopo definido nas três sprints, entregando uma plataforma robusta, responsiva e funcional. A integração entre jornalismo regional e inteligência de dados oferece valor significativo à comunidade, permitindo acesso transparente a informações relevantes sobre segurança pública.
O trabalho consolidou conhecimentos de desenvolvimento web, modelagem de dados, APIs REST, containerização e colaboração em equipe, resultando em um produto final completo e tecnicamente consistente.

## 13. Referências

- Documento de Requisitos (`docs/requisitos.md`).
- Documentação da API (`docs/api.md`).
- Manual Técnico (`docs/manual-tecnico.md`) e Manual do Usuário
  (`docs/manual-usuario.md`).
- Secretaria da Segurança Pública e Defesa Social do Ceará (SSPDS-CE).
