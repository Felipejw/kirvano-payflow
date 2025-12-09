-- Add pixel tracking columns to products table
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS facebook_pixel text,
ADD COLUMN IF NOT EXISTS tiktok_pixel text,
ADD COLUMN IF NOT EXISTS google_analytics text;