FROM python:3.12-slim

WORKDIR /app

COPY backend/requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Dá permissão de execução ao script de entrada
RUN chmod +x /app/backend/entrypoint.sh

EXPOSE 5000

# Executa o entrypoint.sh em vez de chamar diretamente o app.py
ENTRYPOINT ["/app/backend/entrypoint.sh"]