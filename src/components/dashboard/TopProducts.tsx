import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, Package, TrendingUp } from "lucide-react";

const products = [
  { 
    name: "Curso Marketing Digital Pro", 
    sales: 234, 
    revenue: "R$ 116.298,00",
    growth: "+12%"
  },
  { 
    name: "E-book Vendas Automatizadas", 
    sales: 567, 
    revenue: "R$ 26.649,00",
    growth: "+28%"
  },
  { 
    name: "Mentoria Business Elite", 
    sales: 45, 
    revenue: "R$ 89.865,00",
    growth: "+5%"
  },
  { 
    name: "Pack Templates Premium", 
    sales: 189, 
    revenue: "R$ 24.003,00",
    growth: "+18%"
  },
];

export function TopProducts() {
  return (
    <Card variant="glass">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-semibold">Produtos em Destaque</CardTitle>
        <Button variant="ghost" size="sm" className="gap-2">
          Ver todos <ArrowRight className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {products.map((product, index) => (
          <div 
            key={product.name} 
            className="flex items-center gap-4 p-3 rounded-lg hover:bg-secondary/30 transition-colors"
          >
            <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-secondary">
              <Package className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{product.name}</p>
              <p className="text-sm text-muted-foreground">{product.sales} vendas</p>
            </div>
            <div className="text-right">
              <p className="font-semibold">{product.revenue}</p>
              <div className="flex items-center justify-end gap-1 text-accent text-sm">
                <TrendingUp className="h-3 w-3" />
                {product.growth}
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
