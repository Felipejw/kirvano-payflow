import { useState, useEffect } from "react";
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
  const { user } = useAuth();
  const [role, setRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRole = async () => {
      if (!user) {
        setRole(null);
        setLoading(false);
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
          setRole("seller"); // Default to seller
        } else {
          setRole(data?.role as AppRole || "seller");
        }
      } catch (error) {
        console.error("Error fetching user role:", error);
        setRole("seller");
      } finally {
        setLoading(false);
      }
    };

    fetchRole();
  }, [user]);

  return {
    role,
    isAdmin: role === "admin",
    isSeller: role === "seller",
    isAffiliate: role === "affiliate",
    isMember: role === "member",
    loading,
  };
};
