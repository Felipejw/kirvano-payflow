import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  DollarSign, 
  ShoppingCart,
  Radio,
  RefreshCw,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  Clock,
  Trophy
} from "lucide-react";
import { useAppNavigate } from "@/lib/routes";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useAdminStats } from "@/hooks/useAdminStats";

export default function AdminReceita() {
  const {
    stats,
    feesChartData,
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
            <h1 className="text-3xl font-bold">💰 Receita</h1>
            <p className="text-muted-foreground">
              Taxas, lucros e fluxo de caixa da plataforma
            </p>
          </div>
          <div className="flex gap-2 items-center">
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
        </div>

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className={`h-2 w-2 rounded-full ${isLive ? "bg-green-500 animate-pulse" : "bg-muted"}`}></span>
          Última atualização: {format(lastUpdate, "HH:mm:ss", { locale: ptBR })}
        </div>

        {/* Alerts */}
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

        {/* Featured Card - SEU LUCRO */}
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

        {/* Quick Actions */}
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate("admin/invoices")}>
            Ver todas as faturas
          </Button>
          <Button variant="outline" onClick={() => navigate("admin/withdrawals")}>
            Gerenciar saques
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
}
