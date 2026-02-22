-- =====================================================
-- Feature: Links do YouTube para Produtos
-- Execute este arquivo no SQL Editor do Supabase
-- =====================================================

-- 1. Adicionar coluna youtube_url à tabela products
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS youtube_url TEXT DEFAULT NULL;

-- 2. Criar índice para performance (opcional, mas útil para buscas)
CREATE INDEX IF NOT EXISTS idx_products_youtube_url ON products(youtube_url) 
WHERE youtube_url IS NOT NULL;

-- 3. Atualizar a função get_site_data para incluir youtube_url
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
                'youtube_url', youtube_url,
                'rl_price', rl_price,
                'kks_price', kks_price,
                'parcelado_price', parcelado_price,
                'purchased_value', purchased_value,
                'quantity', quantity,
                'is_active', is_active,
                'created_at', created_at,
                'display_order', display_order,
                'is_anuncio', is_anuncio,
                'anuncio_plano', anuncio_plano,
                'anuncio_inicio', anuncio_inicio,
                'anuncio_fim', anuncio_fim,
                'anunciante_nome', anunciante_nome
            ) ORDER BY
                -- ANÚNCIOS TÊM PRIORIDADE MÁXIMA
                -- Anúncios Elite fixados (sempre no topo)
                CASE WHEN is_anuncio AND anuncio_plano = 'elite' AND (anuncio_fim IS NULL OR anuncio_fim > NOW()) THEN 0 ELSE 1 END,
                -- Depois anúncios Pro
                CASE WHEN is_anuncio AND anuncio_plano = 'pro' AND (anuncio_fim IS NULL OR anuncio_fim > NOW()) THEN 0 ELSE 1 END,
                -- Depois anúncios Básico
                CASE WHEN is_anuncio AND anuncio_plano = 'basico' AND (anuncio_fim IS NULL OR anuncio_fim > NOW()) THEN 0 ELSE 1 END,
                -- DEPOIS: ordem customizada (apenas para produtos não-anúncios)
                display_order ASC,
                -- Por último: data de criação (fallback)
                created_at DESC
            )
            FROM products
            WHERE is_active = true
        )
    ) INTO result;
    
    RETURN result;
END;
$$;

-- =====================================================
-- Comentários para referência
-- =====================================================
-- 
-- Formatos de URL do YouTube aceitos:
-- - https://www.youtube.com/watch?v=VIDEO_ID
-- - https://youtu.be/VIDEO_ID
-- - https://www.youtube.com/embed/VIDEO_ID
-- - https://youtube.com/shorts/VIDEO_ID
--
-- O frontend extrai o VIDEO_ID automaticamente e gera o embed
-- =====================================================
