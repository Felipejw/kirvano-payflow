import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

type AppRole = "admin" | "seller" | "affiliate" | "member";

interface UserRoleState {
  role: AppRole | null;
  isAdmin: boolean;
  isSeller: boolean;
  isAffiliate: boolean;
  isMember: boolean;
  loading: boolean;
}

export const useUserRole = (): UserRoleState => {
  const { user, loading: authLoading } = useAuth();
  const [role, setRole] = useState<AppRole | null>(null);
  const [roleLoading, setRoleLoading] = useState(true);
  const cachedUserId = useRef<string | null>(null);

  useEffect(() => {
    // Wait for auth to finish loading
    if (authLoading) {
      return;
    }

    const fetchRole = async () => {
      if (!user) {
        setRole(null);
        cachedUserId.current = null;
        setRoleLoading(false);
        return;
      }

      // Skip fetch if we already have the role for this user
      if (cachedUserId.current === user.id && role !== null) {
        setRoleLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id)
          .single();

        if (error) {
          console.error("Error fetching user role:", error);
          setRole("seller");
        } else {
          setRole(data?.role as AppRole || "seller");
        }
        cachedUserId.current = user.id;
      } catch (error) {
        console.error("Error fetching user role:", error);
        setRole("seller");
      } finally {
        setRoleLoading(false);
      }
    };

    fetchRole();
  }, [user, authLoading]);

  // Loading is true if auth is loading OR role is loading
  const isLoading = authLoading || roleLoading;

  return {
    role,
    isAdmin: role === "admin",
    isSeller: role === "seller",
    isAffiliate: role === "affiliate",
    isMember: role === "member",
    loading: isLoading,
  };
};
