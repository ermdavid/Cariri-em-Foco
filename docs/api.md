# Documentação da API REST — Cariri em Foco / Cariri em Dados

Base URL (via Nginx): `http://localhost:8080/api`
Base URL (backend direto): `http://localhost:5000/api`

---

## 1. Saúde do serviço

### `GET /api/health`
Verifica se a API está no ar. Não acessa o banco.

**Resposta 200**
```json
{ "status": "ok" }
```

---

## 2. Autenticação

### `POST /api/auth/login`
Autentica um usuário da redação e devolve um token JWT (validade de 8 horas).

**Corpo (JSON)**
```json
{ "email": "admin@caririemfoco.com.br", "senha": "cariri2026" }
```

**Resposta 200**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "usuario": { "id": 1, "nome": "Redação Cariri em Foco", "email": "admin@caririemfoco.com.br" }
}
```

**Erros:** `400` campos ausentes · `401` credenciais inválidas.

### `GET /api/auth/me` 🔒
Retorna os dados do usuário autenticado a partir do token. Útil como guarda de
sessão no frontend.

**Resposta 200**
```json
{ "usuario_id": 1, "email": "admin@caririemfoco.com.br" }
```

---

## 3. Notícias

### `GET /api/noticias`
Lista notícias publicadas, com paginação e filtro opcional por editoria.

**Parâmetros (query):** `categoria` (opcional), `page` (padrão 1), `per_page` (padrão 10).

**Resposta 200**
```json
{
  "pagina_atual": 1,
  "total_registros": 2,
  "total_paginas": 1,
  "registros": [
    { "id": 1, "titulo": "...", "subtitulo": "...", "categoria": "cultura",
      "autor": "Redação", "imagem_url": "assets/img/...", "publicado_em": "24/08/2026" }
  ]
}
```

### `GET /api/noticias/{id}`
Retorna uma notícia completa (inclui o campo `conteudo`).
**Erros:** `404` não encontrada.

### `POST /api/noticias` 🔒
Cria uma notícia. Campos `titulo` e `conteudo` são obrigatórios.

**Corpo (JSON)**
```json
{ "titulo": "...", "subtitulo": "...", "categoria": "economia",
  "autor": "...", "conteudo": "...", "imagem_url": "..." }
```
**Resposta 201:** `{ "id": 3, "mensagem": "Notícia criada com sucesso." }`
**Erros:** `400` campos obrigatórios ausentes · `401` sem token.

### `PUT /api/noticias/{id}` 🔒
Atualiza uma notícia existente. Mesmo corpo do `POST`.
**Erros:** `400` · `401` · `404`.

### `DELETE /api/noticias/{id}` 🔒
Remove uma notícia. **Erros:** `401` · `404`.

---

## 4. Dashboard "Cariri em Dados"

Todos aceitam filtros opcionais por `municipio_id` e/ou `categoria_id`.

### `GET /api/filtros`
Lista municípios e categorias de crime para popular os seletores.
```json
{ "municipios": [{ "id": 1, "nome": "..." }], "categorias": [{ "id": 1, "nome": "..." }] }
```

### `GET /api/kpis`
Indicadores consolidados.
```json
{ "total_ocorrencias": 0, "total_armas": 0, "total_drogas_kg": 0, "total_vitimas": 0 }
```

### `GET /api/ocorrencias`
Série temporal agregada por mês (`YYYY-MM`).
```json
[ { "mes_ano": "2019-01", "total": 120 } ]
```

### `GET /api/ocorrencias/municipio`
Total de ocorrências por município (aceita `categoria_id`).
```json
[ { "municipio": "...", "total": 340 } ]
```

### `GET /api/ocorrencias/categoria`
Total de ocorrências por categoria (aceita `municipio_id`).
```json
[ { "categoria": "...", "total": 210 } ]
```

### `GET /api/ocorrencias/detalhada`
Tabela paginada de ocorrências. Parâmetros: `municipio_id`, `categoria_id`, `page`, `per_page`.
```json
{ "pagina_atual": 1, "itens_por_pagina": 10, "total_registros": 0,
  "total_paginas": 1, "registros": [] }
```

---

## Códigos de status utilizados
`200` OK · `201` criado · `400` requisição inválida · `401` não autenticado ·
`404` não encontrado.

🔒 = requer cabeçalho `Authorization: Bearer <token>`.
`404` não encontrado.

🔒 = requer cabeçalho `Authorization: Bearer <token>`.
