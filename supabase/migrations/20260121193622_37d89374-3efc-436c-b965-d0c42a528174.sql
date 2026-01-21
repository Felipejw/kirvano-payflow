-- Security hotfix: remove overly permissive RLS policies (true / with check true)

-- pix_charges: never allow public direct writes/updates
DROP POLICY IF EXISTS "Public can create charges" ON public.pix_charges;
DROP POLICY IF EXISTS "Service role can update pix_charges" ON public.pix_charges;

-- members: memberships must be created only by backend logic (service role bypasses RLS)
DROP POLICY IF EXISTS "System can insert memberships" ON public.members;

-- platform_invoices: invoices must be created/updated only by backend logic
DROP POLICY IF EXISTS "System can insert invoices" ON public.platform_invoices;
DROP POLICY IF EXISTS "System can update invoices" ON public.platform_invoices;

-- seller_blocks: blocks must not be publicly readable/manipulable
DROP POLICY IF EXISTS "System can manage blocks" ON public.seller_blocks;
DROP POLICY IF EXISTS "Anyone can check blocks" ON public.seller_blocks;

-- recovery_messages: must be inserted/updated only by backend logic
DROP POLICY IF EXISTS "System can insert messages" ON public.recovery_messages;
DROP POLICY IF EXISTS "System can update messages" ON public.recovery_messages;

-- quiz_leads: lead PII must not be publicly writable/readable
DROP POLICY IF EXISTS "Public can create leads" ON public.quiz_leads;
DROP POLICY IF EXISTS "Public can update their own leads by session" ON public.quiz_leads;

-- broadcast recipients: updates should be backend-only
DROP POLICY IF EXISTS "System can update recipients" ON public.whatsapp_broadcast_recipients;
DROP POLICY IF EXISTS "System can update email recipients" ON public.email_broadcast_recipients;
