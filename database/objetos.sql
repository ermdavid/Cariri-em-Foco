1. VIEW — Ocorrências consolidadas por município e categoria

CREATE OR REPLACE VIEW vw_ocorrencias_por_municipio AS
SELECT
    m.id            AS municipio_id,
    m.nome          AS municipio,
    c.id            AS categoria_id,
    c.nome          AS categoria,
    COUNT(o.id)     AS total_ocorrencias
FROM ocorrencia o
JOIN municipio m       ON o.municipio_id = m.id
JOIN categoria_crime c ON o.categoria_id = c.id
GROUP BY m.id, m.nome, c.id, c.nome;

2. FUNCTION — Total de ocorrências de um município

CREATE OR REPLACE FUNCTION fn_total_ocorrencias_municipio(p_municipio_id INT)
RETURNS BIGINT AS $$
DECLARE
    v_total BIGINT;
BEGIN
    SELECT COUNT(*) INTO v_total
    FROM ocorrencia
    WHERE municipio_id = p_municipio_id;

    RETURN v_total;
END;
$$ LANGUAGE plpgsql;

3. TRIGGER — Marca a data/hora da última atualização de uma notícia

ALTER TABLE noticia ADD COLUMN IF NOT EXISTS atualizado_em TIMESTAMP;

CREATE OR REPLACE FUNCTION fn_marca_atualizacao_noticia()
RETURNS TRIGGER AS $$
BEGIN
    NEW.atualizado_em := CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_noticia_atualizada ON noticia;
CREATE TRIGGER trg_noticia_atualizada
    BEFORE UPDATE ON noticia
    FOR EACH ROW
    EXECUTE FUNCTION fn_marca_atualizacao_noticia();
