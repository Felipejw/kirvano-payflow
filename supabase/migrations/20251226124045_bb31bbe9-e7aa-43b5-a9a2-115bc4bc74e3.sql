-- Add platform_gateway_type column to platform_settings
ALTER TABLE public.platform_settings 
ADD COLUMN IF NOT EXISTS platform_gateway_type TEXT NOT NULL DEFAULT 'bspay'
CHECK (platform_gateway_type IN ('bspay', 'pixup'));