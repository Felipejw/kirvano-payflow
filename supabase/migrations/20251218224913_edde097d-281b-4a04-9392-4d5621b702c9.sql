-- Fix existing users who are buyers (in members table) but wrongly have 'seller' role
-- Update them to 'member' role if they don't have any products (not real sellers)

UPDATE public.user_roles ur
SET role = 'member'
WHERE ur.role = 'seller'
AND ur.user_id IN (
  SELECT DISTINCT m.user_id 
  FROM public.members m
  WHERE NOT EXISTS (
    SELECT 1 FROM public.products p WHERE p.seller_id = m.user_id
  )
);

-- Update handle_new_user function to only assign 'seller' role for normal signups
-- (when user provides document_type or sales_niche in metadata)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  -- Create profile
  INSERT INTO public.profiles (user_id, email, full_name, payment_mode, document_type, document_number, company_name, sales_niche, average_revenue)
  VALUES (
    new.id, 
    new.email, 
    new.raw_user_meta_data ->> 'full_name',
    COALESCE(new.raw_user_meta_data ->> 'payment_mode', 'own_gateway'),
    new.raw_user_meta_data ->> 'document_type',
    new.raw_user_meta_data ->> 'document_number',
    new.raw_user_meta_data ->> 'company_name',
    new.raw_user_meta_data ->> 'sales_niche',
    new.raw_user_meta_data ->> 'average_revenue'
  );
  
  -- Only assign 'seller' role if this is a normal seller signup
  -- (indicated by document_type or sales_niche in metadata)
  -- Buyers created via edge function will have their role set separately
  IF (new.raw_user_meta_data ->> 'document_type' IS NOT NULL) 
     OR (new.raw_user_meta_data ->> 'sales_niche' IS NOT NULL) THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (new.id, 'seller');
  END IF;
  
  RETURN new;
END;
$$;