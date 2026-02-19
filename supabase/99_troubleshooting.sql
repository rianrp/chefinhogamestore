-- =====================================================
-- VERIFICAÇÕES E TROUBLESHOOTING - Supabase
-- =====================================================
-- Execute estes comandos no SQL Editor para verificar
-- o estado do banco e resolver problemas comuns
-- =====================================================

-- 1. VERIFICAR SE AS TABELAS FORAM CRIADAS
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- 2. VERIFICAR POLÍTICAS RLS ATIVAS
SELECT schemaname, tablename, policyname, permissive, roles, cmd 
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- 3. VERIFICAR ADMIN CRIADO
SELECT username, is_active, last_login, created_at 
FROM admin_users;

-- 4. VERIFICAR CATEGORIAS INSERIDAS
SELECT id, name, is_active, sort_order 
FROM categories 
ORDER BY sort_order;

-- 5. CONTAR PRODUTOS
SELECT 
    COUNT(*) as total,
    COUNT(*) FILTER (WHERE is_active = true) as ativos,
    COUNT(*) FILTER (WHERE is_active = false) as inativos
FROM products;

-- 6. VER ÚLTIMOS PRODUTOS ADICIONADOS
SELECT id, name, category, rl_price, is_active, created_at
FROM products
ORDER BY created_at DESC
LIMIT 10;

-- =====================================================
-- RESOLVER PROBLEMAS COMUNS
-- =====================================================

-- PROBLEMA: Erro ao inserir produtos (RLS)
-- SOLUÇÃO: Execute o arquivo 06_fix_rls_policies.sql

-- PROBLEMA: Admin não consegue fazer login
-- SOLUÇÃO: Verificar se o admin existe e resetar senha
UPDATE admin_users 
SET password_hash = crypt('admin123', gen_salt('bf'))
WHERE username = 'admin';

-- PROBLEMA: Produtos não aparecem no site
-- SOLUÇÃO: Verificar se estão marcados como ativos
SELECT id, name, is_active FROM products WHERE is_active = false;

-- Para ativar todos os produtos:
-- UPDATE products SET is_active = true;

-- PROBLEMA: Erro ao fazer upload de imagem
-- SOLUÇÃO: Verificar se o bucket 'contas' existe e está público
-- Vá em Storage > contas > Settings > Make public

-- =====================================================
-- RESETAR TUDO (CUIDADO!)
-- =====================================================
-- Descomente apenas se quiser deletar TODOS os dados

-- DROP TABLE IF EXISTS products CASCADE;
-- DROP TABLE IF EXISTS categories CASCADE;
-- DROP TABLE IF EXISTS site_config CASCADE;
-- DROP TABLE IF EXISTS admin_users CASCADE;
-- DROP TABLE IF EXISTS news CASCADE;
-- DROP FUNCTION IF EXISTS get_site_data();
-- DROP FUNCTION IF EXISTS validate_admin_login(VARCHAR, VARCHAR);
-- DROP FUNCTION IF EXISTS validate_admin_login_simple(VARCHAR, VARCHAR);
-- DROP FUNCTION IF EXISTS validate_admin_token(VARCHAR);

-- Depois execute novamente os arquivos 01 a 05
