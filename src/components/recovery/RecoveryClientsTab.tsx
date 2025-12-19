import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { MessageSquare, Mail, User, Package, Clock, CheckCircle2, XCircle, Loader2, Send, History } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface RecoveryClient {
  chargeId: string;
  buyerName: string | null;
  buyerEmail: string;
  buyerPhone: string | null;
  productName: string;
  productId: string;
  amount: number;
  expiredAt: string;
  messagesSent: number;
  maxMessages: number;
  status: "em_andamento" | "recuperado" | "esgotado" | "aguardando";
  lastMessageAt: string | null;
  nextMessageAt: string | null;
  messages: RecoveryMessageDetail[];
}

interface RecoveryMessageDetail {
  id: string;
  channel: string;
  status: string;
  messageNumber: number;
  sentAt: string;
  errorMessage: string | null;
}

interface RecoveryClientsTabProps {
  clients: RecoveryClient[];
  campaignId: string | null;
  onRefresh: () => void;
  loading?: boolean;
}

export function RecoveryClientsTab({ clients, campaignId, onRefresh, loading }: RecoveryClientsTabProps) {
  const [sendingManual, setSendingManual] = useState<string | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{ chargeId: string; channel: "whatsapp" | "email" } | null>(null);
  const [detailsDialog, setDetailsDialog] = useState<RecoveryClient | null>(null);

  const getStatusBadge = (status: RecoveryClient["status"]) => {
    switch (status) {
      case "em_andamento":
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Em andamento</Badge>;
      case "recuperado":
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Recuperado</Badge>;
      case "esgotado":
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Esgotado</Badge>;
      case "aguardando":
        return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">Aguardando</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getMessageStatusIcon = (status: string) => {
    switch (status) {
      case "sent":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case "failed":
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const handleManualSend = async (chargeId: string, channel: "whatsapp" | "email") => {
    if (!campaignId) {
      toast.error("Campanha não configurada. Configure sua campanha primeiro.");
      return;
    }

    setSendingManual(chargeId);
    setConfirmDialog(null);

    try {
      const { data, error } = await supabase.functions.invoke("process-sales-recovery", {
        body: { 
          manual: true, 
          charge_id: chargeId, 
          channel,
          campaign_id: campaignId
        }
      });

      if (error) throw error;

      if (data?.success) {
        toast.success(`Mensagem via ${channel === "whatsapp" ? "WhatsApp" : "Email"} enviada com sucesso!`);
        onRefresh();
      } else {
        throw new Error(data?.error || "Falha ao enviar mensagem");
      }
    } catch (error: any) {
      console.error("Manual send error:", error);
      toast.error(error.message || "Erro ao enviar mensagem manual");
    } finally {
      setSendingManual(null);
    }
  };

  if (loading) {
    return (
      <Card className="bg-card border-border">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Clientes em Recuperação
          </CardTitle>
          <CardDescription>
            Acompanhe o status de cada cliente no processo de recuperação
          </CardDescription>
        </CardHeader>
        <CardContent>
          {clients.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum cliente em processo de recuperação</p>
              <p className="text-sm mt-2">Os clientes com cobranças expiradas aparecerão aqui</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Produto</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Etapa</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Última Msg</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clients.map((client) => (
                  <TableRow key={client.chargeId}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <User className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">
                            {client.buyerName || "Cliente"}
                          </p>
                          <p className="text-xs text-muted-foreground truncate max-w-[150px]">
                            {client.buyerEmail}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm truncate max-w-[120px]">
                          {client.productName}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium text-primary">
                        R$ {client.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Progress 
                            value={(client.messagesSent / client.maxMessages) * 100} 
                            className="h-2 w-16"
                          />
                          <span className="text-xs text-muted-foreground">
                            {client.messagesSent}/{client.maxMessages}
                          </span>
                        </div>
                        {client.nextMessageAt && client.status === "aguardando" && (
                          <p className="text-xs text-blue-400">
                            Próxima em {formatDistanceToNow(new Date(client.nextMessageAt), { locale: ptBR })}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(client.status)}
                    </TableCell>
                    <TableCell>
                      <span className="text-xs text-muted-foreground">
                        {client.lastMessageAt 
                          ? formatDistanceToNow(new Date(client.lastMessageAt), { addSuffix: true, locale: ptBR })
                          : "Nenhuma"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        {client.status !== "recuperado" && client.status !== "esgotado" && (
                          <>
                            {client.buyerPhone && (
                              <Button
                                variant="ghost"
                                size="sm"
                                disabled={sendingManual === client.chargeId}
                                onClick={() => setConfirmDialog({ chargeId: client.chargeId, channel: "whatsapp" })}
                                className="text-green-500 hover:text-green-400 hover:bg-green-500/10"
                              >
                                {sendingManual === client.chargeId ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <MessageSquare className="h-4 w-4" />
                                )}
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled={sendingManual === client.chargeId}
                              onClick={() => setConfirmDialog({ chargeId: client.chargeId, channel: "email" })}
                              className="text-blue-500 hover:text-blue-400 hover:bg-blue-500/10"
                            >
                              {sendingManual === client.chargeId ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Mail className="h-4 w-4" />
                              )}
                            </Button>
                          </>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDetailsDialog(client)}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          <History className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Confirm Send Dialog */}
      <Dialog open={!!confirmDialog} onOpenChange={() => setConfirmDialog(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send className="h-5 w-5" />
              Enviar mensagem manual
            </DialogTitle>
            <DialogDescription>
              Deseja enviar uma mensagem de recuperação via {confirmDialog?.channel === "whatsapp" ? "WhatsApp" : "Email"}?
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              Esta ação enviará imediatamente uma mensagem de recuperação para o cliente, 
              independente do intervalo configurado.
            </p>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setConfirmDialog(null)}>
              Cancelar
            </Button>
            <Button 
              onClick={() => confirmDialog && handleManualSend(confirmDialog.chargeId, confirmDialog.channel)}
              className={confirmDialog?.channel === "whatsapp" 
                ? "bg-green-600 hover:bg-green-700" 
                : "bg-blue-600 hover:bg-blue-700"
              }
            >
              {confirmDialog?.channel === "whatsapp" ? (
                <>
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Enviar WhatsApp
                </>
              ) : (
                <>
                  <Mail className="h-4 w-4 mr-2" />
                  Enviar Email
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Details Dialog */}
      <Dialog open={!!detailsDialog} onOpenChange={() => setDetailsDialog(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Histórico de Recuperação
            </DialogTitle>
            <DialogDescription>
              {detailsDialog?.buyerName || "Cliente"} - {detailsDialog?.productName}
            </DialogDescription>
          </DialogHeader>
          
          {detailsDialog && (
            <div className="space-y-4">
              {/* Client Info */}
              <div className="p-4 rounded-lg bg-muted/30 border border-border">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Email</p>
                    <p className="font-medium">{detailsDialog.buyerEmail}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Telefone</p>
                    <p className="font-medium">{detailsDialog.buyerPhone || "Não informado"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Valor</p>
                    <p className="font-medium text-primary">
                      R$ {detailsDialog.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Expirou em</p>
                    <p className="font-medium">
                      {format(new Date(detailsDialog.expiredAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                </div>
              </div>

              {/* Progress */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Progresso</span>
                  <span className="font-medium">{detailsDialog.messagesSent} de {detailsDialog.maxMessages} mensagens</span>
                </div>
                <Progress value={(detailsDialog.messagesSent / detailsDialog.maxMessages) * 100} className="h-2" />
              </div>

              {/* Messages Timeline */}
              <div className="space-y-2">
                <p className="text-sm font-medium">Mensagens Enviadas</p>
                {detailsDialog.messages.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Nenhuma mensagem enviada ainda
                  </p>
                ) : (
                  <div className="space-y-2 max-h-[200px] overflow-y-auto">
                    {detailsDialog.messages.map((msg) => (
                      <div 
                        key={msg.id}
                        className="flex items-center gap-3 p-3 rounded-lg bg-muted/20 border border-border"
                      >
                        {getMessageStatusIcon(msg.status)}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            {msg.channel === "whatsapp" ? (
                              <MessageSquare className="h-3 w-3 text-green-500" />
                            ) : (
                              <Mail className="h-3 w-3 text-blue-500" />
                            )}
                            <span className="text-sm font-medium capitalize">{msg.channel}</span>
                            <span className="text-xs text-muted-foreground">#{msg.messageNumber}</span>
                          </div>
                          {msg.errorMessage && (
                            <p className="text-xs text-red-400 mt-1 truncate">{msg.errorMessage}</p>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {format(new Date(msg.sentAt), "dd/MM HH:mm", { locale: ptBR })}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
