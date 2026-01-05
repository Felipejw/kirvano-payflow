-- Adicionar coluna product_id (opcional) na tabela api_keys
ALTER TABLE api_keys ADD COLUMN product_id uuid REFERENCES products(id) ON DELETE SET NULL;

-- Criar índice para performance
CREATE INDEX idx_api_keys_product_id ON api_keys(product_id);