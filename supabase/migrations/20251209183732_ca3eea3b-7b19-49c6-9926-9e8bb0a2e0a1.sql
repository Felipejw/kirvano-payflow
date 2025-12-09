-- Add theme column to checkout_templates
ALTER TABLE public.checkout_templates 
ADD COLUMN IF NOT EXISTS theme text DEFAULT 'dark';