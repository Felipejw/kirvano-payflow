-- Inserir Ghostpay como novo gateway de pagamento
INSERT INTO payment_gateways (
  name, 
  slug, 
  logo_url, 
  is_active,
  instructions, 
  required_fields,
  supports_pix, 
  supports_card, 
  supports_boleto,
  display_order
) VALUES (
  'Ghostpay',
  'ghostpay',
  'https://ghostpay.com.br/logo.png',
  true,
  'Acesse o painel Ghostpay > Integrações > Chaves de API. Copie a Secret Key e o Company ID.',
  '["secret_key", "company_id"]',
  true, 
  true, 
  true,
  10
);