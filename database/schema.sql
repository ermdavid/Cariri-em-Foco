-- 1. Tabela de Municípios (Domínio)
CREATE TABLE municipio (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL UNIQUE
);

-- 2. Tabela de Categorias de Crime (Domínio)
CREATE TABLE categoria_crime (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL UNIQUE
);

-- 3. Tabela Principal de Ocorrências (Entidade Fato)
CREATE TABLE ocorrencia (
    id BIGSERIAL PRIMARY KEY,
    municipio_id INT NOT NULL,
    categoria_id INT NOT NULL,
    ais VARCHAR(50),
    data_hora TIMESTAMP NOT NULL,
    dia_da_semana VARCHAR(20),
    periodo VARCHAR(20),
    natureza VARCHAR(150),
    local VARCHAR(150),
    meio_empregado VARCHAR(100),
    quantidade_armas INT DEFAULT 0,
    quantidade_drogas_kg DECIMAL(10, 3) DEFAULT 0.000,
    tipo_entorpecente VARCHAR(100),

    CONSTRAINT fk_ocorrencia_municipio
        FOREIGN KEY (municipio_id)
        REFERENCES municipio(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

    CONSTRAINT fk_ocorrencia_categoria
        FOREIGN KEY (categoria_id)
        REFERENCES categoria_crime(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
);

-- 4. Tabela de Detalhes da Vítima
CREATE TABLE detalhe_vitima (
    id BIGSERIAL PRIMARY KEY,
    ocorrencia_id BIGINT NOT NULL UNIQUE,
    genero VARCHAR(50),
    identidade_genero VARCHAR(50),
    orientacao_sexual VARCHAR(50),
    idade INT CHECK (idade IS NULL OR (idade >= 0 AND idade <= 120)),
    escolaridade VARCHAR(100),
    raca VARCHAR(50),

    CONSTRAINT fk_detalhe_ocorrencia
        FOREIGN KEY (ocorrencia_id)
        REFERENCES ocorrencia(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

-- 5. Tabela de Usuários (Redação / acesso administrativo)
CREATE TABLE usuario (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(120) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    senha_hash VARCHAR(255) NOT NULL,
    criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 6. Tabela de Notícias (gerenciadas pela redação via painel administrativo)
CREATE TABLE noticia (
    id SERIAL PRIMARY KEY,
    titulo VARCHAR(200) NOT NULL,
    subtitulo VARCHAR(300),
    categoria VARCHAR(50),
    autor VARCHAR(120),
    conteudo TEXT NOT NULL,
    imagem_url VARCHAR(500),
    publicado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Filtros do dashboard incidem sobre municipio_id, categoria_id e data_hora.
CREATE INDEX idx_ocorrencia_municipio   ON ocorrencia (municipio_id);
CREATE INDEX idx_ocorrencia_categoria   ON ocorrencia (categoria_id);
CREATE INDEX idx_ocorrencia_data_hora   ON ocorrencia (data_hora);
-- Índice composto para consultas que cruzam município e categoria simultaneamente.
CREATE INDEX idx_ocorrencia_muni_cat    ON ocorrencia (municipio_id, categoria_id);
-- Join frequente entre detalhe_vitima e ocorrencia (KPI de vítimas).
CREATE INDEX idx_detalhe_ocorrencia     ON detalhe_vitima (ocorrencia_id);
-- Listagem de notícias por editoria e ordenação temporal.
CREATE INDEX idx_noticia_categoria      ON noticia (categoria);
CREATE INDEX idx_noticia_publicado_em   ON noticia (publicado_em DESC);
