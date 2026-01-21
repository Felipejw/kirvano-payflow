import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle
} from "@/components/ui/dialog";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from "@/components/ui/alert-dialog";
import { 
  Search, 
  Shield, 
  User, 
  Users as UsersIcon, 
  UserCheck,
  Edit,
  MoreHorizontal,
  Package,
  Eye,
  DollarSign,
  Calendar,
  Key,
  UserPlus,
  Building,
  Phone,
  Mail,
  FileText,
  CreditCard,
  Clock,
  Briefcase,
  Trash2,
  AlertTriangle
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAppNavigate } from "@/lib/routes";
import { useUserRole } from "@/hooks/useUserRole";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

type AppRole = "admin" | "seller" | "affiliate" | "member";

interface ProductData {
  id: string;
  name: string;
  price: number;
  status: string;
  type: string;
  created_at: string;
  sales_count: number;
  total_revenue: number;
}

interface ProfileData {
  user_id: string;
  email: string | null;
  full_name: string | null;
  phone: string | null;
  pix_key: string | null;
  document_type: string | null;
  document_number: string | null;
  company_name: string | null;
  sales_niche: string | null;
  average_revenue: string | null;
  payment_mode: string | null;
  terms_accepted_at: string | null;
  created_at: string;
  updated_at: string;
}

interface UserData {
  user_id: string;
  email: string;
  full_name: string;
  created_at: string;
  role: AppRole;
  products_count: number;
  total_revenue: number;
  profile: ProfileData;
}

interface ProductForMember {
  id: string;
  name: string;
  seller_id: string;
}

export default function AdminUsers() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [newRole, setNewRole] = useState<AppRole>("seller");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [productsDialogOpen, setProductsDialogOpen] = useState(false);
  const [userProducts, setUserProducts] = useState<ProductData[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [processing, setProcessing] = useState(false);
  
  // New state for new dialogs
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [resetPasswordDialogOpen, setResetPasswordDialogOpen] = useState(false);
  const [addMemberDialogOpen, setAddMemberDialogOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [passwordType, setPasswordType] = useState<"default" | "random" | "custom">("default");
  const [allProducts, setAllProducts] = useState<ProductForMember[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [loadingAllProducts, setLoadingAllProducts] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const { toast } = useToast();
  const navigate = useAppNavigate();
  const { isAdmin, isSuperAdmin, loading: roleLoading } = useUserRole();

  // Super admin bootstrap
  const [bootstrapEmail, setBootstrapEmail] = useState("admin@admin.com");
  const [bootstrapPassword, setBootstrapPassword] = useState("123456");
  const [bootstrapLoading, setBootstrapLoading] = useState(false);

  useEffect(() => {
    if (!roleLoading && !isAdmin) {
      toast({
        title: "Acesso negado",
        description: "Você não tem permissão para acessar esta página",
        variant: "destructive"
      });
      navigate("dashboard");
    }
  }, [isAdmin, roleLoading, navigate, toast]);

  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
    }
  }, [isAdmin]);

  const handleBootstrapAdmin = async () => {
    if (!isSuperAdmin) {
      toast({
        title: "Acesso negado",
        description: "Apenas super admins podem executar esta ação",
        variant: "destructive",
      });
      return;
    }

    if (!bootstrapEmail.trim() || !bootstrapPassword.trim()) {
      toast({
        title: "Campos obrigatórios",
        description: "Informe email e senha",
        variant: "destructive",
      });
      return;
    }

    setBootstrapLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("admin-bootstrap", {
        body: {
          email: bootstrapEmail.trim(),
          password: bootstrapPassword,
          full_name: "Admin",
        },
      });

      if (error) throw error;

      toast({
        title: "Admin pronto",
        description: data?.message || "Usuário admin criado/resetado",
      });
    } catch (err: any) {
      console.error("Error bootstrapping admin:", err);
      toast({
        title: "Erro",
        description: err?.message || "Falha ao criar/resetar admin",
        variant: "destructive",
      });
    } finally {
      setBootstrapLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      // Fetch profiles
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("*");

      if (profilesError) throw profilesError;

      // Fetch user roles
      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id, role");

      if (rolesError) throw rolesError;

      // Fetch products count per user
      const { data: products } = await supabase
        .from("products")
        .select("seller_id");

      // Fetch transactions for revenue
      const { data: transactions } = await supabase
        .from("transactions")
        .select("seller_id, seller_amount");

      // Build user data
      const usersData: UserData[] = profiles?.map((profile) => {
        const userRole = roles?.find((r) => r.user_id === profile.user_id);
        const userProducts = products?.filter((p) => p.seller_id === profile.user_id) || [];
        const userTransactions = transactions?.filter((t) => t.seller_id === profile.user_id) || [];
        const totalRevenue = userTransactions.reduce((sum, t) => sum + Number(t.seller_amount || 0), 0);
        
        const dbRole = (userRole?.role as AppRole) || "seller";

        return {
          user_id: profile.user_id,
          email: profile.email || "",
          full_name: profile.full_name || "Sem nome",
          created_at: profile.created_at,
          role: dbRole,
          products_count: userProducts.length,
          total_revenue: totalRevenue,
          profile: profile as ProfileData
        };
      }) || [];

      setUsers(usersData);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast({
        title: "Erro",
        description: "Falha ao carregar usuários",
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

  const getRoleBadge = (role: AppRole) => {
    const roleMap: Record<AppRole, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: React.ReactNode }> = {
      admin: { label: "Admin", variant: "destructive", icon: <Shield className="h-3 w-3 mr-1" /> },
      seller: { label: "Vendedor", variant: "default", icon: <User className="h-3 w-3 mr-1" /> },
      affiliate: { label: "Afiliado", variant: "secondary", icon: <UsersIcon className="h-3 w-3 mr-1" /> },
      member: { label: "Cliente/Membro", variant: "outline", icon: <UserCheck className="h-3 w-3 mr-1" /> }
    };
    const config = roleMap[role];
    return (
      <Badge variant={config.variant} className="flex items-center w-fit">
        {config.icon}
        {config.label}
      </Badge>
    );
  };

  const openRoleDialog = (user: UserData) => {
    setSelectedUser(user);
    setNewRole(user.role);
    setDialogOpen(true);
  };

  const openProductsDialog = async (user: UserData) => {
    setSelectedUser(user);
    setProductsDialogOpen(true);
    setLoadingProducts(true);
    
    try {
      const { data: products, error: productsError } = await supabase
        .from("products")
        .select("id, name, price, status, type, created_at")
        .eq("seller_id", user.user_id);

      if (productsError) throw productsError;

      const { data: transactions } = await supabase
        .from("transactions")
        .select("product_id, amount, status")
        .eq("seller_id", user.user_id)
        .eq("status", "paid");

      const productsWithSales: ProductData[] = (products || []).map(product => {
        const productTransactions = transactions?.filter(t => t.product_id === product.id) || [];
        const salesCount = productTransactions.length;
        const totalRevenue = productTransactions.reduce((sum, t) => sum + Number(t.amount || 0), 0);

        return {
          ...product,
          sales_count: salesCount,
          total_revenue: totalRevenue
        };
      });

      setUserProducts(productsWithSales);
    } catch (error) {
      console.error("Error fetching user products:", error);
      toast({
        title: "Erro",
        description: "Falha ao carregar produtos do usuário",
        variant: "destructive"
      });
    } finally {
      setLoadingProducts(false);
    }
  };

  const openDetailsDialog = (user: UserData) => {
    setSelectedUser(user);
    setDetailsDialogOpen(true);
  };

  const openResetPasswordDialog = (user: UserData) => {
    setSelectedUser(user);
    setPasswordType("default");
    setNewPassword("123456");
    setResetPasswordDialogOpen(true);
  };

  const openAddMemberDialog = async (user: UserData) => {
    setSelectedUser(user);
    setSelectedProductId("");
    setAddMemberDialogOpen(true);
    setLoadingAllProducts(true);
    
    try {
      const { data: products, error } = await supabase
        .from("products")
        .select("id, name, seller_id")
        .eq("status", "active");

      if (error) throw error;
      setAllProducts(products || []);
    } catch (error) {
      console.error("Error fetching products:", error);
      toast({
        title: "Erro",
        description: "Falha ao carregar produtos",
        variant: "destructive"
      });
    } finally {
      setLoadingAllProducts(false);
    }
  };

  const handleRoleChange = async () => {
    if (!selectedUser) return;

    setProcessing(true);
    try {
      const { error } = await supabase
        .from("user_roles")
        .update({ role: newRole })
        .eq("user_id", selectedUser.user_id);

      if (error) throw error;

      toast({
        title: "Role atualizada",
        description: `${selectedUser.full_name} agora é ${newRole}`
      });

      fetchUsers();
      setDialogOpen(false);
    } catch (error) {
      console.error("Error updating role:", error);
      toast({
        title: "Erro",
        description: "Falha ao atualizar role",
        variant: "destructive"
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleResetPassword = async () => {
    if (!selectedUser) return;

    let passwordToSet = newPassword;
    if (passwordType === "default") {
      passwordToSet = "123456";
    } else if (passwordType === "random") {
      passwordToSet = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-4).toUpperCase();
    }

    if (passwordToSet.length < 6) {
      toast({
        title: "Erro",
        description: "A senha deve ter pelo menos 6 caracteres",
        variant: "destructive"
      });
      return;
    }

    setProcessing(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/reset-user-password`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.access_token}`
          },
          body: JSON.stringify({
            userId: selectedUser.user_id,
            newPassword: passwordToSet
          })
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to reset password");
      }

      toast({
        title: "Senha resetada",
        description: passwordType === "random" 
          ? `Nova senha: ${passwordToSet}` 
          : `Senha de ${selectedUser.full_name} foi resetada com sucesso`
      });

      setResetPasswordDialogOpen(false);
    } catch (error) {
      console.error("Error resetting password:", error);
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Falha ao resetar senha",
        variant: "destructive"
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleAddMember = async () => {
    if (!selectedUser || !selectedProductId) return;

    setProcessing(true);
    try {
      // Check if user already has member role
      const { data: existingRole } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", selectedUser.user_id)
        .single();

      // If no role exists or role is not member, upsert member role
      if (!existingRole || existingRole.role !== "member") {
        const { error: roleError } = await supabase
          .from("user_roles")
          .upsert({
            user_id: selectedUser.user_id,
            role: "member" as const
          }, { onConflict: "user_id" });

        if (roleError) throw roleError;
      }

      // Check if membership already exists
      const { data: existingMember } = await supabase
        .from("members")
        .select("id")
        .eq("user_id", selectedUser.user_id)
        .eq("product_id", selectedProductId)
        .single();

      if (existingMember) {
        toast({
          title: "Aviso",
          description: "Este usuário já é membro deste produto",
          variant: "destructive"
        });
        return;
      }

      // Insert membership
      const { error: memberError } = await supabase
        .from("members")
        .insert({
          user_id: selectedUser.user_id,
          product_id: selectedProductId,
          status: "active",
          access_level: "full"
        });

      if (memberError) throw memberError;

      toast({
        title: "Membro adicionado",
        description: `${selectedUser.full_name} agora tem acesso ao produto`
      });

      fetchUsers();
      setAddMemberDialogOpen(false);
    } catch (error) {
      console.error("Error adding member:", error);
      toast({
        title: "Erro",
        description: "Falha ao adicionar membro",
        variant: "destructive"
      });
    } finally {
      setProcessing(false);
    }
  };

  const openDeleteDialog = (user: UserData) => {
    setSelectedUser(user);
    setDeleteDialogOpen(true);
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;

    setIsDeleting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delete-user`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${session?.access_token}`
          },
          body: JSON.stringify({ userId: selectedUser.user_id })
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Falha ao excluir usuário");
      }

      // Remove user from local state
      setUsers(users.filter(u => u.user_id !== selectedUser.user_id));

      toast({
        title: "Usuário excluído",
        description: `${selectedUser.full_name} foi excluído permanentemente`
      });

      setDeleteDialogOpen(false);
    } catch (error) {
      console.error("Error deleting user:", error);
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Falha ao excluir usuário",
        variant: "destructive"
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.full_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === "all" || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const stats = {
    total: users.length,
    admins: users.filter((u) => u.role === "admin").length,
    sellers: users.filter((u) => u.role === "seller").length,
    affiliates: users.filter((u) => u.role === "affiliate").length,
    members: users.filter((u) => u.role === "member").length
  };

  const formatPaymentMode = (mode: string | null) => {
    const modes: Record<string, string> = {
      own_gateway: "Gateway Próprio",
      platform_gateway: "Gateway da Plataforma"
    };
    return mode ? modes[mode] || mode : "Não definido";
  };

  const formatDocumentType = (type: string | null) => {
    const types: Record<string, string> = {
      cpf: "CPF",
      cnpj: "CNPJ"
    };
    return type ? types[type] || type : "Não definido";
  };

  if (roleLoading || loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Gerenciar Usuários</h1>
          <p className="text-muted-foreground">
            Gerencie roles e permissões de usuários da plataforma
          </p>
        </div>

        {/* Bootstrap admin@admin.com (super_admin only) */}
        {isSuperAdmin && (
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Bootstrap do Admin Padrão
              </CardTitle>
              <CardDescription>
                Crie ou resete o usuário <strong>admin@admin.com</strong> com a senha informada.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="bootstrap-email">Email</Label>
                  <Input
                    id="bootstrap-email"
                    value={bootstrapEmail}
                    onChange={(e) => setBootstrapEmail(e.target.value)}
                    placeholder="admin@admin.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bootstrap-password">Senha</Label>
                  <Input
                    id="bootstrap-password"
                    type="password"
                    value={bootstrapPassword}
                    onChange={(e) => setBootstrapPassword(e.target.value)}
                    placeholder="123456"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end">
                <Button onClick={handleBootstrapAdmin} disabled={bootstrapLoading}>
                  {bootstrapLoading ? "Processando..." : "Criar / Resetar Admin"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-5">
          <Card className="glass-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total de Usuários</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Administradores</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{stats.admins}</div>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Vendedores</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{stats.sellers}</div>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Afiliados</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.affiliates}</div>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Clientes/Membros</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-muted-foreground">{stats.members}</div>
            </CardContent>
          </Card>
        </div>

        {/* Users Table */}
        <Card className="glass-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Usuários</CardTitle>
                <CardDescription>
                  {filteredUsers.length} usuários encontrados
                </CardDescription>
              </div>
              <div className="flex items-center gap-3">
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Buscar usuário..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="seller">Vendedor</SelectItem>
                    <SelectItem value="affiliate">Afiliado</SelectItem>
                    <SelectItem value="member">Cliente/Membro</SelectItem>
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
                    <th className="p-3 text-left font-medium">Usuário</th>
                    <th className="p-3 text-left font-medium">Role</th>
                    <th className="p-3 text-left font-medium">Produtos</th>
                    <th className="p-3 text-left font-medium">Receita</th>
                    <th className="p-3 text-left font-medium">Cadastro</th>
                    <th className="p-3 text-left font-medium">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-muted-foreground">
                        Nenhum usuário encontrado
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((user) => (
                      <tr key={user.user_id} className="border-b hover:bg-muted/25">
                        <td className="p-3">
                          <div>
                            <p className="font-medium">{user.full_name}</p>
                            <p className="text-sm text-muted-foreground">{user.email}</p>
                          </div>
                        </td>
                        <td className="p-3">
                          {getRoleBadge(user.role)}
                        </td>
                        <td className="p-3">
                          <Badge variant="outline">{user.products_count}</Badge>
                        </td>
                        <td className="p-3 font-medium">
                          {formatCurrency(user.total_revenue)}
                        </td>
                        <td className="p-3 text-muted-foreground">
                          {format(new Date(user.created_at), "dd/MM/yyyy", { locale: ptBR })}
                        </td>
                        <td className="p-3">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Ações</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => openDetailsDialog(user)}>
                                <Eye className="h-4 w-4 mr-2" />
                                Ver Detalhes
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => openProductsDialog(user)}>
                                <Package className="h-4 w-4 mr-2" />
                                Ver Produtos
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => openAddMemberDialog(user)}>
                                <UserPlus className="h-4 w-4 mr-2" />
                                Adicionar como Membro
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => openResetPasswordDialog(user)}>
                                <Key className="h-4 w-4 mr-2" />
                                Resetar Senha
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => openRoleDialog(user)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Alterar Role
                              </DropdownMenuItem>
                              {user.role !== 'admin' && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem 
                                    onClick={() => openDeleteDialog(user)}
                                    className="text-destructive focus:text-destructive"
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Excluir Usuário
                                  </DropdownMenuItem>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* User Details Dialog */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              Detalhes do Usuário
            </DialogTitle>
            <DialogDescription>
              Informações completas de cadastro
            </DialogDescription>
          </DialogHeader>

          {selectedUser && (
            <div className="space-y-6">
              {/* Personal Info */}
              <div>
                <h3 className="font-semibold flex items-center gap-2 mb-3">
                  <User className="h-4 w-4" />
                  Informações Pessoais
                </h3>
                <div className="grid grid-cols-2 gap-4 p-4 rounded-lg border bg-muted/30">
                  <div>
                    <p className="text-sm text-muted-foreground">Nome Completo</p>
                    <p className="font-medium">{selectedUser.profile.full_name || "Não informado"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Mail className="h-3 w-3" /> E-mail
                    </p>
                    <p className="font-medium">{selectedUser.profile.email || "Não informado"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Phone className="h-3 w-3" /> Telefone
                    </p>
                    <p className="font-medium">{selectedUser.profile.phone || "Não informado"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Role Atual</p>
                    {getRoleBadge(selectedUser.role)}
                  </div>
                </div>
              </div>

              <Separator />

              {/* Documentation */}
              <div>
                <h3 className="font-semibold flex items-center gap-2 mb-3">
                  <FileText className="h-4 w-4" />
                  Documentação
                </h3>
                <div className="grid grid-cols-2 gap-4 p-4 rounded-lg border bg-muted/30">
                  <div>
                    <p className="text-sm text-muted-foreground">Tipo de Documento</p>
                    <p className="font-medium">{formatDocumentType(selectedUser.profile.document_type)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Número do Documento</p>
                    <p className="font-medium">{selectedUser.profile.document_number || "Não informado"}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Building className="h-3 w-3" /> Razão Social / Nome da Empresa
                    </p>
                    <p className="font-medium">{selectedUser.profile.company_name || "Não informado"}</p>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Business Info */}
              <div>
                <h3 className="font-semibold flex items-center gap-2 mb-3">
                  <Briefcase className="h-4 w-4" />
                  Informações do Negócio
                </h3>
                <div className="grid grid-cols-2 gap-4 p-4 rounded-lg border bg-muted/30">
                  <div>
                    <p className="text-sm text-muted-foreground">Nicho de Vendas</p>
                    <p className="font-medium">{selectedUser.profile.sales_niche || "Não informado"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Faturamento Médio</p>
                    <p className="font-medium">{selectedUser.profile.average_revenue || "Não informado"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Produtos Cadastrados</p>
                    <p className="font-medium">{selectedUser.products_count}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Receita Total</p>
                    <p className="font-medium text-emerald-500">{formatCurrency(selectedUser.total_revenue)}</p>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Payment Settings */}
              <div>
                <h3 className="font-semibold flex items-center gap-2 mb-3">
                  <CreditCard className="h-4 w-4" />
                  Configurações de Pagamento
                </h3>
                <div className="grid grid-cols-2 gap-4 p-4 rounded-lg border bg-muted/30">
                  <div>
                    <p className="text-sm text-muted-foreground">Modo de Pagamento</p>
                    <p className="font-medium">{formatPaymentMode(selectedUser.profile.payment_mode)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Chave PIX</p>
                    <p className="font-medium">{selectedUser.profile.pix_key || "Não informado"}</p>
                  </div>
                </div>
              </div>

              <Separator />

              {/* System Info */}
              <div>
                <h3 className="font-semibold flex items-center gap-2 mb-3">
                  <Clock className="h-4 w-4" />
                  Informações do Sistema
                </h3>
                <div className="grid grid-cols-2 gap-4 p-4 rounded-lg border bg-muted/30">
                  <div>
                    <p className="text-sm text-muted-foreground">Data de Cadastro</p>
                    <p className="font-medium">
                      {format(new Date(selectedUser.profile.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Última Atualização</p>
                    <p className="font-medium">
                      {format(new Date(selectedUser.profile.updated_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm text-muted-foreground">Termos Aceitos em</p>
                    <p className="font-medium">
                      {selectedUser.profile.terms_accepted_at 
                        ? format(new Date(selectedUser.profile.terms_accepted_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
                        : "Não aceito"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailsDialogOpen(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog open={resetPasswordDialogOpen} onOpenChange={setResetPasswordDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Key className="h-5 w-5 text-primary" />
              Resetar Senha
            </DialogTitle>
            <DialogDescription>
              Resetar senha de {selectedUser?.full_name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="rounded-lg border p-4 bg-muted/30">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Usuário:</span>
                <span className="font-medium">{selectedUser?.email}</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Tipo de Senha</Label>
              <Select 
                value={passwordType} 
                onValueChange={(value) => {
                  setPasswordType(value as "default" | "random" | "custom");
                  if (value === "default") setNewPassword("123456");
                  else if (value === "random") setNewPassword("");
                  else setNewPassword("");
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Senha Padrão (123456)</SelectItem>
                  <SelectItem value="random">Senha Aleatória</SelectItem>
                  <SelectItem value="custom">Senha Personalizada</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {passwordType === "custom" && (
              <div className="space-y-2">
                <Label>Nova Senha</Label>
                <Input
                  type="text"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Digite a nova senha"
                />
                <p className="text-xs text-muted-foreground">Mínimo de 6 caracteres</p>
              </div>
            )}

            {passwordType === "random" && (
              <div className="p-3 rounded-lg border bg-amber-500/10 border-amber-500/30">
                <p className="text-sm text-amber-500">
                  A senha aleatória será exibida após a confirmação. Copie e envie para o usuário.
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setResetPasswordDialogOpen(false)} disabled={processing}>
              Cancelar
            </Button>
            <Button onClick={handleResetPassword} disabled={processing}>
              {processing ? "Resetando..." : "Resetar Senha"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Member Dialog */}
      <Dialog open={addMemberDialogOpen} onOpenChange={setAddMemberDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-primary" />
              Adicionar como Membro
            </DialogTitle>
            <DialogDescription>
              Dar acesso a {selectedUser?.full_name} a um produto
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="rounded-lg border p-4 bg-muted/30">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Usuário:</span>
                <span className="font-medium">{selectedUser?.email}</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Selecione o Produto</Label>
              {loadingAllProducts ? (
                <div className="flex items-center justify-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                </div>
              ) : (
                <Select value={selectedProductId} onValueChange={setSelectedProductId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Escolha um produto..." />
                  </SelectTrigger>
                  <SelectContent>
                    {allProducts.map((product) => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              {allProducts.length === 0 && !loadingAllProducts && (
                <p className="text-sm text-muted-foreground">Nenhum produto ativo encontrado</p>
              )}
            </div>

            <div className="p-3 rounded-lg border bg-blue-500/10 border-blue-500/30">
              <p className="text-sm text-blue-500">
                O usuário receberá a role de Cliente/Membro e terá acesso à área de membros do produto selecionado.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAddMemberDialogOpen(false)} disabled={processing}>
              Cancelar
            </Button>
            <Button 
              onClick={handleAddMember} 
              disabled={processing || !selectedProductId}
            >
              {processing ? "Adicionando..." : "Adicionar Membro"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Role Change Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Alterar Role do Usuário</DialogTitle>
            <DialogDescription>
              Altere a role de {selectedUser?.full_name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="rounded-lg border p-4">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Usuário:</span>
                <span className="font-medium">{selectedUser?.email}</span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Nova Role</label>
              <Select value={newRole} onValueChange={(value) => setNewRole(value as AppRole)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">
                    <div className="flex flex-col items-start">
                      <div className="flex items-center">
                        <Shield className="h-4 w-4 mr-2 text-destructive" />
                        <span className="font-medium">Administrador</span>
                      </div>
                      <span className="text-xs text-muted-foreground ml-6">Acesso total à plataforma</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="seller">
                    <div className="flex flex-col items-start">
                      <div className="flex items-center">
                        <User className="h-4 w-4 mr-2 text-primary" />
                        <span className="font-medium">Vendedor</span>
                      </div>
                      <span className="text-xs text-muted-foreground ml-6">Pode criar e vender produtos</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="affiliate">
                    <div className="flex flex-col items-start">
                      <div className="flex items-center">
                        <UsersIcon className="h-4 w-4 mr-2" />
                        <span className="font-medium">Afiliado</span>
                      </div>
                      <span className="text-xs text-muted-foreground ml-6">Promove produtos e ganha comissão</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="member">
                    <div className="flex flex-col items-start">
                      <div className="flex items-center">
                        <UserCheck className="h-4 w-4 mr-2" />
                        <span className="font-medium">Cliente/Membro</span>
                      </div>
                      <span className="text-xs text-muted-foreground ml-6">Acesso à área de membros (compradores)</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={processing}>
              Cancelar
            </Button>
            <Button onClick={handleRoleChange} disabled={processing}>
              {processing ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Products Dialog */}
      <Dialog open={productsDialogOpen} onOpenChange={setProductsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              Produtos de {selectedUser?.full_name}
            </DialogTitle>
            <DialogDescription>
              {selectedUser?.email} • {userProducts.length} produto(s) cadastrado(s)
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="max-h-[400px]">
            {loadingProducts ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : userProducts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Nenhum produto cadastrado</p>
              </div>
            ) : (
              <div className="space-y-3">
                {userProducts.map((product) => (
                  <div 
                    key={product.id} 
                    className="rounded-lg border bg-card p-4 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold">{product.name}</h4>
                          <Badge 
                            variant={product.status === 'active' ? 'default' : 'secondary'}
                            className="text-xs"
                          >
                            {product.status === 'active' ? 'Ativo' : 'Inativo'}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {product.type === 'digital' ? 'Digital' : product.type === 'course' ? 'Curso' : product.type}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Criado em {format(new Date(product.created_at), "dd/MM/yyyy", { locale: ptBR })}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-lg">{formatCurrency(product.price)}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 mt-3 pt-3 border-t">
                      <div className="flex items-center gap-1 text-sm">
                        <Eye className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Vendas:</span>
                        <span className="font-medium">{product.sales_count}</span>
                      </div>
                      <div className="flex items-center gap-1 text-sm">
                        <DollarSign className="h-4 w-4 text-emerald-500" />
                        <span className="text-muted-foreground">Receita:</span>
                        <span className="font-medium text-emerald-500">{formatCurrency(product.total_revenue)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>

          <DialogFooter>
            <Button variant="outline" onClick={() => setProductsDialogOpen(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete User Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Excluir Usuário Permanentemente
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <div className="p-3 rounded-lg border bg-destructive/10 border-destructive/30">
                <p className="text-destructive font-medium">
                  ⚠️ Esta ação é irreversível!
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Todos os dados do usuário serão excluídos permanentemente, incluindo:
                  perfil, produtos, transações e acessos de membro.
                </p>
              </div>
              
              <div className="rounded-lg border p-4 bg-muted/30">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-muted-foreground">Nome:</span>
                  <span className="font-medium">{selectedUser?.full_name}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Email:</span>
                  <span className="font-medium">{selectedUser?.email}</span>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteUser}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Excluindo..." : "Excluir Permanentemente"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
