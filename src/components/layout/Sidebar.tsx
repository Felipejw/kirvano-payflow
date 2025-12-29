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
  RefreshCw,
  Instagram,
  Trophy,
  Server,
  MessageSquare,
  Send,
  Mail
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useUserRole } from "@/hooks/useUserRole";
import { useAuth } from "@/hooks/useAuth";
import { useSidebar } from "@/contexts/SidebarContext";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import gateflowLogo from "@/assets/gateflow-logo.png";
import { getPageUrl, useAppNavigate, useCurrentPage } from "@/lib/routes";
import { usePaymentMode } from "@/hooks/usePaymentMode";

// Menu items for sellers using their own gateway
const ownGatewayMenuItems = [
  { icon: LayoutDashboard, label: "Dashboard", page: "dashboard" },
  { icon: Package, label: "Produtos", page: "dashboard/products" },
  { icon: ShoppingCart, label: "Vendas", page: "dashboard/sales" },
  { icon: CreditCard, label: "Transações", page: "dashboard/transactions" },
  { icon: Users, label: "Clientes", page: "dashboard/clients" },
  { icon: UserCheck, label: "Área de Membros", page: "dashboard/members" },
  { icon: MessageSquare, label: "Quizzes", page: "dashboard/quizzes" },
  { icon: RefreshCw, label: "Recuperação", page: "dashboard/recovery" },
  { icon: Wallet, label: "Formas de Pagamento", page: "dashboard/payment-methods" },
  { icon: CreditCard, label: "Financeiro", page: "dashboard/finance" },
];

// Menu items for sellers using platform gateway (no payment methods or finance - they use withdrawals)
const platformGatewayMenuItems = [
  { icon: LayoutDashboard, label: "Dashboard", page: "dashboard" },
  { icon: Package, label: "Produtos", page: "dashboard/products" },
  { icon: ShoppingCart, label: "Vendas", page: "dashboard/sales" },
  { icon: CreditCard, label: "Transações", page: "dashboard/transactions" },
  { icon: Users, label: "Clientes", page: "dashboard/clients" },
  { icon: UserCheck, label: "Área de Membros", page: "dashboard/members" },
  { icon: MessageSquare, label: "Quizzes", page: "dashboard/quizzes" },
  { icon: RefreshCw, label: "Recuperação", page: "dashboard/recovery" },
  { icon: Wallet, label: "Saques", page: "dashboard/withdrawals" },
];

const adminMenuItems = [
  { icon: LayoutDashboard, label: "Visão Geral", page: "admin" },
  { icon: Wallet, label: "Receita/Lucro", page: "admin/receita" },
  { icon: TrendingUp, label: "Métricas Vendas", page: "admin/vendas" },
  { icon: Trophy, label: "Rankings", page: "admin/rankings" },
  { icon: Users, label: "Usuários", page: "admin/users" },
  { icon: Package, label: "Produtos", page: "admin/products" },
  { icon: ShoppingCart, label: "Transações", page: "admin/transactions" },
  { icon: Wallet, label: "Saques", page: "admin/withdrawals" },
  { icon: CreditCard, label: "Faturas", page: "admin/invoices" },
  { icon: CreditCard, label: "Gateways", page: "admin/gateways" },
  { icon: Server, label: "Logs Gateway", page: "admin/gateway-logs" },
  { icon: RefreshCw, label: "Recuperação", page: "admin/recovery" },
  { icon: Send, label: "Disparo WhatsApp", page: "admin/broadcast" },
  { icon: Mail, label: "Disparo Email", page: "admin/email-broadcast" },
  { icon: Instagram, label: "Posts Instagram", page: "admin/instagram-posts" },
  { icon: Lightbulb, label: "Sugestões", page: "admin/suggestions" },
  { icon: Settings, label: "Configurações", page: "admin/settings" },
];

const bottomMenuItems = [
  { icon: Lightbulb, label: "Sugestões", page: "dashboard/suggestions" },
  { icon: Settings, label: "Configurações", page: "dashboard/settings" },
];

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const { collapsed, toggle, isMobile } = useSidebar();
  const currentPage = useCurrentPage();
  const navigate = useAppNavigate();
  const { isAdmin, loading: roleLoading } = useUserRole();
  const { signOut } = useAuth();
  const { paymentMode, loading: modeLoading } = usePaymentMode();

  const isOnAdminRoute = currentPage.startsWith("admin");
  
  // Select menu items based on context
  let menuItems;
  if (isOnAdminRoute) {
    menuItems = adminMenuItems;
  } else {
    // For sellers, show menu based on their payment mode
    menuItems = paymentMode === "platform_gateway" ? platformGatewayMenuItems : ownGatewayMenuItems;
  }

  const handleLogout = async () => {
    await signOut();
    navigate("");
  };

  const toggleView = () => {
    if (isOnAdminRoute) {
      navigate("dashboard");
    } else {
      navigate("admin");
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
            const isActive = currentPage === item.page;
            return (
              <Link
                key={item.page}
                to={getPageUrl(item.page)}
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
          const isActive = currentPage === item.page;
          return (
            <Link
              key={item.page}
              to={getPageUrl(item.page)}
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
