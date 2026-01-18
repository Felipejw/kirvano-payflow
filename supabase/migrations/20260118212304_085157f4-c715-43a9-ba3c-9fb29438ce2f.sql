-- 1. Criar tabela de features para controle de funcionalidades
CREATE TABLE public.platform_features (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feature_key TEXT UNIQUE NOT NULL,
  feature_name TEXT NOT NULL,
  description TEXT,
  is_enabled BOOLEAN DEFAULT true,
  icon TEXT,
  menu_page TEXT,
  category TEXT DEFAULT 'seller',
  display_order INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id)
);

-- 2. Inserir features iniciais (baseado nos menus existentes)
INSERT INTO platform_features (feature_key, feature_name, description, icon, menu_page, category, display_order) VALUES
  ('dashboard', 'Dashboard', 'Painel principal com métricas', 'LayoutDashboard', 'dashboard', 'seller', 1),
  ('products', 'Produtos', 'Gerenciamento de produtos digitais', 'Package', 'products', 'seller', 2),
  ('transactions', 'Transações', 'Histórico de vendas e pagamentos', 'Receipt', 'transactions', 'seller', 3),
  ('clients', 'Clientes', 'Lista de clientes e compradores', 'Users', 'clients', 'seller', 4),
  ('quizzes', 'Quizzes', 'Construtor de quizzes interativos', 'MessageSquare', 'quizzes', 'seller', 5),
  ('members', 'Área de Membros', 'Área de membros para produtos digitais', 'UserCheck', 'members', 'seller', 6),
  ('recovery', 'Recuperação de Vendas', 'Sistema de recuperação automática', 'RefreshCw', 'recovery', 'seller', 7),
  ('affiliates', 'Afiliados', 'Sistema de afiliados', 'Users', 'affiliates', 'seller', 8),
  ('finance', 'Financeiro', 'Gestão financeira e saques', 'Wallet', 'finance', 'seller', 9),
  ('api_docs', 'Documentação API', 'Documentação da API para integrações', 'FileCode', 'api-docs', 'seller', 10),
  ('admin_analytics', 'Analytics', 'Análises e métricas avançadas', 'BarChart3', 'admin/analytics', 'admin', 1),
  ('admin_users', 'Usuários', 'Gerenciamento de usuários', 'Users', 'admin/users', 'admin', 2),
  ('admin_products', 'Produtos Admin', 'Produtos de todos os vendedores', 'Package', 'admin/products', 'admin', 3),
  ('admin_transactions', 'Transações Admin', 'Todas as transações da plataforma', 'Receipt', 'admin/transactions', 'admin', 4),
  ('admin_withdrawals', 'Saques Admin', 'Gerenciar solicitações de saque', 'Wallet', 'admin/withdrawals', 'admin', 5),
  ('admin_recovery', 'Recuperação Admin', 'Configurações de recuperação', 'RefreshCw', 'admin/recovery', 'admin', 6),
  ('admin_gateways', 'Gateways', 'Configurar gateways de pagamento', 'CreditCard', 'admin/gateways', 'admin', 7),
  ('admin_invoices', 'Faturas', 'Faturas da plataforma', 'FileText', 'admin/invoices', 'admin', 8),
  ('admin_rankings', 'Rankings', 'Rankings de vendedores', 'Trophy', 'admin/rankings', 'admin', 9),
  ('admin_broadcast', 'Disparo WhatsApp', 'Envio em massa via WhatsApp', 'Send', 'admin/broadcast', 'admin', 10),
  ('admin_email_broadcast', 'Disparo Email', 'Envio em massa via email', 'Mail', 'admin/email-broadcast', 'admin', 11),
  ('admin_instagram', 'Posts Instagram', 'Gerador de posts para Instagram', 'Instagram', 'admin/instagram-posts', 'admin', 12);

-- 3. Habilitar RLS
ALTER TABLE public.platform_features ENABLE ROW LEVEL SECURITY;

-- 4. Super admins podem gerenciar features
CREATE POLICY "super_admins_manage_features" ON public.platform_features
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role = 'super_admin'
    )
  );

-- 5. Todos podem ler features (para filtrar sidebar)
CREATE POLICY "everyone_can_read_features" ON public.platform_features
  FOR SELECT USING (true);

-- 6. Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_platform_features_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_platform_features_timestamp
  BEFORE UPDATE ON public.platform_features
  FOR EACH ROW
  EXECUTE FUNCTION update_platform_features_updated_at();

-- 7. Adicionar campo para rastrear produto GateFlow principal
ALTER TABLE gateflow_product ADD COLUMN IF NOT EXISTS is_main_product BOOLEAN DEFAULT false;

-- 8. Marcar produto principal (o existente)
UPDATE gateflow_product SET is_main_product = true WHERE id = '9203c033-4cf7-4eea-9a04-6810b3527105';