-- Remover a constraint antiga
ALTER TABLE platform_settings 
DROP CONSTRAINT platform_settings_platform_gateway_type_check;

-- Criar nova constraint incluindo ghostpay
ALTER TABLE platform_settings 
ADD CONSTRAINT platform_settings_platform_gateway_type_check 
CHECK (platform_gateway_type = ANY (ARRAY['bspay', 'pixup', 'ghostpay']));