# database/seeds.py
import os
import numpy as np
import pandas as pd
from sqlalchemy import create_engine, text

# 1. Configurações do Banco de Dados 
DB_USER = os.getenv('DB_USER', 'admin')
DB_PASSWORD = os.getenv('DB_PASSWORD', 'adminpostgres')
DB_HOST = os.getenv('DB_HOST', 'db')
DB_PORT = os.getenv('DB_PORT', '5432')
DB_NAME = os.getenv('DB_NAME', 'db_cariri')

DATABASE_URL = (
    f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
)
engine = create_engine(DATABASE_URL)


def carregar_dataframe(caminho_arquivo):
  print(f'Lendo arquivo de dados: {caminho_arquivo}')
  if caminho_arquivo.endswith('.parquet'):
    return pd.read_parquet(caminho_arquivo)
  return pd.read_csv(caminho_arquivo)


def executar_etl(caminho_arquivo):
  print('Carregando dados...')

  # EXTRACT (Leitura do arquivo)
  df = carregar_dataframe(caminho_arquivo)

  # TRANSFORM (Higienização e Adequação ao Schema)
  print('Tratando e limpando os dados...')

  # Padronizar nomes das colunas de domínio
  df['MUNICÍPIO'] = df['MUNICÍPIO'].astype(str).str.strip().str.upper()
  df['CATEGORIA'] = df['CATEGORIA'].astype(str).str.strip().str.upper()

  # Tratar e combinar DATA + HORA -> data_hora (TIMESTAMP)
  df['HORA'] = (
      df['HORA']
      .astype(str)
      .str.strip()
      .replace({'nan': '00:00:00', '<NA>': '00:00:00', '': '00:00:00'})
  )
  data_str = pd.to_datetime(df['DATA']).dt.strftime('%Y-%m-%d')
  df['data_hora'] = pd.to_datetime(
      data_str + ' ' + df['HORA'], errors='coerce'
  ).fillna(pd.to_datetime(df['DATA']))

  # Outras colunas do fato 'ocorrencia'
  df['ais'] = df['AIS'].astype(str).str.strip()
  df['dia_da_semana'] = df['DIA_DA_SEMANA'].astype(str).str.strip()
  df['periodo'] = df['PERIODO'].astype(str).str.strip()
  df['natureza'] = df['NATUREZA'].astype(str).str.strip()
  df['local'] = df['LOCAL'].astype(str).str.strip()
  df['meio_empregado'] = df['MEIO_EMPREGADO'].astype(str).str.strip()
  df['tipo_entorpecente'] = df['TIPO_DE_ENTORPECENTE'].astype(str).str.strip()

  # Tratamento numérico (Armas e Drogas)
  df['quantidade_armas'] = (
      pd.to_numeric(df['QUANTIDADE'], errors='coerce').fillna(0).astype(int)
  )
  df['quantidade_drogas_kg'] = (
      pd.to_numeric(df['QUANTIDADE_(KG)'], errors='coerce')
      .fillna(0.0)
      .astype(float)
  )

  # Tratamento para tabela de vítimas
  df['genero'] = df['GÊNERO'].astype(str).str.strip()
  df['identidade_genero'] = df['IDENTIDADE_DE_GÊNERO'].astype(str).str.strip()
  df['orientacao_sexual'] = df['ORIENTAÇÃO_SEXUAL'].astype(str).str.strip()
  df['escolaridade'] = df['ESCOLARIDADE_DA_VÍTIMA'].astype(str).str.strip()
  df['raca'] = df['RAÇA_DA_VÍTIMA'].astype(str).str.strip()

  # Idade da vítima com validação CHECK (0 a 120 anos)
  df['idade'] = pd.to_numeric(df['IDADE_DA_VÍTIMA'], errors='coerce')
  df.loc[(df['idade'] < 0) | (df['idade'] > 120), 'idade'] = np.nan

  # Atribuir um ID incremental para relacionar Ocorrências e Detalhes da Vítima
  df['ocorrencia_id'] = range(1, len(df) + 1)

  # LOAD (Banco PostgreSQL)
  with engine.begin() as conn:
    # 1. Inserir Municípios
    print("Povoando tabela 'municipio'...")
    municipios = (
        df[['MUNICÍPIO']]
        .drop_duplicates()
        .dropna()
        .rename(columns={'MUNICÍPIO': 'nome'})
    )
    for _, row in municipios.iterrows():
      conn.execute(
          text(
              'INSERT INTO municipio (nome) VALUES (:nome) ON CONFLICT (nome)'
              ' DO NOTHING;'
          ),
          {'nome': row['nome']},
      )

    # 2. Inserir Categorias de Crime
    print("Povoando tabela 'categoria_crime'...")
    categorias = (
        df[['CATEGORIA']]
        .drop_duplicates()
        .dropna()
        .rename(columns={'CATEGORIA': 'nome'})
    )
    for _, row in categorias.iterrows():
      conn.execute(
          text(
              'INSERT INTO categoria_crime (nome) VALUES (:nome) ON CONFLICT'
              ' (nome) DO NOTHING;'
          ),
          {'nome': row['nome']},
      )

    # Mapear os IDs do banco cruzando pelo nome (evita sensibilidade a maiúsculas no SQL)
    map_muni = pd.read_sql(
        'SELECT id AS municipio_id, nome FROM municipio', conn
    )
    map_cat = pd.read_sql(
        'SELECT id AS categoria_id, nome FROM categoria_crime', conn
    )

    df = df.merge(
        map_muni, left_on='MUNICÍPIO', right_on='nome', how='left'
    ).drop(columns=['nome'])
    df = df.merge(
        map_cat, left_on='CATEGORIA', right_on='nome', how='left'
    ).drop(columns=['nome'])

    # 3. Inserir Ocorrências
    print('Verificando tabela de ocorrências...')

    ocorrencias_existentes = conn.execute(
        text('SELECT COUNT(*) FROM ocorrencia')
    ).scalar()

    if ocorrencias_existentes > 0:
        print(
            f'Tabela de ocorrências já possui {ocorrencias_existentes} registros.'
        )
        print('Carga de ocorrências ignorada para evitar duplicação.')
    else:
        print('Inserindo ocorrências no banco...')

        df_ocorrencias = df[[
            'ocorrencia_id',
            'municipio_id',
            'categoria_id',
            'ais',
            'data_hora',
            'dia_da_semana',
            'periodo',
            'natureza',
            'local',
            'meio_empregado',
            'quantidade_armas',
            'quantidade_drogas_kg',
            'tipo_entorpecente',
        ]].rename(columns={'ocorrencia_id': 'id'})

        # Limpar strings 'nan' para None (SQL NULL)
        df_ocorrencias = df_ocorrencias.replace({'nan': None, '': None})

        df_ocorrencias.to_sql(
            'ocorrencia',
            con=conn,
            if_exists='append',
            index=False,
            method='multi',
            chunksize=3000,
        )

        # Ajustar a sequência da chave primária SERIAL no PostgreSQL
        conn.execute(
            text(
                "SELECT setval('ocorrencia_id_seq', "
                "(SELECT MAX(id) FROM ocorrencia));"
            )
        )
        
    # 4. Inserir Detalhes das Vítimas (Apenas linhas que contêm informações de vítimas)
    print('Inserindo Detalhes das Vítimas...')
    colunas_vitima = [
        'genero',
        'identidade_genero',
        'orientacao_sexual',
        'idade',
        'escolaridade',
        'raca',
    ]
    has_vitima = (
        df[colunas_vitima].notna().replace({'nan': False, '': False}).any(axis=1)
    )

    df_vitimas = df[has_vitima][['ocorrencia_id'] + colunas_vitima].copy()
    df_vitimas = df_vitimas.replace({'nan': None, '': None})

    df_vitimas.to_sql(
        'detalhe_vitima',
        con=conn,
        if_exists='append',
        index=False,
        method='multi',
        chunksize=3000,
    )

  print('Carga realizada com sucesso no PostgreSQL!')


if __name__ == '__main__':
  diretorio_base = os.path.dirname(__file__)
  arquivo_parquet = os.path.join(diretorio_base, 'dados_sspds.parquet')
  arquivo_csv = os.path.join(diretorio_base, 'dados_sspds.csv')

  if os.path.exists(arquivo_parquet):
    executar_etl(arquivo_parquet)
  elif os.path.exists(arquivo_csv):
    executar_etl(arquivo_csv)
  else:
    print(
        "Nenhum arquivo ('dados_sspds.parquet' ou 'dados_sspds.csv') foi"
        " encontrado na pasta 'database/'"
    )
