-- Fix the specific reseller product that wasn't updated due to name mismatch
UPDATE products 
SET 
  parent_product_id = 'e5761661-ebb4-4605-a33c-65943686972c',
  order_bumps = (SELECT order_bumps FROM products WHERE id = 'e5761661-ebb4-4605-a33c-65943686972c')
WHERE id = 'a5c6b078-0d32-43fa-b9f7-7a1a532e25c5';

-- Also fix any other Gateflow products that might have been missed
UPDATE products 
SET 
  parent_product_id = 'e5761661-ebb4-4605-a33c-65943686972c',
  order_bumps = (SELECT order_bumps FROM products WHERE id = 'e5761661-ebb4-4605-a33c-65943686972c')
WHERE seller_id != 'c50d0704-2f21-4fe9-87d4-9d7bbccfef57'
  AND parent_product_id IS NULL
  AND (name ILIKE '%gatteflow%' OR name ILIKE '%gateflow%' OR custom_slug LIKE 'gateflow%');