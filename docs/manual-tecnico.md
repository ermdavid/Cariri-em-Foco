# Manual Técnico — Cariri em Foco / Cariri em Dados

## 1. Visão geral da arquitetura

O sistema adota uma arquitetura desacoplada em três serviços orquestrados por
Docker Compose, comunicando-se por HTTP/JSON:

```
┌─────────────┐     /api/*      ┌─────────────┐    SQL     ┌──────────────┐
│  Frontend   │ ──────────────▶ │   Backend   │ ─────────▶ │  PostgreSQL  │
│ Nginx (HTML │  proxy reverso  │ Flask (API  │  SQLAlchemy│   (db_cariri)│
│  /CSS/JS)   │ ◀────────────── │   REST)     │ ◀───────── │              │
└─────────────┘      JSON       └─────────────┘            └──────────────┘
   porta 8080                      porta 5000                 porta 5432
```

- **Frontend:** HTML5, CSS3 e JavaScript (ES6+) servidos pelo Nginx, que também
  atua como proxy reverso do caminho `/api/`, eliminando problemas de CORS.
- **Backend:** API REST em Python 3.12 com Flask e SQLAlchemy (SQL textual
  parametrizado). Autenticação por JWT (PyJWT) e hash de senha com Werkzeug
  (pbkdf2:sha256).
- **Banco:** PostgreSQL 15, populado por um processo de ETL (Pandas + PyArrow)
  a partir de microdados da SSPDS-CE.

## 2. Estrutura de diretórios

```
.
├── backend/
│   ├── app.py              # Aplicação Flask e definição dos endpoints
│   ├── utils.py            # Funções puras (filtros, paginação, JWT)
│   ├── entrypoint.sh       # ETL + seed administrativo + inicialização da API
│   ├── requirements.txt
│   ├── Dockerfile
│   ├── pytest.ini
│   └── tests/              # Testes unitários e de integração
├── database/
│   ├── schema.sql          # DDL: tabelas, chaves estrangeiras e índices
│   ├── objetos.sql         # View, function e trigger
│   ├── seeds.py            # ETL das ocorrências
│   ├── seed_auth.py        # Usuário administrador e notícias de exemplo
│   ├── apply_objetos.py    # Aplica o objetos.sql na inicialização
│   └── dados_sspds.parquet
├── frontend/               # HTML, CSS, JS e nginx.conf
├── docs/                   # Documentação (este manual, API, manual do usuário)
└── docker-compose.yml
```

## 3. Modelo de dados

Seis tabelas em Terceira Forma Normal (3FN):

- `municipio` e `categoria_crime`: tabelas de domínio.
- `ocorrencia`: entidade-fato, com chaves estrangeiras para município e categoria.
- `detalhe_vitima`: perfil sociodemográfico (relação 1:1 com ocorrência).
- `usuario`: credenciais da redação (senha armazenada apenas como hash).
- `noticia`: conteúdo editorial gerenciado pelo painel administrativo.

**Índices (RNF02):** foram criados índices em `ocorrencia(municipio_id)`,
`ocorrencia(categoria_id)`, `ocorrencia(data_hora)`, um índice composto
`ocorrencia(municipio_id, categoria_id)`, além de `detalhe_vitima(ocorrencia_id)`
e índices de apoio em `noticia`. Esses índices sustentam o requisito de resposta
inferior a 2 segundos sobre a base histórica.

**Objetos de banco (`database/objetos.sql`):** além das tabelas, o banco define
uma view, uma function e uma trigger, aplicadas automaticamente na inicialização
por `apply_objetos.py`:
- `vw_ocorrencias_por_municipio`: view que consolida a contagem de ocorrências
  por município e categoria, com os nomes já resolvidos.
- `fn_total_ocorrencias_municipio(id)`: function que retorna o total de
  ocorrências de um município.
- `trg_noticia_atualizada`: trigger que, a cada `UPDATE` em `noticia`, preenche
  a coluna `atualizado_em` com a data e hora da alteração.

## 4. Autenticação e segurança

- O login (`POST /api/auth/login`) valida as credenciais contra a tabela
  `usuario` e devolve um JWT assinado (HS256), com validade de 8 horas.
- Rotas de escrita de notícias são protegidas pelo decorator `token_obrigatorio`,
  que exige o cabeçalho `Authorization: Bearer <token>`.
- Senhas nunca são armazenadas em texto puro: usa-se `generate_password_hash`
  (pbkdf2:sha256) na gravação e `check_password_hash` na verificação.
- Toda consulta SQL usa parâmetros nomeados, prevenindo injeção de SQL.

**Credenciais padrão (ambiente de desenvolvimento):**
`admin@caririemfoco.com.br` / `cariri2026`. Podem ser sobrescritas pelas
variáveis de ambiente `ADMIN_EMAIL` e `ADMIN_SENHA`, e a chave de assinatura por
`SECRET_KEY`.

## 5. Como executar

Pré-requisitos: Git, Docker Desktop e Docker Compose.

```bash
git clone https://github.com/ermdavid/Cariri-em-Foco.git
cd Cariri-em-Foco
docker compose up -d --build
```

Na primeira execução o Docker cria as imagens, sobe o PostgreSQL, aplica o
`schema.sql`, roda o ETL (`seeds.py`), cria o usuário administrador
(`seed_auth.py`) e inicia a API e o servidor web.

- Portal: `http://localhost:8080`
- Painel de dados: `http://localhost:8080/cariri-em-dados.html`
- Login da redação: `http://localhost:8080/login.html`
- API (health): `http://localhost:5000/api/health`

## 6. Execução dos testes

A suíte usa pytest e separa testes unitários (funções puras, sem banco) de
testes de integração (endpoints reais, ignorados automaticamente se o banco
estiver indisponível):

```bash
# Dentro do contêiner do backend, com o banco no ar:
docker compose exec backend sh -c "cd backend && pytest -v"

# Apenas os testes unitários (rodam em qualquer ambiente):
docker compose exec backend sh -c "cd backend && pytest tests/test_utils.py -v"
```

## 7. Comandos úteis

```bash
docker compose ps                 # status dos contêineres
docker compose logs -f backend    # logs da API
docker compose down               # parar
docker compose down -v            # parar e apagar os dados do banco
```

## 8. Decisões técnicas relevantes

- **SQL textual parametrizado** em vez de ORM completo: simplicidade e controle
  sobre as agregações do dashboard, mantendo proteção contra injeção.
- **Nginx como proxy reverso** do backend: uma única origem para o navegador,
  eliminando CORS em produção.
- **Funções puras isoladas** em `utils.py`: tornam a lógica de filtros,
  paginação e tokens testável sem subir banco ou servidor.
- **Seed idempotente:** `seed_auth.py` pode rodar repetidamente sem duplicar
  registros, e o hash da senha é gerado no ambiente de execução.
- **Objetos de banco reexecutáveis:** view, function e trigger usam
  `CREATE OR REPLACE` / `IF NOT EXISTS`, podendo ser reaplicados a cada boot sem
  erro, e são executados via SQLAlchemy (sem depender do cliente `psql`).
