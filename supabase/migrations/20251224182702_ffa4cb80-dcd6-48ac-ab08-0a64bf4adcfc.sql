-- Create table for broadcast templates
CREATE TABLE public.broadcast_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  message TEXT NOT NULL,
  media_type TEXT, -- 'image', 'video', 'document', NULL
  media_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add random interval columns to whatsapp_broadcasts
ALTER TABLE public.whatsapp_broadcasts 
ADD COLUMN interval_min_seconds INTEGER DEFAULT 30,
ADD COLUMN interval_max_seconds INTEGER DEFAULT 60;

-- Migrate existing data: set min = current interval, max = current interval + 15
UPDATE public.whatsapp_broadcasts 
SET interval_min_seconds = interval_seconds,
    interval_max_seconds = interval_seconds + 15;

-- Enable RLS on broadcast_templates
ALTER TABLE public.broadcast_templates ENABLE ROW LEVEL SECURITY;

-- RLS policies for broadcast_templates (admins only)
CREATE POLICY "Admins can manage templates"
ON public.broadcast_templates
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);

-- Create index
CREATE INDEX idx_broadcast_templates_user_id ON public.broadcast_templates(user_id);

-- Create updated_at trigger for templates
CREATE TRIGGER update_broadcast_templates_updated_at
BEFORE UPDATE ON public.broadcast_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();