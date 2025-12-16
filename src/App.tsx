import { useMemo } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { SidebarProvider } from "@/contexts/SidebarContext";
import Auth from "./pages/Auth";
import DomainRouter from "./components/DomainRouter";
import Dashboard from "./pages/Dashboard";
import Products from "./pages/Products";
import Transactions from "./pages/Transactions";

import Checkout from "./pages/Checkout";

// Detect if we're on a custom domain (not Lovable/Gateflow domains)
const isCustomDomain = (() => {
  const hostname = window.location.hostname;
  const ignoredDomains = ['localhost', 'lovable.app', 'gatteflow.store', '127.0.0.1', 'lovableproject.com'];
  return !ignoredDomains.some(d => hostname.includes(d));
})();
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

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      staleTime: 5 * 60 * 1000, // 5 minutos
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 1,
    },
  },
});

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
              <Route path="/" element={<Checkout />} />
              <Route path="/:slug" element={<Checkout />} />
              <Route path="*" element={<Checkout />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    );
  }

  // Normal routes for main platform
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <SidebarProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<DomainRouter />} />
                <Route path="/auth" element={<Auth />} />
              <Route path="/checkout/:productId" element={<Checkout />} />
              <Route path="/checkout/s/:slug" element={<Checkout />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/dashboard/products" element={<Products />} />
              <Route path="/dashboard/transactions" element={<Transactions />} />
              
              <Route path="/dashboard/sales" element={<Sales />} />
              <Route path="/dashboard/finance" element={<Finance />} />
              <Route path="/dashboard/payment-methods" element={<PaymentMethods />} />
              <Route path="/dashboard/settings" element={<Settings />} />
              <Route path="/dashboard/clients" element={<Clients />} />
              <Route path="/dashboard/members" element={<Members />} />
              <Route path="/dashboard/members/config/:productId" element={<MembersConfig />} />
              <Route path="/dashboard/suggestions" element={<Suggestions />} />
              <Route path="/dashboard/recovery" element={<Recovery />} />
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/recovery" element={<AdminRecovery />} />
              <Route path="/admin/users" element={<AdminUsers />} />
              <Route path="/admin/transactions" element={<AdminTransactionsPage />} />
              <Route path="/admin/withdrawals" element={<AdminWithdrawalsPage />} />
              <Route path="/admin/invoices" element={<AdminInvoicesPage />} />
              <Route path="/admin/gateways" element={<AdminGatewaysPage />} />
              <Route path="/admin/analytics" element={<AdminAnalytics />} />
              <Route path="/admin/suggestions" element={<AdminSuggestions />} />
              <Route path="/admin/settings" element={<AdminSettings />} />
              <Route path="/members" element={<MembersArea />} />
              <Route path="/members/login" element={<MembersLogin />} />
              <Route path="/members/product/:productId" element={<MemberProduct />} />
              <Route path="/:slug" element={<Checkout />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </SidebarProvider>
    </AuthProvider>
  </QueryClientProvider>
  );
};

export default App;
