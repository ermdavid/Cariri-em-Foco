import os

from sqlalchemy import create_engine, text

DB_USER = os.getenv('DB_USER', 'admin')
DB_PASSWORD = os.getenv('DB_PASSWORD', 'adminpostgres')
DB_HOST = os.getenv('DB_HOST', 'db')
DB_PORT = os.getenv('DB_PORT', '5432')
DB_NAME = os.getenv('DB_NAME', 'db_cariri')

DATABASE_URL = f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
engine = create_engine(DATABASE_URL)

CAMINHO_SQL = os.path.join(os.path.dirname(__file__), 'objetos.sql')


def aplicar():
    with open(CAMINHO_SQL, 'r', encoding='utf-8') as arquivo:
        conteudo = arquivo.read()

    # exec_driver_sql executa o script inteiro de uma vez, preservando os
    # blocos $$ ... $$ das funções PL/pgSQL (que não podem ser divididos por ';').
    with engine.begin() as conn:
        conn.exec_driver_sql(conteudo)

    print('Objetos de banco (view, function, trigger) aplicados com sucesso.')


if __name__ == '__main__':
    aplicar()
