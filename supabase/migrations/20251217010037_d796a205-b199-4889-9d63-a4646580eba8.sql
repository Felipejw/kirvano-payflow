-- Update Asaas gateway configuration
UPDATE payment_gateways 
SET 
  required_fields = '["access_token"]',
  supports_pix = true,
  supports_card = true,
  supports_boleto = true,
  instructions = 'Acesse asaas.com > Minha Conta > Integrações > API. Copie a chave de API (formato: $aact_...). IMPORTANTE: Configure o webhook para: https://gfjsvuoqaheiaddvfrwb.supabase.co/functions/v1/pix-api/webhook/asaas',
  is_active = true
WHERE slug = 'asaas';

-- If Asaas doesn't exist, insert it
INSERT INTO payment_gateways (name, slug, required_fields, supports_pix, supports_card, supports_boleto, is_active, instructions, display_order)
SELECT 
  'Asaas',
  'asaas',
  '["access_token"]',
  true,
  true,
  true,
  true,
  'Acesse asaas.com > Minha Conta > Integrações > API. Copie a chave de API (formato: $aact_...). IMPORTANTE: Configure o webhook para: https://gfjsvuoqaheiaddvfrwb.supabase.co/functions/v1/pix-api/webhook/asaas',
  3
WHERE NOT EXISTS (SELECT 1 FROM payment_gateways WHERE slug = 'asaas');