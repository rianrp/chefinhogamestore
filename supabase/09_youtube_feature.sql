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
-- (se existir, ela já deve retornar todas as colunas com SELECT *)
-- Caso use SELECT específico, adicionar youtube_url na lista

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
