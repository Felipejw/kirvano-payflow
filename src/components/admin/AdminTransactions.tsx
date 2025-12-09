import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Download, Eye, Filter } from "lucide-react";
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
  seller_id: string;
  product_id: string;
  seller_name?: string;
  seller_email?: string;
  product_name?: string;
}

export function AdminTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const { toast } = useToast();

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      const { data: transactionsData, error: transactionsError } = await supabase
        .from("transactions")
        .select("*")
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

      // Map data
      const enrichedTransactions = transactionsData?.map((t) => {
        const seller = profiles?.find((p) => p.user_id === t.seller_id);
        const product = products?.find((p) => p.id === t.product_id);
        return {
          ...t,
          seller_name: seller?.full_name || "Desconhecido",
          seller_email: seller?.email || "",
          product_name: product?.name || "Produto removido"
        };
      }) || [];

      setTransactions(enrichedTransactions);
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
      t.product_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || t.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const exportToCSV = () => {
    const headers = ["Data", "Produto", "Vendedor", "Valor", "Taxa", "Líquido", "Status"];
    const rows = filteredTransactions.map((t) => [
      format(new Date(t.created_at), "dd/MM/yyyy HH:mm"),
      t.product_name,
      t.seller_name,
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
    <Card className="glass-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Todas as Transações</CardTitle>
            <CardDescription>
              {filteredTransactions.length} transações encontradas
            </CardDescription>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por vendedor ou produto..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
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
        <div className="rounded-md border">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="p-3 text-left font-medium">Data</th>
                <th className="p-3 text-left font-medium">Produto</th>
                <th className="p-3 text-left font-medium">Vendedor</th>
                <th className="p-3 text-left font-medium">Valor Total</th>
                <th className="p-3 text-left font-medium">Taxa</th>
                <th className="p-3 text-left font-medium">Líquido Vendedor</th>
                <th className="p-3 text-left font-medium">Status</th>
                <th className="p-3 text-left font-medium">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-muted-foreground">
                    Nenhuma transação encontrada
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((transaction) => (
                  <tr key={transaction.id} className="border-b hover:bg-muted/25">
                    <td className="p-3 text-muted-foreground">
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
                      <Button variant="ghost" size="sm">
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
  );
}
