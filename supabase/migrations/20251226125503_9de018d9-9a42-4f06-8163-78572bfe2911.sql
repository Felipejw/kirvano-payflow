-- Drop existing policy that doesn't have WITH CHECK
DROP POLICY IF EXISTS "Admins can manage platform settings" ON public.platform_settings;

-- Create separate policies for each operation with proper clauses
CREATE POLICY "Admins can select platform settings" 
ON public.platform_settings 
FOR SELECT 
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update platform settings" 
ON public.platform_settings 
FOR UPDATE 
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert platform settings" 
ON public.platform_settings 
FOR INSERT 
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete platform settings" 
ON public.platform_settings 
FOR DELETE 
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));