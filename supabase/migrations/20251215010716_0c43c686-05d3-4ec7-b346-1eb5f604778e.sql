-- Create product_modules table
CREATE TABLE public.product_modules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create module_lessons table
CREATE TABLE public.module_lessons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  module_id UUID NOT NULL REFERENCES public.product_modules(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  content_type TEXT NOT NULL DEFAULT 'video',
  content_url TEXT,
  thumbnail_url TEXT,
  duration_minutes INTEGER,
  order_index INTEGER NOT NULL DEFAULT 0,
  is_free BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.product_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.module_lessons ENABLE ROW LEVEL SECURITY;

-- Create indexes
CREATE INDEX idx_product_modules_product_id ON public.product_modules(product_id);
CREATE INDEX idx_module_lessons_module_id ON public.module_lessons(module_id);

-- RLS Policies for product_modules
CREATE POLICY "Sellers can manage their product modules"
ON public.product_modules
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM products
    WHERE products.id = product_modules.product_id
    AND products.seller_id = auth.uid()
  )
);

CREATE POLICY "Members can view modules of their products"
ON public.product_modules
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM members
    WHERE members.product_id = product_modules.product_id
    AND members.user_id = auth.uid()
    AND (members.expires_at IS NULL OR members.expires_at > now())
  )
);

-- RLS Policies for module_lessons
CREATE POLICY "Sellers can manage lessons of their products"
ON public.module_lessons
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM product_modules
    JOIN products ON products.id = product_modules.product_id
    WHERE product_modules.id = module_lessons.module_id
    AND products.seller_id = auth.uid()
  )
);

CREATE POLICY "Members can view lessons of their products"
ON public.module_lessons
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM product_modules
    JOIN members ON members.product_id = product_modules.product_id
    WHERE product_modules.id = module_lessons.module_id
    AND members.user_id = auth.uid()
    AND (members.expires_at IS NULL OR members.expires_at > now())
  )
);

-- Triggers for updated_at
CREATE TRIGGER update_product_modules_updated_at
BEFORE UPDATE ON public.product_modules
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_module_lessons_updated_at
BEFORE UPDATE ON public.module_lessons
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();