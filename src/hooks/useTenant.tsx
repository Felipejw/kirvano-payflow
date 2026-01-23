import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useUserRole } from "./useUserRole";
import { isCustomDomain as isCustomDomainHost, getHostname } from "@/lib/domain";

interface Tenant {
  id: string;
  admin_user_id: string;
  brand_name: string;
  logo_url: string | null;
  favicon_url: string | null;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  custom_domain: string | null;
  domain_verified: boolean;
  support_email: string | null;
  support_phone: string | null;
  whatsapp_url: string | null;
  terms_url: string | null;
  privacy_url: string | null;
  status: string;
  trial_ends_at: string | null;
  is_reseller: boolean;
  reseller_commission: number;
  max_sellers: number | null;
  max_products: number | null;
  created_at: string;
  updated_at: string;
}

interface TenantState {
  tenant: Tenant | null;
  loading: boolean;
  isCustomDomain: boolean;
  error: string | null;
}

export const useTenant = (): TenantState => {
  const { user } = useAuth();
  const { isAdmin, isSuperAdmin, loading: roleLoading } = useUserRole();
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isCustomDomain = useMemo(() => {
    return isCustomDomainHost();
  }, []);

  useEffect(() => {
    const fetchTenant = async () => {
      if (roleLoading) return;
      
      try {
        // Se for domínio customizado, buscar pelo domínio
        if (isCustomDomain) {
          const hostname = getHostname();
          const { data, error: fetchError } = await supabase
            .from("tenants")
            .select("*")
            .eq("custom_domain", hostname)
            .eq("domain_verified", true)
            .single();

          if (fetchError) {
            console.error("Error fetching tenant by domain:", fetchError);
            setError("Tenant não encontrado para este domínio");
          } else {
            setTenant(data as Tenant);
          }
        } 
        // Se for admin logado (não super_admin), buscar seu tenant
        else if (user && isAdmin && !isSuperAdmin) {
          const { data, error: fetchError } = await supabase
            .from("tenants")
            .select("*")
            .eq("admin_user_id", user.id)
            .single();

          if (fetchError && fetchError.code !== 'PGRST116') {
            console.error("Error fetching tenant:", fetchError);
          } else if (data) {
            setTenant(data as Tenant);
          }
        }
        // Se for seller, buscar tenant pelo profile
        else if (user && !isAdmin) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("tenant_id")
            .eq("user_id", user.id)
            .single();

          if (profile?.tenant_id) {
            const { data, error: fetchError } = await supabase
              .from("tenants")
              .select("*")
              .eq("id", profile.tenant_id)
              .single();

            if (!fetchError && data) {
              setTenant(data as Tenant);
            }
          }
        }
      } catch (err) {
        console.error("Error in useTenant:", err);
        setError("Erro ao carregar tenant");
      } finally {
        setLoading(false);
      }
    };

    fetchTenant();
  }, [user, isAdmin, isSuperAdmin, isCustomDomain, roleLoading]);

  return {
    tenant,
    loading: loading || roleLoading,
    isCustomDomain,
    error,
  };
};
