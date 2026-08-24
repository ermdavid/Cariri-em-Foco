import os

import pytest
from sqlalchemy import text

import app as app_module

ADMIN_EMAIL = os.getenv('ADMIN_EMAIL', 'admin@caririemfoco.com.br')
ADMIN_SENHA = os.getenv('ADMIN_SENHA', 'cariri2026')

@pytest.fixture(scope='session')
def banco_disponivel():
    try:
        with app_module.engine.connect() as conn:
            conn.execute(text('SELECT 1'))
    except Exception:
        pytest.skip('Banco de dados indisponível — testes de integração ignorados.')

@pytest.fixture()
def client():
    app_module.app.config['TESTING'] = True
    return app_module.app.test_client()


@pytest.fixture()
def token(client, banco_disponivel):
    resp = client.post('/api/auth/login', json={'email': ADMIN_EMAIL, 'senha': ADMIN_SENHA})
    assert resp.status_code == 200, resp.get_data(as_text=True)
    return resp.get_json()['token']

def test_health(client):
    resp = client.get('/api/health')
    assert resp.status_code == 200
    assert resp.get_json()['status'] == 'ok'

def test_login_sucesso(client, banco_disponivel):
    resp = client.post('/api/auth/login', json={'email': ADMIN_EMAIL, 'senha': ADMIN_SENHA})
    assert resp.status_code == 200
    corpo = resp.get_json()
    assert 'token' in corpo
    assert corpo['usuario']['email'] == ADMIN_EMAIL


def test_login_senha_incorreta(client, banco_disponivel):
    resp = client.post('/api/auth/login', json={'email': ADMIN_EMAIL, 'senha': 'errada'})
    assert resp.status_code == 401


def test_login_campos_ausentes(client):
    resp = client.post('/api/auth/login', json={'email': ''})
    assert resp.status_code == 400


def test_rota_protegida_sem_token(client):
    resp = client.post('/api/noticias', json={'titulo': 'x', 'conteudo': 'y'})
    assert resp.status_code == 401


def test_rota_protegida_token_invalido(client):
    resp = client.get('/api/auth/me', headers={'Authorization': 'Bearer token-falso'})
    assert resp.status_code == 401


def test_ciclo_completo_noticia(client, token, banco_disponivel):
    cabecalho = {'Authorization': f'Bearer {token}'}

    # CREATE
    novo = {
        'titulo': 'Notícia de teste automatizado',
        'subtitulo': 'Gerada por pytest',
        'categoria': 'cultura',
        'autor': 'CI',
        'conteudo': 'Conteúdo de teste.',
    }
    r_create = client.post('/api/noticias', json=novo, headers=cabecalho)
    assert r_create.status_code == 201
    noticia_id = r_create.get_json()['id']

    try:
        # READ
        r_get = client.get(f'/api/noticias/{noticia_id}')
        assert r_get.status_code == 200
        assert r_get.get_json()['titulo'] == novo['titulo']

        # UPDATE
        atualizado = dict(novo, titulo='Título atualizado')
        r_put = client.put(f'/api/noticias/{noticia_id}', json=atualizado, headers=cabecalho)
        assert r_put.status_code == 200

        r_get2 = client.get(f'/api/noticias/{noticia_id}')
        assert r_get2.get_json()['titulo'] == 'Título atualizado'
    finally:
        # DELETE (limpeza)
        r_del = client.delete(f'/api/noticias/{noticia_id}', headers=cabecalho)
        assert r_del.status_code == 200

    # Confirma remoção
    r_get3 = client.get(f'/api/noticias/{noticia_id}')
    assert r_get3.status_code == 404


def test_criar_noticia_sem_titulo(client, token, banco_disponivel):
    r = client.post('/api/noticias', json={'conteudo': 'sem título'},
                    headers={'Authorization': f'Bearer {token}'})
    assert r.status_code == 400

def test_filtros(client, banco_disponivel):
    r = client.get('/api/filtros')
    assert r.status_code == 200
    corpo = r.get_json()
    assert 'municipios' in corpo and 'categorias' in corpo


def test_kpis(client, banco_disponivel):
    r = client.get('/api/kpis')
    assert r.status_code == 200
    assert 'total_ocorrencias' in r.get_json()
