-- Drop existing overly permissive policies on pix_charges
DROP POLICY IF EXISTS "Charges are viewable by relevant parties" ON public.pix_charges;
DROP POLICY IF EXISTS "Charges can be updated" ON public.pix_charges;

-- Create restricted SELECT policy: Only admins and product sellers can view charges
CREATE POLICY "Admins can view all charges"
ON public.pix_charges
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Sellers can view their product charges"
ON public.pix_charges
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM products 
    WHERE products.id = pix_charges.product_id 
    AND products.seller_id = auth.uid()
  )
);

-- Keep public insert for checkout (customers need to create charges)
-- Already exists: "Public can create charges"

-- Remove public UPDATE - only service role should update via edge function
-- No new UPDATE policy created - this restricts updates to service role only