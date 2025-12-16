import { useMemo } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useSearchParams } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { SidebarProvider } from "@/contexts/SidebarContext";
import Auth from "./pages/Auth";
import DomainRouter from "./components/DomainRouter";
import Dashboard from "./pages/Dashboard";
import Products from "./pages/Products";
import Transactions from "./pages/Transactions";
import Checkout from "./pages/Checkout";
import Sales from "./pages/Sales";
import Finance from "./pages/Finance";
import PaymentMethods from "./pages/PaymentMethods";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminSettings from "./pages/admin/AdminSettings";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminTransactionsPage from "./pages/admin/AdminTransactionsPage";
import AdminWithdrawalsPage from "./pages/admin/AdminWithdrawalsPage";
import AdminInvoicesPage from "./pages/admin/AdminInvoicesPage";
import AdminGatewaysPage from "./pages/admin/AdminGatewaysPage";
import AdminAnalytics from "./pages/admin/AdminAnalytics";
import AdminSuggestions from "./pages/admin/AdminSuggestions";
import AdminRecovery from "./pages/admin/AdminRecovery";
import MembersArea from "./pages/members/MembersArea";
import Recovery from "./pages/Recovery";
import MembersLogin from "./pages/members/MembersLogin";
import MemberProduct from "./pages/members/MemberProduct";
import Clients from "./pages/Clients";
import Suggestions from "./pages/Suggestions";
import Members from "./pages/Members";
import MembersConfig from "./pages/members/MembersConfig";
import { getUrlParam } from "./lib/routes";

// Detect if we're on a custom domain (not Lovable/Gateflow domains)
const isCustomDomain = (() => {
  const hostname = window.location.hostname;
  const ignoredDomains = ['localhost', 'lovable.app', 'gatteflow.store', '127.0.0.1', 'lovableproject.com'];
  return !ignoredDomains.some(d => hostname.includes(d));
})();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      staleTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 1,
    },
  },
});

// Page Router component that reads ?page= param
function PageRouter() {
  const [searchParams] = useSearchParams();
  const page = searchParams.get("page") || "";
  const productId = searchParams.get("productId") || searchParams.get("id") || "";
  const slug = searchParams.get("slug") || searchParams.get("s") || "";
  
  // Route based on page param
  switch (page) {
    case "auth":
      return <Auth />;
    case "checkout":
      return <Checkout />;
    case "dashboard":
      return <Dashboard />;
    case "dashboard/products":
      return <Products />;
    case "dashboard/transactions":
      return <Transactions />;
    case "dashboard/sales":
      return <Sales />;
    case "dashboard/finance":
      return <Finance />;
    case "dashboard/payment-methods":
      return <PaymentMethods />;
    case "dashboard/settings":
      return <Settings />;
    case "dashboard/clients":
      return <Clients />;
    case "dashboard/members":
      return <Members />;
    case "dashboard/members/config":
      return <MembersConfig />;
    case "dashboard/suggestions":
      return <Suggestions />;
    case "dashboard/recovery":
      return <Recovery />;
    case "admin":
      return <AdminDashboard />;
    case "admin/recovery":
      return <AdminRecovery />;
    case "admin/users":
      return <AdminUsers />;
    case "admin/transactions":
      return <AdminTransactionsPage />;
    case "admin/withdrawals":
      return <AdminWithdrawalsPage />;
    case "admin/invoices":
      return <AdminInvoicesPage />;
    case "admin/gateways":
      return <AdminGatewaysPage />;
    case "admin/analytics":
      return <AdminAnalytics />;
    case "admin/suggestions":
      return <AdminSuggestions />;
    case "admin/settings":
      return <AdminSettings />;
    case "members":
      return <MembersArea />;
    case "members/login":
      return <MembersLogin />;
    case "members/product":
      return <MemberProduct />;
    default:
      // If no page param, show landing page (DomainRouter)
      if (!page) {
        return <DomainRouter />;
      }
      // Unknown page, show 404
      return <NotFound />;
  }
}

const App = () => {
  // If custom domain, render ONLY Checkout routes
  if (isCustomDomain) {
    return (
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="*" element={<Checkout />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    );
  }

  // Normal routes for main platform - all pages via query params
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <SidebarProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<PageRouter />} />
                <Route path="*" element={<PageRouter />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </SidebarProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
