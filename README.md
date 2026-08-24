# Cariri em Foco & Cariri em Dados

Portal de notícias e inteligência de dados da região do Cariri, desenvolvido para as disciplinas **TBD0016 - Programação para Web** e **TBD0020 - Projeto Integrado III**.

---

## 📌 Sobre o Projeto

O **Cariri em Foco** é uma plataforma web para acompanhamento de notícias e estatísticas regionais. O sistema é composto por um portal de notícias responsivo e pelo painel **Cariri em Dados**, que consome uma API REST alimentada por um banco de dados PostgreSQL com carga automatizada de dados (ETL) oriundos da Secretaria de Segurança Pública e Defesa Social do Ceará.

---

## 🛠️ Tecnologias Utilizadas

* **Frontend:** HTML5, CSS3, JavaScript (ES6+), Nginx
* **Backend:** Python 3.12, Flask, Flask-CORS, SQLAlchemy
* **Autenticação:** JWT (PyJWT) e hash de senha com Werkzeug
* **ETL & Dados:** Pandas, PyArrow, NumPy
* **Banco de Dados:** PostgreSQL 15 (com view, function e trigger)
* **Testes:** pytest (unitários e de integração)
* **Orquestração:** Docker, Docker Compose

---

## 📁 Estrutura do Projeto

```text
.
├── backend/            # API REST em Flask e scripts de entrada
├── database/           # Schemas SQL e script de povoamento (seeds.py)
├── frontend/           # Interface web (HTML/CSS/JS) e configuração do Nginx
├── docker-compose.yml  # Configuração dos serviços Docker
└── README.md
```

---

## 🚀 Como Executar o Projeto

### Pré-requisitos

Antes de começar, certifique-se de ter instalado em sua máquina:

* [Git](https://git-scm.com/)
* [Docker Desktop](https://www.docker.com/products/docker-desktop/)
* Docker Compose ativo

### Passo a Passo

#### 1. Clonar o repositório

```bash
git clone https://github.com/ermdavid/Cariri-em-Foco.git
cd Cariri-em-Foco
```

#### 2. Subir os contêineres com Docker Compose

```bash
docker compose up -d --build
```

> **Nota:** Na primeira execução, o Docker irá criar as imagens, subir o banco de dados PostgreSQL, executar as migrações SQL, realizar o povoamento automático dos dados (`seeds.py`) e iniciar a API e o servidor Web.

#### 3. Acessar a aplicação no navegador

* **Portal Web / Dashboard:** http://localhost:8080
* **Painel de Dados:** http://localhost:8080/cariri-em-dados.html
* **Login da Redação:** http://localhost:8080/login.html

> Credenciais padrão de desenvolvimento: `admin@caririemfoco.com.br` / `cariri2026`
> (configuráveis pelas variáveis `ADMIN_EMAIL` e `ADMIN_SENHA`).

---

## 🧪 Testes

```bash
# Testes unitários e de integração (com o sistema no ar):
docker compose exec backend sh -c "cd backend && pytest -v"
```

A documentação completa está em [`docs/`](docs/): API (`api.md`), Manual Técnico
(`manual-tecnico.md`), Manual do Usuário (`manual-usuario.md`) e Relatório Final
(`relatorio-final.md`).

---

## 🛠️ Comandos Úteis

### Verificar o status dos contêineres

```bash
docker compose ps
```

### Visualizar os logs do backend

```bash
docker compose logs -f backend
```

### Parar a aplicação

```bash
docker compose down
```

### Parar e remover todos os volumes

> ⚠️ Este comando remove também os dados persistidos do banco de dados.

```bash
docker compose down -v
```

---

## 📱 Responsividade

O portal foi desenvolvido com design responsivo utilizando CSS moderno:

* Adaptação contínua via media queries (`1024px`, `768px` e `480px`);
* Grids e layouts flexíveis sem rolagem horizontal;
* Suporte otimizado para dispositivos móveis, tablets e desktops.

---

## 🤝 Como Colaborar

1. Faça um **Fork** deste repositório.
2. Crie uma branch para sua funcionalidade:

```bash
git checkout -b feature/nova-funcionalidade
```

3. Adicione suas alterações:

```bash
git add .
```

4. Faça o commit das mudanças:

```bash
git commit -m "feat: adiciona nova funcionalidade"
```

5. Envie a branch para o repositório remoto:

```bash
git push origin feature/nova-funcionalidade
```

6. Abra um **Pull Request**.

---

## 👥 Autores

* **Aline Pereira de Lima**
* **Diego Gomes Pereira**
* **Ermeson David dos Santos Silva**
* **Fernando Pablo Silva Oliveira**
