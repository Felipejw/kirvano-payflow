import { useState, useEffect, useCallback } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  Users, 
  DollarSign, 
  ShoppingCart, 
  TrendingUp,
  Package,
  Search,
  Eye,
  Settings,
  UserCog,
  Radio,
  RefreshCw,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Receipt,
  Wallet,
  CreditCard,
  Building2,
  PieChart,
  BarChart3,
  Trophy,
  Target,
  Calendar,
  Clock,
  Percent,
  ShoppingBag
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAppNavigate } from "@/lib/routes";
import { useUserRole } from "@/hooks/useUserRole";
import { format, subDays, startOfMonth, endOfMonth, addDays, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AdminTransactions } from "@/components/admin/AdminTransactions";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart as RechartsPie, Pie, Cell, Legend, AreaChart, Area } from "recharts";

interface SellerData {
  user_id: string;
  email: string;
  full_name: string;
  created_at: string;
  total_sales: number;
  total_revenue: number;
  products_count: number;
  payment_mode: string;
}

interface TopProduct {
  id: string;
  name: string;
  totalSales: number;
  totalRevenue: number;
}

interface TopSeller {
  user_id: string;
  full_name: string;
  email: string;
  totalSales: number;
  totalRevenue: number;
}

interface AdminStats {
  totalSellers: number;
  totalRevenue: number;
  totalTransactions: number;
  platformFees: number;
  pendingWithdrawals: number;
  activeProducts: number;
  platformGatewaySellers: number;
  ownGatewaySellers: number;
  platformGatewayRevenue: number;
  ownGatewayRevenue: number;
  averageTicket: number;
  conversionRate: number;
  recoveredSales: number;
  recoveredAmount: number;
  pendingInvoices: number;
  pendingInvoicesAmount: number;
  overdueInvoices: number;
  overdueInvoicesAmount: number;
  custodyBalance: number;
  monthlyGrowth: number;
  // New metrics
  totalOrders: number;
  paidOrders: number;
  averageSalesPerDay: number;
  orderBumpConversionRate: number;
  nextWeekPending: number;
}

interface ChartData {
  date: string;
  revenue: number;
  transactions: number;
}

interface FeesChartData {
  date: string;
  fees: number;
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--accent))', '#ff6b6b', '#4ecdc4', '#ffd93d'];

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats>({
    totalSellers: 0,
    totalRevenue: 0,
    totalTransactions: 0,
    platformFees: 0,
    pendingWithdrawals: 0,
    activeProducts: 0,
    platformGatewaySellers: 0,
    ownGatewaySellers: 0,
    platformGatewayRevenue: 0,
    ownGatewayRevenue: 0,
    averageTicket: 0,
    conversionRate: 0,
    recoveredSales: 0,
    recoveredAmount: 0,
    pendingInvoices: 0,
    pendingInvoicesAmount: 0,
    overdueInvoices: 0,
    overdueInvoicesAmount: 0,
    custodyBalance: 0,
    monthlyGrowth: 0,
    totalOrders: 0,
    paidOrders: 0,
    averageSalesPerDay: 0,
    orderBumpConversionRate: 0,
    nextWeekPending: 0
  });
  const [sellers, setSellers] = useState<SellerData[]>([]);
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [feesChartData, setFeesChartData] = useState<FeesChartData[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [topSellers, setTopSellers] = useState<TopSeller[]>([]);
  const [paymentModeData, setPaymentModeData] = useState<{name: string, value: number}[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [isLive, setIsLive] = useState(true);
  const [newTransactionAlert, setNewTransactionAlert] = useState(false);
  const [newWithdrawalAlert, setNewWithdrawalAlert] = useState(false);
  const { toast } = useToast();
  const navigate = useAppNavigate();
  const { isAdmin, loading: roleLoading } = useUserRole();

  useEffect(() => {
    if (!roleLoading && !isAdmin) {
      toast({
        title: "Acesso negado",
        description: "Você não tem permissão para acessar esta página",
        variant: "destructive"
      });
      navigate("dashboard");
    }
  }, [isAdmin, roleLoading, navigate, toast]);

  const fetchAdminData = useCallback(async () => {
    try {
      // Fetch only sellers (users with role 'seller')
      const { data: sellerRoles, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "seller");

      if (rolesError) throw rolesError;

      const sellerUserIds = sellerRoles?.map(r => r.user_id) || [];

      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .in("user_id", sellerUserIds);

      if (profilesError) throw profilesError;

      const { data: transactions, error: transactionsError } = await supabase
        .from("transactions")
        .select("*");

      if (transactionsError) throw transactionsError;

      const { data: products, error: productsError } = await supabase
        .from("products")
        .select("*");

      if (productsError) throw productsError;

      const { data: withdrawals, error: withdrawalsError } = await supabase
        .from("withdrawals")
        .select("*")
        .eq("status", "pending");

      if (withdrawalsError) throw withdrawalsError;

      // Fetch PIX charges for conversion rate and order bump analysis
      const { data: pixCharges } = await supabase
        .from("pix_charges")
        .select("status, created_at, order_bumps");

      // Fetch invoices
      const { data: invoices } = await supabase
        .from("platform_invoices")
        .select("*");

      // Calculate metrics
      const paidTransactions = transactions?.filter(t => t.status === 'paid') || [];
      const totalRevenue = paidTransactions.reduce((sum, t) => sum + Number(t.amount || 0), 0);
      const platformFees = paidTransactions.reduce((sum, t) => sum + Number(t.platform_fee || 0), 0);
      const pendingWithdrawalsAmount = withdrawals?.reduce((sum, w) => sum + Number(w.amount || 0), 0) || 0;

      // Payment mode metrics
      const platformGatewaySellers = profiles?.filter(p => p.payment_mode === 'platform_gateway').length || 0;
      const ownGatewaySellers = profiles?.filter(p => p.payment_mode !== 'platform_gateway').length || 0;

      // Revenue by payment mode
      const platformGatewayUserIds = profiles?.filter(p => p.payment_mode === 'platform_gateway').map(p => p.user_id) || [];
      const platformGatewayRevenue = paidTransactions
        .filter(t => platformGatewayUserIds.includes(t.seller_id))
        .reduce((sum, t) => sum + Number(t.amount || 0), 0);
      const ownGatewayRevenue = totalRevenue - platformGatewayRevenue;

      // Average ticket
      const averageTicket = paidTransactions.length > 0 ? totalRevenue / paidTransactions.length : 0;

      // Total orders vs paid orders
      const totalOrders = pixCharges?.length || 0;
      const paidOrders = pixCharges?.filter(c => c.status === 'paid').length || 0;

      // Conversion rate
      const conversionRate = totalOrders > 0 ? (paidOrders / totalOrders) * 100 : 0;

      // Order bump conversion rate
      const paidWithBumps = pixCharges?.filter(c => c.status === 'paid' && c.order_bumps && c.order_bumps.length > 0).length || 0;
      const orderBumpConversionRate = paidOrders > 0 ? (paidWithBumps / paidOrders) * 100 : 0;

      // Average sales per day
      const today = new Date();
      const firstSaleDate = paidTransactions.length > 0 
        ? new Date(Math.min(...paidTransactions.map(t => new Date(t.created_at).getTime())))
        : today;
      const daysActive = Math.max(1, differenceInDays(today, firstSaleDate) + 1);
      const averageSalesPerDay = totalRevenue / daysActive;

      // Recovered sales
      const recoveredTransactions = paidTransactions.filter(t => t.is_recovered);
      const recoveredSales = recoveredTransactions.length;
      const recoveredAmount = recoveredTransactions.reduce((sum, t) => sum + Number(t.amount || 0), 0);

      // Invoices
      const pendingInvoices = invoices?.filter(i => i.status === 'pending') || [];
      const pendingInvoicesAmount = pendingInvoices.reduce((sum, i) => sum + Number(i.fee_total || 0), 0);
      
      const overdueInvoices = invoices?.filter(i => 
        i.status === 'pending' && new Date(i.due_date) < today
      ) || [];
      const overdueInvoicesAmount = overdueInvoices.reduce((sum, i) => sum + Number(i.fee_total || 0), 0);

      // Next week pending (invoices due in the next 7 days)
      const nextWeek = addDays(today, 7);
      const nextWeekInvoices = invoices?.filter(i => {
        const dueDate = new Date(i.due_date);
        return i.status === 'pending' && dueDate >= today && dueDate <= nextWeek;
      }) || [];
      const nextWeekPending = nextWeekInvoices.reduce((sum, i) => sum + Number(i.fee_total || 0), 0);

      // Custody balance (platform gateway sellers' balance)
      const custodyBalance = paidTransactions
        .filter(t => platformGatewayUserIds.includes(t.seller_id))
        .reduce((sum, t) => sum + Number(t.seller_amount || 0), 0) - pendingWithdrawalsAmount;

      // Monthly growth (compare this month vs last month)
      const thisMonthStart = startOfMonth(today);
      const lastMonthStart = startOfMonth(subDays(thisMonthStart, 1));
      const lastMonthEnd = endOfMonth(subDays(thisMonthStart, 1));
      
      const thisMonthRevenue = paidTransactions
        .filter(t => new Date(t.created_at) >= thisMonthStart)
        .reduce((sum, t) => sum + Number(t.amount || 0), 0);
      
      const lastMonthRevenue = paidTransactions
        .filter(t => {
          const date = new Date(t.created_at);
          return date >= lastMonthStart && date <= lastMonthEnd;
        })
        .reduce((sum, t) => sum + Number(t.amount || 0), 0);

      const monthlyGrowth = lastMonthRevenue > 0 
        ? ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 
        : 0;

      // Chart data (last 7 days)
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = subDays(today, 6 - i);
        const dayTransactions = paidTransactions.filter(t => {
          const tDate = new Date(t.created_at);
          return tDate.toDateString() === date.toDateString();
        });
        return {
          date: format(date, "dd/MM", { locale: ptBR }),
          revenue: dayTransactions.reduce((sum, t) => sum + Number(t.amount || 0), 0),
          transactions: dayTransactions.length
        };
      });

      // Fees chart data (last 30 days)
      const last30Days = Array.from({ length: 30 }, (_, i) => {
        const date = subDays(today, 29 - i);
        const dayTransactions = paidTransactions.filter(t => {
          const tDate = new Date(t.created_at);
          return tDate.toDateString() === date.toDateString();
        });
        return {
          date: format(date, "dd/MM", { locale: ptBR }),
          fees: dayTransactions.reduce((sum, t) => sum + Number(t.platform_fee || 0), 0)
        };
      });

      // Payment mode pie chart data
      const paymentModeChartData = [
        { name: 'Gateway Plataforma', value: platformGatewayRevenue },
        { name: 'Gateway Próprio', value: ownGatewayRevenue }
      ].filter(d => d.value > 0);

      // Top Products (by sales count)
      const productSalesMap = new Map<string, { name: string; sales: number; revenue: number }>();
      paidTransactions.forEach(t => {
        if (t.product_id) {
          const product = products?.find(p => p.id === t.product_id);
          const existing = productSalesMap.get(t.product_id);
          if (existing) {
            existing.sales += 1;
            existing.revenue += Number(t.amount || 0);
          } else {
            productSalesMap.set(t.product_id, {
              name: product?.name || 'Produto desconhecido',
              sales: 1,
              revenue: Number(t.amount || 0)
            });
          }
        }
      });
      const topProductsList: TopProduct[] = Array.from(productSalesMap.entries())
        .map(([id, data]) => ({
          id,
          name: data.name,
          totalSales: data.sales,
          totalRevenue: data.revenue
        }))
        .sort((a, b) => b.totalSales - a.totalSales)
        .slice(0, 5);

      // Top Sellers (by revenue)
      const sellerRevenueMap = new Map<string, { name: string; email: string; sales: number; revenue: number }>();
      paidTransactions.forEach(t => {
        if (t.seller_id) {
          const profile = profiles?.find(p => p.user_id === t.seller_id);
          const existing = sellerRevenueMap.get(t.seller_id);
          if (existing) {
            existing.sales += 1;
            existing.revenue += Number(t.seller_amount || 0);
          } else {
            sellerRevenueMap.set(t.seller_id, {
              name: profile?.full_name || 'Vendedor',
              email: profile?.email || '',
              sales: 1,
              revenue: Number(t.seller_amount || 0)
            });
          }
        }
      });
      const topSellersList: TopSeller[] = Array.from(sellerRevenueMap.entries())
        .map(([user_id, data]) => ({
          user_id,
          full_name: data.name,
          email: data.email,
          totalSales: data.sales,
          totalRevenue: data.revenue
        }))
        .sort((a, b) => b.totalRevenue - a.totalRevenue)
        .slice(0, 5);

      setStats({
        totalSellers: profiles?.length || 0,
        totalRevenue,
        totalTransactions: paidTransactions.length,
        platformFees,
        pendingWithdrawals: pendingWithdrawalsAmount,
        activeProducts: products?.filter(p => p.status === "active").length || 0,
        platformGatewaySellers,
        ownGatewaySellers,
        platformGatewayRevenue,
        ownGatewayRevenue,
        averageTicket,
        conversionRate,
        recoveredSales,
        recoveredAmount,
        pendingInvoices: pendingInvoices.length,
        pendingInvoicesAmount,
        overdueInvoices: overdueInvoices.length,
        overdueInvoicesAmount,
        custodyBalance,
        monthlyGrowth,
        totalOrders,
        paidOrders,
        averageSalesPerDay,
        orderBumpConversionRate,
        nextWeekPending
      });

      setChartData(last7Days);
      setFeesChartData(last30Days);
      setPaymentModeData(paymentModeChartData);
      setTopProducts(topProductsList);
      setTopSellers(topSellersList);

      const sellerMap = new Map<string, SellerData>();
      
      profiles?.forEach(profile => {
        sellerMap.set(profile.user_id, {
          user_id: profile.user_id,
          email: profile.email || "",
          full_name: profile.full_name || "Sem nome",
          created_at: profile.created_at,
          total_sales: 0,
          total_revenue: 0,
          products_count: 0,
          payment_mode: profile.payment_mode || 'own_gateway'
        });
      });

      transactions?.forEach(t => {
        if (t.seller_id && sellerMap.has(t.seller_id)) {
          const seller = sellerMap.get(t.seller_id)!;
          seller.total_sales += 1;
          seller.total_revenue += Number(t.seller_amount || 0);
        }
      });

      products?.forEach(p => {
        if (sellerMap.has(p.seller_id)) {
          const seller = sellerMap.get(p.seller_id)!;
          seller.products_count += 1;
        }
      });

      setSellers(Array.from(sellerMap.values()));
      setLastUpdate(new Date());
    } catch (error) {
      console.error("Error fetching admin data:", error);
      toast({
        title: "Erro",
        description: "Falha ao carregar dados do admin",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (isAdmin) {
      fetchAdminData();
    }
  }, [isAdmin, fetchAdminData]);

  // Real-time subscriptions
  useEffect(() => {
    if (!isAdmin || !isLive) return;

    const transactionsChannel = supabase
      .channel('admin-transactions')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'transactions' },
        (payload) => {
          console.log('Transaction update:', payload);
          setNewTransactionAlert(true);
          fetchAdminData();
          toast({
            title: "Nova transação!",
            description: "Os dados foram atualizados automaticamente",
          });
          setTimeout(() => setNewTransactionAlert(false), 3000);
        }
      )
      .subscribe();

    const withdrawalsChannel = supabase
      .channel('admin-withdrawals')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'withdrawals' },
        (payload) => {
          console.log('Withdrawal update:', payload);
          setNewWithdrawalAlert(true);
          fetchAdminData();
          toast({
            title: "Atualização de saque!",
            description: "Os dados foram atualizados automaticamente",
          });
          setTimeout(() => setNewWithdrawalAlert(false), 3000);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(transactionsChannel);
      supabase.removeChannel(withdrawalsChannel);
    };
  }, [isAdmin, isLive, fetchAdminData, toast]);

  const filteredSellers = sellers.filter(seller =>
    seller.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    seller.full_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL"
    }).format(value);
  };

  if (roleLoading || loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Painel Administrativo</h1>
            <p className="text-muted-foreground">
              Visão geral completa da plataforma
            </p>
          </div>
          <div className="flex gap-2 items-center">
            {/* Live indicator */}
            <div className="flex items-center gap-2 mr-4">
              <Button
                variant={isLive ? "default" : "outline"}
                size="sm"
                onClick={() => setIsLive(!isLive)}
                className={isLive ? "bg-green-600 hover:bg-green-700" : ""}
              >
                <Radio className={`h-4 w-4 mr-1 ${isLive ? "animate-pulse" : ""}`} />
                {isLive ? "AO VIVO" : "PAUSADO"}
              </Button>
              <Button variant="ghost" size="sm" onClick={fetchAdminData}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
            <Button variant="outline" onClick={() => navigate("admin/users")}>
              <UserCog className="mr-2 h-4 w-4" />
              Usuários
            </Button>
            <Button variant="outline" onClick={() => navigate("admin/settings")}>
              <Settings className="mr-2 h-4 w-4" />
              Configurações
            </Button>
          </div>
        </div>

        {/* Last update indicator */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className={`h-2 w-2 rounded-full ${isLive ? "bg-green-500 animate-pulse" : "bg-muted"}`}></span>
          Última atualização: {format(lastUpdate, "HH:mm:ss", { locale: ptBR })}
        </div>

        {/* Alerts Section */}
        {(stats.overdueInvoices > 0 || stats.pendingWithdrawals > 0) && (
          <div className="space-y-3">
            {stats.overdueInvoices > 0 && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Faturas Vencidas!</AlertTitle>
                <AlertDescription>
                  {stats.overdueInvoices} fatura(s) vencida(s) totalizando {formatCurrency(stats.overdueInvoicesAmount)}. 
                  <Button variant="link" className="p-0 h-auto ml-2" onClick={() => navigate("admin/invoices")}>
                    Ver faturas →
                  </Button>
                </AlertDescription>
              </Alert>
            )}
            {stats.pendingWithdrawals > 0 && (
              <Alert className="border-yellow-500/50 bg-yellow-500/10">
                <Wallet className="h-4 w-4 text-yellow-500" />
                <AlertTitle className="text-yellow-500">Saques Pendentes</AlertTitle>
                <AlertDescription>
                  {formatCurrency(stats.pendingWithdrawals)} em saques aguardando aprovação.
                  <Button variant="link" className="p-0 h-auto ml-2" onClick={() => navigate("admin/withdrawals")}>
                    Gerenciar saques →
                  </Button>
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════════ */}
        {/* SEÇÃO 1: RECEITA (SEU LUCRO) - DESTAQUE PRINCIPAL */}
        {/* ═══════════════════════════════════════════════════════════════════════ */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <DollarSign className="h-6 w-6 text-primary" />
            <h2 className="text-2xl font-bold">Receita</h2>
          </div>

          {/* Featured Card - Platform Earnings (SEU LUCRO) */}
          <Card className="glass-card border-2 border-primary/50 bg-gradient-to-br from-primary/20 via-primary/10 to-background relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent" />
            <CardHeader className="pb-2 relative">
              <CardTitle className="text-xl font-bold flex items-center gap-2">
                <Trophy className="h-6 w-6 text-primary" />
                💰 TAXAS RECEBIDAS (SEU LUCRO)
                {stats.monthlyGrowth !== 0 && (
                  <Badge variant={stats.monthlyGrowth > 0 ? "default" : "destructive"} className="ml-2">
                    {stats.monthlyGrowth > 0 ? <ArrowUpRight className="h-3 w-3 mr-1" /> : <ArrowDownRight className="h-3 w-3 mr-1" />}
                    {Math.abs(stats.monthlyGrowth).toFixed(1)}% este mês
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                Total acumulado de taxas da plataforma - Este é o seu lucro!
              </CardDescription>
            </CardHeader>
            <CardContent className="relative">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Valor em destaque */}
                <div className="flex flex-col justify-center">
                  <span className="text-5xl font-bold text-primary">{formatCurrency(stats.platformFees)}</span>
                  <span className="text-muted-foreground mt-2">
                    de {formatCurrency(stats.totalRevenue)} em vendas totais
                  </span>
                  <div className="flex gap-4 mt-4">
                    <div className="bg-primary/10 rounded-lg p-3">
                      <p className="text-sm text-muted-foreground">Taxa média</p>
                      <p className="text-lg font-bold text-primary">
                        {stats.totalRevenue > 0 ? ((stats.platformFees / stats.totalRevenue) * 100).toFixed(1) : 0}%
                      </p>
                    </div>
                    <div className="bg-primary/10 rounded-lg p-3">
                      <p className="text-sm text-muted-foreground">Por venda</p>
                      <p className="text-lg font-bold text-primary">
                        {formatCurrency(stats.totalTransactions > 0 ? stats.platformFees / stats.totalTransactions : 0)}
                      </p>
                    </div>
                  </div>
                </div>
                
                {/* Gráfico de Taxas */}
                <div className="h-[200px]">
                  <p className="text-sm font-medium text-muted-foreground mb-2">Taxas Recebidas (últimos 30 dias)</p>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={feesChartData}>
                      <defs>
                        <linearGradient id="feesGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="date" className="text-xs" tick={{ fontSize: 10 }} interval={4} />
                      <YAxis 
                        tickFormatter={(value) => `R$${(value / 100).toFixed(0)}`}
                        className="text-xs"
                        tick={{ fontSize: 10 }}
                      />
                      <Tooltip 
                        formatter={(value: number) => [formatCurrency(value), "Taxas"]}
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))', 
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="fees" 
                        stroke="hsl(var(--primary))" 
                        strokeWidth={2}
                        fillOpacity={1} 
                        fill="url(#feesGradient)" 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Revenue Cards Grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            <Card className="glass-card">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Vendas</CardTitle>
                <ShoppingCart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalTransactions}</div>
                <p className="text-xs text-muted-foreground mt-1">vendas realizadas</p>
              </CardContent>
            </Card>

            <Card className="glass-card">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Valor Vendido</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</div>
                <p className="text-xs text-muted-foreground mt-1">volume total</p>
              </CardContent>
            </Card>

            <Card className="glass-card border-yellow-500/30">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Custódia</CardTitle>
                <Wallet className="h-4 w-4 text-yellow-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-500">{formatCurrency(stats.custodyBalance)}</div>
                <p className="text-xs text-muted-foreground mt-1">disponível para saques</p>
              </CardContent>
            </Card>

            <Card className="glass-card border-orange-500/30">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Pendente Próx. Sem.</CardTitle>
                <Clock className="h-4 w-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-500">{formatCurrency(stats.nextWeekPending)}</div>
                <p className="text-xs text-muted-foreground mt-1">faturas a vencer</p>
              </CardContent>
            </Card>

            <Card className={`glass-card ${stats.overdueInvoicesAmount > 0 ? "border-destructive/50" : ""}`}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Valores Atrasados</CardTitle>
                <AlertTriangle className={`h-4 w-4 ${stats.overdueInvoicesAmount > 0 ? "text-destructive" : "text-muted-foreground"}`} />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${stats.overdueInvoicesAmount > 0 ? "text-destructive" : ""}`}>
                  {formatCurrency(stats.overdueInvoicesAmount)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats.overdueInvoices} fatura(s)
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════════ */}
        {/* SEÇÃO 2: VENDAS - MÉTRICAS DETALHADAS */}
        {/* ═══════════════════════════════════════════════════════════════════════ */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-accent" />
            <h2 className="text-2xl font-bold">Vendas</h2>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="glass-card">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Qt. de Vendas</CardTitle>
                <ShoppingBag className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalTransactions}</div>
                <p className="text-xs text-muted-foreground mt-1">vendas pagas</p>
              </CardContent>
            </Card>

            <Card className="glass-card">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Ticket Médio</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(stats.averageTicket)}</div>
                <p className="text-xs text-muted-foreground mt-1">por venda</p>
              </CardContent>
            </Card>

            <Card className="glass-card">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Média/Dia</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(stats.averageSalesPerDay)}</div>
                <p className="text-xs text-muted-foreground mt-1">receita diária</p>
              </CardContent>
            </Card>

            <Card className="glass-card">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Qt. Produtos</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.activeProducts}</div>
                <p className="text-xs text-muted-foreground mt-1">ativos</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="glass-card">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Pedidos (Total)</CardTitle>
                <Receipt className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalOrders}</div>
                <p className="text-xs text-muted-foreground mt-1">charges gerados</p>
              </CardContent>
            </Card>

            <Card className="glass-card border-green-500/30">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Pedidos Pagos</CardTitle>
                <TrendingUp className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-500">{stats.paidOrders}</div>
                <p className="text-xs text-muted-foreground mt-1">conversões</p>
              </CardContent>
            </Card>

            <Card className="glass-card border-primary/30">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Taxa de Conversão</CardTitle>
                <Target className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">{stats.conversionRate.toFixed(1)}%</div>
                <p className="text-xs text-muted-foreground mt-1">pedidos → pagos</p>
              </CardContent>
            </Card>

            <Card className="glass-card border-accent/30">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Conv. Order Bumps</CardTitle>
                <Percent className="h-4 w-4 text-accent" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-accent">{stats.orderBumpConversionRate.toFixed(1)}%</div>
                <p className="text-xs text-muted-foreground mt-1">aceitaram bumps</p>
              </CardContent>
            </Card>
          </div>

          {/* Recovered Sales Card */}
          <Card className="glass-card border-green-500/30">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <RefreshCw className="h-4 w-4 text-green-500" />
                Vendas Recuperadas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-6">
                <div>
                  <div className="text-2xl font-bold text-green-500">{stats.recoveredSales}</div>
                  <p className="text-xs text-muted-foreground">vendas recuperadas</p>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-500">{formatCurrency(stats.recoveredAmount)}</div>
                  <p className="text-xs text-muted-foreground">valor recuperado</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════════ */}
        {/* SEÇÃO 3: RANKINGS - TOP PRODUTOS E VENDEDORES */}
        {/* ═══════════════════════════════════════════════════════════════════════ */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Trophy className="h-6 w-6 text-yellow-500" />
            <h2 className="text-2xl font-bold">Rankings</h2>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            {/* Top Products */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-primary" />
                  🏆 Produtos Mais Vendidos
                </CardTitle>
                <CardDescription>Top 5 produtos por quantidade de vendas</CardDescription>
              </CardHeader>
              <CardContent>
                {topProducts.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">Nenhuma venda registrada</p>
                ) : (
                  <div className="space-y-3">
                    {topProducts.map((product, index) => (
                      <div key={product.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                            index === 0 ? 'bg-yellow-500 text-yellow-950' :
                            index === 1 ? 'bg-gray-400 text-gray-950' :
                            index === 2 ? 'bg-orange-500 text-orange-950' :
                            'bg-muted text-muted-foreground'
                          }`}>
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-medium truncate max-w-[200px]">{product.name}</p>
                            <p className="text-xs text-muted-foreground">{product.totalSales} vendas</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-primary">{formatCurrency(product.totalRevenue)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Top Sellers */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-accent" />
                  🏆 Top Vendedores
                </CardTitle>
                <CardDescription>Top 5 vendedores por receita</CardDescription>
              </CardHeader>
              <CardContent>
                {topSellers.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">Nenhuma venda registrada</p>
                ) : (
                  <div className="space-y-3">
                    {topSellers.map((seller, index) => (
                      <div key={seller.user_id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                            index === 0 ? 'bg-yellow-500 text-yellow-950' :
                            index === 1 ? 'bg-gray-400 text-gray-950' :
                            index === 2 ? 'bg-orange-500 text-orange-950' :
                            'bg-muted text-muted-foreground'
                          }`}>
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-medium truncate max-w-[200px]">{seller.full_name}</p>
                            <p className="text-xs text-muted-foreground">{seller.totalSales} vendas</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-accent">{formatCurrency(seller.totalRevenue)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════════ */}
        {/* SEÇÃO 4: GRÁFICOS E DISTRIBUIÇÃO */}
        {/* ═══════════════════════════════════════════════════════════════════════ */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <PieChart className="h-6 w-6 text-muted-foreground" />
            <h2 className="text-2xl font-bold">Análises</h2>
          </div>

          {/* Sellers by Payment Mode */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="glass-card border-primary/30">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Gateway Plataforma</CardTitle>
                <Building2 className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.platformGatewaySellers}</div>
                <p className="text-xs text-muted-foreground mt-1">vendedores</p>
                <p className="text-sm font-medium text-primary mt-2">
                  {formatCurrency(stats.platformGatewayRevenue)}
                </p>
              </CardContent>
            </Card>

            <Card className="glass-card border-accent/30">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Gateway Próprio</CardTitle>
                <CreditCard className="h-4 w-4 text-accent" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.ownGatewaySellers}</div>
                <p className="text-xs text-muted-foreground mt-1">vendedores</p>
                <p className="text-sm font-medium text-accent mt-2">
                  {formatCurrency(stats.ownGatewayRevenue)}
                </p>
              </CardContent>
            </Card>

            <Card className="glass-card">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Vendedores</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalSellers}</div>
                <p className="text-xs text-muted-foreground mt-1">cadastrados</p>
              </CardContent>
            </Card>

            <Card className={`glass-card ${stats.pendingInvoices > 0 ? "border-yellow-500/30" : ""}`}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Faturas Pendentes</CardTitle>
                <Receipt className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.pendingInvoices}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {formatCurrency(stats.pendingInvoicesAmount)}
                </p>
                {stats.overdueInvoices > 0 && (
                  <Badge variant="destructive" className="mt-2">
                    {stats.overdueInvoices} vencida(s)
                  </Badge>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Charts Row */}
          <div className="grid gap-4 lg:grid-cols-3">
            {/* Revenue Chart */}
            <Card className="glass-card lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Vendas (Últimos 7 dias)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="date" className="text-xs" />
                      <YAxis 
                        tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
                        className="text-xs"
                      />
                      <Tooltip 
                        formatter={(value: number) => [formatCurrency(value), "Receita"]}
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))', 
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                      />
                      <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Payment Mode Distribution */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  Receita por Modo
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[250px]">
                  {paymentModeData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsPie>
                        <Pie
                          data={paymentModeData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                          label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                        >
                          {paymentModeData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip 
                          formatter={(value: number) => formatCurrency(value)}
                          contentStyle={{ 
                            backgroundColor: 'hsl(var(--card))', 
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px'
                          }}
                        />
                        <Legend />
                      </RechartsPie>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                      Sem dados suficientes
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════════ */}
        {/* SEÇÃO 5: TABELAS - VENDEDORES E TRANSAÇÕES */}
        {/* ═══════════════════════════════════════════════════════════════════════ */}
        <Tabs defaultValue="sellers" className="space-y-4">
          <TabsList>
            <TabsTrigger value="sellers">Vendedores ({stats.totalSellers})</TabsTrigger>
            <TabsTrigger value="transactions">Transações</TabsTrigger>
          </TabsList>

          <TabsContent value="sellers" className="space-y-4">
            <Card className="glass-card">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Vendedores da Plataforma</CardTitle>
                    <CardDescription>
                      Todos os vendedores cadastrados
                    </CardDescription>
                  </div>
                  <div className="relative w-72">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Buscar vendedor..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="p-3 text-left font-medium">Vendedor</th>
                        <th className="p-3 text-left font-medium">Modo</th>
                        <th className="p-3 text-left font-medium">Produtos</th>
                        <th className="p-3 text-left font-medium">Vendas</th>
                        <th className="p-3 text-left font-medium">Receita</th>
                        <th className="p-3 text-left font-medium">Cadastro</th>
                        <th className="p-3 text-left font-medium">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredSellers.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="p-8 text-center text-muted-foreground">
                            Nenhum vendedor encontrado
                          </td>
                        </tr>
                      ) : (
                        filteredSellers.map((seller) => (
                          <tr key={seller.user_id} className="border-b">
                            <td className="p-3">
                              <div>
                                <p className="font-medium">{seller.full_name}</p>
                                <p className="text-sm text-muted-foreground">{seller.email}</p>
                              </div>
                            </td>
                            <td className="p-3">
                              <Badge variant={seller.payment_mode === 'platform_gateway' ? 'default' : 'outline'}>
                                {seller.payment_mode === 'platform_gateway' ? 'Plataforma' : 'Próprio'}
                              </Badge>
                            </td>
                            <td className="p-3">
                              <Badge variant="outline">{seller.products_count}</Badge>
                            </td>
                            <td className="p-3">{seller.total_sales}</td>
                            <td className="p-3 font-medium">{formatCurrency(seller.total_revenue)}</td>
                            <td className="p-3 text-muted-foreground">
                              {format(new Date(seller.created_at), "dd/MM/yyyy", { locale: ptBR })}
                            </td>
                            <td className="p-3">
                              <Button variant="ghost" size="sm">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="transactions">
            <AdminTransactions />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
