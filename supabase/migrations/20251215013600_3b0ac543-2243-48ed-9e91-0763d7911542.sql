-- Create table for email history
CREATE TABLE public.member_email_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  email_type TEXT NOT NULL DEFAULT 'access',
  recipient_email TEXT NOT NULL,
  subject TEXT,
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  opened_at TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'sent',
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.member_email_logs ENABLE ROW LEVEL SECURITY;

-- Sellers can view email logs for their product members
CREATE POLICY "Sellers can view email logs of their product members"
ON public.member_email_logs
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM members
    JOIN products ON products.id = members.product_id
    WHERE members.id = member_email_logs.member_id
    AND products.seller_id = auth.uid()
  )
);

-- System can insert email logs (via service role)
CREATE POLICY "System can insert email logs"
ON public.member_email_logs
FOR INSERT
WITH CHECK (true);

-- Anyone can update opened_at (for tracking pixel)
CREATE POLICY "Anyone can update email opened status"
ON public.member_email_logs
FOR UPDATE
USING (true)
WITH CHECK (true);

-- Create index for faster queries
CREATE INDEX idx_member_email_logs_member_id ON public.member_email_logs(member_id);
CREATE INDEX idx_member_email_logs_sent_at ON public.member_email_logs(sent_at DESC);