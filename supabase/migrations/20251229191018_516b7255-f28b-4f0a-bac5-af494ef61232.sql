-- Add security columns to whatsapp_broadcasts table
ALTER TABLE public.whatsapp_broadcasts 
ADD COLUMN IF NOT EXISTS safe_mode boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS messages_per_batch integer DEFAULT 50,
ADD COLUMN IF NOT EXISTS batch_pause_minutes integer DEFAULT 30,
ADD COLUMN IF NOT EXISTS messages_sent_in_batch integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS batch_paused_at timestamp with time zone;