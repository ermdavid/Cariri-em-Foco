import os

from sqlalchemy import create_engine, text
from werkzeug.security import generate_password_hash

DB_USER = os.getenv('DB_USER', 'admin')
DB_PASSWORD = os.getenv('DB_PASSWORD', 'adminpostgres')
DB_HOST = os.getenv('DB_HOST', 'db')
DB_PORT = os.getenv('DB_PORT', '5432')
DB_NAME = os.getenv('DB_NAME', 'db_cariri')

DATABASE_URL = f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
engine = create_engine(DATABASE_URL)

# Credenciais padrão da redação (documentadas no Manual Técnico).
ADMIN_NOME = 'Redação Cariri em Foco'
ADMIN_EMAIL = os.getenv('ADMIN_EMAIL', 'admin@caririemfoco.com.br')
ADMIN_SENHA = os.getenv('ADMIN_SENHA', 'cariri2026')

NOTICIAS_EXEMPLO = [
    {
        'titulo': 'Cariri recebe festival cultural com atrações regionais',
        'subtitulo': 'Evento reúne música, artesanato e gastronomia típica da região.',
        'categoria': 'cultura',
        'autor': 'Redação',
        'conteudo': 'O festival ocorre neste fim de semana e celebra a cultura caririense.',
        'imagem_url': 'assets/img/icasa_jogador.avif',
    },
    {
        'titulo': 'Economia do Cariri cresce impulsionada pelo comércio local',
        'subtitulo': 'Setor de serviços lidera a geração de empregos no semestre.',
        'categoria': 'economia',
        'autor': 'Redação',
        'conteudo': 'Indicadores apontam recuperação constante do comércio na região.',
        'imagem_url': 'assets/img/icasa_jogador.avif',
    },
]


def seed_usuario(conn):
    print('Verificando usuário administrador...')
    existe = conn.execute(
        text("SELECT 1 FROM usuario WHERE email = :email"),
        {'email': ADMIN_EMAIL},
    ).first()

    if existe:
        print('Usuário administrador já existe. Nada a fazer.')
        return

    conn.execute(
        text("""
            INSERT INTO usuario (nome, email, senha_hash)
            VALUES (:nome, :email, :senha_hash)
        """),
        {
            'nome': ADMIN_NOME,
            'email': ADMIN_EMAIL,
            'senha_hash': generate_password_hash(ADMIN_SENHA, method='pbkdf2:sha256'),
        },
    )
    print(f'Usuário administrador criado: {ADMIN_EMAIL}')


def seed_noticias(conn):
    total = conn.execute(text("SELECT COUNT(*) FROM noticia")).scalar()
    if total and total > 0:
        print('Notícias já cadastradas. Nada a fazer.')
        return

    print('Inserindo notícias de exemplo...')
    for n in NOTICIAS_EXEMPLO:
        conn.execute(
            text("""
                INSERT INTO noticia (titulo, subtitulo, categoria, autor, conteudo, imagem_url)
                VALUES (:titulo, :subtitulo, :categoria, :autor, :conteudo, :imagem_url)
            """),
            n,
        )
    print(f'{len(NOTICIAS_EXEMPLO)} notícias de exemplo inseridas.')


if __name__ == '__main__':
    with engine.begin() as conn:
        seed_usuario(conn)
        seed_noticias(conn)
    print('Seed administrativo concluído.')
