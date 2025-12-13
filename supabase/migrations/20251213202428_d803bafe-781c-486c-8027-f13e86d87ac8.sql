-- Create suggestions table
CREATE TABLE public.suggestions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.suggestions ENABLE ROW LEVEL SECURITY;

-- Users can view their own suggestions
CREATE POLICY "Users can view their own suggestions"
ON public.suggestions
FOR SELECT
USING (auth.uid() = user_id);

-- Users can create suggestions
CREATE POLICY "Users can create suggestions"
ON public.suggestions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Admins can view all suggestions
CREATE POLICY "Admins can view all suggestions"
ON public.suggestions
FOR SELECT
USING (has_role(auth.uid(), 'admin'));

-- Admins can update suggestions
CREATE POLICY "Admins can update suggestions"
ON public.suggestions
FOR UPDATE
USING (has_role(auth.uid(), 'admin'));

-- Trigger for updated_at
CREATE TRIGGER update_suggestions_updated_at
BEFORE UPDATE ON public.suggestions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();