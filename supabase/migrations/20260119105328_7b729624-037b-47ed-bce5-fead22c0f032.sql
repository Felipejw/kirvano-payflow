-- Add parent_product_id column to products table
ALTER TABLE products ADD COLUMN IF NOT EXISTS parent_product_id uuid REFERENCES products(id);

-- Update existing Gateflow product copies to reference the original
UPDATE products 
SET 
  parent_product_id = 'e5761661-ebb4-4605-a33c-65943686972c',
  order_bumps = (SELECT order_bumps FROM products WHERE id = 'e5761661-ebb4-4605-a33c-65943686972c')
WHERE name ILIKE '%gateflow%' 
  AND id != 'e5761661-ebb4-4605-a33c-65943686972c';