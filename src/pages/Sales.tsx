import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { 
  Search, 
  Filter,
  Download,
  Clock,
  CheckCircle,
  XCircle,
  TrendingUp,
  DollarSign,
  ShoppingCart,
  AlertCircle,
  Eye,
  User,
  Package,
  Calendar,
  CreditCard,
  Trash2,
  Link2,
  RefreshCw
} from "lucide-react";
import { toast } from "sonner";
import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Sale {
  id: string;
  amount: number;
  status: string;
  buyer_email: string;
  buyer_name: string | null;
  buyer_cpf: string | null;
  buyer_phone: string | null;
  created_at: string;
  paid_at: string | null;
  expires_at: string;
  order_bumps: string[] | null;
  product: {
    name: string;
    id: string;
  } | null;
  order_bump_products?: { id: string; name: string }[];
  platform_fee?: number;
  seller_amount?: number;
  is_recovered?: boolean;
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
  utm_content?: string | null;
  utm_term?: string | null;
}

const statusConfig = {
  pending: { 
    label: "Pendente", 
    variant: "warning" as const, 
    icon: Clock,
    color: "text-yellow-500"
  },
  paid: { 
    label: "Pago", 
    variant: "success" as const, 
    icon: CheckCircle,
    color: "text-green-500"
  },
  expired: { 
    label: "Expirado", 
    variant: "secondary" as const, 
    icon: XCircle,
    color: "text-muted-foreground"
  },
  cancelled: { 
    label: "Cancelado", 
    variant: "destructive" as const, 
    icon: XCircle,
    color: "text-destructive"
  },
};

const Sales = () => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [saleToDelete, setSaleToDelete] = useState<Sale | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchSales();
  }, []);

  const fetchSales = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('pix_charges')
      .select(`
        id,
        amount,
        status,
        buyer_email,
        buyer_name,
        buyer_cpf,
        buyer_phone,
        created_at,
        paid_at,
        expires_at,
        seller_id,
        order_bumps,
        utm_source,
        utm_medium,
        utm_campaign,
        utm_content,
        utm_term,
        products:product_id (
          id,
          name
        )
      `)
      .eq('seller_id', user.id)
      .order('created_at', { ascending: false });

    if (!error && data) {
      // Fetch transactions to get platform_fee and is_recovered for each charge
      const chargeIds = data.map(item => item.id);
      let transactionMap: Record<string, { platform_fee: number; seller_amount: number; is_recovered: boolean }> = {};
      
      if (chargeIds.length > 0) {
        const { data: transactions } = await supabase
          .from('transactions')
          .select('charge_id, platform_fee, seller_amount, is_recovered')
          .in('charge_id', chargeIds);
        
        if (transactions) {
          transactionMap = Object.fromEntries(
            transactions.map(t => [t.charge_id, { 
              platform_fee: t.platform_fee, 
              seller_amount: t.seller_amount,
              is_recovered: t.is_recovered || false
            }])
          );
        }
      }

      // Fetch order bump product names if there are any
      const allBumpIds = data.flatMap(item => item.order_bumps || []);
      const uniqueBumpIds = [...new Set(allBumpIds)];
      
      let bumpProductMap: Record<string, string> = {};
      if (uniqueBumpIds.length > 0) {
        const { data: bumpProducts } = await supabase
          .from('products')
          .select('id, name')
          .in('id', uniqueBumpIds);
        
        if (bumpProducts) {
          bumpProductMap = Object.fromEntries(bumpProducts.map(p => [p.id, p.name]));
        }
      }

      setSales(data.map(item => {
        const txData = transactionMap[item.id];
        return {
          ...item,
          product: item.products as { id: string; name: string } | null,
          order_bump_products: (item.order_bumps || []).map(id => ({
            id,
            name: bumpProductMap[id] || 'Produto adicional'
          })),
          platform_fee: txData?.platform_fee,
          seller_amount: txData?.seller_amount,
          is_recovered: txData?.is_recovered || false,
        };
      }));
    }
    setLoading(false);
  };

  const handleSaleClick = (sale: Sale) => {
    setSelectedSale(sale);
    setDetailDialogOpen(true);
  };

  const handleDeleteClick = (sale: Sale, e: React.MouseEvent) => {
    e.stopPropagation();
    setSaleToDelete(sale);
    setDeleteDialogOpen(true);
  };

  const handleDeleteSale = async () => {
    if (!saleToDelete) return;
    
    setDeleting(true);
    try {
      // Primeiro, deletar transação relacionada (se existir)
      await supabase
        .from('transactions')
        .delete()
        .eq('charge_id', saleToDelete.id);

      // Depois, deletar a cobrança PIX
      const { error } = await supabase
        .from('pix_charges')
        .delete()
        .eq('id', saleToDelete.id);

      if (error) throw error;

      toast.success("Venda excluída com sucesso!");
      setSales(prev => prev.filter(s => s.id !== saleToDelete.id));
    } catch (error) {
      console.error('Erro ao excluir venda:', error);
      toast.error("Erro ao excluir venda. Tente novamente.");
    } finally {
      setDeleting(false);
      setDeleteDialogOpen(false);
      setSaleToDelete(null);
    }
  };

  // Helper function to get the effective status (pending + expired = cancelled)
  const getEffectiveStatus = (sale: Sale) => {
    if (sale.status === 'pending' && new Date(sale.expires_at) < new Date()) {
      return 'cancelled';
    }
    return sale.status;
  };

  const filteredSales = sales.filter(sale => {
    const matchesSearch = 
      sale.buyer_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sale.buyer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sale.product?.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const effectiveStatus = getEffectiveStatus(sale);
    
    if (activeTab === "all") return matchesSearch;
    if (activeTab === "expired") {
      // "Expiradas" tab shows both expired and cancelled
      return matchesSearch && (effectiveStatus === 'expired' || effectiveStatus === 'cancelled');
    }
    return matchesSearch && effectiveStatus === activeTab;
  });

  // UTM Statistics
  const utmStats = useMemo(() => {
    const utmSales = sales.filter(s => s.status === 'paid' && (s.utm_source || s.utm_campaign));
    const bySource: Record<string, { count: number; revenue: number }> = {};
    
    utmSales.forEach(sale => {
      const source = sale.utm_source || 'Direto';
      if (!bySource[source]) {
        bySource[source] = { count: 0, revenue: 0 };
      }
      bySource[source].count++;
      bySource[source].revenue += Number(sale.amount);
    });

    return {
      totalTracked: utmSales.length,
      totalUntracked: sales.filter(s => s.status === 'paid' && !s.utm_source && !s.utm_campaign).length,
      bySource: Object.entries(bySource)
        .sort((a, b) => b[1].revenue - a[1].revenue)
        .slice(0, 5)
    };
  }, [sales]);

  const stats = {
    total: sales.length,
    pending: sales.filter(s => getEffectiveStatus(s) === 'pending').length,
    paid: sales.filter(s => s.status === 'paid').length,
    cancelled: sales.filter(s => {
      const effectiveStatus = getEffectiveStatus(s);
      return effectiveStatus === 'expired' || effectiveStatus === 'cancelled';
    }).length,
    recovered: sales.filter(s => s.is_recovered).length,
    totalValue: sales.filter(s => s.status === 'paid').reduce((acc, s) => acc + Number(s.amount), 0),
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Vendas</h1>
            <p className="text-muted-foreground">Acompanhe todas as suas vendas</p>
          </div>
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Exportar
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card variant="glass">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <ShoppingCart className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Vendas</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card variant="glass">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-yellow-500/10">
                  <Clock className="h-5 w-5 text-yellow-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Pendentes</p>
                  <p className="text-2xl font-bold">{stats.pending}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card variant="glass">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-500/10">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Pagas</p>
                  <p className="text-2xl font-bold">{stats.paid}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card variant="glass">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <DollarSign className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Recebido</p>
                  <p className="text-2xl font-bold">
                    R$ {stats.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* UTM Summary Card */}
        {stats.paid > 0 && (
          <Card variant="glass">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Vendas por Fonte (UTM)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Summary Stats */}
                <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50">
                  <div className="p-2 rounded-full bg-primary/10">
                    <Link2 className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Rastreadas</p>
                    <p className="text-lg font-bold">{utmStats.totalTracked}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50">
                  <div className="p-2 rounded-full bg-muted">
                    <AlertCircle className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Sem UTM</p>
                    <p className="text-lg font-bold">{utmStats.totalUntracked}</p>
                  </div>
                </div>

                {/* Top Sources */}
                {utmStats.bySource.slice(0, 2).map(([source, data]) => {
                  const getSourceColor = (src: string) => {
                    const srcLower = src.toLowerCase();
                    if (srcLower.includes('fb') || srcLower.includes('facebook')) return 'bg-blue-500/10 text-blue-500';
                    if (srcLower.includes('google') || srcLower.includes('gads')) return 'bg-red-500/10 text-red-500';
                    if (srcLower.includes('instagram') || srcLower.includes('ig')) return 'bg-pink-500/10 text-pink-500';
                    if (srcLower.includes('tiktok')) return 'bg-purple-500/10 text-purple-500';
                    if (srcLower === 'direto') return 'bg-green-500/10 text-green-500';
                    return 'bg-primary/10 text-primary';
                  };
                  const colorClass = getSourceColor(source);
                  
                  return (
                    <div key={source} className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50">
                      <div className={`p-2 rounded-full ${colorClass.split(' ')[0]}`}>
                        <TrendingUp className={`h-4 w-4 ${colorClass.split(' ')[1]}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-muted-foreground truncate">{source}</p>
                        <p className="text-lg font-bold">{data.count} <span className="text-xs font-normal text-muted-foreground">vendas</span></p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-green-500">
                          R$ {data.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* All Sources Detail */}
              {utmStats.bySource.length > 0 && (
                <div className="mt-4 pt-4 border-t border-border">
                  <p className="text-sm font-medium mb-3">Detalhamento por Fonte</p>
                  <div className="space-y-2">
                    {utmStats.bySource.map(([source, data]) => {
                      const percentage = stats.paid > 0 ? ((data.count / stats.paid) * 100).toFixed(1) : '0';
                      const getSourceColor = (src: string) => {
                        const srcLower = src.toLowerCase();
                        if (srcLower.includes('fb') || srcLower.includes('facebook')) return 'bg-blue-500';
                        if (srcLower.includes('google') || srcLower.includes('gads')) return 'bg-red-500';
                        if (srcLower.includes('instagram') || srcLower.includes('ig')) return 'bg-pink-500';
                        if (srcLower.includes('tiktok')) return 'bg-purple-500';
                        if (srcLower === 'direto') return 'bg-green-500';
                        return 'bg-primary';
                      };
                      
                      return (
                        <div key={source} className="flex items-center gap-3">
                          <div className="w-24 text-sm truncate">{source}</div>
                          <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                            <div 
                              className={`h-full ${getSourceColor(source)} transition-all`}
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <div className="w-16 text-sm text-right">{data.count} ({percentage}%)</div>
                          <div className="w-24 text-sm text-right font-medium text-green-500">
                            R$ {data.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {utmStats.bySource.length === 0 && (
                <div className="mt-4 p-4 rounded-lg bg-muted/50 text-center">
                  <p className="text-sm text-muted-foreground">
                    Nenhuma venda com UTM rastreada ainda. Use links com parâmetros UTM para rastrear suas fontes de tráfego.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Filters */}
        <Card variant="glass">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Buscar por email, nome ou produto..." 
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

        {/* Sales Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-secondary/50">
            <TabsTrigger value="all">Todas ({stats.total})</TabsTrigger>
            <TabsTrigger value="pending">Pendentes ({stats.pending})</TabsTrigger>
            <TabsTrigger value="paid">Pagas ({stats.paid})</TabsTrigger>
            <TabsTrigger value="expired">Expiradas ({stats.cancelled})</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-4">
            <Card variant="glass">
              <CardContent className="p-0">
                {loading ? (
                  <div className="p-8 text-center text-muted-foreground">
                    Carregando vendas...
                  </div>
                ) : filteredSales.length === 0 ? (
                  <div className="p-8 text-center">
                    <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">Nenhuma venda encontrada</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left p-4 font-medium text-muted-foreground">Cliente</th>
                          <th className="text-left p-4 font-medium text-muted-foreground hidden md:table-cell">Telefone</th>
                          <th className="text-left p-4 font-medium text-muted-foreground">Produto</th>
                          <th className="text-left p-4 font-medium text-muted-foreground">Valor</th>
                          <th className="text-left p-4 font-medium text-muted-foreground hidden lg:table-cell">Taxa</th>
                          <th className="text-left p-4 font-medium text-muted-foreground hidden lg:table-cell">Líquido</th>
                          <th className="text-left p-4 font-medium text-muted-foreground hidden xl:table-cell">UTM</th>
                          <th className="text-left p-4 font-medium text-muted-foreground">Status</th>
                          <th className="text-left p-4 font-medium text-muted-foreground hidden sm:table-cell">Data</th>
                          <th className="text-left p-4 font-medium text-muted-foreground w-16">Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredSales.map((sale) => {
                          const effectiveStatus = getEffectiveStatus(sale);
                          const status = statusConfig[effectiveStatus as keyof typeof statusConfig] || statusConfig.pending;
                          const StatusIcon = status.icon;
                          
                          return (
                            <tr 
                              key={sale.id} 
                              className="border-b border-border/50 hover:bg-secondary/30 transition-colors cursor-pointer"
                              onClick={() => handleSaleClick(sale)}
                            >
                              <td className="p-4">
                                <div>
                                  <p className="font-medium">{sale.buyer_name || "Cliente"}</p>
                                  <p className="text-sm text-muted-foreground">{sale.buyer_email}</p>
                                </div>
                              </td>
                              <td className="p-4 hidden md:table-cell">
                                <p className="text-sm text-muted-foreground">{sale.buyer_phone || "-"}</p>
                              </td>
                              <td className="p-4">
                                <div>
                                  <p className="text-sm">{sale.product?.name || "Produto não especificado"}</p>
                                  {sale.order_bump_products && sale.order_bump_products.length > 0 && (
                                    <p className="text-xs text-primary">
                                      + {sale.order_bump_products.length} adicional{sale.order_bump_products.length > 1 ? 'is' : ''}
                                    </p>
                                  )}
                                </div>
                              </td>
                              <td className="p-4">
                                <p className="font-semibold">
                                  R$ {Number(sale.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </p>
                              </td>
                              <td className="p-4 hidden lg:table-cell">
                                {sale.platform_fee !== undefined ? (
                                  <p className="text-sm text-destructive">
                                    - R$ {Number(sale.platform_fee).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                  </p>
                                ) : (
                                  <p className="text-sm text-muted-foreground">-</p>
                                )}
                              </td>
                              <td className="p-4 hidden lg:table-cell">
                                {sale.seller_amount !== undefined ? (
                                  <p className="text-sm font-medium text-green-500">
                                    R$ {Number(sale.seller_amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                  </p>
                                ) : (
                                  <p className="text-sm text-muted-foreground">-</p>
                                )}
                              </td>
                              <td className="p-4 hidden xl:table-cell">
                                {sale.utm_source || sale.utm_campaign ? (
                                  <div className="flex flex-wrap gap-1 max-w-[180px]">
                                    {sale.utm_source && (
                                      <Badge variant="outline" className="text-xs bg-blue-500/10 text-blue-500 border-blue-500/30">
                                        {sale.utm_source}
                                      </Badge>
                                    )}
                                    {sale.utm_campaign && (
                                      <Badge variant="outline" className="text-xs bg-purple-500/10 text-purple-500 border-purple-500/30 truncate max-w-[120px]" title={sale.utm_campaign}>
                                        {sale.utm_campaign}
                                      </Badge>
                                    )}
                                    {sale.utm_medium && !sale.utm_source && !sale.utm_campaign && (
                                      <Badge variant="outline" className="text-xs bg-emerald-500/10 text-emerald-500 border-emerald-500/30">
                                        {sale.utm_medium}
                                      </Badge>
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-sm text-muted-foreground">-</span>
                                )}
                              </td>
                              <td className="p-4">
                                <div className="flex flex-col gap-1">
                                  <Badge variant={status.variant} className="gap-1 w-fit">
                                    <StatusIcon className="h-3 w-3" />
                                    {status.label}
                                  </Badge>
                                  {(sale as any).is_recovered && (
                                    <Badge variant="outline" className="gap-1 w-fit text-xs bg-emerald-500/10 text-emerald-500 border-emerald-500/30">
                                      <RefreshCw className="h-3 w-3" />
                                      Recuperada
                                    </Badge>
                                  )}
                                </div>
                              </td>
                              <td className="p-4 hidden sm:table-cell">
                                <p className="text-sm text-muted-foreground">
                                  {format(new Date(sale.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                                </p>
                              </td>
                              <td className="p-4">
                                <div className="flex items-center gap-1">
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-8 w-8"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleSaleClick(sale);
                                    }}
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                    onClick={(e) => handleDeleteClick(sale, e)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Sale Detail Dialog */}
        <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Detalhes da Venda</DialogTitle>
            </DialogHeader>
            {selectedSale && (
              <div className="space-y-4">
                {/* Status */}
                <div className="flex justify-center">
                  {(() => {
                    const status = statusConfig[selectedSale.status as keyof typeof statusConfig] || statusConfig.pending;
                    const StatusIcon = status.icon;
                    return (
                      <Badge variant={status.variant} className="gap-1 text-base px-4 py-2">
                        <StatusIcon className="h-4 w-4" />
                        {status.label}
                      </Badge>
                    );
                  })()}
                </div>

                {/* Amount */}
                <div className="text-center space-y-1">
                  <p className="text-3xl font-bold text-primary">
                    R$ {Number(selectedSale.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                  {selectedSale.platform_fee !== undefined && selectedSale.seller_amount !== undefined && (
                    <div className="flex items-center justify-center gap-3 text-sm">
                      <span className="text-destructive">
                        Taxa: R$ {Number(selectedSale.platform_fee).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                      <span className="text-muted-foreground">•</span>
                      <span className="text-green-500">
                        Líquido: R$ {Number(selectedSale.seller_amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="space-y-3 p-4 bg-secondary/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Cliente</p>
                      <p className="font-medium">{selectedSale.buyer_name || "Não informado"}</p>
                      <p className="text-sm text-muted-foreground">{selectedSale.buyer_email}</p>
                      {selectedSale.buyer_phone && (
                        <p className="text-xs text-muted-foreground">Tel: {selectedSale.buyer_phone}</p>
                      )}
                      {selectedSale.buyer_cpf && (
                        <p className="text-xs text-muted-foreground">CPF: {selectedSale.buyer_cpf}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Package className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Produto Principal</p>
                      <p className="font-medium">{selectedSale.product?.name || "Produto não especificado"}</p>
                      {selectedSale.order_bump_products && selectedSale.order_bump_products.length > 0 && (
                        <div className="mt-2">
                          <p className="text-xs text-muted-foreground">Order Bumps:</p>
                          {selectedSale.order_bump_products.map((bump, idx) => (
                            <p key={bump.id} className="text-sm text-primary">• {bump.name}</p>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Criado em</p>
                      <p className="font-medium">
                        {format(new Date(selectedSale.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </p>
                    </div>
                  </div>

                  {selectedSale.paid_at && (
                    <div className="flex items-center gap-3">
                      <CreditCard className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Pago em</p>
                        <p className="font-medium text-green-500">
                          {format(new Date(selectedSale.paid_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </p>
                      </div>
                    </div>
                  )}

                  {selectedSale.status === 'pending' && (
                    <div className="flex items-center gap-3">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Expira em</p>
                        <p className="font-medium text-yellow-500">
                          {format(new Date(selectedSale.expires_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* UTM Parameters */}
                  {(selectedSale.utm_source || selectedSale.utm_medium || selectedSale.utm_campaign) && (
                    <div className="flex items-start gap-3 pt-2 border-t border-border">
                      <Link2 className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div className="flex-1">
                        <p className="text-xs text-muted-foreground mb-1">Origem (UTM)</p>
                        <div className="flex flex-wrap gap-1">
                          {selectedSale.utm_source && (
                            <Badge variant="outline" className="text-xs">
                              source: {selectedSale.utm_source}
                            </Badge>
                          )}
                          {selectedSale.utm_medium && (
                            <Badge variant="outline" className="text-xs">
                              medium: {selectedSale.utm_medium}
                            </Badge>
                          )}
                          {selectedSale.utm_campaign && (
                            <Badge variant="outline" className="text-xs">
                              campaign: {selectedSale.utm_campaign}
                            </Badge>
                          )}
                          {selectedSale.utm_content && (
                            <Badge variant="outline" className="text-xs">
                              content: {selectedSale.utm_content}
                            </Badge>
                          )}
                          {selectedSale.utm_term && (
                            <Badge variant="outline" className="text-xs">
                              term: {selectedSale.utm_term}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="pt-2 border-t border-border">
                    <p className="text-xs text-muted-foreground">ID da Cobrança</p>
                    <p className="font-mono text-xs">{selectedSale.id}</p>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir Venda</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir esta venda? Esta ação não pode ser desfeita e irá remover também a transação relacionada.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteSale}
                disabled={deleting}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {deleting ? "Excluindo..." : "Excluir"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  );
};

export default Sales;
