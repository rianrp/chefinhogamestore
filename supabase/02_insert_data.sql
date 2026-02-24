-- =====================================================
-- Dados Iniciais - Categorias
-- =====================================================

INSERT INTO categories (id, name, description, icon, sort_order) VALUES
    ('freefire', 'Free Fire', 'Skins, Personagens, Diamantes', 'fas fa-fire', 1),
    ('mage', 'Rucoy Mage', 'Personagens Mage, Items', 'fas fa-magic', 2),
    ('kina', 'Rucoy Knight', 'Personagens Knight, Items', 'fas fa-shield-alt', 3),
    ('pally', 'Rucoy Paladin', 'Personagens Paladin, Items', 'fas fa-crosshairs', 4),
    ('supercell', 'Supercell Games', 'Clash of Clans, Clash Royale', 'fas fa-crown', 5),
    ('itens', 'Itens Diversos', 'Items, Acessórios, Outros', 'fas fa-gem', 6),
    ('geral', 'Geral', 'Produtos Diversos', 'fas fa-gamepad', 7),
    ('roblox', 'Roblox', 'Contas e itens Roblox', 'fas fa-cube', 8)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    icon = EXCLUDED.icon,
    sort_order = EXCLUDED.sort_order;

-- =====================================================
-- Configurações do Site
-- =====================================================

INSERT INTO site_config (key, value) VALUES
    ('site', '{
        "name": "Chefinho",
        "tagline": "Gaming Store",
        "description": "Sua loja gamer de confiança - Personagens, contas e itens para seus jogos favoritos com os melhores preços",
        "whatsapp": "556993450986"
    }'::jsonb),
    ('theme', '{
        "colors": {
            "primary": "#8B5CF6",
            "secondary": "#A855F7",
            "yellow": "#FCD34D",
            "dark": "#0F0F23",
            "darker": "#0A0A1A"
        },
        "mode": "dark"
    }'::jsonb),
    ('stats', '{
        "products": "2K+",
        "users": "10K+",
        "support": "24/7"
    }'::jsonb),
    ('contact', '{
        "whatsapp": "+55 69 9345-0986",
        "email": "contato@chefinho.com",
        "hours": {
            "weekdays": "Segunda à Sexta: 9h às 23h",
            "saturday": "Sábado: 9h às 23h",
            "sunday": "Domingo: 9h às 23h"
        }
    }'::jsonb),
    ('social', '{
        "instagram": "#",
        "twitter": "#",
        "youtube": "#",
        "twitch": "#"
    }'::jsonb)
ON CONFLICT (key) DO UPDATE SET
    value = EXCLUDED.value,
    updated_at = NOW();

-- =====================================================
-- Admin padrão (troque a senha depois!)
-- Senha: admin123 (hash bcrypt)
-- =====================================================

-- IMPORTANTE: Gere um hash bcrypt da sua senha real
-- Use: https://bcrypt-generator.com/ ou similar
-- O token é gerado uma vez e nunca expira

INSERT INTO admin_users (username, password_hash, token) VALUES
    ('admin', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.jrw.E8kKbGq.Wy', 'chefinho_admin_token_super_secreto_2024')
ON CONFLICT (username) DO NOTHING;
