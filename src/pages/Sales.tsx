import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Search, 
  Filter,
  Download,
  Clock,
  CheckCircle,
  XCircle,
  TrendingUp,
  DollarSign,
  ShoppingCart,
  AlertCircle
} from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Sale {
  id: string;
  amount: number;
  status: string;
  buyer_email: string;
  buyer_name: string | null;
  created_at: string;
  paid_at: string | null;
  product: {
    name: string;
    id: string;
  } | null;
}

const statusConfig = {
  pending: { 
    label: "Pendente", 
    variant: "warning" as const, 
    icon: Clock,
    color: "text-yellow-500"
  },
  paid: { 
    label: "Pago", 
    variant: "success" as const, 
    icon: CheckCircle,
    color: "text-green-500"
  },
  expired: { 
    label: "Expirado", 
    variant: "secondary" as const, 
    icon: XCircle,
    color: "text-muted-foreground"
  },
  cancelled: { 
    label: "Cancelado", 
    variant: "destructive" as const, 
    icon: XCircle,
    color: "text-destructive"
  },
};

const Sales = () => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchSales();
  }, []);

  const fetchSales = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('pix_charges')
      .select(`
        id,
        amount,
        status,
        buyer_email,
        buyer_name,
        created_at,
        paid_at,
        products:product_id (
          id,
          name
        )
      `)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setSales(data.map(item => ({
        ...item,
        product: item.products as { id: string; name: string } | null
      })));
    }
    setLoading(false);
  };

  const filteredSales = sales.filter(sale => {
    const matchesSearch = 
      sale.buyer_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sale.buyer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sale.product?.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (activeTab === "all") return matchesSearch;
    return matchesSearch && sale.status === activeTab;
  });

  const stats = {
    total: sales.length,
    pending: sales.filter(s => s.status === 'pending').length,
    paid: sales.filter(s => s.status === 'paid').length,
    cancelled: sales.filter(s => s.status === 'expired' || s.status === 'cancelled').length,
    totalValue: sales.filter(s => s.status === 'paid').reduce((acc, s) => acc + Number(s.amount), 0),
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Vendas</h1>
            <p className="text-muted-foreground">Acompanhe todas as suas vendas</p>
          </div>
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Exportar
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card variant="glass">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <ShoppingCart className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Vendas</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card variant="glass">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-yellow-500/10">
                  <Clock className="h-5 w-5 text-yellow-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Pendentes</p>
                  <p className="text-2xl font-bold">{stats.pending}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card variant="glass">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-500/10">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Pagas</p>
                  <p className="text-2xl font-bold">{stats.paid}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card variant="glass">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <DollarSign className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Recebido</p>
                  <p className="text-2xl font-bold">
                    R$ {stats.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card variant="glass">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Buscar por email, nome ou produto..." 
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Button variant="outline" className="gap-2">
                <Filter className="h-4 w-4" />
                Filtros
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Sales Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-secondary/50">
            <TabsTrigger value="all">Todas ({stats.total})</TabsTrigger>
            <TabsTrigger value="pending">Pendentes ({stats.pending})</TabsTrigger>
            <TabsTrigger value="paid">Pagas ({stats.paid})</TabsTrigger>
            <TabsTrigger value="expired">Expiradas ({stats.cancelled})</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-4">
            <Card variant="glass">
              <CardContent className="p-0">
                {loading ? (
                  <div className="p-8 text-center text-muted-foreground">
                    Carregando vendas...
                  </div>
                ) : filteredSales.length === 0 ? (
                  <div className="p-8 text-center">
                    <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">Nenhuma venda encontrada</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left p-4 font-medium text-muted-foreground">Cliente</th>
                          <th className="text-left p-4 font-medium text-muted-foreground">Produto</th>
                          <th className="text-left p-4 font-medium text-muted-foreground">Valor</th>
                          <th className="text-left p-4 font-medium text-muted-foreground">Status</th>
                          <th className="text-left p-4 font-medium text-muted-foreground">Data</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredSales.map((sale) => {
                          const status = statusConfig[sale.status as keyof typeof statusConfig] || statusConfig.pending;
                          const StatusIcon = status.icon;
                          
                          return (
                            <tr key={sale.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                              <td className="p-4">
                                <div>
                                  <p className="font-medium">{sale.buyer_name || "Cliente"}</p>
                                  <p className="text-sm text-muted-foreground">{sale.buyer_email}</p>
                                </div>
                              </td>
                              <td className="p-4">
                                <p className="text-sm">{sale.product?.name || "Produto removido"}</p>
                              </td>
                              <td className="p-4">
                                <p className="font-semibold">
                                  R$ {Number(sale.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </p>
                              </td>
                              <td className="p-4">
                                <Badge variant={status.variant} className="gap-1">
                                  <StatusIcon className="h-3 w-3" />
                                  {status.label}
                                </Badge>
                              </td>
                              <td className="p-4">
                                <p className="text-sm text-muted-foreground">
                                  {format(new Date(sale.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                                </p>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default Sales;
