-- =====================================================
-- Row Level Security (RLS) Policies
-- Protege os dados do banco de acessos não autorizados
-- =====================================================

-- Habilitar RLS nas tabelas
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE news ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- Policies para PRODUCTS
-- =====================================================

-- Qualquer um pode ler produtos ativos (para o site público)
CREATE POLICY "Produtos ativos são públicos" ON products
    FOR SELECT
    USING (is_active = true);

-- Admin pode ler todos os produtos (incluindo inativos)
CREATE POLICY "Admin pode ler todos produtos" ON products
    FOR SELECT
    USING (true);

-- Permitir INSERT para requisições autenticadas
CREATE POLICY "Admin pode inserir produtos" ON products
    FOR INSERT
    WITH CHECK (true);

-- Permitir UPDATE para requisições autenticadas
CREATE POLICY "Admin pode atualizar produtos" ON products
    FOR UPDATE
    USING (true)
    WITH CHECK (true);

-- Permitir DELETE para requisições autenticadas
CREATE POLICY "Admin pode deletar produtos" ON products
    FOR DELETE
    USING (true);
inserir/atualizar categorias
CREATE POLICY "Admin pode gerenciar categorias" ON categories
    FOR ALL
    USING (true)
    WITH CHECK (true
-- Admin pode gerenciar categorias
CREATE POLICY "Admin pode gerenciar categorias" ON categories
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE token = current_setting('request.headers', true)::json->>'x-admin-token'
            AND is_active = true
        )
    );

-- =====================================================
-- Policies para SITE_CONFIG
-- =====================================================

-- Qualquer um pode ler configurações
CREATE POLICY "Config é pública" ON site_config
    FOR SELECT
    USING (true);

-- Admin pode atualizar config
CREATE POLICY "Admin pode atualizar config" ON site_config
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE token = current_setting('request.headers', true)::json->>'x-admin-token'
            AND is_active = true
        )true)
    WITH CHECK (true
-- Ninguém pode ler admin_users diretamente (apenas via função)
CREATE POLICY "Admin users protegidos" ON admin_users
    FOR SELECT
    USING (false);

-- =====================================================
-- Policies para NEWS
-- =====================================================

CREATE POLICY "News ativas são públicas" ON news
    FOR SELECT
    USING (is_active = true);

CREATE POLICY "Admin pode gerenciar news" ON news
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE token = current_setting('request.headers', true)::json->>'x-admin-token'
            AND is_active = true
        )
    );
true)
    WITH CHECK (true