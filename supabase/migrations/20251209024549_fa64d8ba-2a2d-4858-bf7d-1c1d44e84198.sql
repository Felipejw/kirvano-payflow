
-- Create platform_settings table for global configurations
CREATE TABLE public.platform_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  platform_fee numeric NOT NULL DEFAULT 5,
  min_withdrawal numeric NOT NULL DEFAULT 50,
  default_checkout_template_id uuid REFERENCES public.checkout_templates(id) ON DELETE SET NULL,
  pix_enabled boolean NOT NULL DEFAULT true,
  maintenance_mode boolean NOT NULL DEFAULT false,
  support_email text,
  support_phone text,
  terms_url text,
  privacy_url text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

-- Only admins can manage platform settings
CREATE POLICY "Admins can manage platform settings"
ON public.platform_settings
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Anyone can read platform settings (for public configs)
CREATE POLICY "Anyone can view platform settings"
ON public.platform_settings
FOR SELECT
USING (true);

-- Insert default settings
INSERT INTO public.platform_settings (platform_fee, min_withdrawal) VALUES (5, 50);

-- Update RLS policies for admin access on existing tables

-- Products: Admin can view all products
CREATE POLICY "Admins can view all products"
ON public.products
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Products: Admin can manage all products
CREATE POLICY "Admins can manage all products"
ON public.products
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Transactions: Admin can view all transactions
CREATE POLICY "Admins can view all transactions"
ON public.transactions
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Pix charges: Admin can view all charges
CREATE POLICY "Admins can view all pix charges"
ON public.pix_charges
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Profiles: Admin can view all profiles
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Withdrawals: Admin can view all withdrawals
CREATE POLICY "Admins can view all withdrawals"
ON public.withdrawals
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Withdrawals: Admin can update withdrawals (approve/reject)
CREATE POLICY "Admins can update withdrawals"
ON public.withdrawals
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

-- Affiliates: Admin can view all affiliates
CREATE POLICY "Admins can view all affiliates"
ON public.affiliates
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Checkout templates: Admin can view all templates
CREATE POLICY "Admins can view all templates"
ON public.checkout_templates
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Checkout settings: Admin can view all settings
CREATE POLICY "Admins can view all checkout settings"
ON public.checkout_settings
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Trigger for updated_at
CREATE TRIGGER update_platform_settings_updated_at
BEFORE UPDATE ON public.platform_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
