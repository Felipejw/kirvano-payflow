import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { 
  Users, 
  Package, 
  Search, 
  Calendar,
  Mail,
  CheckCircle2,
  AlertCircle,
  Settings,
  Clock,
  Ban,
  CalendarPlus,
  MoreHorizontal,
  Send,
  Loader2,
  History,
  MailOpen,
  XCircle
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Member {
  id: string;
  user_id: string;
  product_id: string;
  transaction_id: string | null;
  access_level: string;
  expires_at: string | null;
  created_at: string;
  last_accessed_at: string | null;
  status: string;
  product: {
    id: string;
    name: string;
    cover_url: string | null;
  };
  user_email?: string;
  buyer_name?: string;
}

interface EmailLog {
  id: string;
  email_type: string;
  recipient_email: string;
  subject: string | null;
  sent_at: string;
  opened_at: string | null;
  status: string;
}

interface Product {
  id: string;
  name: string;
}

const Members = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [members, setMembers] = useState<Member[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<string>("all");
  const { toast } = useToast();
  
  // Dialog states
  const [revokeDialogOpen, setRevokeDialogOpen] = useState(false);
  const [extendDialogOpen, setExtendDialogOpen] = useState(false);
  const [emailHistoryDialogOpen, setEmailHistoryDialogOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [emailLogs, setEmailLogs] = useState<EmailLog[]>([]);
  const [loadingEmailLogs, setLoadingEmailLogs] = useState(false);
  const [extendDays, setExtendDays] = useState("30");
  const [sendingEmail, setSendingEmail] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      // Fetch seller's products
      const { data: productsData, error: productsError } = await supabase
        .from("products")
        .select("id, name")
        .eq("seller_id", user?.id);

      if (productsError) throw productsError;
      setProducts(productsData || []);

      if (!productsData || productsData.length === 0) {
        setMembers([]);
        setLoading(false);
        return;
      }

      const productIds = productsData.map(p => p.id);

      // Fetch members for seller's products
      const { data: membersData, error: membersError } = await supabase
        .from("members")
        .select(`
          id,
          user_id,
          product_id,
          transaction_id,
          access_level,
          expires_at,
          created_at,
          last_accessed_at,
          status,
          product:products (
            id,
            name,
            cover_url
          )
        `)
        .in("product_id", productIds)
        .order("created_at", { ascending: false });

      if (membersError) throw membersError;

      // Get buyer info from pix_charges via transaction_id -> transactions -> charge_id
      const membersWithBuyerInfo = await Promise.all(
        (membersData || []).map(async (member) => {
          let buyerEmail = "Email não disponível";
          let buyerName: string | null = null;

          if (member.transaction_id) {
            // Buscar através de transactions → pix_charges
            const { data: transactionData } = await supabase
              .from("transactions")
              .select("charge_id")
              .eq("id", member.transaction_id)
              .maybeSingle();

            if (transactionData?.charge_id) {
              const { data: chargeData } = await supabase
                .from("pix_charges")
                .select("buyer_email, buyer_name")
                .eq("id", transactionData.charge_id)
                .maybeSingle();

              if (chargeData) {
                buyerEmail = chargeData.buyer_email || buyerEmail;
                buyerName = chargeData.buyer_name || null;
              }
            }
          }

          return {
            ...member,
            product: member.product as Member["product"],
            user_email: buyerEmail,
            buyer_name: buyerName
          };
        })
      );

      setMembers(membersWithBuyerInfo.filter(m => m.product !== null));
    } catch (error) {
      console.error("Error fetching data:", error);
      toast({
        title: "Erro ao carregar dados",
        description: "Tente novamente mais tarde.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const isExpired = (expiresAt: string | null) => {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatDateTime = (dateString: string | null) => {
    if (!dateString) return "Nunca";
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleRevokeMember = async () => {
    if (!selectedMember) return;
    try {
      const { error } = await supabase
        .from("members")
        .update({ status: "revoked" })
        .eq("id", selectedMember.id);

      if (error) throw error;
      
      toast({
        title: "Acesso revogado",
        description: "O acesso do membro foi revogado com sucesso.",
      });
      setRevokeDialogOpen(false);
      setSelectedMember(null);
      fetchData();
    } catch (error) {
      console.error("Error revoking access:", error);
      toast({
        title: "Erro",
        description: "Erro ao revogar acesso.",
        variant: "destructive",
      });
    }
  };

  const handleRestoreMember = async (member: Member) => {
    try {
      const { error } = await supabase
        .from("members")
        .update({ status: "active" })
        .eq("id", member.id);

      if (error) throw error;
      
      toast({
        title: "Acesso restaurado",
        description: "O acesso do membro foi restaurado.",
      });
      fetchData();
    } catch (error) {
      console.error("Error restoring access:", error);
      toast({
        title: "Erro",
        description: "Erro ao restaurar acesso.",
        variant: "destructive",
      });
    }
  };

  const handleExtendAccess = async () => {
    if (!selectedMember) return;
    try {
      const days = parseInt(extendDays);
      if (isNaN(days) || days <= 0) {
        toast({
          title: "Erro",
          description: "Informe um número válido de dias.",
          variant: "destructive",
        });
        return;
      }

      const currentExpiry = selectedMember.expires_at 
        ? new Date(selectedMember.expires_at) 
        : new Date();
      
      const newExpiry = new Date(currentExpiry);
      newExpiry.setDate(newExpiry.getDate() + days);

      const { error } = await supabase
        .from("members")
        .update({ expires_at: newExpiry.toISOString(), status: "active" })
        .eq("id", selectedMember.id);

      if (error) throw error;
      
      toast({
        title: "Acesso estendido",
        description: `Acesso estendido por ${days} dias.`,
      });
      setExtendDialogOpen(false);
      setSelectedMember(null);
      fetchData();
    } catch (error) {
      console.error("Error extending access:", error);
      toast({
        title: "Erro",
        description: "Erro ao estender acesso.",
        variant: "destructive",
      });
    }
  };

  const handleSendAccessEmail = async (member: Member) => {
    setSendingEmail(member.id);
    try {
      const { data, error } = await supabase.functions.invoke("send-member-access-email", {
        body: {
          memberEmail: member.user_email,
          memberName: member.buyer_name || member.user_email?.split("@")[0],
          productName: member.product.name,
          productId: member.product_id,
          memberId: member.id,
          expiresAt: member.expires_at,
        },
      });

      if (error) throw error;

      if (data?.success) {
        toast({
          title: "Email enviado!",
          description: `Email de acesso enviado para ${member.user_email}`,
        });
      } else {
        throw new Error(data?.error || "Erro ao enviar email");
      }
    } catch (error: any) {
      console.error("Error sending email:", error);
      toast({
        title: "Erro ao enviar email",
        description: error.message || "Tente novamente mais tarde.",
        variant: "destructive",
      });
    } finally {
      setSendingEmail(null);
    }
  };

  const handleViewEmailHistory = async (member: Member) => {
    setSelectedMember(member);
    setEmailHistoryDialogOpen(true);
    setLoadingEmailLogs(true);
    
    try {
      const { data, error } = await supabase
        .from("member_email_logs")
        .select("*")
        .eq("member_id", member.id)
        .order("sent_at", { ascending: false });
      
      if (error) throw error;
      setEmailLogs(data || []);
    } catch (error) {
      console.error("Error fetching email logs:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar o histórico de emails.",
        variant: "destructive",
      });
    } finally {
      setLoadingEmailLogs(false);
    }
  };

  const filteredMembers = members.filter(member => {
    const matchesSearch = 
      member.user_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.buyer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.product.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesProduct = selectedProduct === "all" || member.product_id === selectedProduct;
    
    return matchesSearch && matchesProduct;
  });

  const activeCount = members.filter(m => m.status === 'active' && !isExpired(m.expires_at)).length;
  const expiredCount = members.filter(m => isExpired(m.expires_at)).length;
  const revokedCount = members.filter(m => m.status === 'revoked').length;

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <div className="grid gap-4 md:grid-cols-3">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
          <Skeleton className="h-96" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Área de Membros</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie os membros e configure o conteúdo dos seus produtos
          </p>
        </div>
      </div>

      {/* Products with Configure Button */}
      {products.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Seus Produtos
            </CardTitle>
            <CardDescription>
              Configure a área de membros e o conteúdo de cada produto
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {products.map(product => (
                <Card key={product.id} className="bg-muted/50">
                  <CardContent className="p-4 flex items-center justify-between gap-4">
                    <span className="font-medium truncate">{product.name}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/dashboard/members/config/${product.id}`)}
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      Configurar
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total de Membros</p>
                <p className="text-2xl font-bold">{members.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-accent/10 flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6 text-accent" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Acessos Ativos</p>
                <p className="text-2xl font-bold text-accent">{activeCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center">
                <AlertCircle className="h-6 w-6 text-destructive" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Acessos Expirados</p>
                <p className="text-2xl font-bold text-destructive">{expiredCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por email ou produto..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={selectedProduct} onValueChange={setSelectedProduct}>
              <SelectTrigger className="w-full sm:w-64">
                <SelectValue placeholder="Filtrar por produto" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os produtos</SelectItem>
                {products.map(product => (
                  <SelectItem key={product.id} value={product.id}>
                    {product.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Members Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Membros ({filteredMembers.length})
          </CardTitle>
          <CardDescription>
            Lista de todos os membros com acesso aos seus produtos
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredMembers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Package className="h-16 w-16 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Nenhum membro encontrado
              </h3>
              <p className="text-muted-foreground max-w-md">
                {members.length === 0 
                  ? "Quando clientes comprarem seus produtos, eles aparecerão aqui."
                  : "Nenhum resultado para os filtros aplicados."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Produto</TableHead>
                    <TableHead>Último Acesso</TableHead>
                    <TableHead>Expiração</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                {filteredMembers.map((member) => {
                    const expired = isExpired(member.expires_at);
                    const isRevoked = member.status === 'revoked';
                    return (
                      <TableRow key={member.id} className={isRevoked ? "opacity-60" : ""}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            <div className="flex flex-col">
                              <span className="font-medium">
                                {member.buyer_name || member.user_email?.split("@")[0] || "Não identificado"}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {member.user_email}
                              </span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {member.product.cover_url ? (
                              <img 
                                src={member.product.cover_url} 
                                alt={member.product.name}
                                className="h-8 w-8 rounded object-cover"
                              />
                            ) : (
                              <div className="h-8 w-8 rounded bg-muted flex items-center justify-center">
                                <Package className="h-4 w-4 text-muted-foreground" />
                              </div>
                            )}
                            <span>{member.product.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Clock className="h-4 w-4" />
                            {formatDateTime(member.last_accessed_at)}
                          </div>
                        </TableCell>
                        <TableCell>
                          {member.expires_at ? (
                            <span className={expired ? "text-destructive" : ""}>
                              {formatDate(member.expires_at)}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">Vitalício</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {isRevoked ? (
                            <Badge variant="outline" className="text-muted-foreground">
                              <Ban className="h-3 w-3 mr-1" />
                              Revogado
                            </Badge>
                          ) : expired ? (
                            <Badge variant="destructive">
                              <AlertCircle className="h-3 w-3 mr-1" />
                              Expirado
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="bg-accent/10 text-accent border-accent/20">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Ativo
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {isRevoked ? (
                                <DropdownMenuItem onClick={() => handleRestoreMember(member)}>
                                  <CheckCircle2 className="h-4 w-4 mr-2" />
                                  Restaurar Acesso
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem 
                                  onClick={() => { setSelectedMember(member); setRevokeDialogOpen(true); }}
                                  className="text-destructive"
                                >
                                  <Ban className="h-4 w-4 mr-2" />
                                  Revogar Acesso
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem onClick={() => { setSelectedMember(member); setExtendDialogOpen(true); }}>
                                <CalendarPlus className="h-4 w-4 mr-2" />
                                Estender Acesso
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleSendAccessEmail(member)}
                                disabled={sendingEmail === member.id}
                              >
                                {sendingEmail === member.id ? (
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                ) : (
                                  <Send className="h-4 w-4 mr-2" />
                                )}
                                Enviar Email de Acesso
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleViewEmailHistory(member)}>
                                <History className="h-4 w-4 mr-2" />
                                Histórico de Emails
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Revoke Access Dialog */}
      <AlertDialog open={revokeDialogOpen} onOpenChange={setRevokeDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revogar Acesso?</AlertDialogTitle>
            <AlertDialogDescription>
              O membro não poderá mais acessar o conteúdo deste produto. Você pode restaurar o acesso a qualquer momento.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleRevokeMember} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Revogar Acesso
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Extend Access Dialog */}
      <Dialog open={extendDialogOpen} onOpenChange={setExtendDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Estender Acesso</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              Defina quantos dias de acesso adicional para o membro.
            </p>
            <div className="space-y-2">
              <Label htmlFor="days">Dias adicionais</Label>
              <Input
                id="days"
                type="number"
                value={extendDays}
                onChange={(e) => setExtendDays(e.target.value)}
                placeholder="30"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setExtendDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleExtendAccess}>
              Estender Acesso
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Email History Dialog */}
      <Dialog open={emailHistoryDialogOpen} onOpenChange={setEmailHistoryDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Histórico de Emails
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {selectedMember && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground border-b pb-3">
                <Mail className="h-4 w-4" />
                <span>{selectedMember.user_email}</span>
                <span className="mx-2">•</span>
                <Package className="h-4 w-4" />
                <span>{selectedMember.product.name}</span>
              </div>
            )}
            
            {loadingEmailLogs ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <Skeleton key={i} className="h-16" />
                ))}
              </div>
            ) : emailLogs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Mail className="h-12 w-12 text-muted-foreground/50 mb-3" />
                <p className="text-muted-foreground">Nenhum email enviado para este membro.</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {emailLogs.map((log) => (
                  <div 
                    key={log.id} 
                    className="flex items-start justify-between p-4 bg-muted/50 rounded-lg border"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {log.status === "sent" ? (
                          <Badge variant="secondary" className="bg-accent/10 text-accent border-accent/20">
                            <Send className="h-3 w-3 mr-1" />
                            Enviado
                          </Badge>
                        ) : (
                          <Badge variant="destructive">
                            <XCircle className="h-3 w-3 mr-1" />
                            Falhou
                          </Badge>
                        )}
                        {log.opened_at && (
                          <Badge variant="outline" className="text-primary">
                            <MailOpen className="h-3 w-3 mr-1" />
                            Aberto
                          </Badge>
                        )}
                        <Badge variant="outline">
                          {log.email_type === "auto_access" ? "Automático" : "Manual"}
                        </Badge>
                      </div>
                      <p className="text-sm font-medium">{log.subject || "Email de Acesso"}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Para: {log.recipient_email}
                      </p>
                    </div>
                    <div className="text-right text-xs text-muted-foreground">
                      <p>{new Date(log.sent_at).toLocaleDateString("pt-BR")}</p>
                      <p>{new Date(log.sent_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</p>
                      {log.opened_at && (
                        <p className="text-primary mt-1">
                          Aberto em {new Date(log.opened_at).toLocaleDateString("pt-BR")}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEmailHistoryDialogOpen(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
    </DashboardLayout>
  );
};

export default Members;
