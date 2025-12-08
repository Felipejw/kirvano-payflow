-- Create withdrawals table for real withdrawal history
CREATE TABLE public.withdrawals (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  amount numeric NOT NULL,
  fee numeric NOT NULL DEFAULT 0,
  net_amount numeric NOT NULL,
  pix_key text NOT NULL,
  pix_key_type text NOT NULL DEFAULT 'cpf',
  status text NOT NULL DEFAULT 'pending',
  requested_at timestamp with time zone NOT NULL DEFAULT now(),
  completed_at timestamp with time zone,
  notes text
);

-- Enable RLS
ALTER TABLE public.withdrawals ENABLE ROW LEVEL SECURITY;

-- Users can view their own withdrawals
CREATE POLICY "Users can view their own withdrawals"
ON public.withdrawals
FOR SELECT
USING (auth.uid() = user_id);

-- Users can create their own withdrawals
CREATE POLICY "Users can insert their own withdrawals"
ON public.withdrawals
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Add order bumps, deliverable and affiliate option to products table
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS allow_affiliates boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS order_bumps uuid[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS deliverable_url text,
ADD COLUMN IF NOT EXISTS deliverable_type text;

-- Add buyer_cpf to pix_charges for better tracking
ALTER TABLE public.pix_charges
ADD COLUMN IF NOT EXISTS buyer_cpf text;