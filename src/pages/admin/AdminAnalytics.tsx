import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  TrendingUp, 
  TrendingDown,
  DollarSign,
  Users,
  ShoppingCart,
  Package,
  Calendar
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { useUserRole } from "@/hooks/useUserRole";
import { format, subDays, startOfDay, endOfDay, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from "recharts";

interface AnalyticsData {
  totalRevenue: number;
  totalFees: number;
  totalTransactions: number;
  totalSellers: number;
  totalProducts: number;
  avgTransactionValue: number;
  revenueByDay: { date: string; revenue: number; fees: number }[];
  transactionsByStatus: { status: string; count: number }[];
  topSellers: { name: string; revenue: number }[];
  conversionRate: number;
}

const COLORS = ['hsl(192, 91%, 55%)', 'hsl(142, 71%, 45%)', 'hsl(43, 96%, 56%)', 'hsl(0, 84%, 60%)'];

export default function AdminAnalytics() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("30");
  const { toast } = useToast();
  const navigate = useNavigate();
  const { isAdmin, loading: roleLoading } = useUserRole();

  useEffect(() => {
    if (!roleLoading && !isAdmin) {
      toast({
        title: "Acesso negado",
        description: "Você não tem permissão para acessar esta página",
        variant: "destructive"
      });
      navigate("/dashboard");
    }
  }, [isAdmin, roleLoading, navigate, toast]);

  useEffect(() => {
    if (isAdmin) {
      fetchAnalytics();
    }
  }, [isAdmin, period]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const days = parseInt(period);
      const startDate = startOfDay(subDays(new Date(), days));

      // Fetch transactions
      const { data: transactions, error: transactionsError } = await supabase
        .from("transactions")
        .select("*")
        .gte("created_at", startDate.toISOString());

      if (transactionsError) throw transactionsError;

      // Fetch profiles
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name");

      // Fetch products
      const { data: products } = await supabase
        .from("products")
        .select("*");

      // Fetch pix charges for conversion rate
      const { data: charges } = await supabase
        .from("pix_charges")
        .select("status")
        .gte("created_at", startDate.toISOString());

      // Calculate metrics
      const totalRevenue = transactions?.reduce((sum, t) => sum + Number(t.amount || 0), 0) || 0;
      const totalFees = transactions?.reduce((sum, t) => sum + Number(t.platform_fee || 0), 0) || 0;
      const totalTransactions = transactions?.length || 0;
      const avgTransactionValue = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;

      // Revenue by day
      const revenueByDayMap = new Map<string, { revenue: number; fees: number }>();
      for (let i = days; i >= 0; i--) {
        const date = format(subDays(new Date(), i), "dd/MM");
        revenueByDayMap.set(date, { revenue: 0, fees: 0 });
      }

      transactions?.forEach((t) => {
        const date = format(new Date(t.created_at), "dd/MM");
        if (revenueByDayMap.has(date)) {
          const current = revenueByDayMap.get(date)!;
          current.revenue += Number(t.amount || 0);
          current.fees += Number(t.platform_fee || 0);
        }
      });

      const revenueByDay = Array.from(revenueByDayMap.entries()).map(([date, data]) => ({
        date,
        revenue: data.revenue,
        fees: data.fees
      }));

      // Transactions by status
      const statusCount = new Map<string, number>();
      transactions?.forEach((t) => {
        statusCount.set(t.status, (statusCount.get(t.status) || 0) + 1);
      });
      const transactionsByStatus = Array.from(statusCount.entries()).map(([status, count]) => ({
        status: status === 'paid' ? 'Pago' : status === 'pending' ? 'Pendente' : status === 'expired' ? 'Expirado' : 'Cancelado',
        count
      }));

      // Top sellers
      const sellerRevenue = new Map<string, number>();
      transactions?.forEach((t) => {
        if (t.seller_id) {
          sellerRevenue.set(t.seller_id, (sellerRevenue.get(t.seller_id) || 0) + Number(t.amount || 0));
        }
      });
      const topSellers = Array.from(sellerRevenue.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([sellerId, revenue]) => ({
          name: profiles?.find((p) => p.user_id === sellerId)?.full_name || "Desconhecido",
          revenue
        }));

      // Conversion rate
      const totalCharges = charges?.length || 0;
      const paidCharges = charges?.filter((c) => c.status === 'paid').length || 0;
      const conversionRate = totalCharges > 0 ? (paidCharges / totalCharges) * 100 : 0;

      setData({
        totalRevenue,
        totalFees,
        totalTransactions,
        totalSellers: profiles?.length || 0,
        totalProducts: products?.filter((p) => p.status === 'active').length || 0,
        avgTransactionValue,
        revenueByDay,
        transactionsByStatus,
        topSellers,
        conversionRate
      });
    } catch (error) {
      console.error("Error fetching analytics:", error);
      toast({
        title: "Erro",
        description: "Falha ao carregar analytics",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

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

  if (!isAdmin || !data) {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Analytics</h1>
            <p className="text-muted-foreground">
              Métricas e desempenho da plataforma
            </p>
          </div>
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-48">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Últimos 7 dias</SelectItem>
              <SelectItem value="30">Últimos 30 dias</SelectItem>
              <SelectItem value="90">Últimos 90 dias</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Key Metrics */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(data.totalRevenue)}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Nos últimos {period} dias
              </p>
            </CardContent>
          </Card>

          <Card className="glass-card border-primary/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Taxas da Plataforma</CardTitle>
              <TrendingUp className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{formatCurrency(data.totalFees)}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Seu lucro no período
              </p>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Taxa de Conversão</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.conversionRate.toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground mt-1">
                Checkouts pagos vs gerados
              </p>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Ticket Médio</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(data.avgTransactionValue)}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Valor médio por venda
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Revenue Chart */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Receita e Taxas</CardTitle>
              <CardDescription>Evolução diária do faturamento</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data.revenueByDay}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(217, 33%, 17%)" />
                    <XAxis 
                      dataKey="date" 
                      stroke="hsl(215, 20%, 55%)" 
                      fontSize={12}
                    />
                    <YAxis 
                      stroke="hsl(215, 20%, 55%)" 
                      fontSize={12}
                      tickFormatter={(value) => `R$${(value / 1000).toFixed(0)}k`}
                    />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'hsl(222, 47%, 8%)',
                        border: '1px solid hsl(217, 33%, 17%)',
                        borderRadius: '8px'
                      }}
                      formatter={(value: number) => [formatCurrency(value)]}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="revenue" 
                      stroke="hsl(192, 91%, 55%)" 
                      strokeWidth={2}
                      name="Receita"
                      dot={false}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="fees" 
                      stroke="hsl(142, 71%, 45%)" 
                      strokeWidth={2}
                      name="Taxas"
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Status Distribution */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Status das Transações</CardTitle>
              <CardDescription>Distribuição por status</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.transactionsByStatus}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      fill="#8884d8"
                      paddingAngle={5}
                      dataKey="count"
                      label={({ status, count }) => `${status}: ${count}`}
                    >
                      {data.transactionsByStatus.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'hsl(222, 47%, 8%)',
                        border: '1px solid hsl(217, 33%, 17%)',
                        borderRadius: '8px'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Top Sellers */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Top Vendedores</CardTitle>
            <CardDescription>Maiores faturamentos no período</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.topSellers} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(217, 33%, 17%)" />
                  <XAxis 
                    type="number" 
                    stroke="hsl(215, 20%, 55%)" 
                    fontSize={12}
                    tickFormatter={(value) => `R$${(value / 1000).toFixed(0)}k`}
                  />
                  <YAxis 
                    type="category" 
                    dataKey="name" 
                    stroke="hsl(215, 20%, 55%)" 
                    fontSize={12}
                    width={120}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'hsl(222, 47%, 8%)',
                      border: '1px solid hsl(217, 33%, 17%)',
                      borderRadius: '8px'
                    }}
                    formatter={(value: number) => [formatCurrency(value), "Receita"]}
                  />
                  <Bar dataKey="revenue" fill="hsl(192, 91%, 55%)" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="glass-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Users className="h-4 w-4" />
                Total de Vendedores
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{data.totalSellers}</div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Package className="h-4 w-4" />
                Produtos Ativos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{data.totalProducts}</div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <ShoppingCart className="h-4 w-4" />
                Total de Transações
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{data.totalTransactions}</div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
