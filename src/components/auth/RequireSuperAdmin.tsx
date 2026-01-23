import { PropsWithChildren, useEffect } from "react";
import { useUserRole } from "@/hooks/useUserRole";
import { useAppNavigate } from "@/lib/routes";

export function RequireSuperAdmin({ children }: PropsWithChildren) {
  const { isSuperAdmin, loading } = useUserRole();
  const navigate = useAppNavigate();

  useEffect(() => {
    if (!loading && !isSuperAdmin) {
      navigate("dashboard");
    }
  }, [isSuperAdmin, loading, navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!isSuperAdmin) return null;

  return <>{children}</>;
}
