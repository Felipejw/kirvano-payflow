-- Add auto_send_access_email column to products table
ALTER TABLE public.products 
ADD COLUMN auto_send_access_email boolean DEFAULT true;