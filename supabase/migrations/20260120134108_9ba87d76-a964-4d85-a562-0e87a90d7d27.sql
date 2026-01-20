-- Add new fields to affiliates table for balance management
ALTER TABLE public.affiliates 
ADD COLUMN IF NOT EXISTS pending_balance DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS available_balance DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS pix_key TEXT,
ADD COLUMN IF NOT EXISTS pix_key_type TEXT;

-- Create affiliate_commissions table to track individual commissions
CREATE TABLE public.affiliate_commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id UUID NOT NULL REFERENCES public.affiliates(id) ON DELETE CASCADE,
  transaction_id UUID NOT NULL REFERENCES public.transactions(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, available, paid
  available_at TIMESTAMPTZ, -- date when commission becomes available (after warranty period)
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create affiliate_withdrawals table for payout requests
CREATE TABLE public.affiliate_withdrawals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id UUID NOT NULL REFERENCES public.affiliates(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, approved, rejected, paid
  pix_key TEXT NOT NULL,
  pix_key_type TEXT NOT NULL,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  processed_at TIMESTAMPTZ,
  processed_by UUID,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE public.affiliate_commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_withdrawals ENABLE ROW LEVEL SECURITY;

-- RLS Policies for affiliate_commissions
CREATE POLICY "Users can view own commissions" ON public.affiliate_commissions
  FOR SELECT USING (
    affiliate_id IN (SELECT id FROM public.affiliates WHERE user_id = auth.uid())
  );

CREATE POLICY "Admins can view all commissions" ON public.affiliate_commissions
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "System can insert commissions" ON public.affiliate_commissions
  FOR INSERT WITH CHECK (true);

CREATE POLICY "System can update commissions" ON public.affiliate_commissions
  FOR UPDATE USING (true);

-- RLS Policies for affiliate_withdrawals
CREATE POLICY "Users can view own withdrawals" ON public.affiliate_withdrawals
  FOR SELECT USING (
    affiliate_id IN (SELECT id FROM public.affiliates WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can request withdrawals" ON public.affiliate_withdrawals
  FOR INSERT WITH CHECK (
    affiliate_id IN (SELECT id FROM public.affiliates WHERE user_id = auth.uid())
  );

CREATE POLICY "Admins can view all withdrawals" ON public.affiliate_withdrawals
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update withdrawals" ON public.affiliate_withdrawals
  FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));

-- Update existing affiliates RLS policies to allow users to view and manage their affiliations
DROP POLICY IF EXISTS "Admins can view all affiliates" ON public.affiliates;
DROP POLICY IF EXISTS "Users can view own affiliates" ON public.affiliates;
DROP POLICY IF EXISTS "Users can insert affiliates" ON public.affiliates;
DROP POLICY IF EXISTS "Users can update own affiliates" ON public.affiliates;
DROP POLICY IF EXISTS "Sellers can view product affiliates" ON public.affiliates;

CREATE POLICY "Users can view own affiliates" ON public.affiliates
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Sellers can view product affiliates" ON public.affiliates
  FOR SELECT USING (
    product_id IN (SELECT id FROM public.products WHERE seller_id = auth.uid())
  );

CREATE POLICY "Admins can view all affiliates" ON public.affiliates
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can insert affiliates" ON public.affiliates
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own affiliates" ON public.affiliates
  FOR UPDATE USING (user_id = auth.uid());

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_affiliate_commissions_affiliate_id ON public.affiliate_commissions(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_commissions_status ON public.affiliate_commissions(status);
CREATE INDEX IF NOT EXISTS idx_affiliate_commissions_available_at ON public.affiliate_commissions(available_at);
CREATE INDEX IF NOT EXISTS idx_affiliate_withdrawals_affiliate_id ON public.affiliate_withdrawals(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_withdrawals_status ON public.affiliate_withdrawals(status);