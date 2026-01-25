import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface TenantBranding {
  brand_name: string;
  logo_url: string | null;
  favicon_url: string | null;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
}

const defaultBranding: TenantBranding = {
  brand_name: "Gateflow",
  logo_url: null,
  favicon_url: null,
  primary_color: "#00b4d8",
  secondary_color: "#0a1628",
  accent_color: "#10b981",
};

/**
 * Hook to fetch tenant branding based on seller_id
 * Used in Checkout and Members Area to apply White Label branding
 */
export const useTenantBranding = (sellerId: string | null) => {
  const [branding, setBranding] = useState<TenantBranding>(defaultBranding);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!sellerId) {
      setBranding(defaultBranding);
      setLoading(false);
      return;
    }

    const fetchBranding = async () => {
      try {
        // First, try to find tenant where seller is the admin
        const { data: tenantByAdmin, error: adminError } = await supabase
          .from("tenants")
          .select("brand_name, logo_url, favicon_url, primary_color, secondary_color, accent_color")
          .eq("admin_user_id", sellerId)
          .maybeSingle();

        if (tenantByAdmin) {
          setBranding({
            brand_name: tenantByAdmin.brand_name || defaultBranding.brand_name,
            logo_url: tenantByAdmin.logo_url,
            favicon_url: tenantByAdmin.favicon_url,
            primary_color: tenantByAdmin.primary_color || defaultBranding.primary_color,
            secondary_color: tenantByAdmin.secondary_color || defaultBranding.secondary_color,
            accent_color: tenantByAdmin.accent_color || defaultBranding.accent_color,
          });
          setLoading(false);
          return;
        }

        // If not admin, try to find tenant via profile.tenant_id
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("tenant_id")
          .eq("user_id", sellerId)
          .maybeSingle();

        if (profile?.tenant_id) {
          const { data: tenantByProfile } = await supabase
            .from("tenants")
            .select("brand_name, logo_url, favicon_url, primary_color, secondary_color, accent_color")
            .eq("id", profile.tenant_id)
            .maybeSingle();

          if (tenantByProfile) {
            setBranding({
              brand_name: tenantByProfile.brand_name || defaultBranding.brand_name,
              logo_url: tenantByProfile.logo_url,
              favicon_url: tenantByProfile.favicon_url,
              primary_color: tenantByProfile.primary_color || defaultBranding.primary_color,
              secondary_color: tenantByProfile.secondary_color || defaultBranding.secondary_color,
              accent_color: tenantByProfile.accent_color || defaultBranding.accent_color,
            });
            setLoading(false);
            return;
          }
        }

        // No tenant found, use defaults
        setBranding(defaultBranding);
      } catch (error) {
        console.error("Error fetching tenant branding:", error);
        setBranding(defaultBranding);
      } finally {
        setLoading(false);
      }
    };

    fetchBranding();
  }, [sellerId]);

  return { branding, loading };
};

export { defaultBranding };
export type { TenantBranding };
