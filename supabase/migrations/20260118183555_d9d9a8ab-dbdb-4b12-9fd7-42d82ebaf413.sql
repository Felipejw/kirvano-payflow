-- Fase 1.2: Criar tabelas do sistema multi-tenant

-- Criar tabela tenants (Instâncias dos Admins/Clientes)
CREATE TABLE public.tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID NOT NULL,
  
  -- Branding
  brand_name TEXT NOT NULL,
  logo_url TEXT,
  favicon_url TEXT,
  primary_color TEXT DEFAULT '#00b4d8',
  secondary_color TEXT DEFAULT '#0a1628',
  accent_color TEXT DEFAULT '#10b981',
  
  -- Domínio
  custom_domain TEXT UNIQUE,
  domain_verified BOOLEAN DEFAULT false,
  
  -- Configurações
  support_email TEXT,
  support_phone TEXT,
  whatsapp_url TEXT,
  terms_url TEXT,
  privacy_url TEXT,
  
  -- Status e controle
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'trial', 'cancelled')),
  trial_ends_at TIMESTAMPTZ,
  is_reseller BOOLEAN DEFAULT true,
  reseller_commission NUMERIC(5,2) DEFAULT 50.00,
  
  -- Limites (para planos futuros)
  max_sellers INTEGER,
  max_products INTEGER,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Criar tabela gateflow_product (Produto de Revenda)
CREATE TABLE public.gateflow_product (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT DEFAULT 'GateFlow System',
  description TEXT,
  price NUMERIC(10,2) NOT NULL DEFAULT 997.00,
  reseller_commission NUMERIC(5,2) DEFAULT 50.00,
  checkout_url TEXT,
  cover_url TEXT,
  sales_page_url TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Criar tabela gateflow_sales (Vendas de Afiliados GateFlow)
CREATE TABLE public.gateflow_sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reseller_tenant_id UUID REFERENCES public.tenants(id) ON DELETE SET NULL,
  reseller_user_id UUID,
  buyer_email TEXT NOT NULL,
  buyer_name TEXT,
  buyer_phone TEXT,
  amount NUMERIC(10,2) NOT NULL,
  commission_amount NUMERIC(10,2) NOT NULL,
  commission_paid_at TIMESTAMPTZ,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'paid', 'cancelled')),
  transaction_id TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Adicionar coluna tenant_id na tabela profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE SET NULL;

-- Indexes para performance
CREATE INDEX IF NOT EXISTS idx_profiles_tenant_id ON public.profiles(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenants_admin_user_id ON public.tenants(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_tenants_custom_domain ON public.tenants(custom_domain);
CREATE INDEX IF NOT EXISTS idx_gateflow_sales_reseller ON public.gateflow_sales(reseller_tenant_id);

-- Triggers para updated_at
CREATE TRIGGER update_tenants_updated_at
  BEFORE UPDATE ON public.tenants
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_gateflow_product_updated_at
  BEFORE UPDATE ON public.gateflow_product
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable RLS
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gateflow_product ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gateflow_sales ENABLE ROW LEVEL SECURITY;

-- RLS Policies para tenants
CREATE POLICY "Super admin full access on tenants"
  ON public.tenants FOR ALL
  USING (has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Admin can view own tenant"
  ON public.tenants FOR SELECT
  USING (admin_user_id = auth.uid());

CREATE POLICY "Admin can update own tenant"
  ON public.tenants FOR UPDATE
  USING (admin_user_id = auth.uid());

-- RLS Policies para gateflow_product
CREATE POLICY "Super admin full access on gateflow_product"
  ON public.gateflow_product FOR ALL
  USING (has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Anyone can view active gateflow_product"
  ON public.gateflow_product FOR SELECT
  USING (status = 'active');

-- RLS Policies para gateflow_sales
CREATE POLICY "Super admin full access on gateflow_sales"
  ON public.gateflow_sales FOR ALL
  USING (has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Reseller can view own sales"
  ON public.gateflow_sales FOR SELECT
  USING (reseller_user_id = auth.uid());

-- Inserir produto GateFlow padrão
INSERT INTO public.gateflow_product (name, description, price, reseller_commission, status)
VALUES (
  'GateFlow System',
  'Sistema completo de pagamentos com checkout otimizado, área de membros, recuperação de vendas e muito mais.',
  997.00,
  50.00,
  'active'
);