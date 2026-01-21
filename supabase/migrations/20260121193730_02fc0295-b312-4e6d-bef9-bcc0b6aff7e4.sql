-- Follow-up: add minimal safe policies after removing permissive ones

-- pix_charges: allow sellers/admins to update their own charges (e.g., correct buyer info)
-- NOTE: public/anon users have NO UPDATE policy.
DROP POLICY IF EXISTS "Admins can update pix charges" ON public.pix_charges;
CREATE POLICY "Admins can update pix charges"
ON public.pix_charges
FOR UPDATE
TO public
USING (public.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Sellers can update their charges" ON public.pix_charges;
CREATE POLICY "Sellers can update their charges"
ON public.pix_charges
FOR UPDATE
TO public
USING (
  auth.uid() = seller_id
  OR EXISTS (
    SELECT 1
    FROM public.products
    WHERE products.id = pix_charges.product_id
      AND products.seller_id = auth.uid()
  )
);

-- members: allow admins to manually grant access via admin UI
DROP POLICY IF EXISTS "Admins can insert members" ON public.members;
CREATE POLICY "Admins can insert members"
ON public.members
FOR INSERT
TO public
WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));
