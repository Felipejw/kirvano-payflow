-- Add column for order bump position (after button)
ALTER TABLE public.checkout_templates
ADD COLUMN IF NOT EXISTS show_order_bump_after_button boolean DEFAULT false;