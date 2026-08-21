import os
import math
from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
from sqlalchemy import create_engine, text
#cadastro de noticias
import re
import uuid
import json
import base64
import secrets

app = Flask(__name__)

# Permite exibir acentos e caracteres especiais diretamente no JSON
app.json.ensure_ascii = False

# Habilita CORS para o Frontend
CORS(app)

# Configuração de Conexão com o PostgreSQL
DB_USER = os.getenv('DB_USER', 'admin')
DB_PASSWORD = os.getenv('DB_PASSWORD', 'adminpostgres')
DB_HOST = os.getenv('DB_HOST', 'db')
DB_PORT = os.getenv('DB_PORT', '5432')
DB_NAME = os.getenv('DB_NAME', 'db_cariri')

DATABASE_URL = f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
engine = create_engine(DATABASE_URL, pool_pre_ping=True)
TOKENS_ATIVOS = set()
ADMIN_EMAIL = os.getenv('ADMIN_EMAIL', 'redacao@caririemfoco.com.br')
ADMIN_PASSWORD = os.getenv('ADMIN_PASSWORD', 'admin123')


@app.route('/api/auth/login', methods=['POST'])
def autenticar_redator():
    dados = request.get_json() or {}
    email = dados.get('email', '').strip()
    senha = dados.get('senha', '')

    if email != ADMIN_EMAIL or senha != ADMIN_PASSWORD:
        return jsonify({'erro': 'E-mail ou senha incorretos.'}), 401

    token = secrets.token_urlsafe(32)
    TOKENS_ATIVOS.add(token)
    return jsonify({
        'token': token,
        'usuario': {'email': ADMIN_EMAIL, 'perfil': 'redator'}
    }), 200


def usuario_autenticado():
    autorizacao = request.headers.get('Authorization', '')
    return autorizacao.startswith('Bearer ') and autorizacao[7:] in TOKENS_ATIVOS


# 1. GET /api/filtros (Lista municípios e categorias)
@app.route('/api/filtros', methods=['GET'])
def obter_filtros():
    with engine.connect() as conn:
        municipios = conn.execute(text("SELECT id, nome FROM municipio ORDER BY nome ASC")).mappings().all()
        categorias = conn.execute(text("SELECT id, nome FROM categoria_crime ORDER BY nome ASC")).mappings().all()
    
    return jsonify({
        "municipios": [dict(m) for m in municipios],
        "categorias": [dict(c) for c in categorias]
    }), 200


# 2. GET /api/kpis (Retorna indicadores do dashboard)
@app.route('/api/kpis', methods=['GET'])
def obter_kpis():
    municipio_id = request.args.get('municipio_id')
    categoria_id = request.args.get('categoria_id')

    where_clauses = ["1=1"]
    params = {}

    if municipio_id:
        where_clauses.append("o.municipio_id = :municipio_id")
        params['municipio_id'] = municipio_id
    if categoria_id:
        where_clauses.append("o.categoria_id = :categoria_id")
        params['categoria_id'] = categoria_id

    where_sql = " AND ".join(where_clauses)

    query = f"""
        SELECT 
            COUNT(o.id) AS total_ocorrencias,
            COALESCE(SUM(o.quantidade_armas), 0) AS total_armas,
            COALESCE(SUM(o.quantidade_drogas_kg), 0) AS total_drogas_kg,
            COUNT(v.id) AS total_vitimas
        FROM ocorrencia o
        LEFT JOIN detalhe_vitima v ON o.id = v.ocorrencia_id
        WHERE {where_sql};
    """

    with engine.connect() as conn:
        result = conn.execute(text(query), params).mappings().first()

    return jsonify(dict(result)), 200


# 3. GET /api/ocorrencias (Retorna ocorrências filtradas / Evolução Temporal)
@app.route('/api/ocorrencias', methods=['GET'])
def obter_ocorrencias():
    municipio_id = request.args.get('municipio_id')
    categoria_id = request.args.get('categoria_id')

    where_clauses = ["1=1"]
    params = {}

    if municipio_id:
        where_clauses.append("o.municipio_id = :municipio_id")
        params['municipio_id'] = municipio_id
    if categoria_id:
        where_clauses.append("o.categoria_id = :categoria_id")
        params['categoria_id'] = categoria_id

    where_sql = " AND ".join(where_clauses)

    query = f"""
        SELECT 
            TO_CHAR(o.data_hora, 'YYYY-MM') AS mes_ano,
            COUNT(o.id) AS total
        FROM ocorrencia o
        WHERE {where_sql}
        GROUP BY mes_ano
        ORDER BY mes_ano ASC;
    """

    with engine.connect() as conn:
        results = conn.execute(text(query), params).mappings().all()

    return jsonify([dict(r) for r in results]), 200


# 4. GET /api/ocorrencias/municipio (Dados para gráfico por cidade)
@app.route('/api/ocorrencias/municipio', methods=['GET'])
def ocorrencias_por_municipio():
    categoria_id = request.args.get('categoria_id')

    where_clauses = ["1=1"]
    params = {}

    if categoria_id:
        where_clauses.append("o.categoria_id = :categoria_id")
        params['categoria_id'] = categoria_id

    where_sql = " AND ".join(where_clauses)

    query = f"""
        SELECT m.nome AS municipio, COUNT(o.id) AS total
        FROM ocorrencia o
        JOIN municipio m ON o.municipio_id = m.id
        WHERE {where_sql}
        GROUP BY m.nome
        ORDER BY total DESC;
    """

    with engine.connect() as conn:
        results = conn.execute(text(query), params).mappings().all()

    return jsonify([dict(r) for r in results]), 200


# 5. GET /api/ocorrencias/categoria (Dados para gráfico por categoria)
@app.route('/api/ocorrencias/categoria', methods=['GET'])
def ocorrencias_por_categoria():
    municipio_id = request.args.get('municipio_id')

    where_clauses = ["1=1"]
    params = {}

    if municipio_id:
        where_clauses.append("o.municipio_id = :municipio_id")
        params['municipio_id'] = municipio_id

    where_sql = " AND ".join(where_clauses)

    query = f"""
        SELECT c.nome AS categoria, COUNT(o.id) AS total
        FROM ocorrencia o
        JOIN categoria_crime c ON o.categoria_id = c.id
        WHERE {where_sql}
        GROUP BY c.nome
        ORDER BY total DESC;
    """

    with engine.connect() as conn:
        results = conn.execute(text(query), params).mappings().all()

    return jsonify([dict(r) for r in results]), 200


# 6. GET /api/ocorrencias/detalhada (Dados paginados para tabela)
@app.route('/api/ocorrencias/detalhada', methods=['GET'])
def ocorrencias_detalhada():
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 10, type=int)
    municipio_id = request.args.get('municipio_id')
    categoria_id = request.args.get('categoria_id')

    where_clauses = ["1=1"]
    params = {'limit': per_page, 'offset': (page - 1) * per_page}

    if municipio_id:
        where_clauses.append("o.municipio_id = :municipio_id")
        params['municipio_id'] = municipio_id
    if categoria_id:
        where_clauses.append("o.categoria_id = :categoria_id")
        params['categoria_id'] = categoria_id

    where_sql = " AND ".join(where_clauses)

    query = f"""
        SELECT 
            o.id,
            TO_CHAR(o.data_hora, 'DD/MM/YYYY HH24:MI') AS data_hora,
            m.nome AS municipio,
            c.nome AS categoria,
            o.natureza,
            o.local,
            o.meio_empregado
        FROM ocorrencia o
        JOIN municipio m ON o.municipio_id = m.id
        JOIN categoria_crime c ON o.categoria_id = c.id
        WHERE {where_sql}
        ORDER BY o.data_hora DESC
        LIMIT :limit OFFSET :offset;
    """

    count_query = f"SELECT COUNT(*) FROM ocorrencia o WHERE {where_sql};"

    with engine.connect() as conn:
        results = conn.execute(text(query), params).mappings().all()
        total = conn.execute(text(count_query), params).scalar()

    return jsonify({
        "pagina_atual": page,
        "itens_por_pagina": per_page,
        "total_registros": total,
        "total_paginas": math.ceil(total / per_page) if per_page > 0 else 1,
        "registros": [dict(r) for r in results]
    }), 200


#Noticias
# Configuração dos caminhos dentro do contêiner Linux do Docker
PASTA_IMAGENS = "/app/backend/imagens"
PASTA_DADOS = "/app/backend/dados"

# Garante que as pastas existam no servidor
os.makedirs(PASTA_IMAGENS, exist_ok=True)
os.makedirs(PASTA_DADOS, exist_ok=True)

@app.route('/api/noticias', methods=['POST'])
def salvar_noticia():
    if not usuario_autenticado():
        return jsonify({'erro': 'Autenticação necessária.'}), 401

    dados = request.get_json()
    
    if not dados:
        return jsonify({"erro": "Dados JSON inválidos"}), 400

    # 1. Tratamento da Imagem Base64
    imagem_base64 = dados.get('imagem')
    url_imagem_salva = None

    if imagem_base64:
        # Separa o cabeçalho "data:image/png;base64," dos dados puros
        if "," in imagem_base64:
            cabecalho, dados_puros = imagem_base64.split(",", 1)
        else:
            cabecalho, dados_puros = "", imagem_base64

        # Identifica a extensão do arquivo
        extensao = ".jpg"
        if "image/png" in cabecalho:
            extensao = ".png"
        elif "image/gif" in cabecalho:
            extensao = ".gif"
        elif "image/webp" in cabecalho:
            extensao = ".webp"

        # Decodifica os bytes da imagem
        bytes_imagem = base64.b64decode(dados_puros)
        
        # Gera um nome de arquivo único
        nome_arquivo = f"{uuid.uuid4()}{extensao}"
        caminho_completo_imagem = os.path.join(PASTA_IMAGENS, nome_arquivo)
        
        # Salva o arquivo físico no disco do servidor
        with open(caminho_completo_imagem, "wb") as f:
            f.write(bytes_imagem)
            
        url_imagem_salva = f"/api/imagens/{nome_arquivo}"

    # 2. Monta a estrutura final da notícia para salvar
    nova_noticia = {
        "titulo": dados.get('Titulo'),
        "subtitulo": dados.get('Subtitulo'),
        "resumo": dados.get('Resumo'),
        "palavrasChaves": dados.get('palavrasChaves', []),
        "conteudo": dados.get('Conteúdo'),
        "tipoNoticia": dados.get('Categoria'),
        "status": dados.get('status', 'rascunho'),
        "imagemUrl": url_imagem_salva
    }

    # 3. Salva a notícia em um arquivo JSON local
    nome_arquivo_json = f"noticia_{uuid.uuid4().hex}.json"
    caminho_completo_json = os.path.join(PASTA_DADOS, nome_arquivo_json)
    
    with open(caminho_completo_json, "w", encoding="utf-8") as f:
        json.dump(nova_noticia, f, ensure_ascii=False, indent=4)

    return jsonify({"mensagem": "Notícia processada com sucesso!", "dados": nova_noticia}), 201

@app.route('/api/noticias', methods=['GET'])
def listar_noticias():
    noticias = []

    for nome_arquivo in os.listdir(PASTA_DADOS):
        if not nome_arquivo.endswith('.json'):
            continue

        caminho = os.path.join(PASTA_DADOS, nome_arquivo)
        try:
            with open(caminho, 'r', encoding='utf-8') as arquivo:
                noticia = json.load(arquivo)
        except (OSError, json.JSONDecodeError):
            continue

        if noticia.get('status') == 'publicado':
            noticia['id'] = nome_arquivo.removesuffix('.json')
            noticias.append(noticia)

    noticias.sort(key=lambda noticia: noticia['id'], reverse=True)
    return jsonify(noticias), 200

@app.route('/api/imagens/<path:nome_arquivo>', methods=['GET'])
def obter_imagem(nome_arquivo):
    return send_from_directory(PASTA_IMAGENS, nome_arquivo)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)