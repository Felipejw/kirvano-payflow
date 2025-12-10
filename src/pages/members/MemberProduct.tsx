import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { 
  ArrowLeft, 
  Download, 
  ExternalLink, 
  FileText, 
  Video, 
  Link as LinkIcon,
  Lock,
  CheckCircle2
} from "lucide-react";
import gateflowLogo from "@/assets/gateflow-logo.png";

interface Product {
  id: string;
  name: string;
  description: string | null;
  cover_url: string | null;
  deliverable_url: string | null;
  deliverable_type: string | null;
  content_url: string | null;
}

interface Membership {
  id: string;
  access_level: string;
  expires_at: string | null;
  created_at: string;
}

const MemberProduct = () => {
  const { productId } = useParams();
  const { user, loading: authLoading } = useAuth();
  const [product, setProduct] = useState<Product | null>(null);
  const [membership, setMembership] = useState<Membership | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/members/login");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user && productId) {
      fetchProductAndMembership();
    }
  }, [user, productId]);

  const fetchProductAndMembership = async () => {
    try {
      // Check if user has membership for this product
      const { data: membershipData, error: membershipError } = await supabase
        .from("members")
        .select("id, access_level, expires_at, created_at")
        .eq("user_id", user?.id)
        .eq("product_id", productId)
        .maybeSingle();

      if (membershipError) {
        console.error("Error fetching membership:", membershipError);
      }

      if (!membershipData) {
        setHasAccess(false);
        setLoading(false);
        return;
      }

      // Check if membership is expired
      if (membershipData.expires_at && new Date(membershipData.expires_at) < new Date()) {
        setHasAccess(false);
        setMembership(membershipData);
        setLoading(false);
        return;
      }

      setMembership(membershipData);
      setHasAccess(true);

      // Fetch product details
      const { data: productData, error: productError } = await supabase
        .from("products")
        .select("id, name, description, cover_url, deliverable_url, deliverable_type, content_url")
        .eq("id", productId)
        .single();

      if (productError) {
        console.error("Error fetching product:", productError);
        toast({
          title: "Erro ao carregar produto",
          description: "Tente novamente mais tarde.",
          variant: "destructive",
        });
        return;
      }

      setProduct(productData);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const getDeliverableIcon = (type: string | null) => {
    switch (type) {
      case "video":
        return <Video className="h-5 w-5" />;
      case "file":
        return <FileText className="h-5 w-5" />;
      case "link":
        return <LinkIcon className="h-5 w-5" />;
      default:
        return <Download className="h-5 w-5" />;
    }
  };

  const handleAccessContent = (url: string | null) => {
    if (url) {
      window.open(url, "_blank");
    } else {
      toast({
        title: "Conteúdo não disponível",
        description: "O conteúdo ainda não foi configurado pelo vendedor.",
        variant: "destructive",
      });
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b border-border/50 bg-card/50 backdrop-blur">
          <div className="container mx-auto px-4 py-4">
            <Skeleton className="h-10 w-40" />
          </div>
        </header>
        <main className="container mx-auto px-4 py-8">
          <Skeleton className="h-8 w-32 mb-8" />
          <div className="grid gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <Skeleton className="h-64 w-full rounded-lg" />
            </div>
            <div>
              <Skeleton className="h-48 w-full rounded-lg" />
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="flex flex-col items-center py-12">
            <Lock className="h-16 w-16 text-muted-foreground/50 mb-4" />
            <h2 className="text-xl font-semibold text-foreground mb-2">
              Acesso Negado
            </h2>
            <p className="text-muted-foreground text-center mb-6">
              {membership?.expires_at && new Date(membership.expires_at) < new Date()
                ? "Seu acesso a este produto expirou."
                : "Você não tem acesso a este produto."}
            </p>
            <Button variant="outline" onClick={() => navigate("/members")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar aos Meus Produtos
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={gateflowLogo} alt="Gateflow" className="h-10 w-auto" />
          </div>
          <Button variant="ghost" onClick={() => navigate("/members")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Meus Produtos
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <Button 
          variant="ghost" 
          className="mb-6" 
          onClick={() => navigate("/members")}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Product Info */}
          <div className="lg:col-span-2 space-y-6">
            {product?.cover_url && (
              <div className="aspect-video rounded-lg overflow-hidden bg-muted">
                <img
                  src={product.cover_url}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            <div>
              <div className="flex items-start gap-3 mb-4">
                <h1 className="text-3xl font-bold text-foreground flex-1">
                  {product?.name}
                </h1>
                <Badge variant="secondary">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Acesso Liberado
                </Badge>
              </div>
              
              {product?.description && (
                <p className="text-muted-foreground text-lg">
                  {product.description}
                </p>
              )}
            </div>
          </div>

          {/* Access Card */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {getDeliverableIcon(product?.deliverable_type)}
                  Acessar Conteúdo
                </CardTitle>
                <CardDescription>
                  Clique no botão abaixo para acessar seu produto
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {product?.deliverable_url && (
                  <Button 
                    className="w-full" 
                    size="lg"
                    onClick={() => handleAccessContent(product.deliverable_url)}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Baixar / Acessar
                  </Button>
                )}

                {product?.content_url && (
                  <Button 
                    variant="outline" 
                    className="w-full" 
                    size="lg"
                    onClick={() => handleAccessContent(product.content_url)}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Área de Conteúdo
                  </Button>
                )}

                {!product?.deliverable_url && !product?.content_url && (
                  <div className="text-center py-4 text-muted-foreground">
                    <p>Conteúdo em breve...</p>
                    <p className="text-sm mt-1">
                      O vendedor ainda não configurou o entregável.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Membership Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Informações do Acesso</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Nível de Acesso</span>
                  <span className="font-medium capitalize">{membership?.access_level}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Adquirido em</span>
                  <span className="font-medium">
                    {membership?.created_at && new Date(membership.created_at).toLocaleDateString("pt-BR")}
                  </span>
                </div>
                {membership?.expires_at && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Expira em</span>
                    <span className="font-medium">
                      {new Date(membership.expires_at).toLocaleDateString("pt-BR")}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default MemberProduct;
