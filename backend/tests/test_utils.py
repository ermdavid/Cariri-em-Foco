import jwt
import pytest

from utils import (
    montar_where,
    calcular_total_paginas,
    gerar_token,
    decodificar_token,
)

def test_montar_where_sem_filtros():
    where, params = montar_where({})
    assert where == "1=1"
    assert params == {}


def test_montar_where_apenas_municipio():
    where, params = montar_where({'municipio_id': '5'})
    assert "o.municipio_id = :municipio_id" in where
    assert params == {'municipio_id': '5'}


def test_montar_where_municipio_e_categoria():
    where, params = montar_where({'municipio_id': '5', 'categoria_id': '2'})
    assert "o.municipio_id = :municipio_id" in where
    assert "o.categoria_id = :categoria_id" in where
    assert params == {'municipio_id': '5', 'categoria_id': '2'}


def test_montar_where_ignora_valores_vazios():
    where, params = montar_where({'municipio_id': '', 'categoria_id': None})
    assert where == "1=1"
    assert params == {}


def test_montar_where_respeita_alias():
    where, _ = montar_where({'municipio_id': '1'}, alias='oc')
    assert "oc.municipio_id" in where

@pytest.mark.parametrize("total,por_pagina,esperado", [
    (0, 10, 1),
    (5, 10, 1),
    (10, 10, 1),
    (11, 10, 2),
    (100, 10, 10),
    (101, 10, 11),
])
def test_calcular_total_paginas(total, por_pagina, esperado):
    assert calcular_total_paginas(total, por_pagina) == esperado


def test_calcular_total_paginas_por_pagina_invalido():
    assert calcular_total_paginas(50, 0) == 1
    assert calcular_total_paginas(50, -5) == 1

def test_token_round_trip():
    token = gerar_token(1, 'redacao@teste.com', secret_key='chave-teste')
    dados = decodificar_token(token, secret_key='chave-teste')
    assert dados['usuario_id'] == 1
    assert dados['email'] == 'redacao@teste.com'


def test_token_assinatura_invalida():
    token = gerar_token(1, 'redacao@teste.com', secret_key='chave-correta')
    with pytest.raises(jwt.InvalidTokenError):
        decodificar_token(token, secret_key='chave-errada')


def test_token_expirado():
    token = gerar_token(1, 'redacao@teste.com', secret_key='k', exp_horas=-1)
    with pytest.raises(jwt.ExpiredSignatureError):
        decodificar_token(token, secret_key='k')
