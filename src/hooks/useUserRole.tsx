import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

type AppRole = "super_admin" | "admin" | "seller" | "affiliate" | "member";

interface UserRoleState {
  role: AppRole | null;
  roles: AppRole[];
  isSuperAdmin: boolean;
  isAdmin: boolean;
  isSeller: boolean;
  isAffiliate: boolean;
  isMember: boolean;
  loading: boolean;
}

export const useUserRole = (): UserRoleState => {
  const { user, loading: authLoading } = useAuth();
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [roleLoading, setRoleLoading] = useState(true);
  const fetchedForUserId = useRef<string | null>(null);

  useEffect(() => {
    // Wait for auth to finish loading
    if (authLoading) {
      return;
    }

    // If user logged out, reset everything
    if (!user) {
      setRoles([]);
      fetchedForUserId.current = null;
      setRoleLoading(false);
      return;
    }

    // If user changed, reset the fetched flag
    if (fetchedForUserId.current !== user.id) {
      fetchedForUserId.current = null;
    }

    // Skip fetch if we already fetched for this exact user
    if (fetchedForUserId.current === user.id) {
      return;
    }

    const fetchRoles = async () => {
      setRoleLoading(true);
      
      try {
        console.log("[useUserRole] Fetching roles for user:", user.id, user.email);
        
        // Fetch ALL roles for the user (not just one)
        const { data, error } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id);

        if (error) {
          console.error("[useUserRole] Error fetching user roles:", error);
          setRoles(["seller"]);
        } else {
          const userRoles = data?.map(r => r.role as AppRole) || [];
          console.log("[useUserRole] Roles found:", userRoles);
          setRoles(userRoles.length > 0 ? userRoles : ["seller"]);
        }
        fetchedForUserId.current = user.id;
      } catch (error) {
        console.error("[useUserRole] Error fetching user roles:", error);
        setRoles(["seller"]);
      } finally {
        setRoleLoading(false);
      }
    };

    fetchRoles();
  }, [user, authLoading]);

  // Loading is true if auth is loading OR role is loading
  const isLoading = authLoading || roleLoading;

  // Calculate flags based on all roles
  const hasSuperAdmin = roles.includes("super_admin");
  const hasAdmin = roles.includes("admin");
  const hasSeller = roles.includes("seller");
  const hasAffiliate = roles.includes("affiliate");
  const hasMember = roles.includes("member");

  // Determine primary role based on hierarchy: super_admin > admin > seller > affiliate > member
  const getPrimaryRole = (): AppRole | null => {
    if (hasSuperAdmin) return "super_admin";
    if (hasAdmin) return "admin";
    if (hasSeller) return "seller";
    if (hasAffiliate) return "affiliate";
    if (hasMember) return "member";
    return roles[0] || null;
  };

  return {
    role: getPrimaryRole(),
    roles,
    isSuperAdmin: hasSuperAdmin,
    isAdmin: hasAdmin || hasSuperAdmin, // super_admin tem acesso admin
    isSeller: hasSeller || roles.length === 0,
    isAffiliate: hasAffiliate,
    isMember: hasMember,
    loading: isLoading,
  };
};
