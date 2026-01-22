-- Seller-specific gateway fee settings (per user)
CREATE TABLE IF NOT EXISTS public.seller_fee_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,

  -- Per-method fees (percent + fixed)
  pix_fee_percentage numeric NOT NULL DEFAULT 3.99,
  pix_fee_fixed numeric NOT NULL DEFAULT 1,

  card_fee_percentage numeric NOT NULL DEFAULT 3.99,
  card_fee_fixed numeric NOT NULL DEFAULT 1,

  boleto_fee_percentage numeric NOT NULL DEFAULT 3.99,
  boleto_fee_fixed numeric NOT NULL DEFAULT 1,

  -- Withdrawals (if seller uses platform withdrawals flow, still allow override for own business rules)
  withdrawal_fee numeric NOT NULL DEFAULT 5,

  -- Optional default affiliate commission override (product-level commission still applies unless you choose to use this)
  default_affiliate_commission_rate numeric NULL,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.seller_fee_settings ENABLE ROW LEVEL SECURITY;

-- Policies: seller manages only their own settings
DO $$ BEGIN
  CREATE POLICY "Users can view their own fee settings"
  ON public.seller_fee_settings
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can insert their own fee settings"
  ON public.seller_fee_settings
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can update their own fee settings"
  ON public.seller_fee_settings
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Super admin can manage all (platform support)
DO $$ BEGIN
  CREATE POLICY "Super admin can manage all fee settings"
  ON public.seller_fee_settings
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'::public.app_role));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Trigger for updated_at
DO $$ BEGIN
  CREATE TRIGGER update_seller_fee_settings_updated_at
  BEFORE UPDATE ON public.seller_fee_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Helpful index
CREATE INDEX IF NOT EXISTS idx_seller_fee_settings_user_id ON public.seller_fee_settings(user_id);
