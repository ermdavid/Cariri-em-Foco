import os
from functools import wraps

import jwt
from flask import Flask, jsonify, request
from flask_cors import CORS
from sqlalchemy import create_engine, text
from werkzeug.security import check_password_hash

from utils import montar_where, calcular_total_paginas, gerar_token, decodificar_token

app = Flask(__name__)

app.json.ensure_ascii = False

CORS(app)

SECRET_KEY = os.getenv('SECRET_KEY', 'cariri-em-foco-chave-secreta-dev')
JWT_EXP_HORAS = int(os.getenv('JWT_EXP_HORAS', '8'))

DB_USER = os.getenv('DB_USER', 'admin')
DB_PASSWORD = os.getenv('DB_PASSWORD', 'adminpostgres')
DB_HOST = os.getenv('DB_HOST', 'db')
DB_PORT = os.getenv('DB_PORT', '5432')
DB_NAME = os.getenv('DB_NAME', 'db_cariri')

DATABASE_URL = f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
engine = create_engine(DATABASE_URL, pool_pre_ping=True)

def _gerar_token(usuario_id, email):
    return gerar_token(usuario_id, email, secret_key=SECRET_KEY, exp_horas=JWT_EXP_HORAS)

def _decodificar_token(token):
    return decodificar_token(token, secret_key=SECRET_KEY)

def token_obrigatorio(f):
    @wraps(f)
    def decorada(*args, **kwargs):
        cabecalho = request.headers.get('Authorization', '')
        if not cabecalho.startswith('Bearer '):
            return jsonify({'erro': 'Token de autenticação ausente.'}), 401

        token = cabecalho.split(' ', 1)[1].strip()
        try:
            dados = _decodificar_token(token)
        except jwt.ExpiredSignatureError:
            return jsonify({'erro': 'Sessão expirada. Faça login novamente.'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'erro': 'Token inválido.'}), 401

        request.usuario = dados
        return f(*args, **kwargs)

    return decorada

@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok'}), 200

@app.route('/api/auth/login', methods=['POST'])
def login():
    corpo = request.get_json(silent=True) or {}
    email = (corpo.get('email') or '').strip().lower()
    senha = corpo.get('senha') or ''

    if not email or not senha:
        return jsonify({'erro': 'Informe e-mail e senha.'}), 400

    with engine.connect() as conn:
        usuario = conn.execute(
            text("SELECT id, nome, email, senha_hash FROM usuario WHERE email = :email"),
            {'email': email},
        ).mappings().first()

    if not usuario or not check_password_hash(usuario['senha_hash'], senha):
        return jsonify({'erro': 'E-mail ou senha incorretos.'}), 401

    token = _gerar_token(usuario['id'], usuario['email'])
    return jsonify({
        'token': token,
        'usuario': {
            'id': usuario['id'],
            'nome': usuario['nome'],
            'email': usuario['email'],
        },
    }), 200


@app.route('/api/auth/me', methods=['GET'])
@token_obrigatorio
def me():
    return jsonify({
        'usuario_id': request.usuario.get('usuario_id'),
        'email': request.usuario.get('email'),
    }), 200

@app.route('/api/noticias', methods=['GET'])
def listar_noticias():
    categoria = request.args.get('categoria')
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 10, type=int)

    where = "1=1"
    params = {'limit': per_page, 'offset': (page - 1) * per_page}
    if categoria:
        where = "categoria = :categoria"
        params['categoria'] = categoria

    query = f"""
        SELECT id, titulo, subtitulo, categoria, autor, imagem_url,
               TO_CHAR(publicado_em, 'DD/MM/YYYY') AS publicado_em
        FROM noticia
        WHERE {where}
        ORDER BY publicado_em DESC, id DESC
        LIMIT :limit OFFSET :offset;
    """
    count_query = f"SELECT COUNT(*) FROM noticia WHERE {where};"

    with engine.connect() as conn:
        registros = conn.execute(text(query), params).mappings().all()
        total = conn.execute(text(count_query), params).scalar()

    return jsonify({
        'pagina_atual': page,
        'total_registros': total,
        'total_paginas': calcular_total_paginas(total, per_page),
        'registros': [dict(r) for r in registros],
    }), 200

@app.route('/api/noticias/<int:noticia_id>', methods=['GET'])
def obter_noticia(noticia_id):
    with engine.connect() as conn:
        registro = conn.execute(
            text("""
                SELECT id, titulo, subtitulo, categoria, autor, conteudo, imagem_url,
                       TO_CHAR(publicado_em, 'DD/MM/YYYY') AS publicado_em
                FROM noticia WHERE id = :id
            """),
            {'id': noticia_id},
        ).mappings().first()

    if not registro:
        return jsonify({'erro': 'Notícia não encontrada.'}), 404
    return jsonify(dict(registro)), 200

@app.route('/api/noticias', methods=['POST'])
@token_obrigatorio
def criar_noticia():
    corpo = request.get_json(silent=True) or {}
    titulo = (corpo.get('titulo') or '').strip()
    conteudo = (corpo.get('conteudo') or '').strip()

    if not titulo or not conteudo:
        return jsonify({'erro': 'Título e conteúdo são obrigatórios.'}), 400

    params = {
        'titulo': titulo,
        'subtitulo': (corpo.get('subtitulo') or '').strip() or None,
        'categoria': (corpo.get('categoria') or '').strip() or None,
        'autor': (corpo.get('autor') or '').strip() or None,
        'conteudo': conteudo,
        'imagem_url': (corpo.get('imagem_url') or '').strip() or None,
    }

    with engine.begin() as conn:
        novo_id = conn.execute(
            text("""
                INSERT INTO noticia (titulo, subtitulo, categoria, autor, conteudo, imagem_url)
                VALUES (:titulo, :subtitulo, :categoria, :autor, :conteudo, :imagem_url)
                RETURNING id;
            """),
            params,
        ).scalar()

    return jsonify({'id': novo_id, 'mensagem': 'Notícia criada com sucesso.'}), 201

@app.route('/api/noticias/<int:noticia_id>', methods=['PUT'])
@token_obrigatorio
def atualizar_noticia(noticia_id):
    corpo = request.get_json(silent=True) or {}
    titulo = (corpo.get('titulo') or '').strip()
    conteudo = (corpo.get('conteudo') or '').strip()

    if not titulo or not conteudo:
        return jsonify({'erro': 'Título e conteúdo são obrigatórios.'}), 400

    params = {
        'id': noticia_id,
        'titulo': titulo,
        'subtitulo': (corpo.get('subtitulo') or '').strip() or None,
        'categoria': (corpo.get('categoria') or '').strip() or None,
        'autor': (corpo.get('autor') or '').strip() or None,
        'conteudo': conteudo,
        'imagem_url': (corpo.get('imagem_url') or '').strip() or None,
    }

    with engine.begin() as conn:
        resultado = conn.execute(
            text("""
                UPDATE noticia SET
                    titulo = :titulo, subtitulo = :subtitulo, categoria = :categoria,
                    autor = :autor, conteudo = :conteudo, imagem_url = :imagem_url
                WHERE id = :id;
            """),
            params,
        )

    if resultado.rowcount == 0:
        return jsonify({'erro': 'Notícia não encontrada.'}), 404
    return jsonify({'mensagem': 'Notícia atualizada com sucesso.'}), 200

@app.route('/api/noticias/<int:noticia_id>', methods=['DELETE'])
@token_obrigatorio
def excluir_noticia(noticia_id):
    with engine.begin() as conn:
        resultado = conn.execute(
            text("DELETE FROM noticia WHERE id = :id;"), {'id': noticia_id}
        )
    if resultado.rowcount == 0:
        return jsonify({'erro': 'Notícia não encontrada.'}), 404
    return jsonify({'mensagem': 'Notícia excluída com sucesso.'}), 200

@app.route('/api/filtros', methods=['GET'])
def obter_filtros():
    with engine.connect() as conn:
        municipios = conn.execute(text("SELECT id, nome FROM municipio ORDER BY nome ASC")).mappings().all()
        categorias = conn.execute(text("SELECT id, nome FROM categoria_crime ORDER BY nome ASC")).mappings().all()

    return jsonify({
        "municipios": [dict(m) for m in municipios],
        "categorias": [dict(c) for c in categorias]
    }), 200

@app.route('/api/kpis', methods=['GET'])
def obter_kpis():
    where_sql, params = montar_where(request.args)

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

@app.route('/api/ocorrencias', methods=['GET'])
def obter_ocorrencias():
    where_sql, params = montar_where(request.args)

    query = f"""
        SELECT TO_CHAR(o.data_hora, 'YYYY-MM') AS mes_ano, COUNT(o.id) AS total
        FROM ocorrencia o
        WHERE {where_sql}
        GROUP BY mes_ano
        ORDER BY mes_ano ASC;
    """

    with engine.connect() as conn:
        results = conn.execute(text(query), params).mappings().all()

    return jsonify([dict(r) for r in results]), 200

@app.route('/api/ocorrencias/municipio', methods=['GET'])
def ocorrencias_por_municipio():
    where_sql, params = montar_where({'categoria_id': request.args.get('categoria_id')})

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

@app.route('/api/ocorrencias/categoria', methods=['GET'])
def ocorrencias_por_categoria():
    where_sql, params = montar_where({'municipio_id': request.args.get('municipio_id')})

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

@app.route('/api/ocorrencias/detalhada', methods=['GET'])
def ocorrencias_detalhada():
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 10, type=int)

    where_sql, params = montar_where(request.args)
    params['limit'] = per_page
    params['offset'] = (page - 1) * per_page

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
        "total_paginas": calcular_total_paginas(total, per_page),
        "registros": [dict(r) for r in results]
    }), 200

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
