import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Package, 
  Search, 
  Eye, 
  ArrowLeft,
  DollarSign,
  ShoppingCart,
  User,
  Calendar,
  Filter,
  Download
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAppNavigate } from "@/lib/routes";
import { useUserRole } from "@/hooks/useUserRole";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ProductWithSeller {
  id: string;
  name: string;
  price: number;
  status: string;
  type: string;
  created_at: string;
  seller_id: string;
  seller_name: string;
  seller_email: string;
  sales_count: number;
  total_revenue: number;
}

export default function AdminProducts() {
  const [products, setProducts] = useState<ProductWithSeller[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const { toast } = useToast();
  const navigate = useAppNavigate();
  const { isAdmin, loading: roleLoading } = useUserRole();

  useEffect(() => {
    if (!roleLoading && !isAdmin) {
      toast({
        title: "Acesso negado",
        description: "Você não tem permissão para acessar esta página",
        variant: "destructive"
      });
      navigate("dashboard");
    }
  }, [isAdmin, roleLoading, navigate, toast]);

  useEffect(() => {
    if (isAdmin) {
      fetchProducts();
    }
  }, [isAdmin]);

  const fetchProducts = async () => {
    try {
      // Fetch all products
      const { data: productsData, error: productsError } = await supabase
        .from("products")
        .select("*")
        .order("created_at", { ascending: false });

      if (productsError) throw productsError;

      // Fetch all profiles for seller info
      const sellerIds = [...new Set(productsData?.map(p => p.seller_id) || [])];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, email")
        .in("user_id", sellerIds);

      // Fetch all transactions for sales data
      const { data: transactions } = await supabase
        .from("transactions")
        .select("product_id, amount, status");

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);
      
      const productsWithData = productsData?.map(product => {
        const seller = profileMap.get(product.seller_id);
        const productTransactions = transactions?.filter(
          t => t.product_id === product.id && t.status === "paid"
        ) || [];
        
        return {
          id: product.id,
          name: product.name,
          price: Number(product.price),
          status: product.status,
          type: product.type,
          created_at: product.created_at,
          seller_id: product.seller_id,
          seller_name: seller?.full_name || "Sem nome",
          seller_email: seller?.email || "",
          sales_count: productTransactions.length,
          total_revenue: productTransactions.reduce((sum, t) => sum + Number(t.amount || 0), 0),
        };
      }) || [];

      setProducts(productsWithData);
    } catch (error) {
      console.error("Error fetching products:", error);
      toast({
        title: "Erro",
        description: "Falha ao carregar produtos",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = 
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.seller_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.seller_email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || product.status === statusFilter;
    const matchesType = typeFilter === "all" || product.type === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL"
    }).format(value);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-500/20 text-green-500">Ativo</Badge>;
      case "inactive":
        return <Badge variant="secondary">Inativo</Badge>;
      case "draft":
        return <Badge variant="outline">Rascunho</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "digital":
        return <Badge variant="outline" className="border-blue-500/50 text-blue-500">Digital</Badge>;
      case "physical":
        return <Badge variant="outline" className="border-orange-500/50 text-orange-500">Físico</Badge>;
      case "members":
        return <Badge variant="outline" className="border-purple-500/50 text-purple-500">Membros</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  // Stats
  const totalProducts = products.length;
  const activeProducts = products.filter(p => p.status === "active").length;
  const totalRevenue = products.reduce((sum, p) => sum + p.total_revenue, 0);
  const totalSales = products.reduce((sum, p) => sum + p.sales_count, 0);

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
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("admin")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Todos os Produtos</h1>
            <p className="text-muted-foreground">
              Visualize todos os produtos de todos os vendedores
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total de Produtos</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalProducts}</div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Produtos Ativos</CardTitle>
              <Package className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-500">{activeProducts}</div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Vendas Totais</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalSales}</div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(totalRevenue)}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="glass-card">
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <CardTitle>Lista de Produtos</CardTitle>
                <CardDescription>
                  {filteredProducts.length} produtos encontrados
                </CardDescription>
              </div>
              <div className="flex flex-col md:flex-row gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Buscar produto ou vendedor..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 w-full md:w-64"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full md:w-32">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="active">Ativos</SelectItem>
                    <SelectItem value="inactive">Inativos</SelectItem>
                    <SelectItem value="draft">Rascunhos</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-full md:w-32">
                    <SelectValue placeholder="Tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="digital">Digital</SelectItem>
                    <SelectItem value="physical">Físico</SelectItem>
                    <SelectItem value="members">Membros</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="p-3 text-left font-medium">Produto</th>
                    <th className="p-3 text-left font-medium">Vendedor</th>
                    <th className="p-3 text-left font-medium">Preço</th>
                    <th className="p-3 text-left font-medium">Tipo</th>
                    <th className="p-3 text-left font-medium">Status</th>
                    <th className="p-3 text-left font-medium">Vendas</th>
                    <th className="p-3 text-left font-medium">Receita</th>
                    <th className="p-3 text-left font-medium">Criado</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-muted-foreground">
                        Nenhum produto encontrado
                      </td>
                    </tr>
                  ) : (
                    filteredProducts.map((product) => (
                      <tr key={product.id} className="border-b hover:bg-muted/30">
                        <td className="p-3">
                          <p className="font-medium">{product.name}</p>
                        </td>
                        <td className="p-3">
                          <div>
                            <p className="text-sm">{product.seller_name}</p>
                            <p className="text-xs text-muted-foreground">{product.seller_email}</p>
                          </div>
                        </td>
                        <td className="p-3 font-medium">{formatCurrency(product.price)}</td>
                        <td className="p-3">{getTypeBadge(product.type)}</td>
                        <td className="p-3">{getStatusBadge(product.status)}</td>
                        <td className="p-3">
                          <Badge variant="outline">{product.sales_count}</Badge>
                        </td>
                        <td className="p-3 font-medium text-green-500">
                          {formatCurrency(product.total_revenue)}
                        </td>
                        <td className="p-3 text-muted-foreground text-sm">
                          {format(new Date(product.created_at), "dd/MM/yyyy", { locale: ptBR })}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
