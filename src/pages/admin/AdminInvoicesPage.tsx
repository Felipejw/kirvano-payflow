import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, Clock, CheckCircle, AlertTriangle, XCircle, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useUserRole } from "@/hooks/useUserRole";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

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
}

export default function AdminInvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { isAdmin, loading: roleLoading } = useUserRole();

  useEffect(() => {
    if (!roleLoading && !isAdmin) {
      navigate("/dashboard");
    }
  }, [isAdmin, roleLoading, navigate]);

  useEffect(() => {
    if (isAdmin) fetchInvoices();
  }, [isAdmin]);

  const fetchInvoices = async () => {
    const { data } = await supabase
      .from("platform_invoices")
      .select("*")
      .order("created_at", { ascending: false });
    setInvoices((data as Invoice[]) || []);
    setLoading(false);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "paid": return <Badge variant="success"><CheckCircle className="h-3 w-3 mr-1" />Pago</Badge>;
      case "pending": return <Badge variant="warning"><Clock className="h-3 w-3 mr-1" />Pendente</Badge>;
      case "overdue": return <Badge variant="destructive"><AlertTriangle className="h-3 w-3 mr-1" />Vencida</Badge>;
      case "blocked": return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Bloqueado</Badge>;
      default: return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const formatCurrency = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  if (roleLoading || loading) {
    return <DashboardLayout><div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div></DashboardLayout>;
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/admin")}><ArrowLeft className="h-4 w-4" /></Button>
          <div>
            <h1 className="text-3xl font-bold">Faturas da Plataforma</h1>
            <p className="text-muted-foreground">Acompanhe as faturas de taxas dos vendedores</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5 text-primary" />Todas as Faturas</CardTitle>
          </CardHeader>
          <CardContent>
            {invoices.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">Nenhuma fatura gerada ainda</div>
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
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.map((inv) => (
                      <tr key={inv.id} className="border-b border-border/50 hover:bg-secondary/50">
                        <td className="p-4 font-mono text-xs">{inv.user_id.slice(0, 8)}...</td>
                        <td className="p-4">{format(new Date(inv.period_start), "dd/MM", { locale: ptBR })} - {format(new Date(inv.period_end), "dd/MM", { locale: ptBR })}</td>
                        <td className="p-4">{inv.total_sales}</td>
                        <td className="p-4">{formatCurrency(inv.total_amount)}</td>
                        <td className="p-4 font-semibold text-primary">{formatCurrency(inv.fee_total)}</td>
                        <td className="p-4">{format(new Date(inv.due_date), "dd/MM/yyyy", { locale: ptBR })}</td>
                        <td className="p-4">{getStatusBadge(inv.status)}</td>
                      </tr>
                    ))}
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
