import { useEffect, useState } from "react";
import { Sidebar } from "./Sidebar";
import { MobileBottomNav } from "./MobileBottomNav";
import { Search, User, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { useSalesNotifications } from "@/hooks/useSalesNotifications";
import { useSidebar } from "@/contexts/SidebarContext";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { NotificationCenter } from "@/components/notifications/NotificationCenter";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

interface Profile {
  full_name: string | null;
  email: string | null;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user } = useAuth();
  const { collapsed, isMobile, setMobileOpen } = useSidebar();
  const [profile, setProfile] = useState<Profile | null>(null);
  
  // Real-time sales notifications
  useSalesNotifications(user?.id);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;

      const { data } = await supabase
        .from('profiles')
        .select('full_name, email')
        .eq('user_id', user.id)
        .single();

      if (data) {
        setProfile(data);
      }
    };

    fetchProfile();
  }, [user]);

  const displayName = profile?.full_name || user?.email?.split('@')[0] || 'Usuário';
  const displayEmail = profile?.email || user?.email || '';

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      
      {/* Main Content */}
      <div className={cn(
        "transition-all duration-300",
        isMobile ? "pl-0" : (collapsed ? "pl-20" : "pl-64")
      )}>
        {/* Top Header */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background/80 backdrop-blur-xl px-4 md:px-6 gap-4">
          {/* Mobile menu button */}
          {isMobile && (
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setMobileOpen(true)}
              className="shrink-0"
            >
              <Menu className="h-5 w-5" />
            </Button>
          )}
          
          <div className="flex items-center gap-4 flex-1 max-w-xl">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder={isMobile ? "Buscar..." : "Buscar transações, produtos, afiliados..."} 
                className="pl-10 bg-secondary/50 border-transparent focus:border-primary"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-2 md:gap-4">
            <NotificationCenter />
            
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium">{displayName}</p>
                <p className="text-xs text-muted-foreground truncate max-w-[150px]">{displayEmail}</p>
              </div>
              <Button variant="ghost" size="icon" className="rounded-full bg-secondary">
                <User className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className={cn("p-4 md:p-6", isMobile && "pb-20")}>
          {children}
        </main>
      </div>
      
      <MobileBottomNav />
    </div>
  );
}
