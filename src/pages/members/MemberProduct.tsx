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
  CheckCircle2,
  Play,
  File,
  Clock
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import gateflowLogo from "@/assets/gateflow-logo.png";
import { VideoPlayer } from "@/components/members/VideoPlayer";
import { LessonCheckbox, ModuleProgress } from "@/components/members/LessonProgress";

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

interface Module {
  id: string;
  name: string;
  description: string | null;
  order_index: number;
}

interface Lesson {
  id: string;
  module_id: string;
  name: string;
  description: string | null;
  content_type: string;
  content_url: string | null;
  duration_minutes: number | null;
  is_free: boolean;
  order_index: number;
}

interface LessonProgress {
  lesson_id: string;
  completed_at: string;
}

const MemberProduct = () => {
  const { productId } = useParams();
  const { user, loading: authLoading } = useAuth();
  const [product, setProduct] = useState<Product | null>(null);
  const [membership, setMembership] = useState<Membership | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [lessons, setLessons] = useState<Record<string, Lesson[]>>({});
  const [completedLessons, setCompletedLessons] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Video player state
  const [videoPlayerOpen, setVideoPlayerOpen] = useState(false);
  const [currentVideo, setCurrentVideo] = useState<{ url: string; title: string } | null>(null);

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
        .select("id, access_level, expires_at, created_at, status")
        .eq("user_id", user?.id)
        .eq("product_id", productId)
        .maybeSingle();

      if (membershipError) {
        console.error("Error fetching membership:", membershipError);
      }

      if (!membershipData || membershipData.status === 'revoked') {
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

      // Update last_accessed_at
      await supabase
        .from("members")
        .update({ last_accessed_at: new Date().toISOString() })
        .eq("id", membershipData.id);

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

      // Fetch modules
      const { data: modulesData, error: modulesError } = await supabase
        .from("product_modules")
        .select("*")
        .eq("product_id", productId)
        .order("order_index", { ascending: true });

      if (modulesError) {
        console.error("Error fetching modules:", modulesError);
      } else {
        setModules(modulesData || []);

        // Fetch lessons for all modules
        if (modulesData && modulesData.length > 0) {
          const moduleIds = modulesData.map(m => m.id);
          const { data: lessonsData, error: lessonsError } = await supabase
            .from("module_lessons")
            .select("*")
            .in("module_id", moduleIds)
            .order("order_index", { ascending: true });

          if (lessonsError) {
            console.error("Error fetching lessons:", lessonsError);
          } else {
            // Group lessons by module_id
            const groupedLessons: Record<string, Lesson[]> = {};
            lessonsData?.forEach(lesson => {
              if (!groupedLessons[lesson.module_id]) {
                groupedLessons[lesson.module_id] = [];
              }
              groupedLessons[lesson.module_id].push(lesson);
            });
            setLessons(groupedLessons);
          }
        }
      }

      // Fetch progress
      const { data: progressData, error: progressError } = await supabase
        .from("member_lesson_progress")
        .select("lesson_id, completed_at")
        .eq("member_id", membershipData.id);

      if (!progressError && progressData) {
        setCompletedLessons(new Set(progressData.map(p => p.lesson_id)));
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleLessonComplete = async (lessonId: string) => {
    if (!membership) return;

    const isCompleted = completedLessons.has(lessonId);

    try {
      if (isCompleted) {
        // Remove progress
        await supabase
          .from("member_lesson_progress")
          .delete()
          .eq("member_id", membership.id)
          .eq("lesson_id", lessonId);

        setCompletedLessons(prev => {
          const next = new Set(prev);
          next.delete(lessonId);
          return next;
        });
      } else {
        // Add progress
        await supabase
          .from("member_lesson_progress")
          .insert({
            member_id: membership.id,
            lesson_id: lessonId,
          });

        setCompletedLessons(prev => new Set(prev).add(lessonId));
      }
    } catch (error) {
      console.error("Error toggling progress:", error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o progresso.",
        variant: "destructive",
      });
    }
  };

  const getContentTypeIcon = (type: string) => {
    switch (type) {
      case "video":
        return <Video className="h-4 w-4" />;
      case "pdf":
        return <FileText className="h-4 w-4" />;
      case "link":
        return <LinkIcon className="h-4 w-4" />;
      default:
        return <File className="h-4 w-4" />;
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

  const handleAccessContent = (lesson: Lesson) => {
    if (!lesson.content_url) {
      toast({
        title: "Conteúdo não disponível",
        description: "O conteúdo ainda não foi configurado pelo vendedor.",
        variant: "destructive",
      });
      return;
    }

    if (lesson.content_type === "video") {
      setCurrentVideo({ url: lesson.content_url, title: lesson.name });
      setVideoPlayerOpen(true);
    } else {
      window.open(lesson.content_url, "_blank");
    }
  };

  const handleAccessUrl = (url: string | null) => {
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

  // Calculate total progress
  const totalLessons = Object.values(lessons).flat().length;
  const completedCount = completedLessons.size;
  const progressPercentage = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;

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

  const hasModules = modules.length > 0;

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
          {/* Product Info & Modules */}
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

            {/* Progress Bar */}
            {hasModules && totalLessons > 0 && (
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Seu Progresso</span>
                    <span className="text-sm text-muted-foreground">
                      {completedCount} de {totalLessons} aulas ({progressPercentage}%)
                    </span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary transition-all duration-300"
                      style={{ width: `${progressPercentage}%` }}
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Modules and Lessons */}
            {hasModules && (
              <Card>
                <CardHeader>
                  <CardTitle>Conteúdo do Curso</CardTitle>
                  <CardDescription>
                    {modules.length} módulo{modules.length > 1 ? 's' : ''} disponíve{modules.length > 1 ? 'is' : 'l'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Accordion type="multiple" className="space-y-2">
                    {modules.map((module, moduleIndex) => {
                      const moduleLessons = lessons[module.id] || [];
                      const totalDuration = moduleLessons.reduce((acc, l) => acc + (l.duration_minutes || 0), 0);
                      const moduleCompletedCount = moduleLessons.filter(l => completedLessons.has(l.id)).length;
                      
                      return (
                        <AccordionItem key={module.id} value={module.id} className="border rounded-lg">
                          <AccordionTrigger className="px-4 hover:no-underline">
                            <div className="flex items-center gap-3 flex-1 text-left">
                              <span className="flex items-center justify-center h-8 w-8 rounded-full bg-primary/10 text-primary text-sm font-medium">
                                {moduleIndex + 1}
                              </span>
                              <div className="flex-1">
                                <p className="font-medium">{module.name}</p>
                                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                  <span>{moduleLessons.length} aula{moduleLessons.length > 1 ? 's' : ''}</span>
                                  {totalDuration > 0 && (
                                    <span className="flex items-center gap-1">
                                      <Clock className="h-3 w-3" />
                                      {totalDuration} min
                                    </span>
                                  )}
                                  <ModuleProgress 
                                    completedCount={moduleCompletedCount} 
                                    totalCount={moduleLessons.length} 
                                  />
                                </div>
                              </div>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="px-4 pb-4">
                            {module.description && (
                              <p className="text-sm text-muted-foreground mb-4 ml-11">
                                {module.description}
                              </p>
                            )}
                            <div className="space-y-2 ml-11">
                              {moduleLessons.map((lesson) => {
                                const isCompleted = completedLessons.has(lesson.id);
                                return (
                                  <div
                                    key={lesson.id}
                                    className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                                  >
                                    <LessonCheckbox
                                      isCompleted={isCompleted}
                                      onClick={() => toggleLessonComplete(lesson.id)}
                                    />
                                    <div 
                                      className="flex-1 cursor-pointer"
                                      onClick={() => handleAccessContent(lesson)}
                                    >
                                      <p className={`font-medium text-sm ${isCompleted ? 'line-through text-muted-foreground' : ''}`}>
                                        {lesson.name}
                                      </p>
                                      {lesson.description && (
                                        <p className="text-xs text-muted-foreground">{lesson.description}</p>
                                      )}
                                    </div>
                                    {lesson.duration_minutes && (
                                      <span className="text-xs text-muted-foreground">
                                        {lesson.duration_minutes} min
                                      </span>
                                    )}
                                    {lesson.is_free && (
                                      <Badge variant="outline" className="text-xs">
                                        Grátis
                                      </Badge>
                                    )}
                                    <Button 
                                      variant="ghost" 
                                      size="icon"
                                      onClick={() => handleAccessContent(lesson)}
                                    >
                                      {lesson.content_type === 'video' ? (
                                        <Play className="h-4 w-4" />
                                      ) : (
                                        <ExternalLink className="h-4 w-4" />
                                      )}
                                    </Button>
                                  </div>
                                );
                              })}
                              {moduleLessons.length === 0 && (
                                <p className="text-sm text-muted-foreground text-center py-4">
                                  Nenhuma aula adicionada ainda
                                </p>
                              )}
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      );
                    })}
                  </Accordion>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Access Card */}
            {(product?.deliverable_url || product?.content_url || !hasModules) && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {getDeliverableIcon(product?.deliverable_type)}
                    Acesso Rápido
                  </CardTitle>
                  <CardDescription>
                    {hasModules 
                      ? "Links adicionais do produto" 
                      : "Clique no botão abaixo para acessar seu produto"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {product?.deliverable_url && (
                    <Button 
                      className="w-full" 
                      size="lg"
                      onClick={() => handleAccessUrl(product.deliverable_url)}
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
                      onClick={() => handleAccessUrl(product.content_url)}
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Área de Conteúdo
                    </Button>
                  )}

                  {!product?.deliverable_url && !product?.content_url && !hasModules && (
                    <div className="text-center py-4 text-muted-foreground">
                      <p>Conteúdo em breve...</p>
                      <p className="text-sm mt-1">
                        O vendedor ainda não configurou o conteúdo.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Membership Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Informações do Acesso</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Nível de Acesso</span>
                  <Badge variant="outline" className="capitalize">
                    {membership?.access_level}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Membro desde</span>
                  <span>
                    {membership?.created_at
                      ? new Date(membership.created_at).toLocaleDateString("pt-BR")
                      : "-"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Expira em</span>
                  <span>
                    {membership?.expires_at
                      ? new Date(membership.expires_at).toLocaleDateString("pt-BR")
                      : "Vitalício"}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Video Player Modal */}
      <VideoPlayer
        open={videoPlayerOpen}
        onOpenChange={setVideoPlayerOpen}
        url={currentVideo?.url || null}
        title={currentVideo?.title || ""}
      />
    </div>
  );
};

export default MemberProduct;
