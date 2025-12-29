ALTER TABLE whatsapp_broadcasts 
ADD COLUMN button_type text DEFAULT 'action';

COMMENT ON COLUMN whatsapp_broadcasts.button_type IS 'Tipo de botão: action (URL/Ligar) ou reply (resposta rápida)';