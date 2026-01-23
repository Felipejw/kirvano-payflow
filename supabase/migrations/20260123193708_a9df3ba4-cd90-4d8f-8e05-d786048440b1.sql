-- Multi-tenant isolation hardening (SaaS shared backend)

-- 1) TENANTS: admins only see/update their own tenant; super_admin sees all
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Super admin can view all tenants" ON public.tenants;
DROP POLICY IF EXISTS "Admins can view own tenant" ON public.tenants;
DROP POLICY IF EXISTS "Admins can update own tenant" ON public.tenants;

CREATE POLICY "Super admin can view all tenants"
ON public.tenants
FOR SELECT
USING (public.has_role(auth.uid(), 'super_admin'::public.app_role));

CREATE POLICY "Admins can view own tenant"
ON public.tenants
FOR SELECT
USING (admin_user_id = auth.uid());

CREATE POLICY "Admins can update own tenant"
ON public.tenants
FOR UPDATE
USING (admin_user_id = auth.uid())
WITH CHECK (admin_user_id = auth.uid());


-- 2) GATEFLOW_SALES: only super_admin or the reseller tenant admin can read their own sales
ALTER TABLE public.gateflow_sales ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Super admin can view all gateflow sales" ON public.gateflow_sales;
DROP POLICY IF EXISTS "Resellers can view own tenant sales" ON public.gateflow_sales;

CREATE POLICY "Super admin can view all gateflow sales"
ON public.gateflow_sales
FOR SELECT
USING (public.has_role(auth.uid(), 'super_admin'::public.app_role));

CREATE POLICY "Resellers can view own tenant sales"
ON public.gateflow_sales
FOR SELECT
USING (
  reseller_tenant_id IN (
    SELECT t.id
    FROM public.tenants t
    WHERE t.admin_user_id = auth.uid()
  )
);


-- 3) PLATFORM_GATEWAY_LOGS: seller can see only own logs; super_admin sees all
ALTER TABLE public.platform_gateway_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Super admin can view all gateway logs" ON public.platform_gateway_logs;
DROP POLICY IF EXISTS "Sellers can view own gateway logs" ON public.platform_gateway_logs;

CREATE POLICY "Super admin can view all gateway logs"
ON public.platform_gateway_logs
FOR SELECT
USING (public.has_role(auth.uid(), 'super_admin'::public.app_role));

CREATE POLICY "Sellers can view own gateway logs"
ON public.platform_gateway_logs
FOR SELECT
USING (seller_id = auth.uid());


-- 4) PROFILES (PII): users see own; super_admin sees all; sellers see only buyers that are members of their products
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Super admin can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Sellers can view buyer profiles" ON public.profiles;

CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Super admin can view all profiles"
ON public.profiles
FOR SELECT
USING (public.has_role(auth.uid(), 'super_admin'::public.app_role));

CREATE POLICY "Sellers can view buyer profiles"
ON public.profiles
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.members m
    JOIN public.products p ON p.id = m.product_id
    WHERE m.user_id = public.profiles.user_id
      AND p.seller_id = auth.uid()
  )
);


-- 5) USER_ROLES: users can read their own roles; super_admin can read all
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Super admin can view all roles" ON public.user_roles;

CREATE POLICY "Users can view own roles"
ON public.user_roles
FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Super admin can view all roles"
ON public.user_roles
FOR SELECT
USING (public.has_role(auth.uid(), 'super_admin'::public.app_role));
