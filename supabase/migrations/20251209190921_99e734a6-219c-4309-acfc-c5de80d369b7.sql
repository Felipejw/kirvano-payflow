-- Add checkout_theme column to products table
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS checkout_theme text DEFAULT 'dark';