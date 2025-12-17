-- Add payment mode columns to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS payment_mode text DEFAULT 'own_gateway';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS terms_accepted_at timestamp with time zone;

-- Add platform gateway fee columns to platform_settings
ALTER TABLE public.platform_settings ADD COLUMN IF NOT EXISTS platform_gateway_fee_percentage numeric DEFAULT 5.99;
ALTER TABLE public.platform_settings ADD COLUMN IF NOT EXISTS platform_gateway_fee_fixed numeric DEFAULT 1;
ALTER TABLE public.platform_settings ADD COLUMN IF NOT EXISTS platform_gateway_withdrawal_fee numeric DEFAULT 5;
ALTER TABLE public.platform_settings ADD COLUMN IF NOT EXISTS own_gateway_fee_percentage numeric DEFAULT 3.99;
ALTER TABLE public.platform_settings ADD COLUMN IF NOT EXISTS own_gateway_fee_fixed numeric DEFAULT 1;

-- Update handle_new_user function to include payment_mode
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
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
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (new.id, 'seller');
  
  RETURN new;
END;
$$;