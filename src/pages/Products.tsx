import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Plus, 
  Search, 
  MoreVertical, 
  Package, 
  Eye, 
  Edit, 
  Trash2,
  Filter
} from "lucide-react";

const products = [
  {
    id: 1,
    name: "Curso de Marketing Digital Pro",
    type: "digital",
    price: "R$ 497,00",
    sales: 234,
    status: "active",
    commission: "30%",
    image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=100&h=100&fit=crop",
  },
  {
    id: 2,
    name: "E-book Vendas Automatizadas",
    type: "digital",
    price: "R$ 47,00",
    sales: 567,
    status: "active",
    commission: "50%",
    image: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=100&h=100&fit=crop",
  },
  {
    id: 3,
    name: "Mentoria Business Elite",
    type: "service",
    price: "R$ 1.997,00",
    sales: 45,
    status: "active",
    commission: "20%",
    image: "https://images.unsplash.com/photo-1552664730-d307ca884978?w=100&h=100&fit=crop",
  },
  {
    id: 4,
    name: "Pack Templates Premium",
    type: "digital",
    price: "R$ 127,00",
    sales: 189,
    status: "paused",
    commission: "40%",
    image: "https://images.unsplash.com/photo-1558655146-9f40138edfeb?w=100&h=100&fit=crop",
  },
];

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
  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Produtos</h1>
            <p className="text-muted-foreground">Gerencie seus produtos e serviços</p>
          </div>
          <Button variant="gradient" className="gap-2">
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map((product) => (
            <Card 
              key={product.id} 
              variant="glass" 
              className="group hover:border-primary/30 transition-all duration-300"
            >
              <CardContent className="p-4">
                <div className="relative aspect-video rounded-lg overflow-hidden mb-4 bg-secondary">
                  <img 
                    src={product.image} 
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-2 right-2">
                    <Badge variant={statusLabels[product.status as keyof typeof statusLabels].variant}>
                      {statusLabels[product.status as keyof typeof statusLabels].label}
                    </Badge>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold line-clamp-2">{product.name}</h3>
                    <Button variant="ghost" size="icon" className="shrink-0 h-8 w-8">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge variant={typeLabels[product.type as keyof typeof typeLabels].variant}>
                      {typeLabels[product.type as keyof typeof typeLabels].label}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      Comissão: {product.commission}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-border/50">
                    <div>
                      <p className="text-lg font-bold">{product.price}</p>
                      <p className="text-xs text-muted-foreground">{product.sales} vendas</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
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
      </div>
    </DashboardLayout>
  );
};

export default Products;
