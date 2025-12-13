-- Permitir que vendedores excluam suas próprias cobranças PIX
CREATE POLICY "Sellers can delete their charges"
ON pix_charges
FOR DELETE
USING (auth.uid() = seller_id);

-- Permitir que vendedores excluam suas próprias transações
CREATE POLICY "Sellers can delete their transactions"
ON transactions
FOR DELETE
USING (auth.uid() = seller_id);