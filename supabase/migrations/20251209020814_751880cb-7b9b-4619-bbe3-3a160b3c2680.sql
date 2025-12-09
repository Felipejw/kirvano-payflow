-- Create checkout_templates table for reusable checkout templates
CREATE TABLE public.checkout_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  
  -- Appearance settings
  primary_color TEXT DEFAULT '#00b4d8',
  background_color TEXT DEFAULT '#0a1628',
  text_color TEXT DEFAULT '#ffffff',
  button_color TEXT DEFAULT '#00b4d8',
  button_text_color TEXT DEFAULT '#0a1628',
  border_radius TEXT DEFAULT '12',
  font_family TEXT DEFAULT 'Inter',
  logo_url TEXT,
  favicon_url TEXT,
  page_title TEXT DEFAULT 'Checkout Seguro',
  
  -- Layout settings
  layout TEXT DEFAULT 'one-column',
  show_product_image BOOLEAN DEFAULT true,
  show_product_description BOOLEAN DEFAULT true,
  show_order_summary BOOLEAN DEFAULT true,
  
  -- Fields settings
  require_cpf BOOLEAN DEFAULT true,
  require_phone BOOLEAN DEFAULT true,
  require_address BOOLEAN DEFAULT false,
  
  -- Urgency settings
  enable_timer BOOLEAN DEFAULT true,
  timer_minutes INTEGER DEFAULT 15,
  timer_text TEXT DEFAULT 'Oferta expira em',
  show_stock BOOLEAN DEFAULT false,
  stock_count INTEGER DEFAULT 10,
  stock_text TEXT DEFAULT 'Apenas {count} unidades restantes!',
  show_security_badge BOOLEAN DEFAULT true,
  show_guarantee BOOLEAN DEFAULT true,
  guarantee_days INTEGER DEFAULT 7,
  guarantee_text TEXT DEFAULT 'Garantia incondicional de 7 dias',
  
  -- Notifications
  enable_email_notification BOOLEAN DEFAULT true,
  enable_sms_notification BOOLEAN DEFAULT false,
  
  -- Tracking
  facebook_pixel TEXT,
  tiktok_pixel TEXT,
  google_analytics TEXT,
  
  -- Domain settings
  custom_domain TEXT,
  custom_slug TEXT,
  domain_verified BOOLEAN DEFAULT false,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.checkout_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own templates"
ON public.checkout_templates
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own templates"
ON public.checkout_templates
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own templates"
ON public.checkout_templates
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own templates"
ON public.checkout_templates
FOR DELETE
USING (auth.uid() = user_id);

-- Add checkout_template_id to products table
ALTER TABLE public.products ADD COLUMN checkout_template_id UUID REFERENCES public.checkout_templates(id);

-- Create trigger for updated_at
CREATE TRIGGER update_checkout_templates_updated_at
BEFORE UPDATE ON public.checkout_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();