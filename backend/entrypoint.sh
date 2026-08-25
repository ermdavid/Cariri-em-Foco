#!/bin/sh

# 1. Executa a carga do banco de dados (ETL)
echo "Carregando dados com seeds.py..."
python database/seeds.py

# 2. Inicia o servidor Flask
echo "Iniciando a API Flask..."
exec python backend/app.py
