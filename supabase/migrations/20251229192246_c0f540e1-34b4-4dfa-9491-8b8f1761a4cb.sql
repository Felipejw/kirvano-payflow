-- Add button actions support
ALTER TABLE public.whatsapp_broadcasts 
ADD COLUMN IF NOT EXISTS buttons_enabled boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS button_actions jsonb DEFAULT '[]'::jsonb;

-- Add message variations support
ALTER TABLE public.whatsapp_broadcasts 
ADD COLUMN IF NOT EXISTS message_variations text[] DEFAULT '{}';

-- Add variation tracking to recipients
ALTER TABLE public.whatsapp_broadcast_recipients 
ADD COLUMN IF NOT EXISTS variation_used integer DEFAULT null;