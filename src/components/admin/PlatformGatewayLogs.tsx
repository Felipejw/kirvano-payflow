import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  RefreshCw, 
  Search, 
  Eye, 
  AlertCircle, 
  CheckCircle2, 
  Clock,
  XCircle,
  Server
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface GatewayLog {
  id: string;
  seller_id: string;
  charge_id: string | null;
  transaction_id: string | null;
  action: string;
  amount: number;
  product_id: string | null;
  buyer_email: string | null;
  buyer_name: string | null;
  external_id: string | null;
  gateway_response: Record<string, unknown> | null;
  error_message: string | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
  profiles?: {
    full_name: string | null;
    email: string | null;
  };
  products?: {
    name: string | null;
  };
}

export function PlatformGatewayLogs() {
  const [logs, setLogs] = useState<GatewayLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [actionFilter, setActionFilter] = useState<string>("all");
  const [selectedLog, setSelectedLog] = useState<GatewayLog | null>(null);
  const [stats, setStats] = useState({
    total: 0,
    created: 0,
    paid: 0,
    errors: 0,
    totalAmount: 0,
  });

  const fetchLogs = async () => {
    setLoading(true);
    try {
      // First fetch logs
      let query = supabase
        .from('platform_gateway_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(500);

      if (actionFilter !== "all") {
        query = query.eq('action', actionFilter);
      }

      const { data: logsData, error } = await query;

      if (error) {
        console.error('Error fetching logs:', error);
        return;
      }

      // Fetch profiles and products for the logs
      const sellerIds = [...new Set(logsData?.map(l => l.seller_id) || [])];
      const productIds = [...new Set(logsData?.filter(l => l.product_id).map(l => l.product_id) || [])];

      const [profilesRes, productsRes] = await Promise.all([
        sellerIds.length > 0 
          ? supabase.from('profiles').select('user_id, full_name, email').in('user_id', sellerIds)
          : { data: [] },
        productIds.length > 0
          ? supabase.from('products').select('id, name').in('id', productIds)
          : { data: [] }
      ]);

      const profilesMap = new Map((profilesRes.data || []).map(p => [p.user_id, p]));
      const productsMap = new Map((productsRes.data || []).map(p => [p.id, p]));

      // Combine data
      const enrichedLogs = (logsData || []).map(log => ({
        ...log,
        profiles: profilesMap.get(log.seller_id) || null,
        products: productsMap.get(log.product_id) || null,
      }));

      // Apply search filter client-side
      let filteredLogs = enrichedLogs;
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        filteredLogs = filteredLogs.filter(log => 
          log.buyer_email?.toLowerCase().includes(term) ||
          log.buyer_name?.toLowerCase().includes(term) ||
          log.external_id?.toLowerCase().includes(term) ||
          log.profiles?.full_name?.toLowerCase().includes(term) ||
          log.profiles?.email?.toLowerCase().includes(term)
        );
      }

      setLogs(filteredLogs as GatewayLog[]);

      // Calculate stats
      const allLogs = logsData || [];
      setStats({
        total: allLogs.length,
        created: allLogs.filter(l => l.action === 'pix_created').length,
        paid: allLogs.filter(l => l.action === 'pix_paid').length,
        errors: allLogs.filter(l => l.action === 'error').length,
        totalAmount: allLogs
          .filter(l => l.action === 'pix_paid')
          .reduce((sum, l) => sum + Number(l.amount), 0),
      });
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [actionFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchLogs();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'pix_created':
        return <Badge variant="secondary" className="gap-1"><Clock className="h-3 w-3" /> PIX Criado</Badge>;
      case 'pix_paid':
        return <Badge variant="default" className="gap-1 bg-green-600"><CheckCircle2 className="h-3 w-3" /> Pago</Badge>;
      case 'pix_expired':
        return <Badge variant="outline" className="gap-1"><XCircle className="h-3 w-3" /> Expirado</Badge>;
      case 'error':
        return <Badge variant="destructive" className="gap-1"><AlertCircle className="h-3 w-3" /> Erro</Badge>;
      default:
        return <Badge variant="outline">{action}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Server className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Total de Logs</span>
            </div>
            <p className="text-2xl font-bold">{stats.total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-500" />
              <span className="text-sm text-muted-foreground">PIX Criados</span>
            </div>
            <p className="text-2xl font-bold">{stats.created}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span className="text-sm text-muted-foreground">Pagos</span>
            </div>
            <p className="text-2xl font-bold">{stats.paid}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-destructive" />
              <span className="text-sm text-muted-foreground">Erros</span>
            </div>
            <p className="text-2xl font-bold">{stats.errors}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Total Pago</span>
            </div>
            <p className="text-2xl font-bold text-green-600">{formatCurrency(stats.totalAmount)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            Logs do Gateway da Plataforma
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por email, nome, vendedor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filtrar ação" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as ações</SelectItem>
                <SelectItem value="pix_created">PIX Criado</SelectItem>
                <SelectItem value="pix_paid">Pago</SelectItem>
                <SelectItem value="pix_expired">Expirado</SelectItem>
                <SelectItem value="error">Erro</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={fetchLogs} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              Nenhum log encontrado
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data/Hora</TableHead>
                    <TableHead>Ação</TableHead>
                    <TableHead>Vendedor</TableHead>
                    <TableHead>Comprador</TableHead>
                    <TableHead>Produto</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead>Detalhes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="whitespace-nowrap">
                        {format(new Date(log.created_at), "dd/MM/yyyy HH:mm:ss", { locale: ptBR })}
                      </TableCell>
                      <TableCell>{getActionBadge(log.action)}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <p className="font-medium">{log.profiles?.full_name || 'N/A'}</p>
                          <p className="text-muted-foreground text-xs">{log.profiles?.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <p className="font-medium">{log.buyer_name || 'N/A'}</p>
                          <p className="text-muted-foreground text-xs">{log.buyer_email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{log.products?.name || 'N/A'}</span>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(Number(log.amount))}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedLog(log)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalhes do Log</DialogTitle>
          </DialogHeader>
          {selectedLog && (
            <ScrollArea className="max-h-[60vh]">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-muted-foreground">ID do Log</label>
                    <p className="font-mono text-sm">{selectedLog.id}</p>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">Ação</label>
                    <p>{getActionBadge(selectedLog.action)}</p>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">Data/Hora</label>
                    <p>{format(new Date(selectedLog.created_at), "dd/MM/yyyy HH:mm:ss", { locale: ptBR })}</p>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">Valor</label>
                    <p className="font-bold">{formatCurrency(Number(selectedLog.amount))}</p>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">External ID</label>
                    <p className="font-mono text-sm">{selectedLog.external_id || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">Charge ID</label>
                    <p className="font-mono text-sm">{selectedLog.charge_id || 'N/A'}</p>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-semibold mb-2">Vendedor</h4>
                  <p>{selectedLog.profiles?.full_name || 'N/A'}</p>
                  <p className="text-sm text-muted-foreground">{selectedLog.profiles?.email}</p>
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-semibold mb-2">Comprador</h4>
                  <p>{selectedLog.buyer_name || 'N/A'}</p>
                  <p className="text-sm text-muted-foreground">{selectedLog.buyer_email}</p>
                </div>

                {selectedLog.error_message && (
                  <div className="border-t pt-4">
                    <h4 className="font-semibold mb-2 text-destructive">Mensagem de Erro</h4>
                    <p className="text-sm bg-destructive/10 p-3 rounded-md font-mono">
                      {selectedLog.error_message}
                    </p>
                  </div>
                )}

                {selectedLog.gateway_response && (
                  <div className="border-t pt-4">
                    <h4 className="font-semibold mb-2">Resposta do Gateway</h4>
                    <pre className="text-xs bg-muted p-3 rounded-md overflow-auto max-h-48">
                      {JSON.stringify(selectedLog.gateway_response, null, 2)}
                    </pre>
                  </div>
                )}

                <div className="border-t pt-4 grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <label className="text-muted-foreground">IP Address</label>
                    <p className="font-mono">{selectedLog.ip_address || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-muted-foreground">User Agent</label>
                    <p className="text-xs truncate">{selectedLog.user_agent || 'N/A'}</p>
                  </div>
                </div>
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
