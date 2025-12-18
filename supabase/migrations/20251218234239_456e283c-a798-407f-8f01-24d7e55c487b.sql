-- Create platform gateway audit logs table
CREATE TABLE public.platform_gateway_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  seller_id UUID NOT NULL,
  charge_id UUID REFERENCES public.pix_charges(id),
  transaction_id UUID REFERENCES public.transactions(id),
  action TEXT NOT NULL, -- 'pix_created', 'pix_paid', 'pix_expired', 'error'
  amount NUMERIC NOT NULL DEFAULT 0,
  product_id UUID REFERENCES public.products(id),
  buyer_email TEXT,
  buyer_name TEXT,
  external_id TEXT,
  gateway_response JSONB,
  error_message TEXT,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.platform_gateway_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view logs
CREATE POLICY "Admins can view platform gateway logs"
  ON public.platform_gateway_logs
  FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- Create index for performance
CREATE INDEX idx_platform_gateway_logs_seller_id ON public.platform_gateway_logs(seller_id);
CREATE INDEX idx_platform_gateway_logs_created_at ON public.platform_gateway_logs(created_at DESC);
CREATE INDEX idx_platform_gateway_logs_action ON public.platform_gateway_logs(action);