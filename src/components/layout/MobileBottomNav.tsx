import { LayoutDashboard, Package, ShoppingCart, Wallet, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { Link, useLocation } from "react-router-dom";
import { useSidebar } from "@/contexts/SidebarContext";

const navItems = [
  { icon: LayoutDashboard, label: "Home", path: "/dashboard" },
  { icon: Package, label: "Produtos", path: "/dashboard/products" },
  { icon: ShoppingCart, label: "Vendas", path: "/dashboard/sales" },
  { icon: Wallet, label: "Financeiro", path: "/dashboard/finance" },
];

export function MobileBottomNav() {
  const location = useLocation();
  const { setMobileOpen, isMobile } = useSidebar();

  if (!isMobile) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-xl border-t border-border md:hidden">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg transition-colors min-w-[60px]",
                isActive 
                  ? "text-primary" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <item.icon className={cn("h-5 w-5", isActive && "text-primary")} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
        <button
          onClick={() => setMobileOpen(true)}
          className="flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg text-muted-foreground hover:text-foreground transition-colors min-w-[60px]"
        >
          <MoreHorizontal className="h-5 w-5" />
          <span className="text-[10px] font-medium">Mais</span>
        </button>
      </div>
    </nav>
  );
}
