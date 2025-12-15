-- Add columns to track fee payment status on transactions
ALTER TABLE public.transactions 
ADD COLUMN IF NOT EXISTS fee_paid_at TIMESTAMP WITH TIME ZONE NULL,
ADD COLUMN IF NOT EXISTS fee_invoice_id UUID NULL REFERENCES public.platform_invoices(id);

-- Create index for faster queries on unpaid fees
CREATE INDEX IF NOT EXISTS idx_transactions_fee_unpaid 
ON public.transactions(seller_id, fee_paid_at) 
WHERE fee_paid_at IS NULL AND status = 'paid';