-- Adicionar constraint unique para evitar duplicatas de afiliação
ALTER TABLE affiliates 
ADD CONSTRAINT affiliates_user_product_unique 
UNIQUE (user_id, product_id);