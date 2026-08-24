import math
import datetime

import jwt

SECRET_KEY_PADRAO = 'cariri-em-foco-chave-secreta-dev'

def montar_where(filtros, alias='o'):
    where_clauses = ["1=1"]
    params = {}

    municipio_id = filtros.get('municipio_id')
    categoria_id = filtros.get('categoria_id')

    if municipio_id:
        where_clauses.append(f"{alias}.municipio_id = :municipio_id")
        params['municipio_id'] = municipio_id
    if categoria_id:
        where_clauses.append(f"{alias}.categoria_id = :categoria_id")
        params['categoria_id'] = categoria_id

    return " AND ".join(where_clauses), params


def calcular_total_paginas(total_registros, itens_por_pagina):
    if itens_por_pagina <= 0:
        return 1
    if total_registros <= 0:
        return 1
    return math.ceil(total_registros / itens_por_pagina)


def gerar_token(usuario_id, email, secret_key=SECRET_KEY_PADRAO, exp_horas=8):
    payload = {
        'usuario_id': usuario_id,
        'email': email,
        'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=exp_horas),
    }
    return jwt.encode(payload, secret_key, algorithm='HS256')


def decodificar_token(token, secret_key=SECRET_KEY_PADRAO):
    return jwt.decode(token, secret_key, algorithms=['HS256'])
