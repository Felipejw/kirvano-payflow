-- Create email_broadcasts table
CREATE TABLE public.email_broadcasts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL,
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  html_content TEXT NOT NULL,
  interval_seconds INTEGER DEFAULT 5,
  interval_min_seconds INTEGER DEFAULT 3,
  interval_max_seconds INTEGER DEFAULT 8,
  status TEXT DEFAULT 'draft',
  total_recipients INTEGER DEFAULT 0,
  sent_count INTEGER DEFAULT 0,
  failed_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  scheduled_at TIMESTAMPTZ,
  last_processing_at TIMESTAMPTZ
);

-- Create email_broadcast_recipients table
CREATE TABLE public.email_broadcast_recipients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  broadcast_id UUID NOT NULL REFERENCES email_broadcasts(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT,
  status TEXT DEFAULT 'pending',
  error_message TEXT,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.email_broadcasts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_broadcast_recipients ENABLE ROW LEVEL SECURITY;

-- RLS policies for email_broadcasts
CREATE POLICY "Admins can manage email broadcasts"
ON public.email_broadcasts
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "System can update email broadcasts"
ON public.email_broadcasts
FOR UPDATE
USING (true)
WITH CHECK (true);

-- RLS policies for email_broadcast_recipients
CREATE POLICY "Admins can manage email broadcast recipients"
ON public.email_broadcast_recipients
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM email_broadcasts 
    WHERE email_broadcasts.id = email_broadcast_recipients.broadcast_id
  ) AND has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "System can update email recipients"
ON public.email_broadcast_recipients
FOR UPDATE
USING (true)
WITH CHECK (true);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.email_broadcasts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.email_broadcast_recipients;

-- Create indexes for performance
CREATE INDEX idx_email_broadcasts_status ON public.email_broadcasts(status);
CREATE INDEX idx_email_broadcast_recipients_broadcast_id ON public.email_broadcast_recipients(broadcast_id);
CREATE INDEX idx_email_broadcast_recipients_status ON public.email_broadcast_recipients(status);