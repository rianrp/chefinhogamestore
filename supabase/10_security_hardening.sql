-- =====================================================
-- SECURITY HARDENING - Corrigir RLS Policies
-- Remove policies perigosas e cria policies seguras
-- =====================================================

-- PASSO 1: REMOVER TODAS as policies perigosas de products
DROP POLICY IF EXISTS "Admin pode ler todos produtos" ON products;
DROP POLICY IF EXISTS "Admin pode inserir produtos" ON products;
DROP POLICY IF EXISTS "Admin pode atualizar produtos" ON products;
DROP POLICY IF EXISTS "Admin pode deletar produtos" ON products;

-- PASSO 2: GARANTIR que RLS está habilitado
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- PASSO 3: Criar policy SEGURA para leitura pública
-- Apenas produtos ativos podem ser vistos pelo público
CREATE POLICY "public_read_active_products" ON products
    FOR SELECT
    TO public
    USING (is_active = true);

-- PASSO 4: BLOQUEAR completamente escrita pública
-- Sem policies de INSERT/UPDATE/DELETE para público = BLOQUEADO por padrão
-- Apenas o backend com SERVICE_ROLE pode escrever (bypass RLS)

-- =====================================================
-- VERIFICAÇÃO: Conferir policies atuais
-- =====================================================
-- Execute esta query para conferir as policies restantes:
-- SELECT * FROM pg_policies WHERE tablename = 'products';

-- Resultado esperado: APENAS 1 policy (public_read_active_products)
-- Qualquer outra policy de escrita (INSERT/UPDATE/DELETE) deve ser removida
