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
import { 
  DollarSign, 
  TrendingUp, 
  Users, 
  CreditCard,
  QrCode,
  ArrowUpRight,
  Wallet,
  ShoppingCart,
  Eye,
  Percent
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Dashboard = () => {
  const [user, setUser] = useState<any>(null);
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
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

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
            <Button variant="outline" className="gap-2">
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
            value="R$ 256.815,00"
            change="+12.5% este mês"
            changeType="positive"
            icon={DollarSign}
            iconColor="text-accent"
          />
          <StatsCard
            title="Vendas"
            value="1.234"
            change="+8% este mês"
            changeType="positive"
            icon={ShoppingCart}
            iconColor="text-primary"
          />
          <StatsCard
            title="Saldo Disponível"
            value="R$ 15.680,50"
            change="Disponível para saque"
            changeType="positive"
            icon={Wallet}
            iconColor="text-accent"
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

              <Card className="glass-card-hover group cursor-pointer">
                <CardContent className="p-6 flex items-center gap-4">
                  <div className="p-4 rounded-xl bg-yellow-400/10 group-hover:scale-110 transition-transform">
                    <Eye className="h-8 w-8 text-yellow-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Visualizações</h3>
                    <p className="text-sm text-muted-foreground">Analise seu tráfego</p>
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
    </DashboardLayout>
  );
};

export default Dashboard;
