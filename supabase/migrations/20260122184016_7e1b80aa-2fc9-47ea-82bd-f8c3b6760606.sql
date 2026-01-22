-- Tighten RLS: 'admin' (tenant admin) must NOT have global access.
-- Global/platform access is restricted to 'super_admin' only.

-- affiliate_commissions
ALTER POLICY "Admins can view all commissions" ON public.affiliate_commissions
USING (public.has_role(auth.uid(), 'super_admin'::public.app_role));

-- affiliate_withdrawals
ALTER POLICY "Admins can view all withdrawals" ON public.affiliate_withdrawals
USING (public.has_role(auth.uid(), 'super_admin'::public.app_role));

ALTER POLICY "Admins can update withdrawals" ON public.affiliate_withdrawals
USING (public.has_role(auth.uid(), 'super_admin'::public.app_role));

-- affiliates
ALTER POLICY "Admins can view all affiliates" ON public.affiliates
USING (public.has_role(auth.uid(), 'super_admin'::public.app_role));

-- broadcast_templates (policy uses EXISTS(user_roles...))
ALTER POLICY "Admins can manage templates" ON public.broadcast_templates
USING (public.has_role(auth.uid(), 'super_admin'::public.app_role));

-- checkout_settings / checkout_templates
ALTER POLICY "Admins can view all checkout settings" ON public.checkout_settings
USING (public.has_role(auth.uid(), 'super_admin'::public.app_role));

ALTER POLICY "Admins can view all templates" ON public.checkout_templates
USING (public.has_role(auth.uid(), 'super_admin'::public.app_role));

-- email broadcasts
ALTER POLICY "Admins can manage email broadcasts" ON public.email_broadcasts
USING (public.has_role(auth.uid(), 'super_admin'::public.app_role));

ALTER POLICY "Admins can manage email broadcast recipients" ON public.email_broadcast_recipients
USING (public.has_role(auth.uid(), 'super_admin'::public.app_role));

-- members
ALTER POLICY "Admins can insert members" ON public.members
WITH CHECK (public.has_role(auth.uid(), 'super_admin'::public.app_role));

ALTER POLICY "Admins can update members" ON public.members
USING (public.has_role(auth.uid(), 'super_admin'::public.app_role));

-- payment_gateways
ALTER POLICY "Admins can manage gateways" ON public.payment_gateways
USING (public.has_role(auth.uid(), 'super_admin'::public.app_role));

-- pix_charges
ALTER POLICY "Admins can view all charges" ON public.pix_charges
USING (public.has_role(auth.uid(), 'super_admin'::public.app_role));

ALTER POLICY "Admins can view all pix charges" ON public.pix_charges
USING (public.has_role(auth.uid(), 'super_admin'::public.app_role));

ALTER POLICY "Admins can update pix charges" ON public.pix_charges
USING (public.has_role(auth.uid(), 'super_admin'::public.app_role));

ALTER POLICY "Admins can delete pix charges" ON public.pix_charges
USING (public.has_role(auth.uid(), 'super_admin'::public.app_role));

-- platform_gateway_logs
ALTER POLICY "Admins can view platform gateway logs" ON public.platform_gateway_logs
USING (public.has_role(auth.uid(), 'super_admin'::public.app_role));

ALTER POLICY "Admins can delete platform gateway logs" ON public.platform_gateway_logs
USING (public.has_role(auth.uid(), 'super_admin'::public.app_role));

-- platform_invoices
ALTER POLICY "Admins can manage invoices" ON public.platform_invoices
USING (public.has_role(auth.uid(), 'super_admin'::public.app_role));

ALTER POLICY "Admins can view all invoices" ON public.platform_invoices
USING (public.has_role(auth.uid(), 'super_admin'::public.app_role));

-- platform_settings (these policies are to authenticated; keep but lock to super_admin)
ALTER POLICY "Admins can select platform settings" ON public.platform_settings
USING (public.has_role(auth.uid(), 'super_admin'::public.app_role));

ALTER POLICY "Admins can insert platform settings" ON public.platform_settings
WITH CHECK (public.has_role(auth.uid(), 'super_admin'::public.app_role));

ALTER POLICY "Admins can update platform settings" ON public.platform_settings
USING (public.has_role(auth.uid(), 'super_admin'::public.app_role))
WITH CHECK (public.has_role(auth.uid(), 'super_admin'::public.app_role));

ALTER POLICY "Admins can delete platform settings" ON public.platform_settings
USING (public.has_role(auth.uid(), 'super_admin'::public.app_role));

-- products
ALTER POLICY "Admins can manage all products" ON public.products
USING (public.has_role(auth.uid(), 'super_admin'::public.app_role));

ALTER POLICY "Admins can view all products" ON public.products
USING (public.has_role(auth.uid(), 'super_admin'::public.app_role));

-- profiles
ALTER POLICY "Admins can view all profiles" ON public.profiles
USING (public.has_role(auth.uid(), 'super_admin'::public.app_role));

-- quizzes/leads
ALTER POLICY "Admins can view all quizzes" ON public.quizzes
USING (public.has_role(auth.uid(), 'super_admin'::public.app_role));

ALTER POLICY "Admins can view all leads" ON public.quiz_leads
USING (public.has_role(auth.uid(), 'super_admin'::public.app_role));

ALTER POLICY "Admins can view all responses" ON public.quiz_lead_responses
USING (public.has_role(auth.uid(), 'super_admin'::public.app_role));

-- recovery
ALTER POLICY "Admins can manage all campaigns" ON public.recovery_campaigns
USING (public.has_role(auth.uid(), 'super_admin'::public.app_role));

ALTER POLICY "Admins can view all campaigns" ON public.recovery_campaigns
USING (public.has_role(auth.uid(), 'super_admin'::public.app_role));

ALTER POLICY "Admins can view all messages" ON public.recovery_messages
USING (public.has_role(auth.uid(), 'super_admin'::public.app_role));

ALTER POLICY "Admins can manage recovery settings" ON public.recovery_settings
USING (public.has_role(auth.uid(), 'super_admin'::public.app_role));

-- seller_blocks
ALTER POLICY "Admins can manage blocks" ON public.seller_blocks
USING (public.has_role(auth.uid(), 'super_admin'::public.app_role));

-- seller_gateway_credentials
ALTER POLICY "Admins can view all credentials" ON public.seller_gateway_credentials
USING (public.has_role(auth.uid(), 'super_admin'::public.app_role));

-- suggestions
ALTER POLICY "Admins can view all suggestions" ON public.suggestions
USING (public.has_role(auth.uid(), 'super_admin'::public.app_role));

ALTER POLICY "Admins can update suggestions" ON public.suggestions
USING (public.has_role(auth.uid(), 'super_admin'::public.app_role));

-- transactions
ALTER POLICY "Admins can view all transactions" ON public.transactions
USING (public.has_role(auth.uid(), 'super_admin'::public.app_role));

ALTER POLICY "Admins can delete transactions" ON public.transactions
USING (public.has_role(auth.uid(), 'super_admin'::public.app_role));

-- user_roles
ALTER POLICY "Admins can manage roles" ON public.user_roles
USING (public.has_role(auth.uid(), 'super_admin'::public.app_role));

-- webhook_logs
ALTER POLICY "Admins can delete webhook logs" ON public.webhook_logs
USING (public.has_role(auth.uid(), 'super_admin'::public.app_role));

-- whatsapp broadcasts
ALTER POLICY "Admins can manage broadcasts" ON public.whatsapp_broadcasts
USING (public.has_role(auth.uid(), 'super_admin'::public.app_role));

ALTER POLICY "Admins can manage broadcast recipients" ON public.whatsapp_broadcast_recipients
USING (public.has_role(auth.uid(), 'super_admin'::public.app_role));

-- withdrawals
ALTER POLICY "Admins can view all withdrawals" ON public.withdrawals
USING (public.has_role(auth.uid(), 'super_admin'::public.app_role));

ALTER POLICY "Admins can update withdrawals" ON public.withdrawals
USING (public.has_role(auth.uid(), 'super_admin'::public.app_role));
