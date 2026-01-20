import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Mail, User, Calendar, ShoppingBag, CreditCard, Clock, Phone, Pencil, Check, X, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { ClientData } from "@/pages/Clients";

interface ClientDetailDialogProps {
  client: ClientData | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onClientUpdated?: () => void;
}

export function ClientDetailDialog({ client, open, onOpenChange, onClientUpdated }: ClientDetailDialogProps) {
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  if (!client) return null;

  const handleEditEmail = () => {
    setNewEmail(client.buyer_email);
    setIsEditingEmail(true);
  };

  const handleCancelEdit = () => {
    setIsEditingEmail(false);
    setNewEmail("");
  };

  const handleSaveEmail = async () => {
    if (!newEmail || newEmail === client.buyer_email) {
      handleCancelEdit();
      return;
    }

    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail)) {
      toast.error("Email inválido");
      return;
    }

    setIsUpdating(true);
    try {
      // Atualizar todos os pix_charges com o email antigo para o novo email
      const { error } = await supabase
        .from("pix_charges")
        .update({ buyer_email: newEmail })
        .eq("buyer_email", client.buyer_email);

      if (error) throw error;

      toast.success("Email atualizado com sucesso!");
      setIsEditingEmail(false);
      setNewEmail("");
      
      // Notificar o componente pai para atualizar os dados
      if (onClientUpdated) {
        onClientUpdated();
      }
      
      // Fechar o dialog para forçar atualização
      onOpenChange(false);
    } catch (error: any) {
      console.error("Erro ao atualizar email:", error);
      toast.error("Erro ao atualizar email: " + error.message);
    } finally {
      setIsUpdating(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return <Badge className="bg-emerald-500/10 text-emerald-500">Pago</Badge>;
      case "pending":
        return <Badge className="bg-amber-500/10 text-amber-500">Pendente</Badge>;
      case "expired":
        return <Badge className="bg-destructive/10 text-destructive">Expirado</Badge>;
      case "refunded":
        return <Badge className="bg-blue-500/10 text-blue-500">Reembolsado</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <Dialog open={open} onOpenChange={(open) => {
      if (!open) {
        handleCancelEdit();
      }
      onOpenChange(open);
    }}>
      <DialogContent className="max-w-2xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <p>{client.buyer_name || "Nome não informado"}</p>
              {isEditingEmail ? (
                <div className="flex items-center gap-2 mt-1">
                  <Input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="h-7 text-sm"
                    placeholder="novo@email.com"
                    autoFocus
                  />
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7"
                    onClick={handleSaveEmail}
                    disabled={isUpdating}
                  >
                    {isUpdating ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Check className="h-4 w-4 text-emerald-500" />
                    )}
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7"
                    onClick={handleCancelEdit}
                    disabled={isUpdating}
                  >
                    <X className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ) : (
                <p className="text-sm font-normal text-muted-foreground flex items-center gap-1">
                  <Mail className="h-3 w-3" />
                  {client.buyer_email}
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-5 w-5 ml-1"
                    onClick={handleEditEmail}
                    title="Editar email"
                  >
                    <Pencil className="h-3 w-3" />
                  </Button>
                </p>
              )}
            </div>
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh]">
          <div className="space-y-6 pr-4">
            {/* Client Info */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-3 rounded-lg bg-muted/30">
                <p className="text-xs text-muted-foreground mb-1">Telefone</p>
                <p className="text-sm flex items-center gap-1">
                  {client.buyer_phone ? (
                    <>
                      <Phone className="h-3 w-3" />
                      {client.buyer_phone}
                    </>
                  ) : (
                    "-"
                  )}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-muted/30">
                <p className="text-xs text-muted-foreground mb-1">CPF</p>
                <p className="font-mono text-sm">{client.buyer_cpf || "-"}</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/30">
                <p className="text-xs text-muted-foreground mb-1">Pedidos Pagos</p>
                <p className="font-medium text-emerald-500">{client.paid_orders} / {client.total_orders}</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/30">
                <p className="text-xs text-muted-foreground mb-1">Total Gasto</p>
                <p className="font-medium">
                  {client.total_spent.toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  })}
                </p>
              </div>
            </div>

            {/* Timeline Info */}
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>
                  Primeiro contato:{" "}
                  {format(new Date(client.first_order), "dd/MM/yyyy", { locale: ptBR })}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>
                  Último pedido:{" "}
                  {format(new Date(client.last_order), "dd/MM/yyyy", { locale: ptBR })}
                </span>
              </div>
            </div>

            <Separator />

            {/* Orders History */}
            <div>
              <h3 className="font-medium mb-4 flex items-center gap-2">
                <ShoppingBag className="h-4 w-4" />
                Histórico de Pedidos
              </h3>
              <div className="space-y-3">
                {client.orders
                  .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                  .map((order) => (
                    <div
                      key={order.id}
                      className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-card"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                          <CreditCard className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{order.product_name}</p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(order.created_at), "dd/MM/yyyy 'às' HH:mm", {
                              locale: ptBR,
                            })}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <p className="font-medium">
                          {order.amount.toLocaleString("pt-BR", {
                            style: "currency",
                            currency: "BRL",
                          })}
                        </p>
                        {getStatusBadge(order.status)}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
