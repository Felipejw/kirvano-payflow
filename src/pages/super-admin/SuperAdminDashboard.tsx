import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Building2, Users, Globe, DollarSign, TrendingUp, Package } from "lucide-react";
import { format, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";

const SuperAdminDashboard = () => {
  const navigate = useNavigate();
  const { isSuperAdmin, loading: roleLoading } = useUserRole();
  const [stats, setStats] = useState({
    totalClientes: 0,
    clientesAtivos: 0,
    comDominio: 0,
    vendasHoje: 0,
    receitaTotal: 0,
    totalProdutos: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!roleLoading && !isSuperAdmin) {
      navigate("/dashboard");
      return;
    }
    if (isSuperAdmin) {
      fetchStats();
    }
  }, [isSuperAdmin, roleLoading, navigate]);

  const fetchStats = async () => {
    try {
      // Buscar tenants
      const { data: tenants, error: tenantsError } = await supabase
        .from("tenants")
        .select("id, status, domain_verified");

      if (tenantsError) throw tenantsError;

      // Buscar vendas do GateFlow
      const { data: sales, error: salesError } = await supabase
        .from("gateflow_sales")
        .select("amount, created_at")
        .eq("status", "paid");

      if (salesError) throw salesError;

      const today = new Date().toISOString().split('T')[0];
      const vendasHoje = sales?.filter(s => s.created_at?.startsWith(today)).length || 0;
      const receitaTotal = sales?.reduce((acc, s) => acc + (s.amount || 0), 0) || 0;

      // Buscar produtos
      const { count: produtosCount } = await supabase
        .from("products")
        .select("id", { count: "exact", head: true });

      setStats({
        totalClientes: tenants?.length || 0,
        clientesAtivos: tenants?.filter(t => t.status === "active").length || 0,
        comDominio: tenants?.filter(t => t.domain_verified).length || 0,
        vendasHoje,
        receitaTotal,
        totalProdutos: produtosCount || 0,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  if (roleLoading || loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard Super Admin</h1>
          <p className="text-muted-foreground">Visão geral da plataforma</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Clientes</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalClientes}</div>
              <p className="text-xs text-muted-foreground">Instâncias cadastradas</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Clientes Ativos</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.clientesAtivos}</div>
              <p className="text-xs text-muted-foreground">Com status ativo</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Com Domínio</CardTitle>
              <Globe className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.comDominio}</div>
              <p className="text-xs text-muted-foreground">Domínio verificado</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Vendas Hoje</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.vendasHoje}</div>
              <p className="text-xs text-muted-foreground">Vendas GateFlow</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(stats.receitaTotal)}</div>
              <p className="text-xs text-muted-foreground">Vendas GateFlow pagas</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Produtos</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalProdutos}</div>
              <p className="text-xs text-muted-foreground">Em toda plataforma</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default SuperAdminDashboard;
