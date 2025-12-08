import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, Package, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface TopProduct {
  id: string;
  name: string;
  sales: number;
  revenue: number;
  growth: string;
}

export function TopProducts() {
  const [products, setProducts] = useState<TopProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTopProducts();
  }, []);

  const fetchTopProducts = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Fetch transactions with products
    const { data: transactions } = await supabase
      .from('transactions')
      .select(`
        amount,
        product_id,
        created_at,
        products (
          id,
          name
        )
      `)
      .eq('seller_id', user.id)
      .eq('status', 'paid');

    if (transactions) {
      // Group by product
      const productMap = new Map<string, { name: string; sales: number; revenue: number }>();
      
      transactions.forEach((tx: any) => {
        if (tx.products) {
          const existing = productMap.get(tx.product_id) || { name: tx.products.name, sales: 0, revenue: 0 };
          existing.sales += 1;
          existing.revenue += Number(tx.amount);
          productMap.set(tx.product_id, existing);
        }
      });

      const topProducts: TopProduct[] = Array.from(productMap.entries())
        .map(([id, data]) => ({
          id,
          name: data.name,
          sales: data.sales,
          revenue: data.revenue,
          growth: "+0%"
        }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 4);

      setProducts(topProducts);
    }
    
    setLoading(false);
  };

  if (loading) {
    return (
      <Card variant="glass">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Produtos em Destaque</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-4 p-3 rounded-lg bg-secondary/30 animate-pulse">
                <div className="h-10 w-10 rounded-lg bg-secondary" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-secondary rounded w-3/4" />
                  <div className="h-3 bg-secondary rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (products.length === 0) {
    return (
      <Card variant="glass">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Produtos em Destaque</CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8">
          <Package className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground">Nenhuma venda ainda</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card variant="glass">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-semibold">Produtos em Destaque</CardTitle>
        <Button variant="ghost" size="sm" className="gap-2">
          Ver todos <ArrowRight className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {products.map((product) => (
          <div 
            key={product.id} 
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
              <p className="font-semibold">
                R$ {product.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
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