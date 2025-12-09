-- Add custom domain and slug fields to products table
ALTER TABLE public.products 
ADD COLUMN custom_slug text UNIQUE,
ADD COLUMN custom_domain text,
ADD COLUMN domain_verified boolean DEFAULT false;

-- Create index for faster slug lookups
CREATE INDEX idx_products_custom_slug ON public.products(custom_slug) WHERE custom_slug IS NOT NULL;