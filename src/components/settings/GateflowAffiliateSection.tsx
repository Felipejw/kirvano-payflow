import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  DollarSign, 
  Link as LinkIcon, 
  Copy, 
  ExternalLink,
  TrendingUp,
  Users,
  Loader2,
  Wallet
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface GateflowProduct {
  id: string;
  name: string;
  description: string | null;
  price: number;
  reseller_commission: number;
  checkout_url: string | null;
  cover_url: string | null;
  status: string;
}

interface GateflowSalesStats {
  totalSales: number;
  totalCommission: number;
  pendingCommission: number;
  paidCommission: number;
}

export const GateflowAffiliateSection = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [product, setProduct] = useState<GateflowProduct | null>(null);
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [stats, setStats] = useState<GateflowSalesStats>({
    totalSales: 0,
    totalCommission: 0,
    pendingCommission: 0,
    paidCommission: 0,
  });

  useEffect(() => {
    fetchData();
  }, [user]);

  const fetchData = async () => {
    if (!user) return;

    try {
      // Get tenant ID
      const { data: tenant } = await supabase
        .from("tenants")
        .select("id")
        .eq("admin_user_id", user.id)
        .maybeSingle();

      if (tenant) {
        setTenantId(tenant.id);
      }

      // Get GateFlow product
      const { data: productData } = await supabase
        .from("gateflow_product")
        .select("*")
        .eq("status", "active")
        .maybeSingle();

      if (productData) {
        setProduct(productData as GateflowProduct);
      }

      // Get sales stats if tenant exists
      if (tenant) {
        const { data: salesData } = await supabase
          .from("gateflow_sales")
          .select("*")
          .eq("reseller_tenant_id", tenant.id);

        if (salesData) {
          const totalSales = salesData.length;
          const totalCommission = salesData.reduce((acc, sale) => acc + Number(sale.commission_amount), 0);
          const pendingCommission = salesData
            .filter(sale => sale.status === "pending")
            .reduce((acc, sale) => acc + Number(sale.commission_amount), 0);
          const paidCommission = salesData
            .filter(sale => sale.status === "paid" || sale.status === "completed")
            .reduce((acc, sale) => acc + Number(sale.commission_amount), 0);

          setStats({ totalSales, totalCommission, pendingCommission, paidCommission });
        }
      }
    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
    }
  };

  const affiliateLink = tenantId 
    ? `https://gatteflow.store/comprar?ref=${tenantId}`
    : null;

  const copyLink = () => {
    if (affiliateLink) {
      navigator.clipboard.writeText(affiliateLink);
      toast.success("Link copiado!");
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!product) {
    return (
      <Card variant="glass">
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">
            O programa de afiliados do GateFlow não está disponível no momento.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Product Info */}
      <Card variant="glass">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-primary" />
            Revender GateFlow
          </CardTitle>
          <CardDescription>
            Ganhe {product.reseller_commission}% de comissão em cada venda do sistema GateFlow
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-6">
            {product.cover_url && (
              <img 
                src={product.cover_url} 
                alt={product.name || "GateFlow"} 
                className="w-full md:w-48 h-32 object-cover rounded-lg"
              />
            )}
            <div className="flex-1 space-y-4">
              <div>
                <h3 className="text-xl font-semibold">{product.name}</h3>
                {product.description && (
                  <p className="text-muted-foreground mt-1">{product.description}</p>
                )}
              </div>
              
              <div className="flex flex-wrap gap-3">
                <Badge variant="outline" className="text-lg px-4 py-1">
                  {formatCurrency(product.price)}
                </Badge>
                <Badge className="bg-green-500/10 text-green-500 border-green-500/20 text-lg px-4 py-1">
                  Comissão: {product.reseller_commission}%
                </Badge>
                <Badge variant="secondary" className="text-lg px-4 py-1">
                  Ganhe: {formatCurrency(product.price * (product.reseller_commission / 100))} por venda
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Affiliate Link */}
      {affiliateLink ? (
        <Card variant="glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LinkIcon className="h-5 w-5 text-primary" />
              Seu Link de Afiliado
            </CardTitle>
            <CardDescription>
              Compartilhe este link para ganhar comissões nas vendas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input 
                value={affiliateLink} 
                readOnly 
                className="font-mono text-sm"
              />
              <Button onClick={copyLink} className="gap-2">
                <Copy className="h-4 w-4" />
                Copiar
              </Button>
              <Button 
                variant="outline" 
                asChild
              >
                <a href={affiliateLink} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4" />
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card variant="glass">
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">
              Configure suas informações de marca na aba "White Label" para gerar seu link de afiliado.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Sales Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card variant="glass">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total de Vendas</p>
                <p className="text-2xl font-bold">{stats.totalSales}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card variant="glass">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <TrendingUp className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total em Comissões</p>
                <p className="text-2xl font-bold">{formatCurrency(stats.totalCommission)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card variant="glass">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-yellow-500/10">
                <Wallet className="h-5 w-5 text-yellow-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pendente</p>
                <p className="text-2xl font-bold">{formatCurrency(stats.pendingCommission)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card variant="glass">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <DollarSign className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pago</p>
                <p className="text-2xl font-bold">{formatCurrency(stats.paidCommission)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
