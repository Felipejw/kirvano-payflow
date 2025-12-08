import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { 
  Shield, 
  Lock, 
  Play, 
  FileText, 
  Download, 
  Clock,
  ArrowLeft,
  LogOut
} from "lucide-react";
import { Link } from "react-router-dom";

interface Membership {
  id: string;
  access_level: string;
  expires_at: string | null;
  created_at: string;
  products: {
    id: string;
    name: string;
    description: string;
    cover_url: string;
    content_url: string;
  };
}

const Members = () => {
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
      }
    });

    checkAuth();

    return () => subscription.unsubscribe();
  }, [navigate]);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
      return;
    }
    setUser(session.user);
    fetchMemberships(session.user.id);
  };

  const fetchMemberships = async (userId: string) => {
    const { data, error } = await supabase
      .from('members')
      .select(`
        *,
        products (id, name, description, cover_url, content_url)
      `)
      .eq('user_id', userId);

    if (error) {
      toast({
        title: "Erro ao carregar membros",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setMemberships(data || []);
    }
    setLoading(false);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const isExpired = (expiresAt: string | null) => {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="h-12 w-12 rounded-xl bg-gradient-primary flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Shield className="h-6 w-6 text-primary-foreground" />
          </div>
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold">P</span>
            </div>
            <span className="font-bold text-xl gradient-text">PixPay</span>
          </Link>
          
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground hidden sm:block">
              {user?.email}
            </span>
            <Button variant="outline" size="sm" onClick={handleSignOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Sair
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold gradient-text mb-2">Área de Membros</h1>
          <p className="text-muted-foreground">Acesse seus conteúdos exclusivos</p>
        </div>

        {memberships.length === 0 ? (
          <Card className="glass-card max-w-md mx-auto text-center">
            <CardContent className="pt-12 pb-12">
              <Lock className="h-16 w-16 mx-auto text-muted-foreground mb-6" />
              <h2 className="text-xl font-semibold mb-2">Nenhum conteúdo disponível</h2>
              <p className="text-muted-foreground mb-6">
                Você ainda não possui acesso a nenhum conteúdo. Adquira um produto para começar.
              </p>
              <Button className="btn-primary-gradient" onClick={() => navigate("/")}>
                Ver Produtos
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {memberships.map((membership) => {
              const expired = isExpired(membership.expires_at);
              
              return (
                <Card 
                  key={membership.id} 
                  className={`glass-card-hover overflow-hidden ${expired ? 'opacity-60' : ''}`}
                >
                  {membership.products?.cover_url ? (
                    <img
                      src={membership.products.cover_url}
                      alt={membership.products.name}
                      className="w-full h-40 object-cover"
                    />
                  ) : (
                    <div className="w-full h-40 bg-secondary flex items-center justify-center">
                      <Shield className="h-16 w-16 text-muted-foreground" />
                    </div>
                  )}
                  
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{membership.products?.name}</CardTitle>
                        <CardDescription className="line-clamp-2">
                          {membership.products?.description}
                        </CardDescription>
                      </div>
                      {expired ? (
                        <span className="badge-error">Expirado</span>
                      ) : (
                        <span className="badge-success">Ativo</span>
                      )}
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    {membership.expires_at && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        Expira em: {new Date(membership.expires_at).toLocaleDateString('pt-BR')}
                      </div>
                    )}
                    
                    {!expired && (
                      <div className="flex gap-2">
                        <Button className="flex-1 btn-primary-gradient" size="sm">
                          <Play className="h-4 w-4 mr-2" />
                          Acessar
                        </Button>
                        <Button variant="outline" size="sm">
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                    
                    {expired && (
                      <Button className="w-full" variant="outline" onClick={() => navigate("/")}>
                        Renovar Acesso
                      </Button>
                    )}
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

export default Members;
