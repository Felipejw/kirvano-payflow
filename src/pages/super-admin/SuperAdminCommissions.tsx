import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { 
  Percent, 
  DollarSign, 
  Users, 
  Clock, 
  CheckCircle2, 
  Search,
  Download,
  Edit,
  Loader2,
  CircleDollarSign,
  AlertCircle
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface TenantCommission {
  id: string;
  brand_name: string;
  admin_user_id: string;
  reseller_commission: number;
  created_at: string;
  profile?: {
    full_name: string | null;
    email: string | null;
  };
  stats: {
    total_sales: number;
    total_amount: number;
    pending_commission: number;
    paid_commission: number;
    paid_sales_count: number;
    unpaid_sales_count: number;
  };
}

type PaymentStatus = "paid" | "partial" | "pending" | "none";

const SuperAdminCommissions = () => {
  const navigate = useNavigate();
  const { isSuperAdmin, loading: roleLoading } = useUserRole();
  const [tenants, setTenants] = useState<TenantCommission[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingTenant, setEditingTenant] = useState<TenantCommission | null>(null);
  const [newCommission, setNewCommission] = useState(50);
  const [saving, setSaving] = useState(false);
  const [payingTenant, setPayingTenant] = useState<TenantCommission | null>(null);
  const [partialAmount, setPartialAmount] = useState("");
  const [isPaying, setIsPaying] = useState(false);

  useEffect(() => {
    if (!roleLoading && !isSuperAdmin) {
      navigate("/dashboard");
      return;
    }
    if (isSuperAdmin) {
      fetchTenantsWithCommissions();
    }
  }, [isSuperAdmin, roleLoading, navigate]);

  const fetchTenantsWithCommissions = async () => {
    try {
      // Fetch tenants
      const { data: tenantsData, error: tenantsError } = await supabase
        .from("tenants")
        .select("*")
        .eq("is_reseller", true)
        .order("created_at", { ascending: false });

      if (tenantsError) throw tenantsError;

      // Fetch sales for each tenant
      const tenantsWithStats = await Promise.all(
        (tenantsData || []).map(async (tenant) => {
          // Get profile
          const { data: profile } = await supabase
            .from("profiles")
            .select("full_name, email")
            .eq("user_id", tenant.admin_user_id)
            .single();

          // Get GateFlow sales for this tenant
          const { data: sales } = await supabase
            .from("gateflow_sales")
            .select("amount, commission_amount, status, commission_paid_at")
            .eq("reseller_tenant_id", tenant.id);

          const paidSales = sales?.filter(s => s.status === "paid") || [];
          const paidCommissions = paidSales.filter(s => s.commission_paid_at);
          const unpaidCommissions = paidSales.filter(s => !s.commission_paid_at);

          const stats = {
            total_sales: paidSales.length,
            total_amount: paidSales.reduce((sum, s) => sum + s.amount, 0),
            pending_commission: unpaidCommissions.reduce((sum, s) => sum + s.commission_amount, 0),
            paid_commission: paidCommissions.reduce((sum, s) => sum + s.commission_amount, 0),
            paid_sales_count: paidCommissions.length,
            unpaid_sales_count: unpaidCommissions.length,
          };

          return {
            ...tenant,
            profile: profile || undefined,
            stats,
          };
        })
      );

      setTenants(tenantsWithStats);
    } catch (error) {
      console.error("Error fetching tenants:", error);
      toast.error("Erro ao carregar dados de comissões");
    } finally {
      setLoading(false);
    }
  };

  const getPaymentStatus = (tenant: TenantCommission): PaymentStatus => {
    const { paid_sales_count, unpaid_sales_count, total_sales } = tenant.stats;
    
    if (total_sales === 0) return "none";
    if (unpaid_sales_count === 0 && paid_sales_count > 0) return "paid";
    if (paid_sales_count > 0 && unpaid_sales_count > 0) return "partial";
    return "pending";
  };

  const getPaymentStatusBadge = (status: PaymentStatus) => {
    switch (status) {
      case "paid":
        return (
          <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Pago Total
          </Badge>
        );
      case "partial":
        return (
          <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200">
            <CircleDollarSign className="h-3 w-3 mr-1" />
            Pago Parcial
          </Badge>
        );
      case "pending":
        return (
          <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
            <AlertCircle className="h-3 w-3 mr-1" />
            Pendente
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary">
            Sem vendas
          </Badge>
        );
    }
  };

  const handleEditCommission = (tenant: TenantCommission) => {
    setEditingTenant(tenant);
    setNewCommission(tenant.reseller_commission);
  };

  const handleSaveCommission = async () => {
    if (!editingTenant) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from("tenants")
        .update({ reseller_commission: newCommission })
        .eq("id", editingTenant.id);

      if (error) throw error;

      toast.success("Comissão atualizada com sucesso!");
      setEditingTenant(null);
      fetchTenantsWithCommissions();
    } catch (error) {
      console.error("Error updating commission:", error);
      toast.error("Erro ao atualizar comissão");
    } finally {
      setSaving(false);
    }
  };

  const handleOpenPayDialog = (tenant: TenantCommission) => {
    setPayingTenant(tenant);
    setPartialAmount("");
  };

  const handlePayFull = async () => {
    if (!payingTenant) return;

    setIsPaying(true);
    try {
      // Mark all pending commissions as paid for this tenant
      const { error } = await supabase
        .from("gateflow_sales")
        .update({ commission_paid_at: new Date().toISOString() })
        .eq("reseller_tenant_id", payingTenant.id)
        .eq("status", "paid")
        .is("commission_paid_at", null);

      if (error) throw error;

      toast.success("Todas as comissões foram marcadas como pagas!");
      setPayingTenant(null);
      fetchTenantsWithCommissions();
    } catch (error) {
      console.error("Error marking as paid:", error);
      toast.error("Erro ao marcar como pago");
    } finally {
      setIsPaying(false);
    }
  };

  const handlePayPartial = async () => {
    if (!payingTenant || !partialAmount) return;

    const amount = parseFloat(partialAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Valor inválido");
      return;
    }

    setIsPaying(true);
    try {
      // Get unpaid sales sorted by date
      const { data: unpaidSales, error: fetchError } = await supabase
        .from("gateflow_sales")
        .select("id, commission_amount")
        .eq("reseller_tenant_id", payingTenant.id)
        .eq("status", "paid")
        .is("commission_paid_at", null)
        .order("created_at", { ascending: true });

      if (fetchError) throw fetchError;

      // Mark sales as paid until we reach the amount
      let remainingAmount = amount;
      const salesToMark: string[] = [];

      for (const sale of unpaidSales || []) {
        if (remainingAmount >= sale.commission_amount) {
          salesToMark.push(sale.id);
          remainingAmount -= sale.commission_amount;
        } else {
          break;
        }
      }

      if (salesToMark.length === 0) {
        toast.error("Valor insuficiente para pagar alguma comissão");
        setIsPaying(false);
        return;
      }

      // Mark selected sales as paid
      const { error } = await supabase
        .from("gateflow_sales")
        .update({ commission_paid_at: new Date().toISOString() })
        .in("id", salesToMark);

      if (error) throw error;

      const paidAmount = amount - remainingAmount;
      toast.success(`${formatCurrency(paidAmount)} em comissões foram marcados como pagos!`);
      setPayingTenant(null);
      fetchTenantsWithCommissions();
    } catch (error) {
      console.error("Error marking partial as paid:", error);
      toast.error("Erro ao marcar como pago parcialmente");
    } finally {
      setIsPaying(false);
    }
  };

  const exportToCSV = () => {
    const headers = ["Afiliado", "Email", "Vendas", "Valor Total", "Comissão %", "Pendente", "Pago", "Status"];
    const rows = filteredTenants.map(t => [
      t.profile?.full_name || t.brand_name,
      t.profile?.email || "",
      t.stats.total_sales,
      t.stats.total_amount.toFixed(2),
      t.reseller_commission,
      t.stats.pending_commission.toFixed(2),
      t.stats.paid_commission.toFixed(2),
      getPaymentStatus(t),
    ]);

    const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `comissoes-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
  };

  const filteredTenants = tenants.filter(t => 
    t.brand_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.profile?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.profile?.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calculate totals
  const totals = {
    affiliates: tenants.length,
    pending: tenants.reduce((sum, t) => sum + t.stats.pending_commission, 0),
    paid: tenants.reduce((sum, t) => sum + t.stats.paid_commission, 0),
    total_sales: tenants.reduce((sum, t) => sum + t.stats.total_sales, 0),
  };

  if (roleLoading || loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Gerenciador de Comissões</h1>
            <p className="text-muted-foreground">Gerencie as comissões de todos os afiliados</p>
          </div>
          <Button onClick={exportToCSV} variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Exportar CSV
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Afiliados</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totals.affiliates}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Vendas Totais</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totals.total_sales}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Comissões Pendentes</CardTitle>
              <Clock className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-600">{formatCurrency(totals.pending)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Comissões Pagas</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{formatCurrency(totals.paid)}</div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Afiliados</CardTitle>
                <CardDescription>Lista de todos os afiliados e suas comissões</CardDescription>
              </div>
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar afiliado..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Afiliado</TableHead>
                  <TableHead className="text-center">Vendas</TableHead>
                  <TableHead className="text-center">Comissão %</TableHead>
                  <TableHead className="text-center">Status Pagamento</TableHead>
                  <TableHead className="text-right">Pendente</TableHead>
                  <TableHead className="text-right">Pago</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTenants.map((tenant) => {
                  const paymentStatus = getPaymentStatus(tenant);
                  return (
                    <TableRow key={tenant.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{tenant.profile?.full_name || tenant.brand_name}</p>
                          <p className="text-sm text-muted-foreground">{tenant.profile?.email || "—"}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary">{tenant.stats.total_sales}</Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline">{tenant.reseller_commission}%</Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        {getPaymentStatusBadge(paymentStatus)}
                      </TableCell>
                      <TableCell className="text-right">
                        {tenant.stats.pending_commission > 0 ? (
                          <span className="text-amber-600 font-medium">
                            {formatCurrency(tenant.stats.pending_commission)}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {tenant.stats.paid_commission > 0 ? (
                          <span className="text-green-600 font-medium">
                            {formatCurrency(tenant.stats.paid_commission)}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditCommission(tenant)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          {tenant.stats.pending_commission > 0 && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleOpenPayDialog(tenant)}
                            >
                              <CheckCircle2 className="mr-1 h-4 w-4" />
                              Pagar
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {filteredTenants.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      {searchTerm ? "Nenhum afiliado encontrado" : "Nenhum afiliado cadastrado"}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Edit Commission Dialog */}
        <Dialog open={!!editingTenant} onOpenChange={() => setEditingTenant(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Comissão</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <p className="font-medium">{editingTenant?.profile?.full_name || editingTenant?.brand_name}</p>
                <p className="text-sm text-muted-foreground">{editingTenant?.profile?.email}</p>
              </div>
              <div>
                <Label htmlFor="commission">Porcentagem de Comissão</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Input
                    id="commission"
                    type="number"
                    min="0"
                    max="100"
                    value={newCommission}
                    onChange={(e) => setNewCommission(Number(e.target.value))}
                    className="w-24"
                  />
                  <span className="text-muted-foreground">%</span>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingTenant(null)}>
                Cancelar
              </Button>
              <Button onClick={handleSaveCommission} disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Salvar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Pay Commission Dialog */}
        <Dialog open={!!payingTenant} onOpenChange={() => setPayingTenant(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Pagar Comissão</DialogTitle>
              <DialogDescription>
                Escolha pagar o valor total ou um valor parcial
              </DialogDescription>
            </DialogHeader>
            {payingTenant && (
              <div className="space-y-4">
                <div className="p-4 bg-muted rounded-lg">
                  <p className="font-medium">{payingTenant.profile?.full_name || payingTenant.brand_name}</p>
                  <p className="text-sm text-muted-foreground">{payingTenant.profile?.email}</p>
                  <div className="mt-2">
                    <p className="text-lg font-bold text-amber-600">
                      Pendente: {formatCurrency(payingTenant.stats.pending_commission)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {payingTenant.stats.unpaid_sales_count} venda(s) sem pagamento
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <Button 
                    className="w-full" 
                    onClick={handlePayFull}
                    disabled={isPaying}
                  >
                    {isPaying ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                    )}
                    Pagar Total ({formatCurrency(payingTenant.stats.pending_commission)})
                  </Button>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-background px-2 text-muted-foreground">ou</span>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="partial_amount">Valor Parcial (R$)</Label>
                    <div className="flex gap-2 mt-1">
                      <Input
                        id="partial_amount"
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0,00"
                        value={partialAmount}
                        onChange={(e) => setPartialAmount(e.target.value)}
                      />
                      <Button 
                        variant="outline" 
                        onClick={handlePayPartial}
                        disabled={isPaying || !partialAmount}
                      >
                        {isPaying ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          "Pagar"
                        )}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Será pago até atingir o valor informado (por ordem de venda mais antiga)
                    </p>
                  </div>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setPayingTenant(null)}>
                Cancelar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default SuperAdminCommissions;