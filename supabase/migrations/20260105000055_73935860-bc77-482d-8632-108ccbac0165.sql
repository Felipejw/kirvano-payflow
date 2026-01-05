-- Create webhook configurations table for external API
CREATE TABLE public.webhook_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  url TEXT NOT NULL,
  secret TEXT NOT NULL,
  events TEXT[] DEFAULT ARRAY['payment.confirmed'],
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  last_triggered_at TIMESTAMPTZ,
  failure_count INTEGER DEFAULT 0
);

-- Enable RLS
ALTER TABLE public.webhook_configs ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own webhooks" 
ON public.webhook_configs 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own webhooks" 
ON public.webhook_configs 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own webhooks" 
ON public.webhook_configs 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own webhooks" 
ON public.webhook_configs 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create webhook logs table
CREATE TABLE public.external_webhook_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_id UUID REFERENCES public.webhook_configs(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  payload JSONB,
  response_status INTEGER,
  response_body TEXT,
  error_message TEXT,
  sent_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.external_webhook_logs ENABLE ROW LEVEL SECURITY;

-- Create policy for webhook logs
CREATE POLICY "Users can view their webhook logs" 
ON public.external_webhook_logs 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.webhook_configs wc 
    WHERE wc.id = webhook_id AND wc.user_id = auth.uid()
  )
);

-- Create index for faster queries
CREATE INDEX idx_webhook_configs_user_id ON public.webhook_configs(user_id);
CREATE INDEX idx_webhook_logs_webhook_id ON public.external_webhook_logs(webhook_id);