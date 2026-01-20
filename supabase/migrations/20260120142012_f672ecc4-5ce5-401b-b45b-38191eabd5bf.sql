-- Adicionar coluna enable_coupons na tabela products
ALTER TABLE products 
ADD COLUMN enable_coupons BOOLEAN DEFAULT FALSE;

-- Criar tabela de cupons
CREATE TABLE public.coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL,
  code TEXT NOT NULL,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value NUMERIC NOT NULL CHECK (discount_value > 0),
  max_uses INTEGER DEFAULT NULL,
  used_count INTEGER DEFAULT 0,
  min_purchase_amount NUMERIC DEFAULT 0,
  valid_from TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  valid_until TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indice unico para codigo por produto (case insensitive)
CREATE UNIQUE INDEX coupons_product_code_unique ON coupons(product_id, LOWER(code));

-- Indices para busca rapida
CREATE INDEX coupons_product_id_idx ON coupons(product_id);
CREATE INDEX coupons_seller_id_idx ON coupons(seller_id);

-- Habilitar RLS
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;

-- Vendedores podem gerenciar seus proprios cupons
CREATE POLICY "Sellers can manage own coupons"
  ON coupons FOR ALL
  USING (seller_id = auth.uid());

-- Qualquer um pode ler cupons ativos (para validacao no checkout)
CREATE POLICY "Anyone can read active coupons for validation"
  ON coupons FOR SELECT
  USING (is_active = true);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_coupons_updated_at
  BEFORE UPDATE ON coupons
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Funcao RPC para incrementar uso do cupom
CREATE OR REPLACE FUNCTION increment_coupon_usage(p_coupon_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE coupons 
  SET used_count = used_count + 1,
      updated_at = NOW()
  WHERE id = p_coupon_id;
END;
$$;