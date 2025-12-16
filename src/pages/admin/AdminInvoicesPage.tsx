import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  FileText, Clock, CheckCircle, AlertTriangle, XCircle, ArrowLeft, 
  Search, Ban, RefreshCw, DollarSign, TrendingUp, Users, AlertCircle, X 
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAppNavigate } from "@/lib/routes";
import { useUserRole } from "@/hooks/useUserRole";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

interface Invoice {
  id: string;
  user_id: string;
  period_start: string;
  period_end: string;
  total_sales: number;
  total_amount: number;
  fee_percentage: number;
  fee_fixed: number;
  fee_total: number;
  status: string;
  due_date: string;
  paid_at: string | null;
  profiles?: {
    full_name: string | null;
    email: string | null;
    company_name: string | null;
  };
}

interface Stats {
  totalInvoices: number;
  pendingCount: number;
  pendingAmount: number;
  overdueCount: number;
  overdueAmount: number;
  paidAmount: number;
}

export default function AdminInvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [filteredInvoices, setFilteredInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [stats, setStats] = useState<Stats>({
    totalInvoices: 0,
    pendingCount: 0,
    pendingAmount: 0,
    overdueCount: 0,
    overdueAmount: 0,
    paidAmount: 0,
  });
  const [blockingInvoice, setBlockingInvoice] = useState<string | null>(null);
  const navigate = useAppNavigate();
  const { isAdmin, loading: roleLoading } = useUserRole();

  useEffect(() => {
    if (!roleLoading && !isAdmin) {
      navigate("dashboard");
    }
  }, [isAdmin, roleLoading, navigate]);

  useEffect(() => {
    if (isAdmin) fetchInvoices();
  }, [isAdmin]);

  useEffect(() => {
    filterInvoices();
  }, [invoices, searchTerm, statusFilter]);

  const fetchInvoices = async () => {
    setLoading(true);
    
    // First fetch invoices
    const { data: invoicesData, error } = await supabase
      .from("platform_invoices")
      .select("*")
      .order("due_date", { ascending: true });

    if (error) {
      console.error("Error fetching invoices:", error);
      toast.error("Erro ao carregar faturas");
      setLoading(false);
      return;
    }

    // Then fetch profiles for each unique user_id
    const userIds = [...new Set((invoicesData || []).map((inv) => inv.user_id))];
    
    const { data: profilesData } = await supabase
      .from("profiles")
      .select("user_id, full_name, email, company_name")
      .in("user_id", userIds);

    // Create a map for quick lookup
    const profilesMap = new Map(
      (profilesData || []).map((p) => [p.user_id, p])
    );

    // Merge invoices with profiles
    const invoicesWithProfiles: Invoice[] = (invoicesData || []).map((inv) => ({
      ...inv,
      profiles: profilesMap.get(inv.user_id) || undefined,
    }));

    setInvoices(invoicesWithProfiles);

    // Calculate stats
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const newStats: Stats = {
      totalInvoices: invoicesData.length,
      pendingCount: 0,
      pendingAmount: 0,
      overdueCount: 0,
      overdueAmount: 0,
      paidAmount: 0,
    };

    invoicesData.forEach((inv) => {
      if (inv.status === "paid") {
        newStats.paidAmount += inv.fee_total;
      } else if (inv.status === "pending") {
        const dueDate = new Date(inv.due_date);
        if (dueDate < today) {
          newStats.overdueCount++;
          newStats.overdueAmount += inv.fee_total;
        } else {
          newStats.pendingCount++;
          newStats.pendingAmount += inv.fee_total;
        }
      } else if (inv.status === "overdue" || inv.status === "blocked") {
        newStats.overdueCount++;
        newStats.overdueAmount += inv.fee_total;
      }
    });

    setStats(newStats);
    setLoading(false);
  };

  const filterInvoices = () => {
    let filtered = [...invoices];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter((inv) => {
        const profile = inv.profiles;
        return (
          profile?.full_name?.toLowerCase().includes(term) ||
          profile?.email?.toLowerCase().includes(term) ||
          profile?.company_name?.toLowerCase().includes(term) ||
          inv.user_id.toLowerCase().includes(term)
        );
      });
    }

    if (statusFilter !== "all") {
      if (statusFilter === "overdue") {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        filtered = filtered.filter((inv) => {
          const dueDate = new Date(inv.due_date);
          return (inv.status === "pending" && dueDate < today) || inv.status === "overdue";
        });
      } else {
        filtered = filtered.filter((inv) => inv.status === statusFilter);
      }
    }

    setFilteredInvoices(filtered);
  };

  const handleBlockSeller = async (invoice: Invoice) => {
    if (!confirm(`Tem certeza que deseja bloquear o vendedor por não pagamento da fatura?`)) {
      return;
    }

    setBlockingInvoice(invoice.id);
    try {
      // Update invoice status
      await supabase
        .from("platform_invoices")
        .update({ status: "blocked" })
        .eq("id", invoice.id);

      // Create seller block
      await supabase
        .from("seller_blocks")
        .insert({
          user_id: invoice.user_id,
          invoice_id: invoice.id,
          reason: "unpaid_invoice",
          is_active: true,
        });

      toast.success("Vendedor bloqueado com sucesso");
      fetchInvoices();
    } catch (error) {
      console.error("Error blocking seller:", error);
      toast.error("Erro ao bloquear vendedor");
    } finally {
      setBlockingInvoice(null);
    }
  };

  const handleMarkAsPaid = async (invoice: Invoice) => {
    if (!confirm(`Marcar esta fatura como paga manualmente?`)) {
      return;
    }

    try {
      // Update invoice
      await supabase
        .from("platform_invoices")
        .update({ 
          status: "paid", 
          paid_at: new Date().toISOString() 
        })
        .eq("id", invoice.id);

      // Mark transactions as fee_paid
      await supabase
        .from("transactions")
        .update({
          fee_paid_at: new Date().toISOString(),
          fee_invoice_id: invoice.id,
        })
        .eq("seller_id", invoice.user_id)
        .eq("status", "paid")
        .is("fee_paid_at", null)
        .gte("created_at", invoice.period_start)
        .lte("created_at", invoice.period_end);

      // Unblock seller if blocked
      await supabase
        .from("seller_blocks")
        .update({ is_active: false, unblocked_at: new Date().toISOString() })
        .eq("invoice_id", invoice.id)
        .eq("is_active", true);

      toast.success("Fatura marcada como paga");
      fetchInvoices();
    } catch (error) {
      console.error("Error marking as paid:", error);
      toast.error("Erro ao marcar como paga");
    }
  };

  const handleCancelInvoice = async (invoice: Invoice) => {
    if (!confirm(`Tem certeza que deseja cancelar esta fatura?`)) {
      return;
    }

    try {
      await supabase
        .from("platform_invoices")
        .update({ status: "cancelled" })
        .eq("id", invoice.id);

      toast.success("Fatura cancelada com sucesso");
      fetchInvoices();
    } catch (error) {
      console.error("Error cancelling invoice:", error);
      toast.error("Erro ao cancelar fatura");
    }
  };

  const getStatusBadge = (invoice: Invoice) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDate = new Date(invoice.due_date);
    const isOverdue = invoice.status === "pending" && dueDate < today;

    if (invoice.status === "paid") {
      return <Badge variant="success"><CheckCircle className="h-3 w-3 mr-1" />Pago</Badge>;
    }
    if (invoice.status === "blocked") {
      return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Bloqueado</Badge>;
    }
    if (invoice.status === "cancelled") {
      return <Badge variant="secondary"><X className="h-3 w-3 mr-1" />Cancelado</Badge>;
    }
    if (isOverdue || invoice.status === "overdue") {
      return <Badge variant="destructive"><AlertTriangle className="h-3 w-3 mr-1" />Vencida</Badge>;
    }
    return <Badge variant="warning"><Clock className="h-3 w-3 mr-1" />Pendente</Badge>;
  };

  const formatCurrency = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const getSellerName = (invoice: Invoice) => {
    const profile = invoice.profiles;
    if (profile?.company_name) return profile.company_name;
    if (profile?.full_name) return profile.full_name;
    if (profile?.email) return profile.email;
    return invoice.user_id.slice(0, 8) + "...";
  };

  if (roleLoading || loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("admin")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold">Faturas da Plataforma</h1>
            <p className="text-muted-foreground">Gerencie as faturas de taxas dos vendedores</p>
          </div>
          <Button variant="outline" onClick={fetchInvoices}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.totalInvoices}</p>
                  <p className="text-sm text-muted-foreground">Total de Faturas</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-yellow-500/10 rounded-lg">
                  <Clock className="h-6 w-6 text-yellow-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.pendingCount}</p>
                  <p className="text-sm text-muted-foreground">
                    Pendentes ({formatCurrency(stats.pendingAmount)})
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-destructive/50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-destructive/10 rounded-lg">
                  <AlertCircle className="h-6 w-6 text-destructive" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-destructive">{stats.overdueCount}</p>
                  <p className="text-sm text-muted-foreground">
                    Vencidas ({formatCurrency(stats.overdueAmount)})
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-500/10 rounded-lg">
                  <DollarSign className="h-6 w-6 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-500">{formatCurrency(stats.paidAmount)}</p>
                  <p className="text-sm text-muted-foreground">Total Recebido</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome, email ou empresa..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-[200px]">
                  <SelectValue placeholder="Filtrar por status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="pending">Pendentes</SelectItem>
                  <SelectItem value="overdue">Vencidas</SelectItem>
                  <SelectItem value="paid">Pagas</SelectItem>
                  <SelectItem value="blocked">Bloqueados</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Invoices Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Faturas ({filteredInvoices.length})
            </CardTitle>
            <CardDescription>
              Clique em uma fatura vencida para bloquear o vendedor ou marcar como paga
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredInvoices.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                Nenhuma fatura encontrada
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left p-4 font-medium text-muted-foreground">Vendedor</th>
                      <th className="text-left p-4 font-medium text-muted-foreground">Período</th>
                      <th className="text-left p-4 font-medium text-muted-foreground">Vendas</th>
                      <th className="text-left p-4 font-medium text-muted-foreground">Total</th>
                      <th className="text-left p-4 font-medium text-muted-foreground">Taxa</th>
                      <th className="text-left p-4 font-medium text-muted-foreground">Vencimento</th>
                      <th className="text-left p-4 font-medium text-muted-foreground">Status</th>
                      <th className="text-left p-4 font-medium text-muted-foreground">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredInvoices.map((inv) => {
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      const dueDate = new Date(inv.due_date);
                      const isOverdue = inv.status === "pending" && dueDate < today;
                      const canBlock = isOverdue || inv.status === "overdue";
                      const canMarkPaid = inv.status !== "paid";

                      return (
                        <tr key={inv.id} className="border-b border-border/50 hover:bg-secondary/50">
                          <td className="p-4">
                            <div>
                              <p className="font-medium">{getSellerName(inv)}</p>
                              {inv.profiles?.email && (
                                <p className="text-xs text-muted-foreground">{inv.profiles.email}</p>
                              )}
                            </div>
                          </td>
                          <td className="p-4">
                            {format(new Date(inv.period_start), "dd/MM", { locale: ptBR })} -{" "}
                            {format(new Date(inv.period_end), "dd/MM", { locale: ptBR })}
                          </td>
                          <td className="p-4">{inv.total_sales}</td>
                          <td className="p-4">{formatCurrency(inv.total_amount || 0)}</td>
                          <td className="p-4 font-semibold text-primary">
                            {formatCurrency(inv.fee_total)}
                          </td>
                          <td className="p-4">
                            <span className={isOverdue ? "text-destructive font-medium" : ""}>
                              {format(new Date(inv.due_date), "dd/MM/yyyy", { locale: ptBR })}
                            </span>
                          </td>
                          <td className="p-4">{getStatusBadge(inv)}</td>
                          <td className="p-4">
                            <div className="flex gap-2">
                              {canMarkPaid && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleMarkAsPaid(inv)}
                                >
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Pago
                                </Button>
                              )}
                              {canBlock && inv.status !== "blocked" && (
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => handleBlockSeller(inv)}
                                  disabled={blockingInvoice === inv.id}
                                >
                                  {blockingInvoice === inv.id ? (
                                    <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                                  ) : (
                                    <Ban className="h-3 w-3 mr-1" />
                                  )}
                                  Bloquear
                                </Button>
                              )}
                              {canMarkPaid && inv.status !== "cancelled" && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="text-muted-foreground hover:text-destructive"
                                  onClick={() => handleCancelInvoice(inv)}
                                >
                                  <X className="h-3 w-3 mr-1" />
                                  Cancelar
                                </Button>
                              )}
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
      </div>
    </DashboardLayout>
  );
}
