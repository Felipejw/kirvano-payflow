import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { RecentTransactions } from "@/components/dashboard/RecentTransactions";
import { SalesChart } from "@/components/dashboard/SalesChart";
import { TopProducts } from "@/components/dashboard/TopProducts";
import { 
  DollarSign, 
  TrendingUp, 
  Users, 
  CreditCard,
  QrCode,
  ArrowUpRight
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const Dashboard = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground">Visão geral do seu negócio</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" className="gap-2">
              <QrCode className="h-4 w-4" />
              Gerar PIX
            </Button>
            <Button variant="gradient" className="gap-2">
              <ArrowUpRight className="h-4 w-4" />
              Novo Produto
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            title="Receita Total"
            value="R$ 256.815,00"
            change="+12.5% este mês"
            changeType="positive"
            icon={DollarSign}
            iconColor="text-accent"
          />
          <StatsCard
            title="Transações PIX"
            value="1.234"
            change="+8% este mês"
            changeType="positive"
            icon={CreditCard}
            iconColor="text-primary"
          />
          <StatsCard
            title="Afiliados Ativos"
            value="89"
            change="+3 novos"
            changeType="positive"
            icon={Users}
            iconColor="text-purple-400"
          />
          <StatsCard
            title="Taxa de Conversão"
            value="4.2%"
            change="-0.3% esta semana"
            changeType="negative"
            icon={TrendingUp}
            iconColor="text-yellow-400"
          />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <SalesChart />
          <TopProducts />
        </div>

        {/* Recent Transactions */}
        <RecentTransactions />

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card variant="glass" className="group hover:border-primary/30 transition-all cursor-pointer">
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

          <Card variant="glass" className="group hover:border-accent/30 transition-all cursor-pointer">
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

          <Card variant="glass" className="group hover:border-yellow-400/30 transition-all cursor-pointer">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-4 rounded-xl bg-yellow-400/10 group-hover:scale-110 transition-transform">
                <TrendingUp className="h-8 w-8 text-yellow-400" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Relatórios</h3>
                <p className="text-sm text-muted-foreground">Análises detalhadas</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
