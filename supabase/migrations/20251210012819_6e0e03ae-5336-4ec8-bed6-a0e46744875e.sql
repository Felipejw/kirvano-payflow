-- Add new columns for seller registration
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS document_type text CHECK (document_type IN ('cpf', 'cnpj')),
ADD COLUMN IF NOT EXISTS document_number text,
ADD COLUMN IF NOT EXISTS company_name text,
ADD COLUMN IF NOT EXISTS sales_niche text,
ADD COLUMN IF NOT EXISTS average_revenue text;