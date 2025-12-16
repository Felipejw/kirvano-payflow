-- Add UTM columns to pix_charges table for tracking
ALTER TABLE public.pix_charges 
ADD COLUMN utm_source text,
ADD COLUMN utm_medium text,
ADD COLUMN utm_campaign text,
ADD COLUMN utm_content text,
ADD COLUMN utm_term text;