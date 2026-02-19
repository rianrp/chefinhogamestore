-- =====================================================
-- Extensões necessárias (execute primeiro)
-- =====================================================

-- Para hashing de senhas com bcrypt
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- =====================================================
-- Atualizar senha do admin com hash bcrypt
-- EXECUTE APÓS criar a extensão pgcrypto
-- =====================================================

-- Troque 'SUA_SENHA_AQUI' pela senha real que deseja usar
UPDATE admin_users 
SET password_hash = crypt('admin123', gen_salt('bf'))
WHERE username = 'admin';

-- =====================================================
-- Ou crie um novo admin com senha hashada
-- =====================================================

-- INSERT INTO admin_users (username, password_hash, token) VALUES
--     ('seu_usuario', crypt('sua_senha', gen_salt('bf')), 'token_unico_seu');
