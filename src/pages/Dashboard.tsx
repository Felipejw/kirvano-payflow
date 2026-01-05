import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAppNavigate } from "@/lib/routes";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { SalesChart } from "@/components/dashboard/SalesChart";
import { AverageTicketChart } from "@/components/dashboard/AverageTicketChart";
import { TopProducts } from "@/components/dashboard/TopProducts";
import { RecentTransactions } from "@/components/dashboard/RecentTransactions";
import { ConversionFunnel, ConversionChart } from "@/components/dashboard/ConversionMetrics";
import { GeneratePixDialog } from "@/components/dashboard/GeneratePixDialog";
import { DateRangeFilter, DateRange, DateRangeOption } from "@/components/dashboard/DateRangeFilter";
import { ProductFilter } from "@/components/dashboard/ProductFilter";
import { startOfDay, endOfDay } from "date-fns";
import { 
  DollarSign, 
  TrendingUp, 
  Users, 
  CreditCard,
  QrCode,
  ArrowUpRight,
  ShoppingCart,
  Percent,
  Package,
  Receipt,
  Clock,
  RefreshCw
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface DashboardStats {
  totalRevenue: number;
  totalSales: number;
  averageTicket: number;
  activeProducts: number;
  conversionRate: number;
  pendingRevenue: number;
  pixGenerated: number;
  uniqueCustomers: number;
  revenueChange: string;
  salesChange: string;
}

const Dashboard = () => {
  const [user, setUser] = useState<any>(null);
  const [pixDialogOpen, setPixDialogOpen] = useState(false);
  const [dateRangeOption, setDateRangeOption] = useState<DateRangeOption>("today");
  const [dateRange, setDateRange] = useState<DateRange>({
    from: startOfDay(new Date()),
    to: endOfDay(new Date()),
  });
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalRevenue: 0,
    totalSales: 0,
    averageTicket: 0,
    activeProducts: 0,
    conversionRate: 0,
    pendingRevenue: 0,
    pixGenerated: 0,
    uniqueCustomers: 0,
    revenueChange: "+0%",
    salesChange: "+0%",
  });
  const [loading, setLoading] = useState(true);
  const navigate = useAppNavigate();

  const fetchDashboardStats = useCallback(async (userId: string, range: DateRange, productIds: string[]) => {
    setLoading(true);

    // Build queries with optional product filter
    let paidTransQuery = supabase
      .from('transactions')
      .select('*')
      .eq('seller_id', userId)
      .eq('status', 'paid')
      .gte('created_at', range.from.toISOString())
      .lte('created_at', range.to.toISOString());

    let pixChargesQuery = supabase
      .from('pix_charges')
      .select('id, amount, status, buyer_email')
      .eq('seller_id', userId)
      .gte('created_at', range.from.toISOString())
      .lte('created_at', range.to.toISOString());

    let pendingTransQuery = supabase
      .from('transactions')
      .select('amount')
      .eq('seller_id', userId)
      .in('status', ['pending', 'cancelled', 'expired'])
      .gte('created_at', range.from.toISOString())
      .lte('created_at', range.to.toISOString());

    // Apply product filter if selected
    if (productIds.length > 0) {
      paidTransQuery = paidTransQuery.in('product_id', productIds);
      pixChargesQuery = pixChargesQuery.in('product_id', productIds);
      pendingTransQuery = pendingTransQuery.in('product_id', productIds);
    }

    // Execute queries
    const { data: paidTransactions } = await paidTransQuery;
    const { data: pixCharges } = await pixChargesQuery;
    const { data: pendingTransactions } = await pendingTransQuery;

    // Calculate pending revenue from pix charges not paid
    const pendingPixRevenue = pixCharges
      ?.filter(p => p.status === 'pending' || p.status === 'expired')
      ?.reduce((acc, p) => acc + Number(p.amount), 0) || 0;
    
    // Calculate pending from cancelled/expired transactions
    const pendingTxRevenue = pendingTransactions?.reduce((acc, t) => acc + Number(t.amount), 0) || 0;

    // Fetch active products
    const { data: products } = await supabase
      .from('products')
      .select('id')
      .eq('seller_id', userId)
      .eq('status', 'active');

    // Calculate stats for selected period
    const totalRevenue = paidTransactions?.reduce((acc, t) => acc + Number(t.amount), 0) || 0;
    const paidCount = paidTransactions?.length || 0;
    
    // Calculate average ticket
    const averageTicket = paidCount > 0 ? totalRevenue / paidCount : 0;

    // Calculate conversion rate (paid transactions / PIX generated)
    const pixGeneratedCount = pixCharges?.length || 0;
    const conversionRate = pixGeneratedCount > 0 ? (paidCount / pixGeneratedCount) * 100 : 0;

    // Calculate unique customers from paid pix charges
    const uniqueEmails = new Set(pixCharges?.filter(p => p.status === 'paid').map(p => p.buyer_email) || []);
    const uniqueCustomers = uniqueEmails.size;

    // Calculate comparison with previous period
    const periodDuration = range.to.getTime() - range.from.getTime();
    const previousPeriodEnd = new Date(range.from.getTime() - 1);
    const previousPeriodStart = new Date(previousPeriodEnd.getTime() - periodDuration);

    let previousTransQuery = supabase
      .from('transactions')
      .select('amount')
      .eq('seller_id', userId)
      .eq('status', 'paid')
      .gte('created_at', previousPeriodStart.toISOString())
      .lte('created_at', previousPeriodEnd.toISOString());

    if (productIds.length > 0) {
      previousTransQuery = previousTransQuery.in('product_id', productIds);
    }

    const { data: previousPaidTransactions } = await previousTransQuery;

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
      averageTicket,
      activeProducts: products?.length || 0,
      conversionRate: parseFloat(conversionRate.toFixed(1)),
      pendingRevenue: pendingPixRevenue + pendingTxRevenue,
      pixGenerated: pixGeneratedCount,
      uniqueCustomers,
      revenueChange: `${parseFloat(revenueChange) >= 0 ? '+' : ''}${revenueChange}% vs período anterior`,
      salesChange: `${parseFloat(salesChange) >= 0 ? '+' : ''}${salesChange}% vs período anterior`,
    });

    setLoading(false);
  }, []);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        navigate("auth");
      } else {
        setUser(session.user);
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("auth");
      } else {
        setUser(session.user);
        fetchDashboardStats(session.user.id, dateRange, selectedProducts);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, fetchDashboardStats, dateRange, selectedProducts]);

  const handleDateRangeChange = (range: DateRange, option: DateRangeOption) => {
    setDateRange(range);
    setDateRangeOption(option);
    if (user) {
      fetchDashboardStats(user.id, range, selectedProducts);
    }
  };

  const handleProductsChange = (productIds: string[]) => {
    setSelectedProducts(productIds);
    if (user) {
      fetchDashboardStats(user.id, dateRange, productIds);
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
              <Button 
                variant="outline" 
                size="icon"
                onClick={() => user && fetchDashboardStats(user.id, dateRange, selectedProducts)}
                disabled={loading}
                title="Atualizar dados"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
              <Button variant="outline" className="gap-2 flex-1 sm:flex-none" onClick={() => setPixDialogOpen(true)}>
                <QrCode className="h-4 w-4" />
                <span className="hidden sm:inline">Gerar PIX</span>
                <span className="sm:hidden">PIX</span>
              </Button>
              <Button className="btn-primary-gradient gap-2 flex-1 sm:flex-none" onClick={() => navigate('dashboard/products')}>
                <ArrowUpRight className="h-4 w-4" />
                <span className="hidden sm:inline">Novo Produto</span>
                <span className="sm:hidden">Novo</span>
              </Button>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <ProductFilter 
              selectedProducts={selectedProducts}
              onProductsChange={handleProductsChange}
            />
            <DateRangeFilter 
              onRangeChange={handleDateRangeChange}
              selectedOption={dateRangeOption}
            />
          </div>
        </div>

        {/* Stats Grid - Row 1 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          <StatsCard
            title="Receita Total"
            value={`R$ ${stats.totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
            numericValue={stats.totalRevenue}
            valueType="currency"
            change={stats.revenueChange}
            changeType={stats.revenueChange.startsWith('+') ? "positive" : "negative"}
            icon={DollarSign}
            iconColor="text-accent"
            tooltip="Soma de todas as vendas confirmadas no período selecionado. Inclui todos os produtos vendidos através de PIX, cartão e boleto."
          />
          <StatsCard
            title="Vendas"
            value={stats.totalSales.toString()}
            numericValue={stats.totalSales}
            valueType="number"
            change={stats.salesChange}
            changeType={stats.salesChange.startsWith('+') ? "positive" : "negative"}
            icon={ShoppingCart}
            iconColor="text-primary"
            tooltip="Número total de transações pagas e confirmadas no período. Cada venda representa uma compra finalizada com sucesso."
          />
          <StatsCard
            title="Receita Pendente"
            value={`R$ ${stats.pendingRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
            numericValue={stats.pendingRevenue}
            valueType="currency"
            change="PIX não pagos"
            changeType="neutral"
            icon={Clock}
            iconColor="text-yellow-400"
            tooltip="Valor total de PIX gerados mas ainda não pagos ou expirados. Representa receita potencial que pode ser recuperada com follow-up."
          />
          <StatsCard
            title="Ticket Médio"
            value={`R$ ${stats.averageTicket.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
            numericValue={stats.averageTicket}
            valueType="currency"
            change="Por venda"
            changeType="neutral"
            icon={Receipt}
            iconColor="text-accent"
            tooltip="Valor médio gasto por cliente em cada compra. Calcule estratégias de order bump para aumentar este indicador."
          />
        </div>

        {/* Stats Grid - Row 2 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          <StatsCard
            title="PIX Gerados"
            value={stats.pixGenerated.toString()}
            numericValue={stats.pixGenerated}
            valueType="number"
            change="No período"
            changeType="neutral"
            icon={QrCode}
            iconColor="text-primary"
            tooltip="Total de cobranças PIX criadas no período. Compara com vendas confirmadas para entender sua taxa de conversão."
          />
          <StatsCard
            title="Clientes Únicos"
            value={stats.uniqueCustomers.toString()}
            numericValue={stats.uniqueCustomers}
            valueType="number"
            change="Compradores"
            changeType="positive"
            icon={Users}
            iconColor="text-purple-400"
            tooltip="Número de clientes únicos que compraram no período, baseado no email. Clientes recorrentes contam apenas uma vez."
          />
          <StatsCard
            title="Produtos Ativos"
            value={stats.activeProducts.toString()}
            numericValue={stats.activeProducts}
            valueType="number"
            change="Publicados"
            changeType="positive"
            icon={Package}
            iconColor="text-accent"
            tooltip="Quantidade de produtos com status ativo disponíveis para venda no seu catálogo."
          />
          <StatsCard
            title="Conversão"
            value={`${stats.conversionRate}%`}
            numericValue={stats.conversionRate}
            valueType="percent"
            change="Taxa média"
            changeType={stats.conversionRate >= 3 ? "positive" : "negative"}
            icon={Percent}
            iconColor="text-yellow-400"
            tooltip="Porcentagem de PIX gerados que foram pagos. Taxa ideal: acima de 5%. Taxas baixas podem indicar problemas no checkout."
          />
        </div>

        {/* Tabs for different dashboard sections */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="bg-secondary/50 w-full sm:w-auto">
            <TabsTrigger value="overview" className="flex-1 sm:flex-none">Visão Geral</TabsTrigger>
            <TabsTrigger value="conversions" className="flex-1 sm:flex-none">Conversões</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <SalesChart dateRange={dateRange} selectedProductIds={selectedProducts} />
              <TopProducts dateRange={dateRange} selectedProductIds={selectedProducts} />
            </div>

            {/* Ticket Médio Chart */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <AverageTicketChart dateRange={dateRange} selectedProductIds={selectedProducts} />
            </div>

            {/* Recent Transactions */}
            <RecentTransactions selectedProductIds={selectedProducts} />
          </TabsContent>

          <TabsContent value="conversions" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <ConversionChart dateRange={dateRange} selectedProductIds={selectedProducts} />
              <ConversionFunnel dateRange={dateRange} selectedProductIds={selectedProducts} />
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
        </Tabs>
      </div>

      {/* PIX Generation Dialog */}
      <GeneratePixDialog open={pixDialogOpen} onOpenChange={setPixDialogOpen} />
    </DashboardLayout>
  );
};

export default Dashboard;
