import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Search, Download, Eye, Filter, DollarSign, TrendingUp, Clock, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Transaction {
  id: string;
  amount: number;
  seller_amount: number;
  platform_fee: number;
  affiliate_amount: number;
  status: "pending" | "paid" | "expired" | "cancelled";
  created_at: string;
  seller_id: string | null;
  product_id: string | null;
  charge_id: string | null;
  seller_name?: string;
  seller_email?: string;
  product_name?: string;
  buyer_name?: string;
  buyer_email?: string;
}

interface TransactionStats {
  total: number;
  paid: number;
  pending: number;
  totalAmount: number;
  platformFees: number;
}

export function AdminTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [stats, setStats] = useState<TransactionStats>({
    total: 0,
    paid: 0,
    pending: 0,
    totalAmount: 0,
    platformFees: 0
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      // Fetch transactions with charge info
      const { data: transactionsData, error: transactionsError } = await supabase
        .from("transactions")
        .select("*, pix_charges(seller_id, product_id, buyer_name, buyer_email)")
        .order("created_at", { ascending: false });

      if (transactionsError) throw transactionsError;

      // Fetch seller profiles
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, email");

      // Fetch products
      const { data: products } = await supabase
        .from("products")
        .select("id, name");

      // Map data - use charge seller_id if transaction seller_id is null
      const enrichedTransactions = transactionsData?.map((t: any) => {
        const sellerId = t.seller_id || t.pix_charges?.seller_id;
        const productId = t.product_id || t.pix_charges?.product_id;
        const seller = profiles?.find((p) => p.user_id === sellerId);
        const product = products?.find((p) => p.id === productId);
        
        return {
          ...t,
          seller_id: sellerId,
          product_id: productId,
          seller_name: seller?.full_name || "Desconhecido",
          seller_email: seller?.email || "",
          product_name: product?.name || "Produto não identificado",
          buyer_name: t.pix_charges?.buyer_name || "N/A",
          buyer_email: t.pix_charges?.buyer_email || "N/A"
        };
      }) || [];

      setTransactions(enrichedTransactions);

      // Calculate stats
      const paidTransactions = enrichedTransactions.filter((t: Transaction) => t.status === "paid");
      setStats({
        total: enrichedTransactions.length,
        paid: paidTransactions.length,
        pending: enrichedTransactions.filter((t: Transaction) => t.status === "pending").length,
        totalAmount: paidTransactions.reduce((sum: number, t: Transaction) => sum + Number(t.amount), 0),
        platformFees: paidTransactions.reduce((sum: number, t: Transaction) => sum + Number(t.platform_fee), 0)
      });
    } catch (error) {
      console.error("Error fetching transactions:", error);
      toast({
        title: "Erro",
        description: "Falha ao carregar transações",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL"
    }).format(value);
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      pending: { label: "Pendente", variant: "secondary" },
      paid: { label: "Pago", variant: "default" },
      expired: { label: "Expirado", variant: "destructive" },
      cancelled: { label: "Cancelado", variant: "destructive" }
    };
    const config = statusMap[status] || { label: status, variant: "outline" };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const filteredTransactions = transactions.filter((t) => {
    const matchesSearch =
      t.seller_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.seller_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.product_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.buyer_email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || t.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const exportToCSV = () => {
    const headers = ["Data", "Produto", "Vendedor", "Comprador", "Valor", "Taxa", "Líquido", "Status"];
    const rows = filteredTransactions.map((t) => [
      format(new Date(t.created_at), "dd/MM/yyyy HH:mm"),
      t.product_name,
      t.seller_name,
      t.buyer_email,
      t.amount,
      t.platform_fee,
      t.seller_amount,
      t.status
    ]);

    const csvContent = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `transacoes_${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <>
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              Total de Transações
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              Transações Pagas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">{stats.paid}</div>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-primary" />
              Volume Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalAmount)}</div>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4 text-yellow-500" />
              Taxas da Plataforma
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{formatCurrency(stats.platformFees)}</div>
          </CardContent>
        </Card>
      </div>

      <Card className="glass-card">
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle>Todas as Transações</CardTitle>
              <CardDescription>
                {filteredTransactions.length} transações encontradas
              </CardDescription>
            </div>
            <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
              <div className="relative w-full md:w-64">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-40">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="paid">Pago</SelectItem>
                  <SelectItem value="expired">Expirado</SelectItem>
                  <SelectItem value="cancelled">Cancelado</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" onClick={exportToCSV}>
                <Download className="h-4 w-4 mr-2" />
                Exportar
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="p-3 text-left font-medium">Data</th>
                  <th className="p-3 text-left font-medium">Produto</th>
                  <th className="p-3 text-left font-medium">Vendedor</th>
                  <th className="p-3 text-left font-medium">Comprador</th>
                  <th className="p-3 text-left font-medium">Valor Total</th>
                  <th className="p-3 text-left font-medium">Taxa</th>
                  <th className="p-3 text-left font-medium">Líquido</th>
                  <th className="p-3 text-left font-medium">Status</th>
                  <th className="p-3 text-left font-medium">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-muted-foreground">
                      Nenhuma transação encontrada
                    </td>
                  </tr>
                ) : (
                  filteredTransactions.map((transaction) => (
                    <tr key={transaction.id} className="border-b hover:bg-muted/25">
                      <td className="p-3 text-muted-foreground whitespace-nowrap">
                        {format(new Date(transaction.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                      </td>
                      <td className="p-3">
                        <span className="font-medium">{transaction.product_name}</span>
                      </td>
                      <td className="p-3">
                        <div>
                          <p className="font-medium">{transaction.seller_name}</p>
                          <p className="text-sm text-muted-foreground">{transaction.seller_email}</p>
                        </div>
                      </td>
                      <td className="p-3">
                        <div>
                          <p className="font-medium">{transaction.buyer_name}</p>
                          <p className="text-sm text-muted-foreground">{transaction.buyer_email}</p>
                        </div>
                      </td>
                      <td className="p-3 font-medium">
                        {formatCurrency(transaction.amount)}
                      </td>
                      <td className="p-3 text-primary">
                        {formatCurrency(transaction.platform_fee)}
                      </td>
                      <td className="p-3">
                        {formatCurrency(transaction.seller_amount)}
                      </td>
                      <td className="p-3">
                        {getStatusBadge(transaction.status)}
                      </td>
                      <td className="p-3">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => setSelectedTransaction(transaction)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Transaction Detail Dialog */}
      <Dialog open={!!selectedTransaction} onOpenChange={() => setSelectedTransaction(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Detalhes da Transação</DialogTitle>
            <DialogDescription>
              Informações completas da transação
            </DialogDescription>
          </DialogHeader>
          {selectedTransaction && (
            <div className="space-y-4">
              <div className="rounded-lg border p-4 space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">ID:</span>
                  <span className="font-mono text-xs">{selectedTransaction.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Data:</span>
                  <span>{format(new Date(selectedTransaction.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Produto:</span>
                  <span className="font-medium">{selectedTransaction.product_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Vendedor:</span>
                  <span>{selectedTransaction.seller_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Comprador:</span>
                  <span>{selectedTransaction.buyer_email}</span>
                </div>
              </div>
              
              <div className="rounded-lg border p-4 space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Valor Total:</span>
                  <span className="font-bold">{formatCurrency(selectedTransaction.amount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Taxa Plataforma:</span>
                  <span className="text-primary">{formatCurrency(selectedTransaction.platform_fee)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Líquido Vendedor:</span>
                  <span className="font-medium">{formatCurrency(selectedTransaction.seller_amount)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Status:</span>
                  {getStatusBadge(selectedTransaction.status)}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}