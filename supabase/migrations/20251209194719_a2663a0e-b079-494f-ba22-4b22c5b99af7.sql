-- Habilitar REPLICA IDENTITY FULL para a tabela pix_charges (necessário para Realtime funcionar corretamente com UPDATE)
ALTER TABLE public.pix_charges REPLICA IDENTITY FULL;