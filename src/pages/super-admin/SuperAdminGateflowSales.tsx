import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { DollarSign, TrendingUp, Users, CheckCircle, MoreHorizontal, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface GateflowSale {
  id: string;
  reseller_tenant_id: string | null;
  reseller_user_id: string | null;
  buyer_email: string;
  buyer_name: string | null;
  amount: number;
  commission_amount: number;
  commission_paid_at: string | null;
  status: string;
  transaction_id: string | null;
  created_at: string;
  tenant?: {
    brand_name: string;
  };
}

const SuperAdminGateflowSales = () => {
  const navigate = useNavigate();
  const { isSuperAdmin, loading: roleLoading } = useUserRole();
  const [sales, setSales] = useState<GateflowSale[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingSaleId, setDeletingSaleId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [stats, setStats] = useState({
    totalSales: 0,
    totalRevenue: 0,
    totalCommissions: 0,
    pendingCommissions: 0,
  });

  useEffect(() => {
    if (!roleLoading && !isSuperAdmin) {
      navigate("/dashboard");
      return;
    }
    if (isSuperAdmin) {
      fetchSales();
    }
  }, [isSuperAdmin, roleLoading, navigate]);

  const fetchSales = async () => {
    try {
      const { data, error } = await supabase
        .from("gateflow_sales")
        .select(`
          *,
          tenant:reseller_tenant_id (brand_name)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setSales(data || []);

      // Calcular estatísticas
      const totalSales = data?.length || 0;
      const totalRevenue = data?.reduce((sum, s) => sum + Number(s.amount), 0) || 0;
      const totalCommissions = data?.reduce((sum, s) => sum + Number(s.commission_amount), 0) || 0;
      const pendingCommissions = data
        ?.filter(s => s.status === "approved" && !s.commission_paid_at)
        .reduce((sum, s) => sum + Number(s.commission_amount), 0) || 0;

      setStats({ totalSales, totalRevenue, totalCommissions, pendingCommissions });
    } catch (error) {
      console.error("Error fetching sales:", error);
      toast.error("Erro ao carregar vendas");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (saleId: string, status: string) => {
    try {
      const updateData: any = { status };
      if (status === "paid") {
        updateData.commission_paid_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from("gateflow_sales")
        .update(updateData)
        .eq("id", saleId);

      if (error) throw error;

      toast.success(`Status atualizado para ${status}`);
      fetchSales();
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Erro ao atualizar status");
    }
  };

  const handleDeleteSale = async () => {
    if (!deletingSaleId) return;
    
    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from("gateflow_sales")
        .delete()
        .eq("id", deletingSaleId);

      if (error) throw error;

      toast.success("Venda excluída com sucesso!");
      setDeletingSaleId(null);
      fetchSales();
    } catch (error) {
      console.error("Error deleting sale:", error);
      toast.error("Erro ao excluir venda");
    } finally {
      setIsDeleting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      pending: "secondary",
      approved: "default",
      paid: "default",
      cancelled: "destructive",
    };
    const labels: Record<string, string> = {
      pending: "Pendente",
      approved: "Aprovado",
      paid: "Pago",
      cancelled: "Cancelado",
    };
    return <Badge variant={variants[status] || "outline"}>{labels[status] || status}</Badge>;
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
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
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Vendas GateFlow</h1>
          <p className="text-muted-foreground">Acompanhe as vendas realizadas pelos afiliados</p>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Vendas</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalSales}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Comissões</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(stats.totalCommissions)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Comissões Pendentes</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-500">{formatCurrency(stats.pendingCommissions)}</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Histórico de Vendas</CardTitle>
            <CardDescription>Todas as vendas do GateFlow realizadas por afiliados</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Comprador</TableHead>
                  <TableHead>Afiliado</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Comissão</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sales.map((sale) => (
                  <TableRow key={sale.id}>
                    <TableCell>
                      {format(new Date(sale.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{sale.buyer_name || "—"}</p>
                        <p className="text-sm text-muted-foreground">{sale.buyer_email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {sale.tenant?.brand_name || "Venda Direta"}
                    </TableCell>
                    <TableCell>{formatCurrency(sale.amount)}</TableCell>
                    <TableCell>{formatCurrency(sale.commission_amount)}</TableCell>
                    <TableCell>{getStatusBadge(sale.status)}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {sale.status === "pending" && (
                            <>
                              <DropdownMenuItem onClick={() => handleUpdateStatus(sale.id, "approved")}>
                                <CheckCircle className="mr-2 h-4 w-4" /> Aprovar
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleUpdateStatus(sale.id, "cancelled")}>
                                Cancelar
                              </DropdownMenuItem>
                            </>
                          )}
                          {sale.status === "approved" && !sale.commission_paid_at && (
                            <DropdownMenuItem onClick={() => handleUpdateStatus(sale.id, "paid")}>
                              <CheckCircle className="mr-2 h-4 w-4" /> Marcar Pago
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => setDeletingSaleId(sale.id)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" /> Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
                {sales.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      Nenhuma venda registrada
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={!!deletingSaleId} onOpenChange={(open) => !open && setDeletingSaleId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir Venda</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir esta venda? Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteSale}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                disabled={isDeleting}
              >
                {isDeleting ? "Excluindo..." : "Excluir"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  );
};

export default SuperAdminGateflowSales;
