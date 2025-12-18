import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
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
  Calendar
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

type AppRole = "admin" | "seller" | "affiliate" | "member";
// Unificado: member = Cliente/Membro (compradores)

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

interface UserData {
  user_id: string;
  email: string;
  full_name: string;
  created_at: string;
  role: AppRole;
  products_count: number;
  total_revenue: number;
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
  const { toast } = useToast();
  const navigate = useAppNavigate();
  const { isAdmin, loading: roleLoading } = useUserRole();

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

      // Fetch affiliates for affiliate check
      const { data: affiliates } = await supabase
        .from("affiliates")
        .select("user_id");

      // Build user data
      const usersData: UserData[] = profiles?.map((profile) => {
        const userRole = roles?.find((r) => r.user_id === profile.user_id);
        const userProducts = products?.filter((p) => p.seller_id === profile.user_id) || [];
        const userTransactions = transactions?.filter((t) => t.seller_id === profile.user_id) || [];
        const totalRevenue = userTransactions.reduce((sum, t) => sum + Number(t.seller_amount || 0), 0);
        const hasAffiliations = affiliates?.some((a) => a.user_id === profile.user_id) || false;
        
        const dbRole = (userRole?.role as AppRole) || "seller";

        return {
          user_id: profile.user_id,
          email: profile.email || "",
          full_name: profile.full_name || "Sem nome",
          created_at: profile.created_at,
          role: dbRole,
          products_count: userProducts.length,
          total_revenue: totalRevenue
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
      // Fetch user products with sales data
      const { data: products, error: productsError } = await supabase
        .from("products")
        .select("id, name, price, status, type, created_at")
        .eq("seller_id", user.user_id);

      if (productsError) throw productsError;

      // Fetch transactions for each product
      const { data: transactions } = await supabase
        .from("transactions")
        .select("product_id, amount, status")
        .eq("seller_id", user.user_id)
        .eq("status", "paid");

      // Build products with sales data
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
                              <DropdownMenuItem onClick={() => openProductsDialog(user)}>
                                <Package className="h-4 w-4 mr-2" />
                                Ver Produtos
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => openRoleDialog(user)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Alterar Role
                              </DropdownMenuItem>
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
    </DashboardLayout>
  );
}
