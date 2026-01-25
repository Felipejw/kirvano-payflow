-- Backfill: Criar registros de membros para todos os admins existentes do produto Gateflow
INSERT INTO members (user_id, product_id, access_level, status)
SELECT 
  ur.user_id,
  'e5761661-ebb4-4605-a33c-65943686972c',
  'full',
  'active'
FROM user_roles ur
WHERE ur.role = 'admin'
AND NOT EXISTS (
  SELECT 1 FROM members m 
  WHERE m.user_id = ur.user_id 
  AND m.product_id = 'e5761661-ebb4-4605-a33c-65943686972c'
);

-- Adicionar role 'member' para todos os admins que ainda não possuem
INSERT INTO user_roles (user_id, role)
SELECT ur.user_id, 'member'
FROM user_roles ur
WHERE ur.role = 'admin'
AND NOT EXISTS (
  SELECT 1 FROM user_roles ur2 
  WHERE ur2.user_id = ur.user_id 
  AND ur2.role = 'member'
);