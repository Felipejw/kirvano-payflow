import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { SidebarProvider } from "@/contexts/SidebarContext";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Products from "./pages/Products";
import Transactions from "./pages/Transactions";
import Affiliates from "./pages/Affiliates";
import Checkout from "./pages/Checkout";
import Sales from "./pages/Sales";
import Finance from "./pages/Finance";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminSettings from "./pages/admin/AdminSettings";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminTransactionsPage from "./pages/admin/AdminTransactionsPage";
import AdminWithdrawalsPage from "./pages/admin/AdminWithdrawalsPage";
import AdminAnalytics from "./pages/admin/AdminAnalytics";
import MembersArea from "./pages/members/MembersArea";
import MembersLogin from "./pages/members/MembersLogin";
import MemberProduct from "./pages/members/MemberProduct";
import Clients from "./pages/Clients";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <SidebarProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/checkout/:productId" element={<Checkout />} />
              <Route path="/checkout/s/:slug" element={<Checkout />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/dashboard/products" element={<Products />} />
              <Route path="/dashboard/transactions" element={<Transactions />} />
              <Route path="/dashboard/affiliates" element={<Affiliates />} />
              <Route path="/dashboard/sales" element={<Sales />} />
              <Route path="/dashboard/finance" element={<Finance />} />
              <Route path="/dashboard/settings" element={<Settings />} />
              <Route path="/dashboard/clients" element={<Clients />} />
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/users" element={<AdminUsers />} />
              <Route path="/admin/transactions" element={<AdminTransactionsPage />} />
              <Route path="/admin/withdrawals" element={<AdminWithdrawalsPage />} />
              <Route path="/admin/analytics" element={<AdminAnalytics />} />
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

export default App;
