-- Add unique constraint to prevent future duplicate transactions per charge
CREATE UNIQUE INDEX IF NOT EXISTS unique_transaction_per_charge 
ON transactions (charge_id) 
WHERE charge_id IS NOT NULL;