-- Create recovery_settings table (Global Admin Settings)
CREATE TABLE public.recovery_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  is_enabled boolean NOT NULL DEFAULT false,
  recovery_fee_percentage numeric NOT NULL DEFAULT 9,
  max_messages_per_charge integer NOT NULL DEFAULT 5,
  min_interval_minutes integer NOT NULL DEFAULT 30,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_by uuid
);

-- Create recovery_campaigns table (Per-Seller Settings)
CREATE TABLE public.recovery_campaigns (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  seller_id uuid NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  message_intervals jsonb NOT NULL DEFAULT '[{"type": "minutes", "value": 30, "channel": "whatsapp"}, {"type": "hours", "value": 2, "channel": "email"}, {"type": "days", "value": 1, "channel": "both"}]'::jsonb,
  custom_whatsapp_template text,
  custom_email_subject text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create recovery_messages table (Message Log)
CREATE TABLE public.recovery_messages (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  original_charge_id uuid NOT NULL,
  new_charge_id uuid,
  campaign_id uuid NOT NULL,
  seller_id uuid NOT NULL,
  channel text NOT NULL DEFAULT 'whatsapp',
  status text NOT NULL DEFAULT 'pending',
  message_number integer NOT NULL DEFAULT 1,
  sent_at timestamp with time zone,
  error_message text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Add recovery tracking columns to pix_charges
ALTER TABLE public.pix_charges 
ADD COLUMN is_recovery boolean DEFAULT false,
ADD COLUMN original_charge_id uuid,
ADD COLUMN recovery_message_id uuid;

-- Add recovery tracking columns to transactions
ALTER TABLE public.transactions 
ADD COLUMN is_recovered boolean DEFAULT false,
ADD COLUMN recovery_fee numeric DEFAULT 0;

-- Enable RLS on new tables
ALTER TABLE public.recovery_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recovery_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recovery_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for recovery_settings
CREATE POLICY "Admins can manage recovery settings" ON public.recovery_settings
FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can view recovery settings" ON public.recovery_settings
FOR SELECT USING (true);

-- RLS Policies for recovery_campaigns
CREATE POLICY "Sellers can manage their own campaigns" ON public.recovery_campaigns
FOR ALL USING (auth.uid() = seller_id);

CREATE POLICY "Admins can view all campaigns" ON public.recovery_campaigns
FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage all campaigns" ON public.recovery_campaigns
FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for recovery_messages
CREATE POLICY "Sellers can view their own messages" ON public.recovery_messages
FOR SELECT USING (auth.uid() = seller_id);

CREATE POLICY "Admins can view all messages" ON public.recovery_messages
FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "System can insert messages" ON public.recovery_messages
FOR INSERT WITH CHECK (true);

CREATE POLICY "System can update messages" ON public.recovery_messages
FOR UPDATE USING (true);

-- Insert default recovery settings
INSERT INTO public.recovery_settings (is_enabled, recovery_fee_percentage, max_messages_per_charge, min_interval_minutes)
VALUES (false, 9, 5, 30);

-- Create trigger for updated_at on recovery_settings
CREATE TRIGGER update_recovery_settings_updated_at
BEFORE UPDATE ON public.recovery_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger for updated_at on recovery_campaigns
CREATE TRIGGER update_recovery_campaigns_updated_at
BEFORE UPDATE ON public.recovery_campaigns
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();