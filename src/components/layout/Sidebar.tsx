import { 
  LayoutDashboard, 
  Package, 
  CreditCard, 
  Users, 
  Settings, 
  ShoppingCart,
  Wallet,
  Palette,
  LogOut,
  ChevronLeft,
  Menu,
  Shield,
  TrendingUp
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useUserRole } from "@/hooks/useUserRole";
import { useAuth } from "@/hooks/useAuth";

const sellerMenuItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
  { icon: Package, label: "Produtos", path: "/dashboard/products" },
  { icon: ShoppingCart, label: "Vendas", path: "/dashboard/sales" },
  { icon: CreditCard, label: "Transações", path: "/dashboard/transactions" },
  { icon: Users, label: "Afiliados", path: "/dashboard/affiliates" },
  { icon: Wallet, label: "Financeiro", path: "/dashboard/finance" },
  { icon: Palette, label: "Checkout", path: "/dashboard/checkout" },
  { icon: Palette, label: "Templates", path: "/dashboard/checkout/templates" },
];

const adminMenuItems = [
  { icon: LayoutDashboard, label: "Visão Geral", path: "/admin" },
  { icon: Users, label: "Vendedores", path: "/admin/sellers" },
  { icon: ShoppingCart, label: "Transações", path: "/admin/transactions" },
  { icon: Wallet, label: "Saques", path: "/admin/withdrawals" },
  { icon: TrendingUp, label: "Analytics", path: "/admin/analytics" },
  { icon: Settings, label: "Configurações", path: "/admin/settings" },
];

const bottomMenuItems = [
  { icon: Settings, label: "Configurações", path: "/dashboard/settings" },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { isAdmin, loading: roleLoading } = useUserRole();
  const { signOut } = useAuth();
  const [viewMode, setViewMode] = useState<"seller" | "admin">("seller");

  // Determine which menu items to show based on current path
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
  };

  return (
    <aside 
      className={cn(
        "fixed left-0 top-0 z-40 h-screen bg-sidebar border-r border-sidebar-border transition-all duration-300",
        collapsed ? "w-20" : "w-64"
      )}
    >
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex h-16 items-center justify-between px-4 border-b border-sidebar-border">
          {!collapsed && (
            <Link to="/" className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-lg">P</span>
              </div>
              <span className="font-bold text-xl gradient-text">PixPay</span>
            </Link>
          )}
          {collapsed && (
            <div className="h-8 w-8 rounded-lg bg-gradient-primary flex items-center justify-center mx-auto">
              <span className="text-primary-foreground font-bold text-lg">P</span>
            </div>
          )}
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setCollapsed(!collapsed)}
            className={cn("text-muted-foreground", collapsed && "mx-auto")}
          >
            {collapsed ? <Menu className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
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
                collapsed && "justify-center px-2"
              )}
            >
              <Shield className="h-4 w-4" />
              {!collapsed && (
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
                  className={cn(
                    "sidebar-item",
                    isActive && "active",
                    collapsed && "justify-center px-2"
                  )}
                >
                  <item.icon className="h-5 w-5 shrink-0" />
                  {!collapsed && <span>{item.label}</span>}
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
                className={cn(
                  "sidebar-item",
                  isActive && "active",
                  collapsed && "justify-center px-2"
                )}
              >
                <item.icon className="h-5 w-5 shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
          
          <button 
            onClick={handleLogout}
            className={cn(
              "sidebar-item w-full text-destructive hover:bg-destructive/10",
              collapsed && "justify-center px-2"
            )}
          >
            <LogOut className="h-5 w-5 shrink-0" />
            {!collapsed && <span>Sair</span>}
          </button>
        </div>
      </div>
    </aside>
  );
}
