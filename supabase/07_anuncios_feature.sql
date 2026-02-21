-- =====================================================
-- Feature: Anúncios de Produtos
-- Adiciona campos de anúncio na tabela de produtos
-- para controlar exibição destacada com planos
-- =====================================================

-- 1. Adicionar colunas de anúncio na tabela products
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_anuncio BOOLEAN DEFAULT false;
ALTER TABLE products ADD COLUMN IF NOT EXISTS anuncio_plano VARCHAR(20) DEFAULT NULL;
ALTER TABLE products ADD COLUMN IF NOT EXISTS anuncio_inicio TIMESTAMP WITH TIME ZONE DEFAULT NULL;
ALTER TABLE products ADD COLUMN IF NOT EXISTS anuncio_fim TIMESTAMP WITH TIME ZONE DEFAULT NULL;
ALTER TABLE products ADD COLUMN IF NOT EXISTS anunciante_nome VARCHAR(100) DEFAULT NULL;
ALTER TABLE products ADD COLUMN IF NOT EXISTS anunciante_whatsapp VARCHAR(20) DEFAULT NULL;

-- 2. Índices para consultas de anúncios
CREATE INDEX IF NOT EXISTS idx_products_is_anuncio ON products(is_anuncio);
CREATE INDEX IF NOT EXISTS idx_products_anuncio_fim ON products(anuncio_fim);
CREATE INDEX IF NOT EXISTS idx_products_anuncio_plano ON products(anuncio_plano);

-- 3. Função para verificar se um anúncio ainda está ativo (não expirou)
CREATE OR REPLACE FUNCTION is_anuncio_ativo(p_anuncio_fim TIMESTAMP WITH TIME ZONE)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
BEGIN
    IF p_anuncio_fim IS NULL THEN
        RETURN false;
    END IF;
    RETURN NOW() < p_anuncio_fim;
END;
$$;

-- 4. Função para desativar anúncios expirados automaticamente
-- (pode ser chamada via cron job ou manualmente)
CREATE OR REPLACE FUNCTION desativar_anuncios_expirados()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    affected INTEGER;
BEGIN
    UPDATE products
    SET is_anuncio = false,
        anuncio_plano = NULL,
        anuncio_inicio = NULL,
        anuncio_fim = NULL
    WHERE is_anuncio = true
      AND anuncio_fim IS NOT NULL
      AND anuncio_fim < NOW();
    
    GET DIAGNOSTICS affected = ROW_COUNT;
    RETURN affected;
END;
$$;

-- 5. Atualizar a função get_site_data para incluir campos de anúncio
CREATE OR REPLACE FUNCTION get_site_data()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result JSON;
BEGIN
    -- Primeiro, desativar anúncios expirados
    PERFORM desativar_anuncios_expirados();

    SELECT json_build_object(
        'site', (SELECT value FROM site_config WHERE key = 'site'),
        'theme', (SELECT value FROM site_config WHERE key = 'theme'),
        'stats', (SELECT value FROM site_config WHERE key = 'stats'),
        'contact', (SELECT value FROM site_config WHERE key = 'contact'),
        'social', (SELECT value FROM site_config WHERE key = 'social'),
        'categories', (
            SELECT json_agg(json_build_object(
                'id', id,
                'name', name,
                'description', description,
                'icon', icon
            ) ORDER BY sort_order)
            FROM categories
            WHERE is_active = true
        ),
        'products', (
            SELECT json_agg(json_build_object(
                'id', id,
                'name', name,
                'description', description,
                'category', category,
                'image_url', image_url,
                'video_url', video_url,
                'rl_price', rl_price,
                'kks_price', kks_price,
                'parcelado_price', parcelado_price,
                'purchased_value', purchased_value,
                'quantity', quantity,
                'is_active', is_active,
                'created_at', created_at,
                'is_anuncio', is_anuncio,
                'anuncio_plano', anuncio_plano,
                'anuncio_inicio', anuncio_inicio,
                'anuncio_fim', anuncio_fim,
                'anunciante_nome', anunciante_nome
            ) ORDER BY
                -- Anúncios Elite primeiro (fixados)
                CASE WHEN is_anuncio AND anuncio_plano = 'elite' AND (anuncio_fim IS NULL OR anuncio_fim > NOW()) THEN 0 ELSE 1 END,
                -- Depois anúncios Pro
                CASE WHEN is_anuncio AND anuncio_plano = 'pro' AND (anuncio_fim IS NULL OR anuncio_fim > NOW()) THEN 0 ELSE 1 END,
                -- Depois anúncios Básico
                CASE WHEN is_anuncio AND anuncio_plano = 'basico' AND (anuncio_fim IS NULL OR anuncio_fim > NOW()) THEN 0 ELSE 1 END,
                -- Depois por data
                created_at DESC
            )
            FROM products
            WHERE is_active = true
        )
    ) INTO result;
    
    RETURN result;
END;
$$;

-- 6. Comentários nas colunas para documentação
COMMENT ON COLUMN products.is_anuncio IS 'Se o produto é um anúncio de terceiro';
COMMENT ON COLUMN products.anuncio_plano IS 'Plano do anúncio: basico (2 dias), pro (5 dias), elite (30 dias)';
COMMENT ON COLUMN products.anuncio_inicio IS 'Data/hora de início do anúncio';
COMMENT ON COLUMN products.anuncio_fim IS 'Data/hora de expiração do anúncio';
COMMENT ON COLUMN products.anunciante_nome IS 'Nome do anunciante';
COMMENT ON COLUMN products.anunciante_whatsapp IS 'WhatsApp do anunciante';
