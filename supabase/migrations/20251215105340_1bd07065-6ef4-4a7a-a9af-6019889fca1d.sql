
-- Enum para status de fatura
DO $$ BEGIN
  CREATE TYPE invoice_status AS ENUM ('pending', 'paid', 'overdue', 'blocked');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Tabela de gateways disponíveis na plataforma
CREATE TABLE IF NOT EXISTS public.payment_gateways (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  logo_url TEXT,
  is_active BOOLEAN DEFAULT true,
  instructions TEXT,
  required_fields JSONB DEFAULT '["client_id", "client_secret"]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tabela de credenciais do vendedor para cada gateway
CREATE TABLE IF NOT EXISTS public.seller_gateway_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  gateway_id UUID NOT NULL REFERENCES public.payment_gateways(id) ON DELETE CASCADE,
  credentials JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_active BOOLEAN DEFAULT true,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, gateway_id)
);

-- Tabela de faturas da plataforma (cobrança semanal)
CREATE TABLE IF NOT EXISTS public.platform_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  total_sales INTEGER DEFAULT 0,
  total_amount NUMERIC DEFAULT 0,
  fee_percentage NUMERIC NOT NULL DEFAULT 4,
  fee_fixed NUMERIC NOT NULL DEFAULT 1,
  fee_total NUMERIC NOT NULL DEFAULT 0,
  pix_charge_id UUID,
  pix_code TEXT,
  pix_qr_code TEXT,
  status TEXT DEFAULT 'pending',
  due_date DATE NOT NULL,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tabela de bloqueios por inadimplência
CREATE TABLE IF NOT EXISTS public.seller_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  invoice_id UUID REFERENCES public.platform_invoices(id) ON DELETE SET NULL,
  reason TEXT NOT NULL DEFAULT 'unpaid_invoice',
  blocked_at TIMESTAMPTZ DEFAULT now(),
  unblocked_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true
);

-- Adicionar novas colunas em platform_settings
ALTER TABLE public.platform_settings 
ADD COLUMN IF NOT EXISTS fee_percentage NUMERIC DEFAULT 4,
ADD COLUMN IF NOT EXISTS fee_fixed_per_sale NUMERIC DEFAULT 1,
ADD COLUMN IF NOT EXISTS invoice_due_days INTEGER DEFAULT 3;

-- Adicionar colunas em transactions para rastrear gateway usado
ALTER TABLE public.transactions 
ADD COLUMN IF NOT EXISTS gateway_id UUID REFERENCES public.payment_gateways(id),
ADD COLUMN IF NOT EXISTS gateway_transaction_id TEXT;

-- Habilitar RLS nas novas tabelas
ALTER TABLE public.payment_gateways ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seller_gateway_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seller_blocks ENABLE ROW LEVEL SECURITY;

-- Políticas para payment_gateways (todos podem ver gateways ativos)
CREATE POLICY "Anyone can view active gateways" ON public.payment_gateways
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage gateways" ON public.payment_gateways
  FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Políticas para seller_gateway_credentials
CREATE POLICY "Users can view their own credentials" ON public.seller_gateway_credentials
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own credentials" ON public.seller_gateway_credentials
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own credentials" ON public.seller_gateway_credentials
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own credentials" ON public.seller_gateway_credentials
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all credentials" ON public.seller_gateway_credentials
  FOR SELECT USING (has_role(auth.uid(), 'admin'));

-- Políticas para platform_invoices
CREATE POLICY "Users can view their own invoices" ON public.platform_invoices
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all invoices" ON public.platform_invoices
  FOR SELECT USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage invoices" ON public.platform_invoices
  FOR ALL USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "System can insert invoices" ON public.platform_invoices
  FOR INSERT WITH CHECK (true);

CREATE POLICY "System can update invoices" ON public.platform_invoices
  FOR UPDATE USING (true) WITH CHECK (true);

-- Políticas para seller_blocks
CREATE POLICY "Users can view their own blocks" ON public.seller_blocks
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage blocks" ON public.seller_blocks
  FOR ALL USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "System can manage blocks" ON public.seller_blocks
  FOR ALL USING (true);

CREATE POLICY "Anyone can check blocks" ON public.seller_blocks
  FOR SELECT USING (true);

-- Inserir gateways padrão
INSERT INTO public.payment_gateways (name, slug, instructions, required_fields) VALUES
  ('Mercado Pago', 'mercado_pago', 'Acesse sua conta do Mercado Pago > Configurações > Credenciais para obter seu Client ID e Client Secret', '["client_id", "client_secret", "access_token"]'),
  ('PagBank', 'pagbank', 'Acesse o Portal do Desenvolvedor PagBank para gerar suas credenciais de API', '["email", "token"]'),
  ('BSPAY', 'bspay', 'Entre em contato com a BSPAY para obter suas credenciais de integração', '["client_id", "client_secret"]'),
  ('Getnet', 'getnet', 'Acesse o Portal Getnet para configurar suas credenciais de sandbox/produção', '["seller_id", "client_id", "client_secret"]'),
  ('PicPay', 'picpay', 'Acesse a área de desenvolvedores do PicPay para obter seu token de API', '["x_picpay_token", "x_seller_token"]')
ON CONFLICT (slug) DO NOTHING;

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER update_payment_gateways_updated_at
  BEFORE UPDATE ON public.payment_gateways
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_seller_gateway_credentials_updated_at
  BEFORE UPDATE ON public.seller_gateway_credentials
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_platform_invoices_updated_at
  BEFORE UPDATE ON public.platform_invoices
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
