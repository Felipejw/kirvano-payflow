import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Mail, User, Calendar, ShoppingBag, CreditCard, Clock, Phone, Pencil, Check, X, Loader2, UserPlus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { ClientData } from "@/pages/Clients";

interface ClientDetailDialogProps {
  client: ClientData | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onClientUpdated?: () => void;
}

interface SellerProduct {
  id: string;
  name: string;
}

type EditableField = "buyer_name" | "buyer_email" | "buyer_phone" | "buyer_cpf" | null;

export function ClientDetailDialog({ client, open, onOpenChange, onClientUpdated }: ClientDetailDialogProps) {
  const { user } = useAuth();
  const [editingField, setEditingField] = useState<EditableField>(null);
  const [editValue, setEditValue] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  
  // Grant access state
  const [grantAccessDialogOpen, setGrantAccessDialogOpen] = useState(false);
  const [sellerProducts, setSellerProducts] = useState<SellerProduct[]>([]);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [sendAccessEmail, setSendAccessEmail] = useState(true);
  const [grantingAccess, setGrantingAccess] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(false);

  if (!client) return null;

  const handleStartEdit = (field: EditableField, currentValue: string | null) => {
    setEditingField(field);
    setEditValue(currentValue || "");
  };

  const handleCancelEdit = () => {
    setEditingField(null);
    setEditValue("");
  };

  const handleSaveField = async () => {
    if (!editingField) return;
    
    const currentValue = client[editingField as keyof ClientData] as string | null;
    if (editValue === (currentValue || "")) {
      handleCancelEdit();
      return;
    }

    // Validações específicas
    if (editingField === "buyer_email") {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(editValue)) {
        toast.error("Email inválido");
        return;
      }
    }

    if (editingField === "buyer_cpf" && editValue) {
      const cpfClean = editValue.replace(/\D/g, "");
      if (cpfClean.length !== 11) {
        toast.error("CPF deve ter 11 dígitos");
        return;
      }
    }

    if (editingField === "buyer_phone" && editValue) {
      const phoneClean = editValue.replace(/\D/g, "");
      if (phoneClean.length < 10 || phoneClean.length > 11) {
        toast.error("Telefone inválido");
        return;
      }
    }

    setIsUpdating(true);
    try {
      // Atualizar todos os pix_charges com o email antigo para o novo valor
      const { error } = await supabase
        .from("pix_charges")
        .update({ [editingField]: editValue || null })
        .eq("buyer_email", client.buyer_email);

      if (error) throw error;

      toast.success("Dados atualizados com sucesso!");
      handleCancelEdit();
      
      if (onClientUpdated) {
        onClientUpdated();
      }
      
      onOpenChange(false);
    } catch (error: any) {
      console.error("Erro ao atualizar:", error);
      toast.error("Erro ao atualizar: " + error.message);
    } finally {
      setIsUpdating(false);
    }
  };

  const fetchSellerProducts = async () => {
    if (!user?.id) return;
    
    setLoadingProducts(true);
    try {
      const { data: products, error } = await supabase
        .from("products")
        .select("id, name")
        .eq("seller_id", user.id)
        .eq("status", "active")
        .order("name");
      
      if (error) throw error;
      setSellerProducts(products || []);
    } catch (error: any) {
      console.error("Error fetching products:", error);
      toast.error("Erro ao carregar produtos");
    } finally {
      setLoadingProducts(false);
    }
  };

  const handleOpenGrantAccessDialog = () => {
    fetchSellerProducts();
    setSelectedProductId("");
    setSendAccessEmail(true);
    setGrantAccessDialogOpen(true);
  };

  const handleGrantAccess = async () => {
    if (!selectedProductId || !client.buyer_email) return;
    
    setGrantingAccess(true);
    try {
      const { data, error } = await supabase.functions.invoke('grant-member-access', {
        body: {
          email: client.buyer_email,
          name: client.buyer_name,
          productId: selectedProductId,
          sendEmail: sendAccessEmail,
        },
      });

      if (error) throw error;
      
      if (data?.already_had_access) {
        toast.info("Este cliente já possui acesso a este produto");
      } else {
        toast.success(data?.message || "Acesso concedido com sucesso!");
      }
      
      setGrantAccessDialogOpen(false);
      
      if (onClientUpdated) {
        onClientUpdated();
      }
    } catch (error: any) {
      console.error("Error granting access:", error);
      toast.error("Erro ao conceder acesso: " + (error.message || "Erro desconhecido"));
    } finally {
      setGrantingAccess(false);
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

  const renderEditableField = (
    field: EditableField,
    label: string,
    value: string | null,
    icon?: React.ReactNode
  ) => {
    const isEditing = editingField === field;
    
    return (
      <div className="p-3 rounded-lg bg-muted/30">
        <p className="text-xs text-muted-foreground mb-1 flex items-center justify-between">
          {label}
          {!isEditing && (
            <Button
              size="icon"
              variant="ghost"
              className="h-5 w-5"
              onClick={() => handleStartEdit(field, value)}
              title={`Editar ${label.toLowerCase()}`}
            >
              <Pencil className="h-3 w-3" />
            </Button>
          )}
        </p>
        {isEditing ? (
          <div className="flex items-center gap-1">
            <Input
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              className="h-7 text-sm"
              placeholder={`Novo ${label.toLowerCase()}`}
              autoFocus
            />
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7 shrink-0"
              onClick={handleSaveField}
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
              className="h-7 w-7 shrink-0"
              onClick={handleCancelEdit}
              disabled={isUpdating}
            >
              <X className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        ) : (
          <p className="text-sm flex items-center gap-1">
            {icon}
            {value || "-"}
          </p>
        )}
      </div>
    );
  };

  return (
    <>
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
                {editingField === "buyer_name" ? (
                  <div className="flex items-center gap-2">
                    <Input
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      className="h-8 text-base font-semibold"
                      placeholder="Nome do cliente"
                      autoFocus
                    />
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8"
                      onClick={handleSaveField}
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
                      className="h-8 w-8"
                      onClick={handleCancelEdit}
                      disabled={isUpdating}
                    >
                      <X className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ) : (
                  <p className="flex items-center gap-2">
                    {client.buyer_name || "Nome não informado"}
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-5 w-5"
                      onClick={() => handleStartEdit("buyer_name", client.buyer_name)}
                      title="Editar nome"
                    >
                      <Pencil className="h-3 w-3" />
                    </Button>
                  </p>
                )}
                {editingField === "buyer_email" ? (
                  <div className="flex items-center gap-2 mt-1">
                    <Input
                      type="email"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      className="h-7 text-sm"
                      placeholder="novo@email.com"
                      autoFocus
                    />
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7"
                      onClick={handleSaveField}
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
                      onClick={() => handleStartEdit("buyer_email", client.buyer_email)}
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
                {renderEditableField(
                  "buyer_phone",
                  "Telefone",
                  client.buyer_phone,
                  client.buyer_phone ? <Phone className="h-3 w-3" /> : undefined
                )}
                {renderEditableField(
                  "buyer_cpf",
                  "CPF",
                  client.buyer_cpf
                )}
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

              {/* Grant Access Button */}
              <Button 
                onClick={handleOpenGrantAccessDialog}
                className="w-full"
                variant="outline"
              >
                <UserPlus className="mr-2 h-4 w-4" />
                Conceder Acesso a Produto
              </Button>

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

      {/* Grant Access Dialog */}
      <Dialog open={grantAccessDialogOpen} onOpenChange={setGrantAccessDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Conceder Acesso a Produto</DialogTitle>
            <DialogDescription>
              Dar acesso a <span className="font-medium text-foreground">{client.buyer_email}</span> à área de membros de um produto
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Selecione o produto</Label>
              <Select 
                value={selectedProductId} 
                onValueChange={setSelectedProductId}
                disabled={loadingProducts}
              >
                <SelectTrigger>
                  <SelectValue placeholder={loadingProducts ? "Carregando produtos..." : "Selecione um produto..."} />
                </SelectTrigger>
                <SelectContent>
                  {sellerProducts.map((product) => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.name}
                    </SelectItem>
                  ))}
                  {sellerProducts.length === 0 && !loadingProducts && (
                    <div className="p-2 text-sm text-muted-foreground text-center">
                      Nenhum produto ativo encontrado
                    </div>
                  )}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="send-email" className="flex flex-col gap-1">
                <span>Enviar email de acesso</span>
                <span className="text-xs font-normal text-muted-foreground">
                  O cliente receberá os dados de login por email
                </span>
              </Label>
              <Switch 
                id="send-email"
                checked={sendAccessEmail} 
                onCheckedChange={setSendAccessEmail} 
              />
            </div>
          </div>
          
          <DialogFooter className="gap-2 sm:gap-0">
            <Button 
              variant="outline" 
              onClick={() => setGrantAccessDialogOpen(false)}
              disabled={grantingAccess}
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleGrantAccess} 
              disabled={!selectedProductId || grantingAccess}
            >
              {grantingAccess ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Concedendo...
                </>
              ) : (
                "Conceder Acesso"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
