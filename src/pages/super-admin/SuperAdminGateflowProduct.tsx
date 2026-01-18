import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Package, DollarSign, Percent, Link, Save } from "lucide-react";

interface GateflowProduct {
  id: string;
  name: string;
  description: string | null;
  price: number;
  reseller_commission: number;
  checkout_url: string | null;
  cover_url: string | null;
  sales_page_url: string | null;
  status: string;
}

const SuperAdminGateflowProduct = () => {
  const navigate = useNavigate();
  const { isSuperAdmin, loading: roleLoading } = useUserRole();
  const [product, setProduct] = useState<GateflowProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!roleLoading && !isSuperAdmin) {
      navigate("/dashboard");
      return;
    }
    if (isSuperAdmin) {
      fetchProduct();
    }
  }, [isSuperAdmin, roleLoading, navigate]);

  const fetchProduct = async () => {
    try {
      const { data, error } = await supabase
        .from("gateflow_product")
        .select("*")
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      setProduct(data);
    } catch (error) {
      console.error("Error fetching product:", error);
      toast.error("Erro ao carregar produto");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!product) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from("gateflow_product")
        .update({
          name: product.name,
          description: product.description,
          price: product.price,
          reseller_commission: product.reseller_commission,
          checkout_url: product.checkout_url,
          cover_url: product.cover_url,
          sales_page_url: product.sales_page_url,
          status: product.status,
        })
        .eq("id", product.id);

      if (error) throw error;
      toast.success("Produto atualizado com sucesso!");
    } catch (error) {
      console.error("Error saving product:", error);
      toast.error("Erro ao salvar produto");
    } finally {
      setSaving(false);
    }
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

  if (!product) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Produto não encontrado</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Produto GateFlow</h1>
            <p className="text-muted-foreground">Configure o produto para revenda pelos Admins</p>
          </div>
          <Button onClick={handleSave} disabled={saving}>
            <Save className="mr-2 h-4 w-4" />
            {saving ? "Salvando..." : "Salvar Alterações"}
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Informações do Produto
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="name">Nome do Produto</Label>
                <Input
                  id="name"
                  value={product.name}
                  onChange={(e) => setProduct({ ...product, name: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={product.description || ""}
                  onChange={(e) => setProduct({ ...product, description: e.target.value })}
                  rows={4}
                />
              </div>
              <div>
                <Label htmlFor="cover_url">URL da Capa</Label>
                <Input
                  id="cover_url"
                  value={product.cover_url || ""}
                  onChange={(e) => setProduct({ ...product, cover_url: e.target.value })}
                  placeholder="https://..."
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Status do Produto</Label>
                  <p className="text-sm text-muted-foreground">
                    Produto {product.status === "active" ? "ativo" : "inativo"} para revenda
                  </p>
                </div>
                <Switch
                  checked={product.status === "active"}
                  onCheckedChange={(checked) => 
                    setProduct({ ...product, status: checked ? "active" : "inactive" })
                  }
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Preço e Comissão
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="price">Preço de Venda (R$)</Label>
                <Input
                  id="price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={product.price}
                  onChange={(e) => setProduct({ ...product, price: Number(e.target.value) })}
                />
              </div>
              <div>
                <Label htmlFor="commission">Comissão do Afiliado (%)</Label>
                <Input
                  id="commission"
                  type="number"
                  min="0"
                  max="100"
                  value={product.reseller_commission}
                  onChange={(e) => setProduct({ ...product, reseller_commission: Number(e.target.value) })}
                />
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm font-medium">Cálculo de Comissão</p>
                <div className="mt-2 space-y-1 text-sm">
                  <p>Preço: R$ {product.price.toFixed(2)}</p>
                  <p>Comissão ({product.reseller_commission}%): R$ {(product.price * product.reseller_commission / 100).toFixed(2)}</p>
                  <p className="font-medium">Você recebe: R$ {(product.price * (100 - product.reseller_commission) / 100).toFixed(2)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Link className="h-5 w-5" />
                Links
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="checkout_url">URL do Checkout</Label>
                <Input
                  id="checkout_url"
                  value={product.checkout_url || ""}
                  onChange={(e) => setProduct({ ...product, checkout_url: e.target.value })}
                  placeholder="https://..."
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Link do checkout para compra do GateFlow (pode incluir ?ref= para tracking)
                </p>
              </div>
              <div>
                <Label htmlFor="sales_page_url">URL da Página de Vendas</Label>
                <Input
                  id="sales_page_url"
                  value={product.sales_page_url || ""}
                  onChange={(e) => setProduct({ ...product, sales_page_url: e.target.value })}
                  placeholder="https://..."
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Link da página de vendas/VSL do produto
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default SuperAdminGateflowProduct;
