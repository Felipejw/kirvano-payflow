-- Add payment method support columns to payment_gateways
ALTER TABLE public.payment_gateways
ADD COLUMN IF NOT EXISTS supports_pix BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS supports_card BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS supports_boleto BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;

-- Add granular method selection to seller_gateway_credentials
ALTER TABLE public.seller_gateway_credentials
ADD COLUMN IF NOT EXISTS use_for_pix BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS use_for_card BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS use_for_boleto BOOLEAN DEFAULT false;