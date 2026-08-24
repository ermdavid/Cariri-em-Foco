#!/bin/sh

# 1. Executa a carga do banco de dados (ETL das ocorrências)
echo "Carregando dados com seeds.py..."
python database/seeds.py

# 2. Cria o usuário administrador e notícias de exemplo (idempotente)
echo "Executando seed administrativo (seed_auth.py)..."
python database/seed_auth.py

# 3. Aplica os objetos de banco (view, function, trigger) — reexecutável
echo "Aplicando objetos de banco (apply_objetos.py)..."
python database/apply_objetos.py

# 4. Inicia o servidor Flask
echo "Iniciando a API Flask..."
exec python backend/app.py
