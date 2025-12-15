import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { 
  Users, 
  Package, 
  Search, 
  Calendar,
  Mail,
  CheckCircle2,
  AlertCircle,
  ExternalLink
} from "lucide-react";
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
  access_level: string;
  expires_at: string | null;
  created_at: string;
  product: {
    id: string;
    name: string;
    cover_url: string | null;
  };
  user_email?: string;
}

interface Product {
  id: string;
  name: string;
}

const Members = () => {
  const { user } = useAuth();
  const [members, setMembers] = useState<Member[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<string>("all");
  const { toast } = useToast();

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
          access_level,
          expires_at,
          created_at,
          product:products (
            id,
            name,
            cover_url
          )
        `)
        .in("product_id", productIds)
        .order("created_at", { ascending: false });

      if (membersError) throw membersError;

      // Get unique user_ids to fetch emails from pix_charges
      const userIds = [...new Set((membersData || []).map(m => m.user_id))];
      
      // Try to get user emails from pix_charges via transaction_id
      const membersWithEmail = await Promise.all(
        (membersData || []).map(async (member) => {
          // Try to get email from pix_charges through the transaction
          const { data: chargeData } = await supabase
            .from("pix_charges")
            .select("buyer_email")
            .eq("product_id", member.product_id)
            .limit(1)
            .maybeSingle();

          return {
            ...member,
            product: member.product as Member["product"],
            user_email: chargeData?.buyer_email || "Email não disponível"
          };
        })
      );

      setMembers(membersWithEmail.filter(m => m.product !== null));
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const filteredMembers = members.filter(member => {
    const matchesSearch = 
      member.user_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.product.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesProduct = selectedProduct === "all" || member.product_id === selectedProduct;
    
    return matchesSearch && matchesProduct;
  });

  const activeCount = members.filter(m => !isExpired(m.expires_at)).length;
  const expiredCount = members.filter(m => isExpired(m.expires_at)).length;

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Área de Membros</h1>
        <p className="text-muted-foreground mt-1">
          Gerencie os membros que têm acesso aos seus produtos
        </p>
      </div>

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
                    <TableHead>Email</TableHead>
                    <TableHead>Produto</TableHead>
                    <TableHead>Nível</TableHead>
                    <TableHead>Data de Acesso</TableHead>
                    <TableHead>Expiração</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMembers.map((member) => {
                    const expired = isExpired(member.expires_at);
                    return (
                      <TableRow key={member.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{member.user_email}</span>
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
                          <Badge variant="secondary" className="capitalize">
                            {member.access_level}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 text-sm">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            {formatDate(member.created_at)}
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
                          {expired ? (
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
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Members;
