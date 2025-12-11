-- Add buyer_phone column to pix_charges table
ALTER TABLE public.pix_charges ADD COLUMN IF NOT EXISTS buyer_phone text;