-- Migração para adicionar novos campos à tabela users
-- Data: 2025-11-13

-- Adicionar coluna para nome completo
ALTER TABLE users ADD COLUMN IF NOT EXISTS full_name VARCHAR(255);

-- Adicionar coluna para nome de guerra (já existe como 'name')
-- Renomear 'name' para 'war_name' para deixar mais claro
ALTER TABLE users RENAME COLUMN name TO war_name;

-- Adicionar coluna para organização militar
ALTER TABLE users ADD COLUMN IF NOT EXISTS organization VARCHAR(255);

-- Adicionar coluna para companhia
ALTER TABLE users ADD COLUMN IF NOT EXISTS company VARCHAR(100);

-- Adicionar coluna para telefone
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(20);

-- Atualizar dados existentes: copiar war_name para full_name se full_name estiver vazio
UPDATE users SET full_name = war_name WHERE full_name IS NULL OR full_name = '';

-- Comentários para documentação
COMMENT ON COLUMN users.full_name IS 'Nome completo do servidor';
COMMENT ON COLUMN users.war_name IS 'Nome de guerra do servidor';
COMMENT ON COLUMN users.organization IS 'Organização Militar';
COMMENT ON COLUMN users.company IS 'Companhia';
COMMENT ON COLUMN users.phone IS 'Telefone de contato';
