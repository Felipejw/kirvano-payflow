import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Search, CheckCircle, XCircle, Clock, Filter, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Withdrawal {
  id: string;
  user_id: string;
  amount: number;
  fee: number;
  net_amount: number;
  pix_key: string;
  pix_key_type: string;
  status: string;
  notes: string | null;
  requested_at: string;
  completed_at: string | null;
  seller_name?: string;
  seller_email?: string;
}

export function AdminWithdrawals() {
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("pending");
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<Withdrawal | null>(null);
  const [actionType, setActionType] = useState<"approve" | "reject" | null>(null);
  const [notes, setNotes] = useState("");
  const [processing, setProcessing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchWithdrawals();
  }, []);

  const fetchWithdrawals = async () => {
    try {
      const { data: withdrawalsData, error } = await supabase
        .from("withdrawals")
        .select("*")
        .order("requested_at", { ascending: false });

      if (error) throw error;

      // Fetch seller profiles
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, email");

      // Map data
      const enrichedWithdrawals = withdrawalsData?.map((w) => {
        const seller = profiles?.find((p) => p.user_id === w.user_id);
        return {
          ...w,
          seller_name: seller?.full_name || "Desconhecido",
          seller_email: seller?.email || ""
        };
      }) || [];

      setWithdrawals(enrichedWithdrawals);
    } catch (error) {
      console.error("Error fetching withdrawals:", error);
      toast({
        title: "Erro",
        description: "Falha ao carregar saques",
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
    const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: React.ReactNode }> = {
      pending: { label: "Pendente", variant: "secondary", icon: <Clock className="h-3 w-3 mr-1" /> },
      approved: { label: "Aprovado", variant: "default", icon: <CheckCircle className="h-3 w-3 mr-1" /> },
      completed: { label: "Concluído", variant: "default", icon: <CheckCircle className="h-3 w-3 mr-1" /> },
      rejected: { label: "Rejeitado", variant: "destructive", icon: <XCircle className="h-3 w-3 mr-1" /> }
    };
    const config = statusMap[status] || { label: status, variant: "outline", icon: null };
    return (
      <Badge variant={config.variant} className="flex items-center">
        {config.icon}
        {config.label}
      </Badge>
    );
  };

  const getPixKeyTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      cpf: "CPF",
      cnpj: "CNPJ",
      email: "E-mail",
      phone: "Telefone",
      random: "Chave Aleatória"
    };
    return types[type] || type;
  };

  const sendNotificationEmail = async (withdrawal: Withdrawal, status: "approved" | "rejected", notesText: string | null) => {
    try {
      const response = await supabase.functions.invoke("send-withdrawal-notification", {
        body: {
          to_email: withdrawal.seller_email,
          seller_name: withdrawal.seller_name || "Vendedor",
          amount: withdrawal.amount,
          net_amount: withdrawal.net_amount,
          fee: withdrawal.fee,
          pix_key: withdrawal.pix_key,
          status: status,
          notes: notesText
        }
      });

      if (response.error) {
        console.error("Error sending notification email:", response.error);
      } else {
        console.log("Notification email sent successfully");
      }
    } catch (error) {
      console.error("Failed to send notification email:", error);
    }
  };

  const handleAction = async () => {
    if (!selectedWithdrawal || !actionType) return;

    setProcessing(true);
    try {
      const newStatus = actionType === "approve" ? "completed" : "rejected";
      
      const { error } = await supabase
        .from("withdrawals")
        .update({
          status: newStatus,
          notes: notes || null,
          completed_at: new Date().toISOString()
        })
        .eq("id", selectedWithdrawal.id);

      if (error) throw error;

      // Send email notification
      if (selectedWithdrawal.seller_email) {
        await sendNotificationEmail(
          selectedWithdrawal, 
          actionType === "approve" ? "approved" : "rejected",
          notes || null
        );
      }

      toast({
        title: actionType === "approve" ? "Saque aprovado" : "Saque rejeitado",
        description: actionType === "approve" 
          ? `Saque de ${formatCurrency(selectedWithdrawal.net_amount)} foi aprovado. Email enviado.`
          : "O vendedor foi notificado por email sobre a rejeição"
      });

      // Refresh data
      fetchWithdrawals();
      closeDialog();
    } catch (error) {
      console.error("Error updating withdrawal:", error);
      toast({
        title: "Erro",
        description: "Falha ao processar saque",
        variant: "destructive"
      });
    } finally {
      setProcessing(false);
    }
  };

  const openDialog = (withdrawal: Withdrawal, action: "approve" | "reject") => {
    setSelectedWithdrawal(withdrawal);
    setActionType(action);
    setNotes("");
  };

  const closeDialog = () => {
    setSelectedWithdrawal(null);
    setActionType(null);
    setNotes("");
  };

  const filteredWithdrawals = withdrawals.filter((w) => {
    const matchesSearch =
      w.seller_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      w.seller_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      w.pix_key.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || w.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const pendingCount = withdrawals.filter((w) => w.status === "pending").length;
  const pendingAmount = withdrawals
    .filter((w) => w.status === "pending")
    .reduce((sum, w) => sum + w.net_amount, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <>
      <Card className="glass-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                Gerenciar Saques
                {pendingCount > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {pendingCount} pendentes
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                {pendingCount > 0 
                  ? `${formatCurrency(pendingAmount)} aguardando aprovação`
                  : "Nenhum saque pendente"}
              </CardDescription>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar vendedor ou chave PIX..."
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
                  <SelectItem value="pending">Pendentes</SelectItem>
                  <SelectItem value="completed">Concluídos</SelectItem>
                  <SelectItem value="rejected">Rejeitados</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="p-3 text-left font-medium">Data</th>
                  <th className="p-3 text-left font-medium">Vendedor</th>
                  <th className="p-3 text-left font-medium">Valor Bruto</th>
                  <th className="p-3 text-left font-medium">Taxa</th>
                  <th className="p-3 text-left font-medium">Valor Líquido</th>
                  <th className="p-3 text-left font-medium">Chave PIX</th>
                  <th className="p-3 text-left font-medium">Status</th>
                  <th className="p-3 text-left font-medium">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredWithdrawals.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-muted-foreground">
                      Nenhum saque encontrado
                    </td>
                  </tr>
                ) : (
                  filteredWithdrawals.map((withdrawal) => (
                    <tr key={withdrawal.id} className="border-b hover:bg-muted/25">
                      <td className="p-3 text-muted-foreground">
                        {format(new Date(withdrawal.requested_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                      </td>
                      <td className="p-3">
                        <div>
                          <p className="font-medium">{withdrawal.seller_name}</p>
                          <p className="text-sm text-muted-foreground">{withdrawal.seller_email}</p>
                        </div>
                      </td>
                      <td className="p-3 font-medium">
                        {formatCurrency(withdrawal.amount)}
                      </td>
                      <td className="p-3 text-muted-foreground">
                        {formatCurrency(withdrawal.fee)}
                      </td>
                      <td className="p-3 font-medium text-primary">
                        {formatCurrency(withdrawal.net_amount)}
                      </td>
                      <td className="p-3">
                        <div>
                          <p className="font-mono text-sm">{withdrawal.pix_key}</p>
                          <p className="text-xs text-muted-foreground">
                            {getPixKeyTypeLabel(withdrawal.pix_key_type)}
                          </p>
                        </div>
                      </td>
                      <td className="p-3">
                        {getStatusBadge(withdrawal.status)}
                      </td>
                      <td className="p-3">
                        {withdrawal.status === "pending" ? (
                          <div className="flex gap-2">
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => openDialog(withdrawal, "approve")}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Aprovar
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => openDialog(withdrawal, "reject")}
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Rejeitar
                            </Button>
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">
                            {withdrawal.completed_at && format(new Date(withdrawal.completed_at), "dd/MM/yyyy", { locale: ptBR })}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!selectedWithdrawal} onOpenChange={() => closeDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {actionType === "approve" ? (
                <>
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  Aprovar Saque
                </>
              ) : (
                <>
                  <AlertCircle className="h-5 w-5 text-destructive" />
                  Rejeitar Saque
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {actionType === "approve"
                ? "Confirme os dados antes de aprovar o saque."
                : "Informe o motivo da rejeição para notificar o vendedor."}
            </DialogDescription>
          </DialogHeader>

          {selectedWithdrawal && (
            <div className="space-y-4">
              <div className="rounded-lg border p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Vendedor:</span>
                  <span className="font-medium">{selectedWithdrawal.seller_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Valor:</span>
                  <span className="font-medium text-primary">
                    {formatCurrency(selectedWithdrawal.net_amount)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Chave PIX:</span>
                  <span className="font-mono text-sm">{selectedWithdrawal.pix_key}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tipo:</span>
                  <span>{getPixKeyTypeLabel(selectedWithdrawal.pix_key_type)}</span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  {actionType === "approve" ? "Observações (opcional)" : "Motivo da rejeição"}
                </label>
                <Textarea
                  placeholder={actionType === "approve" 
                    ? "Adicione observações se necessário..."
                    : "Explique o motivo da rejeição..."}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={closeDialog} disabled={processing}>
              Cancelar
            </Button>
            <Button
              variant={actionType === "approve" ? "default" : "destructive"}
              onClick={handleAction}
              disabled={processing || (actionType === "reject" && !notes)}
            >
              {processing ? "Processando..." : actionType === "approve" ? "Confirmar Aprovação" : "Confirmar Rejeição"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
