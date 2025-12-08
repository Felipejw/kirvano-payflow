import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { 
  Users, 
  TrendingUp, 
  DollarSign, 
  Link as LinkIcon, 
  Copy, 
  Check,
  Plus,
  ExternalLink
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface Affiliate {
  id: string;
  affiliate_code: string;
  commission_rate: number;
  total_sales: number;
  total_earnings: number;
  status: string;
  created_at: string;
  products: {
    id: string;
    name: string;
    price: number;
  };
}

interface Product {
  id: string;
  name: string;
  price: number;
  commission_rate: number;
}

const Affiliates = () => {
  const [affiliations, setAffiliations] = useState<Affiliate[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();

  const stats = {
    totalAffiliates: affiliations.length,
    totalSales: affiliations.reduce((sum, a) => sum + a.total_sales, 0),
    totalEarnings: affiliations.reduce((sum, a) => sum + Number(a.total_earnings), 0),
    avgCommission: affiliations.length > 0 
      ? affiliations.reduce((sum, a) => sum + (a.commission_rate || 10), 0) / affiliations.length 
      : 0,
  };

  useEffect(() => {
    fetchAffiliations();
    fetchProducts();
  }, []);

  const fetchAffiliations = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('affiliates')
      .select(`
        *,
        products (id, name, price)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      toast({
        title: "Erro ao carregar afiliações",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setAffiliations(data || []);
    }
    setLoading(false);
  };

  const fetchProducts = async () => {
    const { data, error } = await supabase
      .from('products')
      .select('id, name, price, commission_rate')
      .eq('status', 'active');

    if (!error && data) {
      setProducts(data);
    }
  };

  const generateAffiliateCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  const handleBecomeAffiliate = async () => {
    if (!selectedProduct) {
      toast({
        title: "Selecione um produto",
        description: "Escolha um produto para se afiliar.",
        variant: "destructive",
      });
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const product = products.find(p => p.id === selectedProduct);
    const affiliateCode = generateAffiliateCode();

    const { error } = await supabase
      .from('affiliates')
      .insert({
        user_id: user.id,
        product_id: selectedProduct,
        affiliate_code: affiliateCode,
        commission_rate: product?.commission_rate || 10,
      });

    if (error) {
      if (error.code === '23505') {
        toast({
          title: "Já afiliado",
          description: "Você já está afiliado a este produto.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Erro ao criar afiliação",
          description: error.message,
          variant: "destructive",
        });
      }
    } else {
      toast({
        title: "Afiliação criada!",
        description: "Seu link de afiliado está pronto.",
      });
      fetchAffiliations();
      setDialogOpen(false);
      setSelectedProduct("");
    }
  };

  const copyAffiliateLink = async (code: string) => {
    const link = `${window.location.origin}/checkout?ref=${code}`;
    await navigator.clipboard.writeText(link);
    setCopiedCode(code);
    toast({
      title: "Link copiado!",
      description: "Compartilhe com seus contatos.",
    });
    setTimeout(() => setCopiedCode(null), 3000);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold gradient-text">Afiliados</h1>
            <p className="text-muted-foreground">Gerencie suas afiliações e acompanhe ganhos</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="btn-primary-gradient">
                <Plus className="mr-2 h-4 w-4" />
                Nova Afiliação
              </Button>
            </DialogTrigger>
            <DialogContent className="glass-card">
              <DialogHeader>
                <DialogTitle>Tornar-se Afiliado</DialogTitle>
                <DialogDescription>
                  Escolha um produto para promover e ganhar comissões.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Selecione o Produto</Label>
                  <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                    <SelectTrigger>
                      <SelectValue placeholder="Escolha um produto" />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map((product) => (
                        <SelectItem key={product.id} value={product.id}>
                          {product.name} - R$ {product.price.toFixed(2)} ({product.commission_rate}% comissão)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button 
                  onClick={handleBecomeAffiliate} 
                  className="w-full btn-success-gradient"
                >
                  Gerar Link de Afiliado
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="stat-card">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Produtos Afiliados</p>
                  <h3 className="text-2xl font-bold">{stats.totalAffiliates}</h3>
                </div>
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Users className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="stat-card">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Vendas Realizadas</p>
                  <h3 className="text-2xl font-bold">{stats.totalSales}</h3>
                </div>
                <div className="h-12 w-12 rounded-lg bg-accent/10 flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-accent" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="stat-card">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Ganhos Totais</p>
                  <h3 className="text-2xl font-bold gradient-success-text">
                    R$ {stats.totalEarnings.toFixed(2)}
                  </h3>
                </div>
                <div className="h-12 w-12 rounded-lg bg-accent/10 flex items-center justify-center">
                  <DollarSign className="h-6 w-6 text-accent" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="stat-card">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Comissão Média</p>
                  <h3 className="text-2xl font-bold">{stats.avgCommission.toFixed(1)}%</h3>
                </div>
                <div className="h-12 w-12 rounded-lg bg-purple-500/10 flex items-center justify-center">
                  <LinkIcon className="h-6 w-6 text-purple-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Affiliations List */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Minhas Afiliações</CardTitle>
            <CardDescription>Produtos que você está promovendo</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">Carregando...</div>
            ) : affiliations.length === 0 ? (
              <div className="text-center py-12">
                <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Nenhuma afiliação ainda</h3>
                <p className="text-muted-foreground mb-4">
                  Torne-se afiliado de um produto e comece a ganhar comissões.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {affiliations.map((affiliation) => (
                  <div 
                    key={affiliation.id} 
                    className="flex items-center justify-between p-4 bg-secondary/30 rounded-lg"
                  >
                    <div className="flex-1">
                      <h4 className="font-medium">{affiliation.products?.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        Código: <span className="font-mono text-primary">{affiliation.affiliate_code}</span>
                      </p>
                      <div className="flex items-center gap-4 mt-2 text-sm">
                        <span className="text-muted-foreground">
                          Comissão: <span className="text-foreground">{affiliation.commission_rate}%</span>
                        </span>
                        <span className="text-muted-foreground">
                          Vendas: <span className="text-foreground">{affiliation.total_sales}</span>
                        </span>
                        <span className="text-muted-foreground">
                          Ganhos: <span className="text-accent font-medium">R$ {Number(affiliation.total_earnings).toFixed(2)}</span>
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyAffiliateLink(affiliation.affiliate_code)}
                      >
                        {copiedCode === affiliation.affiliate_code ? (
                          <Check className="h-4 w-4 text-accent" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(`/checkout?ref=${affiliation.affiliate_code}`, '_blank')}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Affiliates;
