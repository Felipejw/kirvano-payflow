
-- 1) Drop old constraint and add new one including 'sigilopay'
ALTER TABLE public.platform_settings DROP CONSTRAINT IF EXISTS platform_settings_platform_gateway_type_check;
ALTER TABLE public.platform_settings ADD CONSTRAINT platform_settings_platform_gateway_type_check 
  CHECK (platform_gateway_type = ANY(ARRAY['bspay', 'pixup', 'ghostpay', 'sigilopay']));

-- 2) Create platform_gateway_credentials table for global credentials
CREATE TABLE IF NOT EXISTS public.platform_gateway_credentials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gateway_slug text NOT NULL UNIQUE,
  credentials jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- 3) Enable RLS
ALTER TABLE public.platform_gateway_credentials ENABLE ROW LEVEL SECURITY;

-- 4) RLS: only super_admin can manage
CREATE POLICY "Super admins can manage platform gateway credentials"
  ON public.platform_gateway_credentials
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

-- 5) Seed initial rows
INSERT INTO public.platform_gateway_credentials (gateway_slug, credentials) VALUES
  ('bspay', '{}'),
  ('pixup', '{}'),
  ('ghostpay', '{}'),
  ('sigilopay', '{}')
ON CONFLICT (gateway_slug) DO NOTHING;
