-- Backfill seller_id for pix_charges where it's NULL but product_id exists
UPDATE public.pix_charges 
SET seller_id = products.seller_id
FROM public.products
WHERE pix_charges.product_id = products.id
AND pix_charges.seller_id IS NULL;