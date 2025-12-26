-- Adicionar política para permitir que admins deletem platform_gateway_logs
CREATE POLICY "Admins can delete platform gateway logs"
ON platform_gateway_logs
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Adicionar política para permitir que admins deletem webhook_logs
CREATE POLICY "Admins can delete webhook logs"
ON webhook_logs
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Adicionar política para permitir que admins atualizem members
CREATE POLICY "Admins can update members"
ON members
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Adicionar política para permitir que admins deletem pix_charges
CREATE POLICY "Admins can delete pix charges"
ON pix_charges
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Adicionar política para permitir que admins deletem transactions
CREATE POLICY "Admins can delete transactions"
ON transactions
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));