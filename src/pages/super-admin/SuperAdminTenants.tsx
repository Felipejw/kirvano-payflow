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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Plus, Building2, Users, Globe, Trash2, Edit, Eye } from "lucide-react";
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
}

const SuperAdminTenants = () => {
  const navigate = useNavigate();
  const { isSuperAdmin, loading: roleLoading } = useUserRole();
  const [tenants, setTenants] = useState<(Tenant & { profile?: Profile })[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newTenant, setNewTenant] = useState({
    brand_name: "",
    admin_email: "",
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
            .select("user_id, full_name, email")
            .eq("user_id", tenant.admin_user_id)
            .single();
          return { ...tenant, profile: profile || undefined };
        })
      );

      setTenants(tenantsWithProfiles);
    } catch (error) {
      console.error("Error fetching tenants:", error);
      toast.error("Erro ao carregar tenants");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTenant = async () => {
    if (!newTenant.brand_name || !newTenant.admin_email) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    try {
      // Primeiro, buscar o user_id pelo email
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("user_id")
        .eq("email", newTenant.admin_email)
        .single();

      if (profileError || !profile) {
        toast.error("Usuário não encontrado com este email. O usuário precisa estar cadastrado primeiro.");
        return;
      }

      // Verificar se já tem role de admin
      const { data: existingRole } = await supabase
        .from("user_roles")
        .select("*")
        .eq("user_id", profile.user_id)
        .single();

      // Atualizar role para admin se necessário
      if (!existingRole) {
        await supabase
          .from("user_roles")
          .insert({ user_id: profile.user_id, role: "admin" });
      } else if (existingRole.role !== "admin" && existingRole.role !== "super_admin") {
        await supabase
          .from("user_roles")
          .update({ role: "admin" })
          .eq("user_id", profile.user_id);
      }

      // Criar tenant
      const { error } = await supabase
        .from("tenants")
        .insert({
          admin_user_id: profile.user_id,
          brand_name: newTenant.brand_name,
          custom_domain: newTenant.custom_domain || null,
          reseller_commission: newTenant.reseller_commission,
          status: "active",
        });

      if (error) throw error;

      toast.success("Tenant criado com sucesso!");
      setIsDialogOpen(false);
      setNewTenant({ brand_name: "", admin_email: "", custom_domain: "", reseller_commission: 50 });
      fetchTenants();
    } catch (error: any) {
      console.error("Error creating tenant:", error);
      toast.error(error.message || "Erro ao criar tenant");
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
            <h1 className="text-3xl font-bold tracking-tight">Gerenciar Tenants</h1>
            <p className="text-muted-foreground">Gerencie todos os clientes e suas instâncias</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Novo Tenant
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Criar Novo Tenant</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
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
                  <Label htmlFor="admin_email">Email do Admin *</Label>
                  <Input
                    id="admin_email"
                    type="email"
                    value={newTenant.admin_email}
                    onChange={(e) => setNewTenant({ ...newTenant, admin_email: e.target.value })}
                    placeholder="admin@exemplo.com"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    O usuário precisa estar cadastrado no sistema
                  </p>
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
                <Button onClick={handleCreateTenant} className="w-full">
                  Criar Tenant
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Tenants</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{tenants.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tenants Ativos</CardTitle>
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
            <CardTitle>Todos os Tenants</CardTitle>
            <CardDescription>Lista de todas as instâncias do sistema</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Marca</TableHead>
                  <TableHead>Admin</TableHead>
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
                      {tenant.custom_domain ? (
                        <div className="flex items-center gap-2">
                          <span>{tenant.custom_domain}</span>
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
                      <div className="flex justify-end gap-2">
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
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {tenants.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      Nenhum tenant cadastrado
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default SuperAdminTenants;
