-- Adicionar coluna scheduled_at para agendamento de campanhas
ALTER TABLE public.whatsapp_broadcasts 
ADD COLUMN scheduled_at TIMESTAMPTZ DEFAULT NULL;

-- Criar índice para buscar campanhas agendadas
CREATE INDEX idx_whatsapp_broadcasts_scheduled ON public.whatsapp_broadcasts (scheduled_at) WHERE scheduled_at IS NOT NULL AND status = 'scheduled';