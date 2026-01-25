import { useState, useEffect } from "react";
import { useAppNavigate } from "@/lib/routes";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useTenantBranding } from "@/hooks/useTenantBranding";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { 
  Package, 
  LogOut, 
  ExternalLink, 
  Clock, 
  CheckCircle2,
  AlertCircle,
  User
} from "lucide-react";
import gateflowLogo from "@/assets/gateflow-logo.png";

interface MemberProduct {
  id: string;
  product_id: string;
  access_level: string;
  expires_at: string | null;
  created_at: string;
  product: {
    id: string;
    name: string;
    description: string | null;
    cover_url: string | null;
    deliverable_url: string | null;
    content_url: string | null;
    seller_id: string;
  };
}

const MembersArea = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  const [memberships, setMemberships] = useState<MemberProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useAppNavigate();
  const { toast } = useToast();
  
  // Get seller_id from first membership for branding
  const firstSellerId = memberships.length > 0 ? memberships[0].product.seller_id : null;
  const { branding } = useTenantBranding(firstSellerId);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("members/login");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchMemberships();
    }
  }, [user]);

  const fetchMemberships = async () => {
    try {
      const { data, error } = await supabase
        .from("members")
        .select(`
          id,
          product_id,
          access_level,
          expires_at,
          created_at,
          product:products (
            id,
            name,
            description,
            cover_url,
            deliverable_url,
            content_url,
            seller_id
          )
        `)
        .eq("user_id", user?.id);

      if (error) {
        console.error("Error fetching memberships:", error);
        toast({
          title: "Erro ao carregar produtos",
          description: "Tente novamente mais tarde.",
          variant: "destructive",
        });
        return;
      }

      // Filter out any null products and type the data correctly
      const validMemberships = (data || []).filter(
        (m): m is MemberProduct => m.product !== null
      );
      
      setMemberships(validMemberships);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("members/login");
  };

  const isExpired = (expiresAt: string | null) => {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {branding.logo_url ? (
              <img src={branding.logo_url} alt={branding.brand_name} className="h-10 w-auto" />
            ) : (
              <img src={gateflowLogo} alt="Gateflow" className="h-10 w-auto" />
            )}
            <span className="text-xl font-semibold text-foreground">Área de Membros</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">{user?.email}</span>
            </div>
            <Button variant="outline" size="sm" onClick={handleSignOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Sair
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Meus Produtos</h1>
          <p className="text-muted-foreground">
            Acesse todos os produtos que você adquiriu.
          </p>
        </div>

        {loading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="overflow-hidden">
                <Skeleton className="h-48 w-full" />
                <CardHeader>
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </CardHeader>
              </Card>
            ))}
          </div>
        ) : memberships.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Package className="h-16 w-16 text-muted-foreground/50 mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-2">
                Nenhum produto encontrado
              </h3>
              <p className="text-muted-foreground text-center max-w-md">
                Você ainda não possui nenhum produto. Após realizar uma compra, 
                seus produtos aparecerão aqui.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {memberships.map((membership) => {
              const expired = isExpired(membership.expires_at);
              
              return (
                <Card 
                  key={membership.id} 
                  className={`overflow-hidden transition-all hover:shadow-lg ${
                    expired ? "opacity-60" : ""
                  }`}
                >
                  {membership.product.cover_url ? (
                    <div className="aspect-video relative overflow-hidden bg-muted">
                      <img
                        src={membership.product.cover_url}
                        alt={membership.product.name}
                        className="w-full h-full object-cover"
                      />
                      {expired && (
                        <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                          <Badge variant="destructive" className="text-sm">
                            <AlertCircle className="h-4 w-4 mr-1" />
                            Acesso Expirado
                          </Badge>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="aspect-video bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                      <Package className="h-16 w-16 text-primary/50" />
                    </div>
                  )}
                  
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-lg line-clamp-2">
                        {membership.product.name}
                      </CardTitle>
                      {!expired && (
                        <Badge variant="secondary" className="shrink-0">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Ativo
                        </Badge>
                      )}
                    </div>
                    {membership.product.description && (
                      <CardDescription className="line-clamp-2">
                        {membership.product.description}
                      </CardDescription>
                    )}
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>Adquirido em {formatDate(membership.created_at)}</span>
                    </div>
                    
                    {membership.expires_at && (
                      <div className={`flex items-center gap-2 text-sm ${
                        expired ? "text-destructive" : "text-muted-foreground"
                      }`}>
                        <AlertCircle className="h-4 w-4" />
                        <span>
                          {expired ? "Expirou" : "Expira"} em {formatDate(membership.expires_at)}
                        </span>
                      </div>
                    )}
                    
                    <Button
                      className="w-full"
                      disabled={expired}
                      onClick={() => navigate("members/product", { id: membership.product.id })}
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Acessar Conteúdo
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

export default MembersArea;
