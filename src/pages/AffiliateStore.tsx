import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useAppNavigate } from "@/lib/routes";
import { 
  Search, 
  Store, 
  TrendingUp, 
  ArrowLeft,
  Package,
  Percent,
  Users,
  ExternalLink,
  Copy,
  Check,
  Loader2,
  SlidersHorizontal
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

interface SellerProfile {
  full_name: string | null;
  avatar_url: string | null;
  company_name: string | null;
}

interface StoreProduct {
  id: string;
  name: string;
  description: string | null;
  price: number;
  cover_url: string | null;
  commission_rate: number;
  seller_id: string;
  created_at: string;
  profiles: SellerProfile | null;
  affiliate_count?: number;
}

interface UserAffiliation {
  product_id: string;
  affiliate_code: string;
}

export default function AffiliateStore() {
  const { user } = useAuth();
  const navigate = useAppNavigate();
  
  const [products, setProducts] = useState<StoreProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<string>("recent");
  const [minCommission, setMinCommission] = useState<string>("all");
  const [priceRange, setPriceRange] = useState<string>("all");
  const [userAffiliations, setUserAffiliations] = useState<UserAffiliation[]>([]);
  
  const [affiliatingProductId, setAffiliatingProductId] = useState<string | null>(null);
  const [successDialog, setSuccessDialog] = useState<{ open: boolean; code: string; productName: string }>({
    open: false,
    code: "",
    productName: ""
  });
  const [copiedCode, setCopiedCode] = useState(false);

  useEffect(() => {
    fetchProducts();
    if (user) {
      fetchUserAffiliations();
    }
  }, [user]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          id,
          name,
          description,
          price,
          cover_url,
          commission_rate,
          seller_id,
          created_at,
          profiles!inner (
            full_name,
            avatar_url,
            company_name
          )
        `)
        .eq('status', 'active')
        .eq('allow_affiliates', true);

      if (error) throw error;

      // Get affiliate counts
      const { data: affiliateCounts } = await supabase
        .from('affiliates')
        .select('product_id')
        .eq('status', 'active');

      const countMap: Record<string, number> = {};
      affiliateCounts?.forEach(a => {
        countMap[a.product_id] = (countMap[a.product_id] || 0) + 1;
      });

      const productsWithCounts = (data || []).map(p => ({
        ...p,
        profiles: Array.isArray(p.profiles) ? p.profiles[0] : p.profiles,
        affiliate_count: countMap[p.id] || 0
      }));

      setProducts(productsWithCounts);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Erro ao carregar produtos');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserAffiliations = async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from('affiliates')
      .select('product_id, affiliate_code')
      .eq('user_id', user.id);
    
    setUserAffiliations(data || []);
  };

  const handleAffiliate = async (product: StoreProduct) => {
    if (!user) {
      // Redirect to login with return URL
      const returnUrl = encodeURIComponent(`/?page=affiliate-store`);
      navigate("auth", { returnUrl });
      return;
    }

    // Check if already affiliated
    const existing = userAffiliations.find(a => a.product_id === product.id);
    if (existing) {
      setSuccessDialog({
        open: true,
        code: existing.affiliate_code,
        productName: product.name
      });
      return;
    }

    // Check if user is the seller
    if (product.seller_id === user.id) {
      toast.error('Você não pode se afiliar ao seu próprio produto');
      return;
    }

    setAffiliatingProductId(product.id);

    try {
      // Generate unique affiliate code
      const affiliateCode = `${product.name.substring(0, 3).toUpperCase()}${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

      const { error } = await supabase
        .from('affiliates')
        .insert({
          user_id: user.id,
          product_id: product.id,
          affiliate_code: affiliateCode,
          commission_rate: product.commission_rate,
          status: 'active'
        });

      if (error) throw error;

      // Update local state
      setUserAffiliations(prev => [...prev, { product_id: product.id, affiliate_code: affiliateCode }]);
      
      setSuccessDialog({
        open: true,
        code: affiliateCode,
        productName: product.name
      });

      toast.success('Afiliação criada com sucesso!');
    } catch (error: any) {
      console.error('Error creating affiliation:', error);
      if (error.code === '23505') {
        toast.error('Você já está afiliado a este produto');
      } else {
        toast.error('Erro ao criar afiliação');
      }
    } finally {
      setAffiliatingProductId(null);
    }
  };

  const copyAffiliateLink = (code: string, productId: string) => {
    const link = `${window.location.origin}/?page=checkout&product=${productId}&ref=${code}`;
    navigator.clipboard.writeText(link);
    setCopiedCode(true);
    toast.success('Link copiado!');
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // Filter and sort products
  const filteredProducts = products
    .filter(p => {
      // Search filter
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        const matchesName = p.name.toLowerCase().includes(search);
        const matchesSeller = p.profiles?.full_name?.toLowerCase().includes(search) || 
                              p.profiles?.company_name?.toLowerCase().includes(search);
        if (!matchesName && !matchesSeller) return false;
      }

      // Commission filter
      if (minCommission !== "all") {
        const minRate = parseInt(minCommission);
        if (p.commission_rate < minRate) return false;
      }

      // Price filter
      if (priceRange !== "all") {
        const [min, max] = priceRange.split("-").map(Number);
        if (max) {
          if (p.price < min || p.price > max) return false;
        } else {
          if (p.price < min) return false;
        }
      }

      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "commission":
          return b.commission_rate - a.commission_rate;
        case "price_low":
          return a.price - b.price;
        case "price_high":
          return b.price - a.price;
        case "popular":
          return (b.affiliate_count || 0) - (a.affiliate_count || 0);
        case "recent":
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const getSellerName = (profile: SellerProfile | null) => {
    if (!profile) return "Vendedor";
    return profile.company_name || profile.full_name || "Vendedor";
  };

  const getSellerInitials = (profile: SellerProfile | null) => {
    const name = getSellerName(profile);
    return name.substring(0, 2).toUpperCase();
  };

  const FiltersContent = () => (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium mb-2 block">Comissão mínima</label>
        <Select value={minCommission} onValueChange={setMinCommission}>
          <SelectTrigger>
            <SelectValue placeholder="Qualquer comissão" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Qualquer comissão</SelectItem>
            <SelectItem value="10">10% ou mais</SelectItem>
            <SelectItem value="20">20% ou mais</SelectItem>
            <SelectItem value="30">30% ou mais</SelectItem>
            <SelectItem value="40">40% ou mais</SelectItem>
            <SelectItem value="50">50% ou mais</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <label className="text-sm font-medium mb-2 block">Faixa de preço</label>
        <Select value={priceRange} onValueChange={setPriceRange}>
          <SelectTrigger>
            <SelectValue placeholder="Qualquer preço" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Qualquer preço</SelectItem>
            <SelectItem value="0-50">Até R$ 50</SelectItem>
            <SelectItem value="50-100">R$ 50 - R$ 100</SelectItem>
            <SelectItem value="100-500">R$ 100 - R$ 500</SelectItem>
            <SelectItem value="500-">Acima de R$ 500</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <label className="text-sm font-medium mb-2 block">Ordenar por</label>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger>
            <SelectValue placeholder="Ordenar por" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="recent">Mais recentes</SelectItem>
            <SelectItem value="commission">Maior comissão</SelectItem>
            <SelectItem value="popular">Mais populares</SelectItem>
            <SelectItem value="price_low">Menor preço</SelectItem>
            <SelectItem value="price_high">Maior preço</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => navigate("dashboard/affiliates")}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="flex items-center gap-2">
                <Store className="h-6 w-6 text-primary" />
                <h1 className="text-xl font-bold">Loja de Afiliados</h1>
              </div>
            </div>
            
            {user ? (
              <Button variant="outline" onClick={() => navigate("dashboard/affiliates")}>
                <Percent className="mr-2 h-4 w-4" />
                Minhas Afiliações
              </Button>
            ) : (
              <Button onClick={() => navigate("auth")}>
                Entrar
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        {/* Search and Filters Bar */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar produtos ou vendedores..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          {/* Desktop Filters */}
          <div className="hidden md:flex gap-2">
            <Select value={minCommission} onValueChange={setMinCommission}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Comissão" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Qualquer comissão</SelectItem>
                <SelectItem value="10">10% ou mais</SelectItem>
                <SelectItem value="20">20% ou mais</SelectItem>
                <SelectItem value="30">30% ou mais</SelectItem>
                <SelectItem value="40">40% ou mais</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Ordenar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Mais recentes</SelectItem>
                <SelectItem value="commission">Maior comissão</SelectItem>
                <SelectItem value="popular">Mais populares</SelectItem>
                <SelectItem value="price_low">Menor preço</SelectItem>
                <SelectItem value="price_high">Maior preço</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Mobile Filters */}
          <Sheet>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="outline" size="icon">
                <SlidersHorizontal className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Filtros</SheetTitle>
                <SheetDescription>
                  Filtre e ordene os produtos
                </SheetDescription>
              </SheetHeader>
              <div className="mt-6">
                <FiltersContent />
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Package className="h-4 w-4" />
              <span className="text-sm">Produtos</span>
            </div>
            <p className="text-2xl font-bold">{products.length}</p>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Percent className="h-4 w-4" />
              <span className="text-sm">Maior Comissão</span>
            </div>
            <p className="text-2xl font-bold">
              {products.length > 0 ? Math.max(...products.map(p => p.commission_rate)) : 0}%
            </p>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <TrendingUp className="h-4 w-4" />
              <span className="text-sm">Ticket Médio</span>
            </div>
            <p className="text-2xl font-bold">
              {products.length > 0 
                ? formatCurrency(products.reduce((acc, p) => acc + p.price, 0) / products.length)
                : "R$ 0"
              }
            </p>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Users className="h-4 w-4" />
              <span className="text-sm">Afiliados Ativos</span>
            </div>
            <p className="text-2xl font-bold">
              {products.reduce((acc, p) => acc + (p.affiliate_count || 0), 0)}
            </p>
          </Card>
        </div>

        {/* Products Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-12">
            <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Nenhum produto encontrado</h3>
            <p className="text-muted-foreground">
              {searchTerm ? "Tente buscar com outros termos" : "Não há produtos disponíveis para afiliação no momento"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product) => {
              const isAffiliated = userAffiliations.some(a => a.product_id === product.id);
              const isOwnProduct = user?.id === product.seller_id;
              const commissionValue = (product.price * product.commission_rate) / 100;
              
              return (
                <Card key={product.id} className="overflow-hidden group hover:shadow-lg transition-shadow">
                  {/* Product Image */}
                  <div className="aspect-video bg-muted relative overflow-hidden">
                    {product.cover_url ? (
                      <img 
                        src={product.cover_url} 
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="h-12 w-12 text-muted-foreground" />
                      </div>
                    )}
                    
                    {/* Commission Badge */}
                    <Badge className="absolute top-2 right-2 bg-primary text-primary-foreground">
                      {product.commission_rate}% comissão
                    </Badge>
                  </div>

                  <CardContent className="p-4">
                    {/* Seller Info */}
                    <div className="flex items-center gap-2 mb-3">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={product.profiles?.avatar_url || undefined} />
                        <AvatarFallback className="text-xs">
                          {getSellerInitials(product.profiles)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm text-muted-foreground truncate">
                        {getSellerName(product.profiles)}
                      </span>
                    </div>

                    {/* Product Name */}
                    <h3 className="font-semibold mb-2 line-clamp-2 min-h-[48px]">
                      {product.name}
                    </h3>

                    {/* Price and Commission */}
                    <div className="space-y-1">
                      <p className="text-xl font-bold">{formatCurrency(product.price)}</p>
                      <p className="text-sm text-green-600 dark:text-green-400 font-medium">
                        Ganhe {formatCurrency(commissionValue)} por venda
                      </p>
                    </div>

                    {/* Affiliate Count */}
                    {(product.affiliate_count || 0) > 0 && (
                      <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                        <Users className="h-3 w-3" />
                        <span>{product.affiliate_count} afiliados</span>
                      </div>
                    )}
                  </CardContent>

                  <CardFooter className="p-4 pt-0">
                    {isOwnProduct ? (
                      <Button variant="outline" className="w-full" disabled>
                        Seu produto
                      </Button>
                    ) : isAffiliated ? (
                      <Button 
                        variant="secondary" 
                        className="w-full"
                        onClick={() => {
                          const affiliation = userAffiliations.find(a => a.product_id === product.id);
                          if (affiliation) {
                            setSuccessDialog({
                              open: true,
                              code: affiliation.affiliate_code,
                              productName: product.name
                            });
                          }
                        }}
                      >
                        <Check className="mr-2 h-4 w-4" />
                        Ver meu link
                      </Button>
                    ) : (
                      <Button 
                        className="w-full"
                        onClick={() => handleAffiliate(product)}
                        disabled={affiliatingProductId === product.id}
                      >
                        {affiliatingProductId === product.id ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <ExternalLink className="mr-2 h-4 w-4" />
                        )}
                        Afiliar-se
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        )}
      </main>

      {/* Success Dialog */}
      <Dialog open={successDialog.open} onOpenChange={(open) => setSuccessDialog(prev => ({ ...prev, open }))}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>🎉 Link de Afiliado</DialogTitle>
            <DialogDescription>
              Seu link para promover "{successDialog.productName}"
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground mb-2">Seu código de afiliado:</p>
              <p className="font-mono font-bold text-lg">{successDialog.code}</p>
            </div>
            
            <Button 
              className="w-full" 
              onClick={() => {
                const product = products.find(p => 
                  userAffiliations.some(a => a.product_id === p.id && a.affiliate_code === successDialog.code)
                );
                if (product) {
                  copyAffiliateLink(successDialog.code, product.id);
                }
              }}
            >
              {copiedCode ? (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Copiado!
                </>
              ) : (
                <>
                  <Copy className="mr-2 h-4 w-4" />
                  Copiar Link de Afiliado
                </>
              )}
            </Button>
            
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => {
                setSuccessDialog(prev => ({ ...prev, open: false }));
                navigate("dashboard/affiliates");
              }}
            >
              Ir para Minhas Afiliações
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
