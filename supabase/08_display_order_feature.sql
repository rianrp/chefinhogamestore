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
UPDATE products
SET display_order = subquery.row_num * 10
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
                -- Primeiro por ordem customizada
                display_order ASC,
                -- Anúncios Elite fixados
                CASE WHEN is_anuncio AND anuncio_plano = 'elite' AND (anuncio_fim IS NULL OR anuncio_fim > NOW()) THEN 0 ELSE 1 END,
                -- Depois anúncios Pro
                CASE WHEN is_anuncio AND anuncio_plano = 'pro' AND (anuncio_fim IS NULL OR anuncio_fim > NOW()) THEN 0 ELSE 1 END,
                -- Depois anúncios Básico
                CASE WHEN is_anuncio AND anuncio_plano = 'basico' AND (anuncio_fim IS NULL OR anuncio_fim > NOW()) THEN 0 ELSE 1 END,
                -- Depois por data de criação
                created_at DESC
            )
            FROM products
            WHERE is_active = true
        )
    ) INTO result;
    
    RETURN result;
END;
$$;

-- 5. Função auxiliar para reordenar produto (mover para cima)
CREATE OR REPLACE FUNCTION move_product_up(p_product_id VARCHAR(50))
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_order INTEGER;
    target_order INTEGER;
    current_product_id VARCHAR(50);
BEGIN
    -- Obter ordem atual do produto
    SELECT display_order INTO current_order
    FROM products
    WHERE id = p_product_id;
    
    IF NOT FOUND THEN
        RETURN false;
    END IF;
    
    -- Encontrar o produto imediatamente acima (menor display_order)
    SELECT id, display_order INTO current_product_id, target_order
    FROM products
    WHERE display_order < current_order
      AND is_active = true
    ORDER BY display_order DESC
    LIMIT 1;
    
    IF NOT FOUND THEN
        -- Já está no topo
        RETURN false;
    END IF;
    
    -- Trocar as ordens
    UPDATE products SET display_order = current_order WHERE id = current_product_id;
    UPDATE products SET display_order = target_order WHERE id = p_product_id;
    
    RETURN true;
END;
$$;

-- 6. Função auxiliar para reordenar produto (mover para baixo)
CREATE OR REPLACE FUNCTION move_product_down(p_product_id VARCHAR(50))
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_order INTEGER;
    target_order INTEGER;
    current_product_id VARCHAR(50);
BEGIN
    -- Obter ordem atual do produto
    SELECT display_order INTO current_order
    FROM products
    WHERE id = p_product_id;
    
    IF NOT FOUND THEN
        RETURN false;
    END IF;
    
    -- Encontrar o produto imediatamente abaixo (maior display_order)
    SELECT id, display_order INTO current_product_id, target_order
    FROM products
    WHERE display_order > current_order
      AND is_active = true
    ORDER BY display_order ASC
    LIMIT 1;
    
    IF NOT FOUND THEN
        -- Já está no final
        RETURN false;
    END IF;
    
    -- Trocar as ordens
    UPDATE products SET display_order = current_order WHERE id = current_product_id;
    UPDATE products SET display_order = target_order WHERE id = p_product_id;
    
    RETURN true;
END;
$$;

-- 7. Função para mover produto para o topo
CREATE OR REPLACE FUNCTION move_product_to_top(p_product_id VARCHAR(50))
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    min_order INTEGER;
BEGIN
    -- Obter a menor ordem atual
    SELECT MIN(display_order) - 10 INTO min_order
    FROM products
    WHERE is_active = true;
    
    -- Mover produto para o topo
    UPDATE products
    SET display_order = min_order
    WHERE id = p_product_id;
    
    RETURN true;
END;
$$;

-- 8. Função para mover produto para o final
CREATE OR REPLACE FUNCTION move_product_to_bottom(p_product_id VARCHAR(50))
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    max_order INTEGER;
BEGIN
    -- Obter a maior ordem atual
    SELECT MAX(display_order) + 10 INTO max_order
    FROM products
    WHERE is_active = true;
    
    -- Mover produto para o final
    UPDATE products
    SET display_order = max_order
    WHERE id = p_product_id;
    
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
        -- Obter a maior ordem atual e adicionar 10
        SELECT COALESCE(MAX(display_order), 0) + 10 INTO max_order
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
-- 2. No admin panel, use os botões ↑ e ↓ para reordenar
-- 3. Os produtos serão exibidos seguindo a ordem definida
-- 
-- Ordem de prioridade na exibição:
-- 1. display_order (customizado pelo admin)
-- 2. Anúncios (Elite > Pro > Básico)
-- 3. Data de criação (mais recentes primeiro)
-- =====================================================
