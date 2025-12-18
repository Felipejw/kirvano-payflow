import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Trophy,
  Radio,
  RefreshCw,
  Medal,
  Package,
  Users
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useAdminStats } from "@/hooks/useAdminStats";

export default function AdminRankings() {
  const {
    topProducts,
    topSellers,
    loading,
    lastUpdate,
    isLive,
    setIsLive,
    isAdmin,
    roleLoading,
    fetchAdminData,
    formatCurrency
  } = useAdminStats();

  if (roleLoading || loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!isAdmin) return null;

  const getMedalColor = (index: number) => {
    switch(index) {
      case 0: return "text-yellow-500";
      case 1: return "text-gray-400";
      case 2: return "text-amber-600";
      default: return "text-muted-foreground";
    }
  };

  const getMedalEmoji = (index: number) => {
    switch(index) {
      case 0: return "🥇";
      case 1: return "🥈";
      case 2: return "🥉";
      default: return `${index + 1}º`;
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">🏆 Rankings</h1>
            <p className="text-muted-foreground">
              Top produtos e vendedores da plataforma
            </p>
          </div>
          <div className="flex gap-2 items-center">
            <Button
              variant={isLive ? "default" : "outline"}
              size="sm"
              onClick={() => setIsLive(!isLive)}
              className={isLive ? "bg-green-600 hover:bg-green-700" : ""}
            >
              <Radio className={`h-4 w-4 mr-1 ${isLive ? "animate-pulse" : ""}`} />
              {isLive ? "AO VIVO" : "PAUSADO"}
            </Button>
            <Button variant="ghost" size="sm" onClick={fetchAdminData}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className={`h-2 w-2 rounded-full ${isLive ? "bg-green-500 animate-pulse" : "bg-muted"}`}></span>
          Última atualização: {format(lastUpdate, "HH:mm:ss", { locale: ptBR })}
        </div>

        {/* Rankings Grid */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Top Products */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5 text-primary" />
                🏆 Produtos Mais Vendidos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topProducts.length > 0 ? (
                  topProducts.map((product, index) => (
                    <div 
                      key={product.id} 
                      className={`flex items-center justify-between p-4 rounded-lg transition-all ${
                        index === 0 ? 'bg-yellow-500/10 border border-yellow-500/30' :
                        index === 1 ? 'bg-gray-500/10 border border-gray-500/30' :
                        index === 2 ? 'bg-amber-500/10 border border-amber-500/30' :
                        'bg-muted/50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className={`text-2xl font-bold ${getMedalColor(index)}`}>
                          {getMedalEmoji(index)}
                        </span>
                        <div>
                          <p className="font-semibold truncate max-w-[200px]">{product.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {product.totalSales} vendas
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-primary">{formatCurrency(product.totalRevenue)}</p>
                        <Badge variant="secondary" className="text-xs">
                          {((product.totalRevenue / (topProducts.reduce((sum, p) => sum + p.totalRevenue, 0) || 1)) * 100).toFixed(1)}%
                        </Badge>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>Nenhum produto vendido ainda</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Top Sellers */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-accent" />
                🏆 Top Vendedores
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topSellers.length > 0 ? (
                  topSellers.map((seller, index) => (
                    <div 
                      key={seller.user_id} 
                      className={`flex items-center justify-between p-4 rounded-lg transition-all ${
                        index === 0 ? 'bg-yellow-500/10 border border-yellow-500/30' :
                        index === 1 ? 'bg-gray-500/10 border border-gray-500/30' :
                        index === 2 ? 'bg-amber-500/10 border border-amber-500/30' :
                        'bg-muted/50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className={`text-2xl font-bold ${getMedalColor(index)}`}>
                          {getMedalEmoji(index)}
                        </span>
                        <div>
                          <p className="font-semibold">{seller.full_name}</p>
                          <p className="text-sm text-muted-foreground truncate max-w-[180px]">
                            {seller.email}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-accent">{formatCurrency(seller.totalRevenue)}</p>
                        <Badge variant="secondary" className="text-xs">
                          {seller.totalSales} vendas
                        </Badge>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>Nenhum vendedor com vendas ainda</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Summary Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="glass-card">
            <CardContent className="pt-6">
              <div className="text-center">
                <Trophy className="h-8 w-8 mx-auto mb-2 text-yellow-500" />
                <p className="text-sm text-muted-foreground">Produto Campeão</p>
                <p className="text-lg font-bold truncate">
                  {topProducts[0]?.name || '-'}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardContent className="pt-6">
              <div className="text-center">
                <Medal className="h-8 w-8 mx-auto mb-2 text-primary" />
                <p className="text-sm text-muted-foreground">Top Vendedor</p>
                <p className="text-lg font-bold truncate">
                  {topSellers[0]?.full_name || '-'}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardContent className="pt-6">
              <div className="text-center">
                <Trophy className="h-8 w-8 mx-auto mb-2 text-accent" />
                <p className="text-sm text-muted-foreground">Maior Receita</p>
                <p className="text-lg font-bold">
                  {formatCurrency(topSellers[0]?.totalRevenue || 0)}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
