-- Adicionar coluna universal_access ao produto GateFlow
ALTER TABLE public.gateflow_product 
ADD COLUMN IF NOT EXISTS universal_access BOOLEAN DEFAULT true;

-- Atualizar produto existente para ter acesso universal
UPDATE public.gateflow_product SET universal_access = true WHERE universal_access IS NULL;