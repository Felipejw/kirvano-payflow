import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
import { useAuth } from "@/hooks/useAuth";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Plus, Building2, Users, Globe, Key, Loader2, Mail, Phone, User, Trash2, Pencil, Server, Copy } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Tenant {
  id: string;
  admin_user_id: string;
  brand_name: string;
  logo_url: string | null;
  custom_domain: string | null;
  domain_verified: boolean;
  status: string;
  is_reseller: boolean;
  reseller_commission: number;
  created_at: string;
}

interface Profile {
  user_id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
}

const SERVER_IP = "72.60.60.102";

const SuperAdminClientes = () => {
  const navigate = useNavigate();
  const { session } = useAuth();
  const { isSuperAdmin, loading: roleLoading } = useUserRole();
  const [tenants, setTenants] = useState<(Tenant & { profile?: Profile })[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editingTenant, setEditingTenant] = useState<(Tenant & { profile?: Profile }) | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [newTenant, setNewTenant] = useState({
    full_name: "",
    email: "",
    password: "",
    phone: "",
    brand_name: "",
    custom_domain: "",
    reseller_commission: 50,
  });

  useEffect(() => {
    if (!roleLoading && !isSuperAdmin) {
      navigate("/dashboard");
      return;
    }
    if (isSuperAdmin) {
      fetchTenants();
    }
  }, [isSuperAdmin, roleLoading, navigate]);

  const fetchTenants = async () => {
    try {
      const { data, error } = await supabase
        .from("tenants")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Buscar profiles dos admins
      const tenantsWithProfiles = await Promise.all(
        (data || []).map(async (tenant) => {
          const { data: profile } = await supabase
            .from("profiles")
            .select("user_id, full_name, email, phone")
            .eq("user_id", tenant.admin_user_id)
            .single();
          return { ...tenant, profile: profile || undefined };
        })
      );

      setTenants(tenantsWithProfiles);
    } catch (error) {
      console.error("Error fetching tenants:", error);
      toast.error("Erro ao carregar clientes");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTenant = async () => {
    if (!newTenant.full_name || !newTenant.email || !newTenant.password || !newTenant.brand_name) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    if (newTenant.password.length < 6) {
      toast.error("A senha deve ter pelo menos 6 caracteres");
      return;
    }

    setIsCreating(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-tenant-admin", {
        body: {
          email: newTenant.email,
          password: newTenant.password,
          full_name: newTenant.full_name,
          phone: newTenant.phone || undefined,
          brand_name: newTenant.brand_name,
          custom_domain: newTenant.custom_domain || undefined,
          reseller_commission: newTenant.reseller_commission,
        },
      });

      if (error) throw error;

      if (data?.error) {
        throw new Error(data.error);
      }

      toast.success("Cliente criado com sucesso!");
      setIsDialogOpen(false);
      setNewTenant({
        full_name: "",
        email: "",
        password: "",
        phone: "",
        brand_name: "",
        custom_domain: "",
        reseller_commission: 50,
      });
      fetchTenants();
    } catch (error: any) {
      console.error("Error creating tenant:", error);
      toast.error(error.message || "Erro ao criar cliente");
    } finally {
      setIsCreating(false);
    }
  };

  const handleUpdateStatus = async (tenantId: string, status: string) => {
    try {
      const { error } = await supabase
        .from("tenants")
        .update({ status })
        .eq("id", tenantId);

      if (error) throw error;

      toast.success(`Status atualizado para ${status}`);
      fetchTenants();
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Erro ao atualizar status");
    }
  };

  const handleResetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/?page=auth`,
      });

      if (error) throw error;

      toast.success("Email de redefinição de senha enviado!");
    } catch (error) {
      console.error("Error resetting password:", error);
      toast.error("Erro ao enviar email de redefinição");
    }
  };

  const handleDeleteTenant = async (tenant: Tenant & { profile?: Profile }) => {
    setIsDeleting(true);
    try {
      // Delete the user using edge function
      const { data, error } = await supabase.functions.invoke("delete-user", {
        body: { userId: tenant.admin_user_id },
      });

      if (error) throw error;

      if (data?.error) {
        throw new Error(data.error);
      }

      // Delete tenant record
      const { error: tenantError } = await supabase
        .from("tenants")
        .delete()
        .eq("id", tenant.id);

      if (tenantError) throw tenantError;

      toast.success("Cliente excluído com sucesso!");
      fetchTenants();
    } catch (error: any) {
      console.error("Error deleting tenant:", error);
      toast.error(error.message || "Erro ao excluir cliente");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEditTenant = (tenant: Tenant & { profile?: Profile }) => {
    setEditingTenant(tenant);
  };

  const handleSaveEdit = async () => {
    if (!editingTenant) return;

    setIsSaving(true);
    try {
      // Update tenant
      const { error: tenantError } = await supabase
        .from("tenants")
        .update({
          brand_name: editingTenant.brand_name,
          custom_domain: editingTenant.custom_domain,
          reseller_commission: editingTenant.reseller_commission,
        })
        .eq("id", editingTenant.id);

      if (tenantError) throw tenantError;

      // Update profile
      if (editingTenant.profile) {
        const { error: profileError } = await supabase
          .from("profiles")
          .update({
            full_name: editingTenant.profile.full_name,
            email: editingTenant.profile.email,
            phone: editingTenant.profile.phone,
          })
          .eq("user_id", editingTenant.admin_user_id);

        if (profileError) throw profileError;
      }

      toast.success("Cliente atualizado com sucesso!");
      setEditingTenant(null);
      fetchTenants();
    } catch (error: any) {
      console.error("Error updating tenant:", error);
      toast.error(error.message || "Erro ao atualizar cliente");
    } finally {
      setIsSaving(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("IP copiado para a área de transferência!");
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      active: "default",
      trial: "secondary",
      suspended: "destructive",
      cancelled: "outline",
    };
    const labels: Record<string, string> = {
      active: "Ativo",
      trial: "Trial",
      suspended: "Suspenso",
      cancelled: "Cancelado",
    };
    return <Badge variant={variants[status] || "outline"}>{labels[status] || status}</Badge>;
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
            <h1 className="text-3xl font-bold tracking-tight">Clientes</h1>
            <p className="text-muted-foreground">Gerencie todos os clientes e suas instâncias</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Novo Cliente
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Criar Novo Cliente</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Dados do Admin
                  </h4>
                  <div>
                    <Label htmlFor="full_name">Nome Completo *</Label>
                    <Input
                      id="full_name"
                      value={newTenant.full_name}
                      onChange={(e) => setNewTenant({ ...newTenant, full_name: e.target.value })}
                      placeholder="Nome do administrador"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={newTenant.email}
                      onChange={(e) => setNewTenant({ ...newTenant, email: e.target.value })}
                      placeholder="admin@empresa.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="password">Senha Inicial *</Label>
                    <Input
                      id="password"
                      type="password"
                      value={newTenant.password}
                      onChange={(e) => setNewTenant({ ...newTenant, password: e.target.value })}
                      placeholder="Mínimo 6 caracteres"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">WhatsApp/Telefone</Label>
                    <Input
                      id="phone"
                      value={newTenant.phone}
                      onChange={(e) => setNewTenant({ ...newTenant, phone: e.target.value })}
                      placeholder="(11) 99999-9999"
                    />
                  </div>
                </div>

                <div className="border-t pt-4 space-y-2">
                  <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    Dados da Instância
                  </h4>
                  <div>
                    <Label htmlFor="brand_name">Nome da Marca *</Label>
                    <Input
                      id="brand_name"
                      value={newTenant.brand_name}
                      onChange={(e) => setNewTenant({ ...newTenant, brand_name: e.target.value })}
                      placeholder="Nome do negócio"
                    />
                  </div>
                  <div>
                    <Label htmlFor="custom_domain">Domínio Personalizado</Label>
                    <Input
                      id="custom_domain"
                      value={newTenant.custom_domain}
                      onChange={(e) => setNewTenant({ ...newTenant, custom_domain: e.target.value })}
                      placeholder="checkout.exemplo.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="commission">Comissão de Revenda (%)</Label>
                    <Input
                      id="commission"
                      type="number"
                      min="0"
                      max="100"
                      value={newTenant.reseller_commission}
                      onChange={(e) => setNewTenant({ ...newTenant, reseller_commission: Number(e.target.value) })}
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleCreateTenant} disabled={isCreating}>
                  {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Criar Cliente
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Server IP Info Card */}
        <Card className="border-blue-200 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-950/20">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-blue-700 dark:text-blue-400">
              <Server className="h-5 w-5" />
              IP do Servidor para Apontamento DNS
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <code className="text-lg font-mono bg-blue-100 dark:bg-blue-900 px-4 py-2 rounded-lg text-blue-800 dark:text-blue-200">
                {SERVER_IP}
              </code>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => copyToClipboard(SERVER_IP)}
                className="border-blue-300 hover:bg-blue-100 dark:border-blue-700 dark:hover:bg-blue-900"
              >
                <Copy className="h-4 w-4 mr-2" />
                Copiar
              </Button>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Configure um registro <strong>A</strong> no DNS do domínio do cliente apontando para este IP.
            </p>
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Clientes</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{tenants.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Clientes Ativos</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {tenants.filter(t => t.status === "active").length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Com Domínio</CardTitle>
              <Globe className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {tenants.filter(t => t.domain_verified).length}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Todos os Clientes</CardTitle>
            <CardDescription>Lista de todas as instâncias do sistema</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Marca</TableHead>
                  <TableHead>Admin</TableHead>
                  <TableHead>Contato</TableHead>
                  <TableHead>Domínio</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Comissão</TableHead>
                  <TableHead>Criado em</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tenants.map((tenant) => (
                  <TableRow key={tenant.id}>
                    <TableCell className="font-medium">{tenant.brand_name}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{tenant.profile?.full_name || "—"}</p>
                        <p className="text-sm text-muted-foreground">{tenant.profile?.email || "—"}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        {tenant.profile?.phone ? (
                          <>
                            <Phone className="h-3 w-3" />
                            {tenant.profile.phone}
                          </>
                        ) : "—"}
                      </div>
                    </TableCell>
                    <TableCell>
                      {tenant.custom_domain ? (
                        <div className="flex items-center gap-2">
                          <span className="text-sm">{tenant.custom_domain}</span>
                          {tenant.domain_verified ? (
                            <Badge variant="default" className="text-xs">Verificado</Badge>
                          ) : (
                            <Badge variant="secondary" className="text-xs">Pendente</Badge>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>{getStatusBadge(tenant.status)}</TableCell>
                    <TableCell>{tenant.reseller_commission}%</TableCell>
                    <TableCell>
                      {format(new Date(tenant.created_at), "dd/MM/yyyy", { locale: ptBR })}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditTenant(tenant)}
                          title="Editar cliente"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        {tenant.profile?.email && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleResetPassword(tenant.profile!.email!)}
                            title="Resetar senha"
                          >
                            <Key className="h-4 w-4" />
                          </Button>
                        )}
                        {tenant.status === "active" ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleUpdateStatus(tenant.id, "suspended")}
                          >
                            Suspender
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleUpdateStatus(tenant.id, "active")}
                          >
                            Ativar
                          </Button>
                        )}
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:text-destructive"
                              title="Excluir cliente"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Excluir Cliente</AlertDialogTitle>
                              <AlertDialogDescription>
                                Tem certeza que deseja excluir o cliente <strong>{tenant.brand_name}</strong>?
                                Esta ação não pode ser desfeita e todos os dados serão perdidos.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteTenant(tenant)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                disabled={isDeleting}
                              >
                                {isDeleting ? (
                                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                ) : null}
                                Excluir
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {tenants.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      Nenhum cliente cadastrado
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Edit Dialog */}
        <Dialog open={!!editingTenant} onOpenChange={() => setEditingTenant(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Editar Cliente</DialogTitle>
              <DialogDescription>Atualize as informações do cliente</DialogDescription>
            </DialogHeader>
            {editingTenant && (
              <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Dados do Admin
                  </h4>
                  <div>
                    <Label htmlFor="edit_full_name">Nome Completo</Label>
                    <Input
                      id="edit_full_name"
                      value={editingTenant.profile?.full_name || ""}
                      onChange={(e) => setEditingTenant({
                        ...editingTenant,
                        profile: { ...editingTenant.profile!, full_name: e.target.value }
                      })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit_email">Email</Label>
                    <Input
                      id="edit_email"
                      type="email"
                      value={editingTenant.profile?.email || ""}
                      onChange={(e) => setEditingTenant({
                        ...editingTenant,
                        profile: { ...editingTenant.profile!, email: e.target.value }
                      })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit_phone">WhatsApp/Telefone</Label>
                    <Input
                      id="edit_phone"
                      value={editingTenant.profile?.phone || ""}
                      onChange={(e) => setEditingTenant({
                        ...editingTenant,
                        profile: { ...editingTenant.profile!, phone: e.target.value }
                      })}
                    />
                  </div>
                </div>

                <div className="border-t pt-4 space-y-2">
                  <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    Dados da Instância
                  </h4>
                  <div>
                    <Label htmlFor="edit_brand_name">Nome da Marca</Label>
                    <Input
                      id="edit_brand_name"
                      value={editingTenant.brand_name}
                      onChange={(e) => setEditingTenant({ ...editingTenant, brand_name: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit_custom_domain">Domínio Personalizado</Label>
                    <Input
                      id="edit_custom_domain"
                      value={editingTenant.custom_domain || ""}
                      onChange={(e) => setEditingTenant({ ...editingTenant, custom_domain: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit_commission">Comissão de Revenda (%)</Label>
                    <Input
                      id="edit_commission"
                      type="number"
                      min="0"
                      max="100"
                      value={editingTenant.reseller_commission}
                      onChange={(e) => setEditingTenant({ ...editingTenant, reseller_commission: Number(e.target.value) })}
                    />
                  </div>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingTenant(null)}>
                Cancelar
              </Button>
              <Button onClick={handleSaveEdit} disabled={isSaving}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Salvar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default SuperAdminClientes;