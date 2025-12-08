import { useState, useEffect } from "react";
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
        fetchDashboardStats(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const fetchDashboardStats = async (userId: string) => {
    setLoading(true);

    // Fetch paid transactions
    const { data: paidTransactions } = await supabase
      .from('transactions')
      .select('*')
      .eq('seller_id', userId)
      .eq('status', 'paid');

    // Fetch all transactions for conversion calculation
    const { data: allTransactions } = await supabase
      .from('transactions')
      .select('*')
      .eq('seller_id', userId);

    // Fetch active affiliates
    const { data: affiliates } = await supabase
      .from('affiliates')
      .select('id, product_id, products!inner(seller_id)')
      .eq('status', 'active');

    // Filter affiliates by seller
    const sellerAffiliates = affiliates?.filter((a: any) => a.products?.seller_id === userId) || [];

    // Fetch completed withdrawals
    const { data: withdrawals } = await supabase
      .from('withdrawals')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'completed');

    // Calculate stats
    const totalRevenue = paidTransactions?.reduce((acc, t) => acc + Number(t.amount), 0) || 0;
    const totalSellerAmount = paidTransactions?.reduce((acc, t) => acc + Number(t.seller_amount), 0) || 0;
    const totalWithdrawn = withdrawals?.reduce((acc, w) => acc + Number(w.net_amount), 0) || 0;

    // Calculate conversion rate
    const paidCount = paidTransactions?.length || 0;
    const totalCount = allTransactions?.length || 1;
    const conversionRate = totalCount > 0 ? (paidCount / totalCount) * 100 : 0;

    // Calculate month over month change (simplified)
    const now = new Date();
    const thisMonth = paidTransactions?.filter(t => {
      const date = new Date(t.created_at);
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    }) || [];
    
    const lastMonth = paidTransactions?.filter(t => {
      const date = new Date(t.created_at);
      const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1);
      return date.getMonth() === lastMonthDate.getMonth() && date.getFullYear() === lastMonthDate.getFullYear();
    }) || [];

    const thisMonthRevenue = thisMonth.reduce((acc, t) => acc + Number(t.amount), 0);
    const lastMonthRevenue = lastMonth.reduce((acc, t) => acc + Number(t.amount), 0);
    const revenueChange = lastMonthRevenue > 0 
      ? ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue * 100).toFixed(1)
      : "0";

    const salesChange = lastMonth.length > 0 
      ? ((thisMonth.length - lastMonth.length) / lastMonth.length * 100).toFixed(1)
      : "0";

    setStats({
      totalRevenue,
      totalSales: paidTransactions?.length || 0,
      availableBalance: totalSellerAmount - totalWithdrawn,
      activeAffiliates: sellerAffiliates.length,
      conversionRate: parseFloat(conversionRate.toFixed(1)),
      revenueChange: `${parseFloat(revenueChange) >= 0 ? '+' : ''}${revenueChange}% este mês`,
      salesChange: `${parseFloat(salesChange) >= 0 ? '+' : ''}${salesChange}% este mês`,
    });

    setLoading(false);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold gradient-text">Dashboard</h1>
            <p className="text-muted-foreground">Visão geral do seu negócio</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" className="gap-2" onClick={() => setPixDialogOpen(true)}>
              <QrCode className="h-4 w-4" />
              Gerar PIX
            </Button>
            <Button className="btn-primary-gradient gap-2" onClick={() => navigate('/dashboard/products')}>
              <ArrowUpRight className="h-4 w-4" />
              Novo Produto
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
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
            title="Afiliados Ativos"
            value={stats.activeAffiliates.toString()}
            change="Promovendo seus produtos"
            changeType="positive"
            icon={Users}
            iconColor="text-purple-400"
          />
          <StatsCard
            title="Taxa de Conversão"
            value={`${stats.conversionRate}%`}
            change="Baseado em todas transações"
            changeType={stats.conversionRate >= 3 ? "positive" : "negative"}
            icon={Percent}
            iconColor="text-yellow-400"
          />
        </div>

        {/* Tabs for different dashboard sections */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="bg-secondary/50">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="conversions">Conversões</TabsTrigger>
            <TabsTrigger value="finance">Financeiro</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <SalesChart />
              <TopProducts />
            </div>

            {/* Recent Transactions */}
            <RecentTransactions />

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="glass-card-hover group cursor-pointer" onClick={() => navigate('/dashboard/api')}>
                <CardContent className="p-6 flex items-center gap-4">
                  <div className="p-4 rounded-xl bg-primary/10 group-hover:scale-110 transition-transform">
                    <QrCode className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">API PIX</h3>
                    <p className="text-sm text-muted-foreground">Gere cobranças via API</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-card-hover group cursor-pointer" onClick={() => navigate('/dashboard/affiliates')}>
                <CardContent className="p-6 flex items-center gap-4">
                  <div className="p-4 rounded-xl bg-accent/10 group-hover:scale-110 transition-transform">
                    <Users className="h-8 w-8 text-accent" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Afiliados</h3>
                    <p className="text-sm text-muted-foreground">Gerencie sua rede</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-card-hover group cursor-pointer" onClick={() => navigate('/dashboard/sales')}>
                <CardContent className="p-6 flex items-center gap-4">
                  <div className="p-4 rounded-xl bg-yellow-400/10 group-hover:scale-110 transition-transform">
                    <ShoppingCart className="h-8 w-8 text-yellow-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Vendas</h3>
                    <p className="text-sm text-muted-foreground">Veja suas vendas</p>
                  </div>
                </CardContent>
              </Card>
            </div>
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