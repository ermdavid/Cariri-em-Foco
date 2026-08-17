import os
import math
from flask import Flask, jsonify, request
from flask_cors import CORS
from sqlalchemy import create_engine, text

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
DB_NAME = os.getenv('DB_NAME', 'bd_cariri')

DATABASE_URL = f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
engine = create_engine(DATABASE_URL, pool_pre_ping=True)


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


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)