import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Search, 
  Filter,
  Download,
  QrCode,
  ArrowUpRight,
  ArrowDownLeft,
  Clock,
  CheckCircle,
  XCircle,
  RefreshCw,
  X,
  Calendar
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Transaction {
  id: string;
  amount: number;
  seller_amount: number;
  platform_fee: number;
  affiliate_amount: number;
  status: string;
  created_at: string;
  product?: {
    name: string;
  } | null;
  charge?: {
    buyer_name: string | null;
    buyer_email: string;
  } | null;
}

interface TransactionStats {
  receivedToday: number;
  pending: number;
  refunds: number;
  totalTransactions: number;
}

const statusConfig = {
  paid: { 
    label: "Aprovado", 
    variant: "success" as const,
    icon: CheckCircle 
  },
  pending: { 
    label: "Pendente", 
    variant: "warning" as const,
    icon: Clock 
  },
  expired: { 
    label: "Expirado", 
    variant: "destructive" as const,
    icon: XCircle 
  },
  cancelled: { 
    label: "Cancelado", 
    variant: "secondary" as const,
    icon: RefreshCw 
  },
};

const Transactions = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [stats, setStats] = useState<TransactionStats>({
    receivedToday: 0,
    pending: 0,
    refunds: 0,
    totalTransactions: 0,
  });
  
  // Filter states
  const [filterOpen, setFilterOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("all");
  const [minAmount, setMinAmount] = useState<string>("");
  const [maxAmount, setMaxAmount] = useState<string>("");

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return;

    const { data, error } = await supabase
      .from('transactions')
      .select(`
        *,
        product:products(name),
        charge:pix_charges(buyer_name, buyer_email)
      `)
      .eq('seller_id', user.id)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setTransactions(data);
      calculateStats(data);
    }
    setLoading(false);
  };

  const calculateStats = (data: Transaction[]) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const receivedToday = data
      .filter(t => t.status === 'paid' && new Date(t.created_at) >= today)
      .reduce((acc, t) => acc + Number(t.seller_amount), 0);

    const pending = data
      .filter(t => t.status === 'pending')
      .reduce((acc, t) => acc + Number(t.amount), 0);

    const refunds = data
      .filter(t => t.status === 'cancelled')
      .reduce((acc, t) => acc + Number(t.amount), 0);

    setStats({
      receivedToday,
      pending,
      refunds,
      totalTransactions: data.length,
    });
  };

  const applyFilters = () => {
    let filtered = [...transactions];

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(t => t.status === statusFilter);
    }

    // Date filter
    if (dateFilter !== "all") {
      const now = new Date();
      let startDate: Date;

      switch (dateFilter) {
        case "today":
          startDate = new Date(now.setHours(0, 0, 0, 0));
          break;
        case "week":
          startDate = new Date(now.setDate(now.getDate() - 7));
          break;
        case "month":
          startDate = new Date(now.setMonth(now.getMonth() - 1));
          break;
        default:
          startDate = new Date(0);
      }

      filtered = filtered.filter(t => new Date(t.created_at) >= startDate);
    }

    // Amount filters
    if (minAmount) {
      filtered = filtered.filter(t => Number(t.amount) >= parseFloat(minAmount));
    }
    if (maxAmount) {
      filtered = filtered.filter(t => Number(t.amount) <= parseFloat(maxAmount));
    }

    return filtered;
  };

  const clearFilters = () => {
    setStatusFilter("all");
    setDateFilter("all");
    setMinAmount("");
    setMaxAmount("");
  };

  const hasActiveFilters = statusFilter !== "all" || dateFilter !== "all" || minAmount || maxAmount;

  const filteredTransactions = applyFilters().filter(t => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      t.id.toLowerCase().includes(search) ||
      t.charge?.buyer_email?.toLowerCase().includes(search) ||
      t.charge?.buyer_name?.toLowerCase().includes(search) ||
      t.product?.name?.toLowerCase().includes(search)
    );
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Transações</h1>
            <p className="text-muted-foreground">Histórico completo de pagamentos</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" className="gap-2">
              <Download className="h-4 w-4" />
              Exportar
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card variant="glass">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-accent/10">
                  <ArrowDownLeft className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Recebido Hoje</p>
                  <p className="text-xl font-bold">
                    R$ {stats.receivedToday.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card variant="glass">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Clock className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Pendente</p>
                  <p className="text-xl font-bold">
                    R$ {stats.pending.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card variant="glass">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-destructive/10">
                  <ArrowUpRight className="h-5 w-5 text-destructive" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Cancelados</p>
                  <p className="text-xl font-bold">
                    R$ {stats.refunds.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card variant="glass">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-yellow-500/10">
                  <QrCode className="h-5 w-5 text-yellow-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Transações</p>
                  <p className="text-xl font-bold">{stats.totalTransactions}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card variant="glass">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Buscar por ID, cliente, email..." 
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Popover open={filterOpen} onOpenChange={setFilterOpen}>
                <PopoverTrigger asChild>
                  <Button variant={hasActiveFilters ? "default" : "outline"} className="gap-2">
                    <Filter className="h-4 w-4" />
                    Filtros
                    {hasActiveFilters && (
                      <Badge variant="secondary" className="ml-1">
                        {[statusFilter !== "all", dateFilter !== "all", minAmount, maxAmount].filter(Boolean).length}
                      </Badge>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80" align="end">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold">Filtros</h4>
                      {hasActiveFilters && (
                        <Button variant="ghost" size="sm" onClick={clearFilters}>
                          <X className="h-4 w-4 mr-1" />
                          Limpar
                        </Button>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label>Status</Label>
                      <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger>
                          <SelectValue placeholder="Todos" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todos</SelectItem>
                          <SelectItem value="paid">Aprovado</SelectItem>
                          <SelectItem value="pending">Pendente</SelectItem>
                          <SelectItem value="expired">Expirado</SelectItem>
                          <SelectItem value="cancelled">Cancelado</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Período</Label>
                      <Select value={dateFilter} onValueChange={setDateFilter}>
                        <SelectTrigger>
                          <SelectValue placeholder="Todos" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todos</SelectItem>
                          <SelectItem value="today">Hoje</SelectItem>
                          <SelectItem value="week">Última semana</SelectItem>
                          <SelectItem value="month">Último mês</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Valor</Label>
                      <div className="flex gap-2">
                        <Input
                          type="number"
                          placeholder="Mín"
                          value={minAmount}
                          onChange={(e) => setMinAmount(e.target.value)}
                        />
                        <Input
                          type="number"
                          placeholder="Máx"
                          value={maxAmount}
                          onChange={(e) => setMaxAmount(e.target.value)}
                        />
                      </div>
                    </div>

                    <Button 
                      variant="gradient" 
                      className="w-full"
                      onClick={() => setFilterOpen(false)}
                    >
                      Aplicar Filtros
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </CardContent>
        </Card>

        {/* Transactions Table */}
        <Card variant="glass">
          <CardContent className="p-0">
            {loading ? (
              <div className="text-center py-12 text-muted-foreground">Carregando transações...</div>
            ) : filteredTransactions.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                {searchTerm || hasActiveFilters ? "Nenhuma transação encontrada com os filtros aplicados" : "Nenhuma transação encontrada"}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Cliente</th>
                      <th>Produto</th>
                      <th>Valor</th>
                      <th>Taxa (7%)</th>
                      <th>Líquido</th>
                      <th>Status</th>
                      <th>Data</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTransactions.map((tx) => {
                      const statusInfo = statusConfig[tx.status as keyof typeof statusConfig] || statusConfig.pending;
                      const StatusIcon = statusInfo.icon;
                      const platformFee = Number(tx.platform_fee);
                      const sellerAmount = Number(tx.seller_amount);
                      
                      return (
                        <tr key={tx.id} className="group cursor-pointer">
                          <td className="font-mono text-sm text-primary">
                            {tx.id.substring(0, 8)}...
                          </td>
                          <td>
                            <div>
                              <p className="font-medium">{tx.charge?.buyer_name || "—"}</p>
                              <p className="text-xs text-muted-foreground">{tx.charge?.buyer_email || "—"}</p>
                            </div>
                          </td>
                          <td className="max-w-[200px]">
                            <p className="truncate">{tx.product?.name || "—"}</p>
                          </td>
                          <td className="font-semibold">
                            R$ {Number(tx.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="text-muted-foreground">
                            R$ {platformFee.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="text-accent font-medium">
                            R$ {sellerAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </td>
                          <td>
                            <Badge 
                              variant={statusInfo.variant}
                              className="gap-1"
                            >
                              <StatusIcon className="h-3 w-3" />
                              {statusInfo.label}
                            </Badge>
                          </td>
                          <td className="text-sm text-muted-foreground whitespace-nowrap">
                            {format(new Date(tx.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
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
      </div>
    </DashboardLayout>
  );
};

export default Transactions;