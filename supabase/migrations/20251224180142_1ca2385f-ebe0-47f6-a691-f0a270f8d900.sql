-- Create whatsapp_broadcasts table for campaigns
CREATE TABLE public.whatsapp_broadcasts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL,
  name TEXT NOT NULL,
  message TEXT NOT NULL,
  media_type TEXT, -- 'image', 'video', 'document', NULL
  media_url TEXT,
  interval_seconds INTEGER DEFAULT 30,
  status TEXT DEFAULT 'draft', -- 'draft', 'running', 'paused', 'completed', 'cancelled'
  total_recipients INTEGER DEFAULT 0,
  sent_count INTEGER DEFAULT 0,
  failed_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

-- Create whatsapp_broadcast_recipients table for recipients and status
CREATE TABLE public.whatsapp_broadcast_recipients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  broadcast_id UUID NOT NULL REFERENCES public.whatsapp_broadcasts(id) ON DELETE CASCADE,
  phone TEXT NOT NULL,
  name TEXT,
  status TEXT DEFAULT 'pending', -- 'pending', 'sent', 'failed'
  error_message TEXT,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on both tables
ALTER TABLE public.whatsapp_broadcasts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_broadcast_recipients ENABLE ROW LEVEL SECURITY;

-- RLS policies for whatsapp_broadcasts (admin only)
CREATE POLICY "Admins can manage broadcasts"
ON public.whatsapp_broadcasts
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS policies for whatsapp_broadcast_recipients (admin only)
CREATE POLICY "Admins can manage broadcast recipients"
ON public.whatsapp_broadcast_recipients
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.whatsapp_broadcasts
    WHERE whatsapp_broadcasts.id = whatsapp_broadcast_recipients.broadcast_id
  )
  AND has_role(auth.uid(), 'admin'::app_role)
);

-- System can update recipients (for edge function)
CREATE POLICY "System can update recipients"
ON public.whatsapp_broadcast_recipients
FOR UPDATE
USING (true)
WITH CHECK (true);

-- System can update broadcasts (for edge function)
CREATE POLICY "System can update broadcasts"
ON public.whatsapp_broadcasts
FOR UPDATE
USING (true)
WITH CHECK (true);

-- Enable realtime for recipients table
ALTER PUBLICATION supabase_realtime ADD TABLE public.whatsapp_broadcast_recipients;
ALTER PUBLICATION supabase_realtime ADD TABLE public.whatsapp_broadcasts;

-- Create indexes for better performance
CREATE INDEX idx_broadcast_recipients_broadcast_id ON public.whatsapp_broadcast_recipients(broadcast_id);
CREATE INDEX idx_broadcast_recipients_status ON public.whatsapp_broadcast_recipients(status);
CREATE INDEX idx_broadcasts_status ON public.whatsapp_broadcasts(status);
CREATE INDEX idx_broadcasts_admin_id ON public.whatsapp_broadcasts(admin_id);