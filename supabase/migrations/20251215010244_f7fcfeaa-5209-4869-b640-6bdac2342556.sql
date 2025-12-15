-- Allow sellers to view members of their products
CREATE POLICY "Sellers can view their product members"
ON public.members
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM products
    WHERE products.id = members.product_id
    AND products.seller_id = auth.uid()
  )
);