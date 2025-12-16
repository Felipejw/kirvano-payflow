import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Plus, 
  Search, 
  MoreVertical, 
  Eye, 
  Edit, 
  Trash2,
  Filter,
  ExternalLink,
  AlertCircle,
  Copy,
  Link
} from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ProductFormDialog } from "@/components/products/ProductFormDialog";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface Product {
  id: string;
  name: string;
  description: string | null;
  type: string;
  price: number;
  status: string;
  commission_rate: number;
  cover_url: string | null;
  content_url: string | null;
  created_at: string;
  allow_affiliates?: boolean;
  order_bumps?: string[];
  deliverable_url?: string | null;
  deliverable_type?: string | null;
  checkout_template_id?: string | null;
  custom_slug?: string | null;
  custom_domain?: string | null;
  domain_verified?: boolean;
}

const typeLabels = {
  digital: { label: "Digital", variant: "info" as const },
  physical: { label: "Físico", variant: "secondary" as const },
  service: { label: "Serviço", variant: "warning" as const },
};

const statusLabels = {
  active: { label: "Ativo", variant: "success" as const },
  paused: { label: "Pausado", variant: "warning" as const },
  draft: { label: "Rascunho", variant: "secondary" as const },
};

const Products = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      navigate('/auth');
      return;
    }

    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('seller_id', user.id)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setProducts(data);
    }
    setLoading(false);
  };

  const handleDelete = async (productId: string) => {
    if (!confirm('Tem certeza que deseja excluir este produto?')) return;
    
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', productId);

    if (error) {
      toast.error("Erro ao excluir produto");
    } else {
      toast.success("Produto excluído");
      fetchProducts();
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setDialogOpen(true);
  };

  const handleCreate = () => {
    setEditingProduct(null);
    setDialogOpen(true);
  };

  const getCheckoutUrl = (product: Product) => {
    // Custom domain with verified status
    if (product.custom_domain && product.domain_verified) {
      // Check if there are other products with the same domain
      const productsWithSameDomain = products.filter(
        p => p.custom_domain === product.custom_domain && p.domain_verified
      );
      
      // If domain is shared, include slug in URL
      if (productsWithSameDomain.length > 1 && product.custom_slug) {
        return `https://${product.custom_domain}?s=${product.custom_slug}`;
      }
      
      // Single product on domain - no slug needed
      return `https://${product.custom_domain}`;
    }
    
    // For other products, usar APENAS a raiz / com query params
    // Isso funciona em QUALQUER servidor sem precisar de SPA fallback
    const baseUrl = window.location.origin;
    
    // Usar query param ?s= para slug
    if (product.custom_slug) {
      return `${baseUrl}/?s=${product.custom_slug}`;
    }
    
    // Usar query param ?id= para ID do produto
    return `${baseUrl}/?id=${product.id}`;
  };

  const openCheckout = (product: Product) => {
    window.open(getCheckoutUrl(product), '_blank');
  };

  const copyCheckoutUrl = async (product: Product) => {
    const url = getCheckoutUrl(product);
    await navigator.clipboard.writeText(url);
    toast.success("Link copiado!");
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Produtos</h1>
            <p className="text-muted-foreground">Gerencie seus produtos e serviços</p>
          </div>
          <Button variant="gradient" className="gap-2" onClick={handleCreate}>
            <Plus className="h-4 w-4" />
            Novo Produto
          </Button>
        </div>

        {/* Filters */}
        <Card variant="glass">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Buscar produtos..." 
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

        {/* Products Grid */}
        {loading ? (
          <div className="text-center py-12 text-muted-foreground">Carregando produtos...</div>
        ) : filteredProducts.length === 0 && !searchTerm ? (
          <Card variant="glass" className="py-12">
            <CardContent className="text-center">
              <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-semibold mb-2">Nenhum produto cadastrado</h3>
              <p className="text-muted-foreground mb-4">Crie seu primeiro produto para começar a vender</p>
              <Button variant="gradient" onClick={handleCreate}>
                <Plus className="h-4 w-4 mr-2" />
                Criar Produto
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <Card 
                key={product.id} 
                variant="glass" 
                className="group hover:border-primary/30 transition-all duration-300"
              >
                <CardContent className="p-4">
                  <div className="relative aspect-video rounded-lg overflow-hidden mb-4 bg-secondary">
                    {product.cover_url ? (
                      <img 
                        src={product.cover_url} 
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                        <span className="text-4xl">📦</span>
                      </div>
                    )}
                    <div className="absolute top-2 right-2">
                      <Badge variant={statusLabels[product.status as keyof typeof statusLabels]?.variant || "secondary"}>
                        {statusLabels[product.status as keyof typeof statusLabels]?.label || product.status}
                      </Badge>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold line-clamp-2">{product.name}</h3>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="shrink-0 h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openCheckout(product)}>
                            <ExternalLink className="h-4 w-4 mr-2" />
                            Ver Checkout
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => copyCheckoutUrl(product)}>
                            <Copy className="h-4 w-4 mr-2" />
                            Copiar Link
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEdit(product)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleDelete(product.id)}
                            className="text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge variant={typeLabels[product.type as keyof typeof typeLabels]?.variant || "secondary"}>
                        {typeLabels[product.type as keyof typeof typeLabels]?.label || product.type}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        Comissão: {product.commission_rate}%
                      </span>
                    </div>

                    {/* Custom URL Preview */}
                    {(product.custom_slug || product.custom_domain) && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground bg-secondary/50 rounded px-2 py-1">
                        <Link className="h-3 w-3" />
                        <span className="truncate">
                          {product.custom_domain 
                            ? product.custom_slug 
                              ? `${product.custom_domain}/${product.custom_slug}` 
                              : product.custom_domain
                            : `?s=${product.custom_slug}`}
                        </span>
                        {product.custom_domain && !product.domain_verified && (
                          <Badge variant="warning" className="text-[10px] px-1 py-0">Pendente</Badge>
                        )}
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-2 border-t border-border/50">
                      <div>
                        <p className="text-lg font-bold">
                          R$ {Number(product.price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8"
                          onClick={() => copyCheckoutUrl(product)}
                          title="Copiar link"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8"
                          onClick={() => openCheckout(product)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8"
                          onClick={() => handleEdit(product)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* Add Product Card */}
            <Card 
              variant="glass" 
              className="border-dashed hover:border-primary/50 transition-all cursor-pointer group"
              onClick={handleCreate}
            >
              <CardContent className="p-4 h-full flex flex-col items-center justify-center min-h-[280px] text-center">
                <div className="p-4 rounded-full bg-secondary/50 mb-4 group-hover:scale-110 transition-transform">
                  <Plus className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="font-semibold mb-1">Adicionar Produto</h3>
                <p className="text-sm text-muted-foreground">
                  Crie um novo produto ou serviço
                </p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      <ProductFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        product={editingProduct}
        onSuccess={fetchProducts}
      />
    </DashboardLayout>
  );
};

export default Products;
