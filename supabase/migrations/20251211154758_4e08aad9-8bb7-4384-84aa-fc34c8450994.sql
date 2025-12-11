-- Add seller_id to pix_charges for proper tracking
ALTER TABLE public.pix_charges ADD COLUMN IF NOT EXISTS seller_id uuid;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_pix_charges_seller_id ON public.pix_charges(seller_id);

-- Create RLS policy for sellers to view their charges by seller_id
CREATE POLICY "Sellers can view their charges by seller_id" 
ON public.pix_charges 
FOR SELECT 
USING (auth.uid() = seller_id);

-- Allow service role to update seller_id
CREATE POLICY "Service role can update pix_charges" 
ON public.pix_charges 
FOR UPDATE 
USING (true)
WITH CHECK (true);