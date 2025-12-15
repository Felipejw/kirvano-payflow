import { 
  LayoutDashboard, 
  Package, 
  CreditCard, 
  Users, 
  Settings, 
  ShoppingCart,
  Wallet,
  LogOut,
  ChevronLeft,
  Menu,
  Shield,
  TrendingUp,
  Lightbulb,
  UserCheck,
  X
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useUserRole } from "@/hooks/useUserRole";
import { useAuth } from "@/hooks/useAuth";
import { useSidebar } from "@/contexts/SidebarContext";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import gateflowLogo from "@/assets/gateflow-logo.png";

const sellerMenuItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
  { icon: Package, label: "Produtos", path: "/dashboard/products" },
  { icon: ShoppingCart, label: "Vendas", path: "/dashboard/sales" },
  { icon: CreditCard, label: "Transações", path: "/dashboard/transactions" },
  { icon: Users, label: "Clientes", path: "/dashboard/clients" },
  { icon: UserCheck, label: "Área de Membros", path: "/dashboard/members" },
  { icon: Wallet, label: "Financeiro", path: "/dashboard/finance" },
];

const adminMenuItems = [
  { icon: LayoutDashboard, label: "Visão Geral", path: "/admin" },
  { icon: Users, label: "Usuários", path: "/admin/users" },
  { icon: ShoppingCart, label: "Transações", path: "/admin/transactions" },
  { icon: Wallet, label: "Faturas", path: "/admin/invoices" },
  { icon: TrendingUp, label: "Analytics", path: "/admin/analytics" },
  { icon: Lightbulb, label: "Sugestões", path: "/admin/suggestions" },
  { icon: Settings, label: "Configurações", path: "/admin/settings" },
];

const bottomMenuItems = [
  { icon: Lightbulb, label: "Sugestões", path: "/dashboard/suggestions" },
  { icon: Settings, label: "Configurações", path: "/dashboard/settings" },
];

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const { collapsed, toggle, isMobile } = useSidebar();
  const location = useLocation();
  const navigate = useNavigate();
  const { isAdmin, loading: roleLoading } = useUserRole();
  const { signOut } = useAuth();

  const isOnAdminRoute = location.pathname.startsWith("/admin");
  const menuItems = isOnAdminRoute ? adminMenuItems : sellerMenuItems;

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  const toggleView = () => {
    if (isOnAdminRoute) {
      navigate("/dashboard");
    } else {
      navigate("/admin");
    }
    onNavigate?.();
  };

  const handleNavClick = () => {
    onNavigate?.();
  };

  const showCollapsed = collapsed && !isMobile;

  return (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-sidebar-border">
        {!showCollapsed && (
          <Link to="/" className="flex items-center gap-2" onClick={handleNavClick}>
            <img src={gateflowLogo} alt="Gateflow" className="h-8 w-auto" />
            <span className="font-bold text-xl gradient-text">Gateflow</span>
          </Link>
        )}
        {showCollapsed && (
          <img src={gateflowLogo} alt="Gateflow" className="h-8 w-auto mx-auto" />
        )}
        {!isMobile && (
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={toggle}
            className={cn("text-muted-foreground", showCollapsed && "mx-auto")}
          >
            {showCollapsed ? <Menu className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        )}
      </div>

      {/* Admin/Seller Toggle - only for admins */}
      {isAdmin && !roleLoading && (
        <div className="px-3 py-2 border-b border-sidebar-border">
          <Button
            variant="outline"
            size="sm"
            onClick={toggleView}
            className={cn(
              "w-full justify-start gap-2",
              showCollapsed && "justify-center px-2"
            )}
          >
            <Shield className="h-4 w-4" />
            {!showCollapsed && (
              <span>{isOnAdminRoute ? "Modo Vendedor" : "Modo Admin"}</span>
            )}
          </Button>
        </div>
      )}

      {/* Main Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
        <div className="space-y-1">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={handleNavClick}
                className={cn(
                  "sidebar-item",
                  isActive && "active",
                  showCollapsed && "justify-center px-2"
                )}
              >
                <item.icon className="h-5 w-5 shrink-0" />
                {!showCollapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Bottom Navigation */}
      <div className="border-t border-sidebar-border px-3 py-4 space-y-1">
        {!isOnAdminRoute && bottomMenuItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={handleNavClick}
              className={cn(
                "sidebar-item",
                isActive && "active",
                showCollapsed && "justify-center px-2"
              )}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              {!showCollapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
        
        <button 
          onClick={handleLogout}
          className={cn(
            "sidebar-item w-full text-destructive hover:bg-destructive/10",
            showCollapsed && "justify-center px-2"
          )}
        >
          <LogOut className="h-5 w-5 shrink-0" />
          {!showCollapsed && <span>Sair</span>}
        </button>
      </div>
    </div>
  );
}

export function Sidebar() {
  const { collapsed, mobileOpen, setMobileOpen, isMobile } = useSidebar();

  // Mobile: Sheet drawer
  if (isMobile) {
    return (
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-64 p-0 bg-sidebar border-sidebar-border">
          <SidebarContent onNavigate={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>
    );
  }

  // Desktop: Fixed sidebar
  return (
    <aside 
      className={cn(
        "fixed left-0 top-0 z-40 h-screen bg-sidebar border-r border-sidebar-border transition-all duration-300 hidden md:block",
        collapsed ? "w-20" : "w-64"
      )}
    >
      <SidebarContent />
    </aside>
  );
}
