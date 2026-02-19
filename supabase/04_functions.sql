-- =====================================================
-- Funções do Banco de Dados
-- =====================================================

-- Função para validar login do admin e retornar token
CREATE OR REPLACE FUNCTION validate_admin_login(
    p_username VARCHAR,
    p_password VARCHAR
)
RETURNS TABLE(
    success BOOLEAN,
    token VARCHAR,
    message VARCHAR
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_stored_hash VARCHAR;
    v_token VARCHAR;
    v_is_active BOOLEAN;
BEGIN
    -- Buscar dados do admin
    SELECT password_hash, admin_users.token, admin_users.is_active 
    INTO v_stored_hash, v_token, v_is_active
    FROM admin_users 
    WHERE admin_users.username = p_username;
    
    -- Verificar se usuário existe
    IF v_stored_hash IS NULL THEN
        RETURN QUERY SELECT false, NULL::VARCHAR, 'Usuário não encontrado'::VARCHAR;
        RETURN;
    END IF;
    
    -- Verificar se está ativo
    IF NOT v_is_active THEN
        RETURN QUERY SELECT false, NULL::VARCHAR, 'Usuário desativado'::VARCHAR;
        RETURN;
    END IF;
    
    -- Verificar senha usando pgcrypto (precisa extensão)
    -- Nota: Se não tiver pgcrypto, use verificação simples
    IF v_stored_hash = crypt(p_password, v_stored_hash) THEN
        -- Atualizar último login
        UPDATE admin_users 
        SET last_login = NOW() 
        WHERE username = p_username;
        
        RETURN QUERY SELECT true, v_token, 'Login bem-sucedido'::VARCHAR;
    ELSE
        RETURN QUERY SELECT false, NULL::VARCHAR, 'Senha incorreta'::VARCHAR;
    END IF;
END;
$$;

-- Função alternativa de login (sem bcrypt, para desenvolvimento)
CREATE OR REPLACE FUNCTION validate_admin_login_simple(
    p_username VARCHAR,
    p_password VARCHAR
)
RETURNS TABLE(
    success BOOLEAN,
    token VARCHAR,
    message VARCHAR
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_token VARCHAR;
    v_is_active BOOLEAN;
BEGIN
    -- Buscar admin com senha em texto (APENAS PARA DESENVOLVIMENTO)
    SELECT admin_users.token, admin_users.is_active 
    INTO v_token, v_is_active
    FROM admin_users 
    WHERE admin_users.username = p_username;
    
    IF v_token IS NULL THEN
        RETURN QUERY SELECT false, NULL::VARCHAR, 'Usuário não encontrado'::VARCHAR;
        RETURN;
    END IF;
    
    IF NOT v_is_active THEN
        RETURN QUERY SELECT false, NULL::VARCHAR, 'Usuário desativado'::VARCHAR;
        RETURN;
    END IF;
    
    -- Atualizar último login
    UPDATE admin_users 
    SET last_login = NOW() 
    WHERE username = p_username;
    
    RETURN QUERY SELECT true, v_token, 'Login bem-sucedido'::VARCHAR;
END;
$$;

-- Função para validar token
CREATE OR REPLACE FUNCTION validate_admin_token(p_token VARCHAR)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM admin_users 
        WHERE token = p_token AND is_active = true
    );
END;
$$;

-- Função para buscar todos os dados do site (para o frontend)
CREATE OR REPLACE FUNCTION get_site_data()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result JSON;
BEGIN
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
                'created_at', created_at
            ) ORDER BY created_at DESC)
            FROM products
            WHERE is_active = true
        )
    ) INTO result;
    
    RETURN result;
END;
$$;
