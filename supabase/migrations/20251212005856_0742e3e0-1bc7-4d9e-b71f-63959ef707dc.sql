-- Adicionar coluna order_bumps na tabela pix_charges para armazenar IDs dos order bumps selecionados
ALTER TABLE public.pix_charges ADD COLUMN order_bumps uuid[] DEFAULT '{}';

-- Atualizar registros antigos que não têm seller_id mas têm product_id
UPDATE public.pix_charges 
SET seller_id = products.seller_id
FROM products 
WHERE pix_charges.product_id = products.id 
AND pix_charges.seller_id IS NULL;