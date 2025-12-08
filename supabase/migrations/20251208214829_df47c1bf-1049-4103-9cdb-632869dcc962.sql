-- Create checkout_settings table to store checkout customization
CREATE TABLE public.checkout_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  
  -- Appearance
  primary_color TEXT DEFAULT '#00b4d8',
  background_color TEXT DEFAULT '#0a1628',
  text_color TEXT DEFAULT '#ffffff',
  button_color TEXT DEFAULT '#00b4d8',
  button_text_color TEXT DEFAULT '#0a1628',
  font_family TEXT DEFAULT 'Inter',
  border_radius TEXT DEFAULT '12',
  
  -- Layout
  layout TEXT DEFAULT 'one-column',
  show_product_image BOOLEAN DEFAULT true,
  show_product_description BOOLEAN DEFAULT true,
  show_order_summary BOOLEAN DEFAULT true,
  
  -- Fields
  require_phone BOOLEAN DEFAULT true,
  require_cpf BOOLEAN DEFAULT true,
  require_address BOOLEAN DEFAULT false,
  
  -- Timer and Urgency
  enable_timer BOOLEAN DEFAULT true,
  timer_minutes INTEGER DEFAULT 15,
  timer_text TEXT DEFAULT 'Oferta expira em',
  show_stock BOOLEAN DEFAULT false,
  stock_count INTEGER DEFAULT 10,
  stock_text TEXT DEFAULT 'Apenas {count} unidades restantes!',
  
  -- Security and Guarantee
  show_security_badge BOOLEAN DEFAULT true,
  show_guarantee BOOLEAN DEFAULT true,
  guarantee_days INTEGER DEFAULT 7,
  guarantee_text TEXT DEFAULT 'Garantia incondicional de 7 dias',
  
  -- Logo and Branding
  logo_url TEXT,
  favicon_url TEXT,
  page_title TEXT DEFAULT 'Checkout Seguro',
  
  -- Notifications
  enable_email_notification BOOLEAN DEFAULT true,
  enable_sms_notification BOOLEAN DEFAULT false,
  
  -- Pixels and Tracking
  facebook_pixel TEXT,
  google_analytics TEXT,
  tiktok_pixel TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.checkout_settings ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own checkout settings" 
ON public.checkout_settings 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own checkout settings" 
ON public.checkout_settings 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own checkout settings" 
ON public.checkout_settings 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_checkout_settings_updated_at
BEFORE UPDATE ON public.checkout_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for checkout logos
INSERT INTO storage.buckets (id, name, public) VALUES ('checkout-assets', 'checkout-assets', true);

-- Storage policies
CREATE POLICY "Users can upload checkout assets" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'checkout-assets' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their checkout assets" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'checkout-assets' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Checkout assets are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'checkout-assets');