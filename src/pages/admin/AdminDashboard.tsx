import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  Users, 
  DollarSign, 
  ShoppingCart, 
  TrendingUp,
  Settings,
  UserCog,
  Radio,
  RefreshCw,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  Trophy,
  BarChart3,
  ArrowRight
} from "lucide-react";
import { useAppNavigate } from "@/lib/routes";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useAdminStats } from "@/hooks/useAdminStats";

export default function AdminDashboard() {
  const {
    stats,
    topProducts,
    topSellers,
    loading,
    lastUpdate,
    isLive,
    setIsLive,
    isAdmin,
    roleLoading,
    fetchAdminData,
    formatCurrency
  } = useAdminStats();

  const navigate = useAppNavigate();

  if (roleLoading || loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!isAdmin) return null;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Painel Administrativo</h1>
            <p className="text-muted-foreground">
              Visão geral da plataforma
            </p>
          </div>
          <div className="flex gap-2 items-center">
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

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className={`h-2 w-2 rounded-full ${isLive ? "bg-green-500 animate-pulse" : "bg-muted"}`}></span>
          Última atualização: {format(lastUpdate, "HH:mm:ss", { locale: ptBR })}
        </div>

        {/* Alerts */}
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

        {/* Quick Stats Overview */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {/* Main Revenue Card */}
          <Card 
            className="glass-card border-2 border-primary/50 cursor-pointer hover:border-primary transition-colors"
            onClick={() => navigate("admin/receita")}
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">💰 Seu Lucro</CardTitle>
              <DollarSign className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{formatCurrency(stats.platformFees)}</div>
              <div className="flex items-center gap-2 mt-1">
                {stats.monthlyGrowth !== 0 && (
                  <Badge variant={stats.monthlyGrowth > 0 ? "default" : "destructive"} className="text-xs">
                    {stats.monthlyGrowth > 0 ? <ArrowUpRight className="h-3 w-3 mr-1" /> : <ArrowDownRight className="h-3 w-3 mr-1" />}
                    {Math.abs(stats.monthlyGrowth).toFixed(1)}%
                  </Badge>
                )}
                <span className="text-xs text-muted-foreground">este mês</span>
              </div>
              <Button variant="link" className="p-0 h-auto mt-2 text-xs">
                Ver detalhes <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            </CardContent>
          </Card>

          {/* Sales Card */}
          <Card 
            className="glass-card cursor-pointer hover:border-primary/50 transition-colors"
            onClick={() => navigate("admin/vendas")}
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">📈 Vendas</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalTransactions}</div>
              <p className="text-xs text-muted-foreground">
                {formatCurrency(stats.totalRevenue)} volume total
              </p>
              <Button variant="link" className="p-0 h-auto mt-2 text-xs">
                Ver métricas <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            </CardContent>
          </Card>

          {/* Top Seller Card */}
          <Card 
            className="glass-card cursor-pointer hover:border-primary/50 transition-colors"
            onClick={() => navigate("admin/rankings")}
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">🏆 Top Vendedor</CardTitle>
              <Trophy className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold truncate">
                {topSellers[0]?.full_name || '-'}
              </div>
              <p className="text-xs text-muted-foreground">
                {topSellers[0] ? formatCurrency(topSellers[0].totalRevenue) : '-'}
              </p>
              <Button variant="link" className="p-0 h-auto mt-2 text-xs">
                Ver rankings <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            </CardContent>
          </Card>

          {/* Users Card */}
          <Card 
            className="glass-card cursor-pointer hover:border-primary/50 transition-colors"
            onClick={() => navigate("admin/users")}
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">👥 Vendedores</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalSellers}</div>
              <p className="text-xs text-muted-foreground">
                {stats.platformGatewaySellers} na plataforma
              </p>
              <Button variant="link" className="p-0 h-auto mt-2 text-xs">
                Gerenciar <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Quick Navigation Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card 
            className="glass-card cursor-pointer hover:border-primary transition-all group"
            onClick={() => navigate("admin/receita")}
          >
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="bg-primary/10 p-3 rounded-lg group-hover:bg-primary/20 transition-colors">
                  <DollarSign className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">Receita & Lucro</h3>
                  <p className="text-sm text-muted-foreground">Taxas, custódia e faturas</p>
                </div>
                <ArrowRight className="h-5 w-5 ml-auto text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
            </CardContent>
          </Card>

          <Card 
            className="glass-card cursor-pointer hover:border-accent transition-all group"
            onClick={() => navigate("admin/vendas")}
          >
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="bg-accent/10 p-3 rounded-lg group-hover:bg-accent/20 transition-colors">
                  <BarChart3 className="h-6 w-6 text-accent" />
                </div>
                <div>
                  <h3 className="font-semibold">Métricas de Vendas</h3>
                  <p className="text-sm text-muted-foreground">Conversões e order bumps</p>
                </div>
                <ArrowRight className="h-5 w-5 ml-auto text-muted-foreground group-hover:text-accent transition-colors" />
              </div>
            </CardContent>
          </Card>

          <Card 
            className="glass-card cursor-pointer hover:border-yellow-500 transition-all group"
            onClick={() => navigate("admin/rankings")}
          >
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="bg-yellow-500/10 p-3 rounded-lg group-hover:bg-yellow-500/20 transition-colors">
                  <Trophy className="h-6 w-6 text-yellow-500" />
                </div>
                <div>
                  <h3 className="font-semibold">Rankings</h3>
                  <p className="text-sm text-muted-foreground">Top produtos e vendedores</p>
                </div>
                <ArrowRight className="h-5 w-5 ml-auto text-muted-foreground group-hover:text-yellow-500 transition-colors" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Taxa de Conversão</CardTitle>
              <TrendingUp className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{stats.conversionRate.toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground">pago/gerado</p>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Ticket Médio</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(stats.averageTicket)}</div>
              <p className="text-xs text-muted-foreground">por venda</p>
            </CardContent>
          </Card>

          <Card className="glass-card border-yellow-500/30">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Custódia</CardTitle>
              <Wallet className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-500">{formatCurrency(stats.custodyBalance)}</div>
              <p className="text-xs text-muted-foreground">disponível</p>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Produtos Ativos</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeProducts}</div>
              <p className="text-xs text-muted-foreground">na plataforma</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
