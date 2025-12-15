import { useState, useEffect, useCallback } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
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
  RefreshCw
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { useUserRole } from "@/hooks/useUserRole";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AdminTransactions } from "@/components/admin/AdminTransactions";

interface SellerData {
  user_id: string;
  email: string;
  full_name: string;
  created_at: string;
  total_sales: number;
  total_revenue: number;
  products_count: number;
}

interface AdminStats {
  totalSellers: number;
  totalRevenue: number;
  totalTransactions: number;
  platformFees: number;
  pendingWithdrawals: number;
  activeProducts: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats>({
    totalSellers: 0,
    totalRevenue: 0,
    totalTransactions: 0,
    platformFees: 0,
    pendingWithdrawals: 0,
    activeProducts: 0
  });
  const [sellers, setSellers] = useState<SellerData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [isLive, setIsLive] = useState(true);
  const [newTransactionAlert, setNewTransactionAlert] = useState(false);
  const [newWithdrawalAlert, setNewWithdrawalAlert] = useState(false);
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

      const paidTransactions = transactions?.filter(t => t.status === 'paid') || [];
      const totalRevenue = paidTransactions.reduce((sum, t) => sum + Number(t.amount || 0), 0);
      const platformFees = paidTransactions.reduce((sum, t) => sum + Number(t.platform_fee || 0), 0);
      const pendingWithdrawalsAmount = withdrawals?.reduce((sum, w) => sum + Number(w.amount || 0), 0) || 0;

      setStats({
        totalSellers: profiles?.length || 0,
        totalRevenue,
        totalTransactions: paidTransactions.length,
        platformFees,
        pendingWithdrawals: pendingWithdrawalsAmount,
        activeProducts: products?.filter(p => p.status === "active").length || 0
      });

      const sellerMap = new Map<string, SellerData>();
      
      profiles?.forEach(profile => {
        sellerMap.set(profile.user_id, {
          user_id: profile.user_id,
          email: profile.email || "",
          full_name: profile.full_name || "Sem nome",
          created_at: profile.created_at,
          total_sales: 0,
          total_revenue: 0,
          products_count: 0
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
              Visão geral da plataforma
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
            <Button variant="outline" onClick={() => navigate("/admin/users")}>
              <UserCog className="mr-2 h-4 w-4" />
              Usuários
            </Button>
            <Button variant="outline" onClick={() => navigate("/admin/settings")}>
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

        {/* Featured Card - Platform Earnings */}
        <Card className="glass-card border-primary/50 bg-gradient-to-r from-primary/10 to-primary/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Seu Lucro com Taxas
            </CardTitle>
            <CardDescription>
              Total acumulado de taxas da plataforma
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-4">
              <span className="text-4xl font-bold text-primary">{formatCurrency(stats.platformFees)}</span>
              <span className="text-muted-foreground">
                de {formatCurrency(stats.totalRevenue)} em vendas totais
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Vendedores</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalSellers}</div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</div>
            </CardContent>
          </Card>

          <Card className={`glass-card transition-all duration-300 ${newTransactionAlert ? "ring-2 ring-primary animate-pulse" : ""}`}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Transações</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalTransactions}</div>
              {newTransactionAlert && (
                <Badge className="mt-2 bg-primary animate-bounce">Nova!</Badge>
              )}
            </CardContent>
          </Card>

          <Card className={`glass-card transition-all duration-300 ${newWithdrawalAlert ? "ring-2 ring-yellow-500 animate-pulse" : ""}`}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Saques Pendentes</CardTitle>
              <DollarSign className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-500">{formatCurrency(stats.pendingWithdrawals)}</div>
              {newWithdrawalAlert && (
                <Badge className="mt-2 bg-yellow-500 animate-bounce">Novo!</Badge>
              )}
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Produtos Ativos</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeProducts}</div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="sellers" className="space-y-4">
          <TabsList>
            <TabsTrigger value="sellers">Vendedores</TabsTrigger>
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
                          <td colSpan={6} className="p-8 text-center text-muted-foreground">
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