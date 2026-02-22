-- =====================================================
-- Feature: Ordem de Exibição Customizada
-- Permite ao admin definir manualmente a ordem de
-- exibição dos produtos no site
-- =====================================================

-- 1. Adicionar coluna de ordem de exibição
ALTER TABLE products ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 999999;

-- Comentário da coluna
COMMENT ON COLUMN products.display_order IS 'Ordem customizada de exibição (menor = mais alto na lista)';

-- 2. Criar índice para otimizar ordenação
CREATE INDEX IF NOT EXISTS idx_products_display_order ON products(display_order, created_at DESC);

-- 3. Inicializar display_order para produtos existentes
-- (ordenar por created_at DESC, produtos mais recentes primeiro)
-- Produtos mais recentes = números menores (1, 2, 3...)
UPDATE products
SET display_order = subquery.row_num
FROM (
    SELECT id, ROW_NUMBER() OVER (ORDER BY created_at DESC) as row_num
    FROM products
) AS subquery
WHERE products.id = subquery.id
  AND products.display_order = 999999;

-- 4. Atualizar função get_site_data para usar display_order
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

-- 5. Função simplificada para atualizar display_order
CREATE OR REPLACE FUNCTION update_product_display_order(p_product_id VARCHAR(50), p_new_order INTEGER)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    old_order INTEGER;
    other_product_id VARCHAR(50);
BEGIN
    -- Obter ordem atual do produto
    SELECT display_order INTO old_order
    FROM products
    WHERE id = p_product_id;
    
    IF NOT FOUND THEN
        RETURN false;
    END IF;
    
    -- Verificar se já existe outro produto com essa ordem
    SELECT id INTO other_product_id
    FROM products
    WHERE display_order = p_new_order
      AND id != p_product_id
      AND is_active = true
    LIMIT 1;
    
    IF FOUND THEN
        -- Trocar as posições (swap)
        UPDATE products SET display_order = old_order WHERE id = other_product_id;
    END IF;
    
    -- Atualizar o produto atual
    UPDATE products SET display_order = p_new_order WHERE id = p_product_id;
    
    RETURN true;
END;
$$;

-- 9. Trigger para definir display_order ao criar novo produto
CREATE OR REPLACE FUNCTION set_new_product_display_order()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    max_order INTEGER;
BEGIN
    IF NEW.display_order IS NULL OR NEW.display_order = 999999 THEN
        -- Obter a maior ordem atual e adicionar 1
        SELECT COALESCE(MAX(display_order), 0) + 1 INTO max_order
        FROM products
        WHERE is_active = true;
        
        NEW.display_order := max_order;
    END IF;
    
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_set_product_display_order ON products;
CREATE TRIGGER trigger_set_product_display_order
    BEFORE INSERT ON products
    FOR EACH ROW
    EXECUTE FUNCTION set_new_product_display_order();

-- =====================================================
-- Instruções de Uso:
-- 
-- 1. Execute este script no SQL Editor do Supabase
-- 2. No admin panel:
--    - Digite um número no campo "Ordem" de cada produto
--    - Número 1 = aparece primeiro no site
--    - Número 2 = aparece segundo, e assim por diante
--    - Se digitar um número que já existe, os produtos trocam de posição
-- 3. Use a paginação para navegar entre muitos produtos
-- 
-- ORDEM DE PRIORIDADE NA EXIBIÇÃO:
-- 1. Anúncios (Elite > Pro > Básico) ← SEMPRE NO TOPO
-- 2. display_order (1, 2, 3, 4... ordem customizada pelo admin)
-- 3. Data de criação (mais recentes primeiro)
-- 
-- EXEMPLOS:
-- - Produto com ordem "1" = primeiro na lista
-- - Produto com ordem "2" = segundo na lista
-- - Anúncios sempre aparecem antes, independente da ordem
-- =====================================================
