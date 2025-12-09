import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { SalesChart } from "@/components/dashboard/SalesChart";
import { TopProducts } from "@/components/dashboard/TopProducts";
import { RecentTransactions } from "@/components/dashboard/RecentTransactions";
import { ConversionFunnel, ConversionChart } from "@/components/dashboard/ConversionMetrics";
import { WithdrawalManagement } from "@/components/dashboard/WithdrawalManagement";
import { GeneratePixDialog } from "@/components/dashboard/GeneratePixDialog";
import { DateRangeFilter, DateRange, DateRangeOption } from "@/components/dashboard/DateRangeFilter";
import { startOfMonth, endOfDay } from "date-fns";
import { 
  DollarSign, 
  TrendingUp, 
  Users, 
  CreditCard,
  QrCode,
  ArrowUpRight,
  Wallet,
  ShoppingCart,
  Percent
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface DashboardStats {
  totalRevenue: number;
  totalSales: number;
  availableBalance: number;
  activeAffiliates: number;
  conversionRate: number;
  revenueChange: string;
  salesChange: string;
}

const Dashboard = () => {
  const [user, setUser] = useState<any>(null);
  const [pixDialogOpen, setPixDialogOpen] = useState(false);
  const [dateRangeOption, setDateRangeOption] = useState<DateRangeOption>("currentMonth");
  const [dateRange, setDateRange] = useState<DateRange>({
    from: startOfMonth(new Date()),
    to: endOfDay(new Date()),
  });
  const [stats, setStats] = useState<DashboardStats>({
    totalRevenue: 0,
    totalSales: 0,
    availableBalance: 0,
    activeAffiliates: 0,
    conversionRate: 0,
    revenueChange: "+0%",
    salesChange: "+0%",
  });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchDashboardStats = useCallback(async (userId: string, range: DateRange) => {
    setLoading(true);

    // Fetch paid transactions within date range
    const { data: paidTransactions } = await supabase
      .from('transactions')
      .select('*')
      .eq('seller_id', userId)
      .eq('status', 'paid')
      .gte('created_at', range.from.toISOString())
      .lte('created_at', range.to.toISOString());

    // Fetch all transactions for conversion calculation within date range
    const { data: allTransactions } = await supabase
      .from('transactions')
      .select('*')
      .eq('seller_id', userId)
      .gte('created_at', range.from.toISOString())
      .lte('created_at', range.to.toISOString());

    // Fetch active affiliates
    const { data: affiliates } = await supabase
      .from('affiliates')
      .select('id, product_id, products!inner(seller_id)')
      .eq('status', 'active');

    // Filter affiliates by seller
    const sellerAffiliates = affiliates?.filter((a: any) => a.products?.seller_id === userId) || [];

    // Fetch all paid transactions (for balance calculation - not filtered by date)
    const { data: allPaidTransactions } = await supabase
      .from('transactions')
      .select('seller_amount')
      .eq('seller_id', userId)
      .eq('status', 'paid');

    // Fetch completed withdrawals (for balance calculation)
    const { data: withdrawals } = await supabase
      .from('withdrawals')
      .select('net_amount')
      .eq('user_id', userId)
      .eq('status', 'completed');

    // Calculate stats for selected period
    const totalRevenue = paidTransactions?.reduce((acc, t) => acc + Number(t.amount), 0) || 0;
    
    // Calculate available balance (all time)
    const totalSellerAmount = allPaidTransactions?.reduce((acc, t) => acc + Number(t.seller_amount), 0) || 0;
    const totalWithdrawn = withdrawals?.reduce((acc, w) => acc + Number(w.net_amount), 0) || 0;

    // Calculate conversion rate
    const paidCount = paidTransactions?.length || 0;
    const totalCount = allTransactions?.length || 1;
    const conversionRate = totalCount > 0 ? (paidCount / totalCount) * 100 : 0;

    // Calculate comparison with previous period
    const periodDuration = range.to.getTime() - range.from.getTime();
    const previousPeriodEnd = new Date(range.from.getTime() - 1);
    const previousPeriodStart = new Date(previousPeriodEnd.getTime() - periodDuration);

    const { data: previousPaidTransactions } = await supabase
      .from('transactions')
      .select('amount')
      .eq('seller_id', userId)
      .eq('status', 'paid')
      .gte('created_at', previousPeriodStart.toISOString())
      .lte('created_at', previousPeriodEnd.toISOString());

    const previousRevenue = previousPaidTransactions?.reduce((acc, t) => acc + Number(t.amount), 0) || 0;
    const previousSalesCount = previousPaidTransactions?.length || 0;

    const revenueChange = previousRevenue > 0 
      ? ((totalRevenue - previousRevenue) / previousRevenue * 100).toFixed(1)
      : totalRevenue > 0 ? "100" : "0";

    const salesChange = previousSalesCount > 0 
      ? ((paidCount - previousSalesCount) / previousSalesCount * 100).toFixed(1)
      : paidCount > 0 ? "100" : "0";

    setStats({
      totalRevenue,
      totalSales: paidCount,
      availableBalance: totalSellerAmount - totalWithdrawn,
      activeAffiliates: sellerAffiliates.length,
      conversionRate: parseFloat(conversionRate.toFixed(1)),
      revenueChange: `${parseFloat(revenueChange) >= 0 ? '+' : ''}${revenueChange}% vs período anterior`,
      salesChange: `${parseFloat(salesChange) >= 0 ? '+' : ''}${salesChange}% vs período anterior`,
    });

    setLoading(false);
  }, []);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
        fetchDashboardStats(session.user.id, dateRange);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, fetchDashboardStats, dateRange]);

  const handleDateRangeChange = (range: DateRange, option: DateRangeOption) => {
    setDateRange(range);
    setDateRangeOption(option);
    if (user) {
      fetchDashboardStats(user.id, range);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold gradient-text">Dashboard</h1>
              <p className="text-muted-foreground">Visão geral do seu negócio</p>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
              <Button variant="outline" className="gap-2 flex-1 sm:flex-none" onClick={() => setPixDialogOpen(true)}>
                <QrCode className="h-4 w-4" />
                <span className="hidden sm:inline">Gerar PIX</span>
                <span className="sm:hidden">PIX</span>
              </Button>
              <Button className="btn-primary-gradient gap-2 flex-1 sm:flex-none" onClick={() => navigate('/dashboard/products')}>
                <ArrowUpRight className="h-4 w-4" />
                <span className="hidden sm:inline">Novo Produto</span>
                <span className="sm:hidden">Novo</span>
              </Button>
            </div>
          </div>

          {/* Date Range Filter */}
          <DateRangeFilter 
            onRangeChange={handleDateRangeChange}
            selectedOption={dateRangeOption}
          />
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
          <StatsCard
            title="Receita Total"
            value={`R$ ${stats.totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
            change={stats.revenueChange}
            changeType={stats.revenueChange.startsWith('+') ? "positive" : "negative"}
            icon={DollarSign}
            iconColor="text-accent"
          />
          <StatsCard
            title="Vendas"
            value={stats.totalSales.toString()}
            change={stats.salesChange}
            changeType={stats.salesChange.startsWith('+') ? "positive" : "negative"}
            icon={ShoppingCart}
            iconColor="text-primary"
          />
          <StatsCard
            title="Saldo Disponível"
            value={`R$ ${stats.availableBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
            change="Disponível para saque"
            changeType="positive"
            icon={Wallet}
            iconColor="text-accent"
          />
          <StatsCard
            title="Afiliados"
            value={stats.activeAffiliates.toString()}
            change="Ativos"
            changeType="positive"
            icon={Users}
            iconColor="text-purple-400"
          />
          <StatsCard
            title="Conversão"
            value={`${stats.conversionRate}%`}
            change="Taxa média"
            changeType={stats.conversionRate >= 3 ? "positive" : "negative"}
            icon={Percent}
            iconColor="text-yellow-400"
          />
        </div>

        {/* Tabs for different dashboard sections */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="bg-secondary/50 w-full sm:w-auto">
            <TabsTrigger value="overview" className="flex-1 sm:flex-none">Visão Geral</TabsTrigger>
            <TabsTrigger value="conversions" className="flex-1 sm:flex-none">Conversões</TabsTrigger>
            <TabsTrigger value="finance" className="flex-1 sm:flex-none">Financeiro</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <SalesChart />
              <TopProducts />
            </div>

            {/* Recent Transactions */}
            <RecentTransactions />
          </TabsContent>

          <TabsContent value="conversions" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <ConversionChart />
              <ConversionFunnel />
            </div>

            {/* Conversion Tips */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Dicas de Otimização</CardTitle>
                <CardDescription>Sugestões para melhorar sua conversão</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="p-4 bg-accent/10 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="h-5 w-5 text-accent" />
                      <span className="font-medium">Order Bump</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Adicione ofertas complementares no checkout para aumentar o ticket médio em até 30%.
                    </p>
                  </div>
                  <div className="p-4 bg-primary/10 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <CreditCard className="h-5 w-5 text-primary" />
                      <span className="font-medium">PIX Rápido</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      QR Codes com timer aumentam urgência. Configure expiração de 15-30 minutos.
                    </p>
                  </div>
                  <div className="p-4 bg-yellow-500/10 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="h-5 w-5 text-yellow-500" />
                      <span className="font-medium">Afiliados</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Comissões acima de 30% atraem mais afiliados de qualidade.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="finance" className="space-y-6">
            <WithdrawalManagement />
          </TabsContent>
        </Tabs>
      </div>

      {/* PIX Generation Dialog */}
      <GeneratePixDialog open={pixDialogOpen} onOpenChange={setPixDialogOpen} />
    </DashboardLayout>
  );
};

export default Dashboard;
