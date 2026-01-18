import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
import { useAuth } from "@/hooks/useAuth";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { 
  DollarSign, 
  Clock, 
  CheckCircle2, 
  TrendingUp,
  Copy,
  ExternalLink,
  ShoppingCart
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface GateflowSale {
  id: string;
  buyer_name: string | null;
  buyer_email: string;
  buyer_phone: string | null;
  amount: number;
  commission_amount: number;
  status: string;
  commission_paid_at: string | null;
  created_at: string;
}

interface GateflowProduct {
  id: string;
  name: string;
  price: number;
  reseller_commission: number;
  checkout_url: string | null;
  sales_page_url: string | null;
  universal_access: boolean;
}

const AdminMinhasVendas = () => {
  const navigate = useNavigate();
  const { session } = useAuth();
  const { isAdmin, loading: roleLoading } = useUserRole();
  const [sales, setSales] = useState<GateflowSale[]>([]);
  const [product, setProduct] = useState<GateflowProduct | null>(null);
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!roleLoading && !isAdmin) {
      navigate("/dashboard");
      return;
    }
    if (isAdmin && session?.user?.id) {
      fetchData();
    }
  }, [isAdmin, roleLoading, navigate, session?.user?.id]);

  const fetchData = async () => {
    try {
      // Get user's tenant
      const { data: profile } = await supabase
        .from("profiles")
        .select("tenant_id")
        .eq("user_id", session?.user?.id)
        .single();

      if (!profile?.tenant_id) {
        setLoading(false);
        return;
      }

      setTenantId(profile.tenant_id);

      // Get GateFlow product
      const { data: productData } = await supabase
        .from("gateflow_product")
        .select("*")
        .single();

      if (productData) {
        setProduct({
          ...productData,
          universal_access: productData.universal_access ?? true
        });
      }

      // Get sales for this tenant
      const { data: salesData, error } = await supabase
        .from("gateflow_sales")
        .select("*")
        .eq("reseller_tenant_id", profile.tenant_id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setSales(salesData || []);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
  };

  const copyAffiliateLink = () => {
    if (product?.checkout_url && tenantId) {
      const affiliateUrl = `${product.checkout_url}${product.checkout_url.includes('?') ? '&' : '?'}ref=${tenantId}`;
      navigator.clipboard.writeText(affiliateUrl);
      toast.success("Link de afiliado copiado!");
    }
  };

  // Calculate stats
  const paidSales = sales.filter(s => s.status === "paid");
  const stats = {
    totalSales: paidSales.length,
    totalValue: paidSales.reduce((sum, s) => sum + s.amount, 0),
    pendingCommission: paidSales.filter(s => !s.commission_paid_at).reduce((sum, s) => sum + s.commission_amount, 0),
    paidCommission: paidSales.filter(s => s.commission_paid_at).reduce((sum, s) => sum + s.commission_amount, 0),
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Minhas Vendas & Comissões</h1>
            <p className="text-muted-foreground">Acompanhe suas vendas do produto GateFlow e comissões</p>
          </div>
        </div>

        {/* Product Info & Affiliate Link */}
        {product && product.universal_access && (
          <Card className="border-primary/50 bg-primary/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5 text-primary" />
                Produto: {product.name}
              </CardTitle>
              <CardDescription>
                Preço: {formatCurrency(product.price)} | Sua comissão: {product.reseller_commission}% ({formatCurrency(product.price * product.reseller_commission / 100)})
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button onClick={copyAffiliateLink} className="flex-1">
                  <Copy className="mr-2 h-4 w-4" />
                  Copiar Link de Afiliado
                </Button>
                {product.sales_page_url && (
                  <Button 
                    variant="outline" 
                    onClick={() => window.open(product.sales_page_url!, '_blank')}
                    className="flex-1"
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Ver Página de Vendas
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Vendas Realizadas</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalSales}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Valor Total Vendido</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(stats.totalValue)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Comissões Pendentes</CardTitle>
              <Clock className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-600">{formatCurrency(stats.pendingCommission)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Comissões Pagas</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{formatCurrency(stats.paidCommission)}</div>
            </CardContent>
          </Card>
        </div>

        {/* Sales Table */}
        <Card>
          <CardHeader>
            <CardTitle>Histórico de Vendas</CardTitle>
            <CardDescription>Todas as vendas realizadas através do seu link de afiliado</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Comprador</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead className="text-right">Comissão</TableHead>
                  <TableHead className="text-center">Status Venda</TableHead>
                  <TableHead className="text-center">Pagamento Comissão</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sales.map((sale) => (
                  <TableRow key={sale.id}>
                    <TableCell>
                      {format(new Date(sale.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{sale.buyer_name || "—"}</p>
                        <p className="text-sm text-muted-foreground">{sale.buyer_email}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(sale.amount)}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(sale.commission_amount)}
                    </TableCell>
                    <TableCell className="text-center">
                      {sale.status === "paid" ? (
                        <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                          Pago
                        </Badge>
                      ) : sale.status === "pending" ? (
                        <Badge variant="secondary">Pendente</Badge>
                      ) : (
                        <Badge variant="destructive">Cancelado</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {sale.status === "paid" ? (
                        sale.commission_paid_at ? (
                          <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Pago
                          </Badge>
                        ) : (
                          <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200">
                            <Clock className="h-3 w-3 mr-1" />
                            Pendente
                          </Badge>
                        )
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {sales.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      Nenhuma venda realizada ainda. Compartilhe seu link de afiliado para começar!
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default AdminMinhasVendas;