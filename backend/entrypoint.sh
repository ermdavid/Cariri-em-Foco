#!/bin/sh

# 1. Executa a carga do banco de dados (ETL) apenas na primeira inicialização
if python -c "from sqlalchemy import create_engine, text; import os; url = f\"postgresql://{os.getenv('DB_USER', 'admin')}:{os.getenv('DB_PASSWORD', 'adminpostgres')}@{os.getenv('DB_HOST', 'db')}:{os.getenv('DB_PORT', '5432')}/{os.getenv('DB_NAME', 'db_cariri')}\"; engine = create_engine(url); conn = engine.connect(); raise SystemExit(0 if conn.execute(text('SELECT COUNT(*) FROM ocorrencia')).scalar() > 0 else 1)"; then
	echo "Dados já carregados; ignorando seeds.py."
else
	echo "Carregando dados com seeds.py..."
	python database/seeds.py
fi

# 2. Inicia o servidor Flask
echo "Iniciando a API Flask..."
exec python backend/app.py
