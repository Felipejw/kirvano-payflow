import { useState, useEffect } from "react";
import { ArrowLeft, Save, Eye, Settings, Layers, GitBranch, Users, Palette, Play, Pause, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useAppNavigate, getUrlParam } from "@/lib/routes";
import QuizBuilderTab from "@/components/quiz-builder/QuizBuilderTab";
import QuizFlowTab from "@/components/quiz-builder/QuizFlowTab";
import QuizDesignTab from "@/components/quiz-builder/QuizDesignTab";
import QuizLeadsTab from "@/components/quiz-builder/QuizLeadsTab";
import QuizSettingsTab from "@/components/quiz-builder/QuizSettingsTab";
import QuizAnalyticsTab from "@/components/quiz-builder/QuizAnalyticsTab";

interface Quiz {
  id: string;
  name: string;
  description: string | null;
  status: string;
  custom_slug: string | null;
  custom_domain: string | null;
  domain_verified: boolean;
  facebook_pixel: string | null;
  google_analytics: string | null;
  tiktok_pixel: string | null;
  primary_color: string;
  background_color: string;
  button_color: string;
  text_color: string;
  logo_url: string | null;
  show_logo: boolean;
  show_progress_bar: boolean;
  allow_back_navigation: boolean;
  font_family: string;
  created_at: string;
  updated_at: string;
}

export default function QuizBuilder() {
  const { user } = useAuth();
  const navigate = useAppNavigate();
  const quizId = getUrlParam("id");
  
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("builder");

  useEffect(() => {
    if (user && quizId) {
      fetchQuiz();
    }
  }, [user, quizId]);

  async function fetchQuiz() {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from("quizzes")
        .select("*")
        .eq("id", quizId)
        .eq("user_id", user?.id)
        .single();

      if (error) throw error;
      
      setQuiz(data);
    } catch (error: any) {
      console.error("Error fetching quiz:", error);
      toast.error("Erro ao carregar quiz");
      navigate("dashboard/quizzes");
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!quiz) return;
    
    try {
      setSaving(true);
      
      const { error } = await supabase
        .from("quizzes")
        .update({
          name: quiz.name,
          description: quiz.description,
          custom_slug: quiz.custom_slug,
          custom_domain: quiz.custom_domain,
          facebook_pixel: quiz.facebook_pixel,
          google_analytics: quiz.google_analytics,
          tiktok_pixel: quiz.tiktok_pixel,
          primary_color: quiz.primary_color,
          background_color: quiz.background_color,
          button_color: quiz.button_color,
          text_color: quiz.text_color,
          logo_url: quiz.logo_url,
          show_logo: quiz.show_logo,
          show_progress_bar: quiz.show_progress_bar,
          allow_back_navigation: quiz.allow_back_navigation,
          font_family: quiz.font_family,
        })
        .eq("id", quiz.id);

      if (error) throw error;
      
      toast.success("Quiz salvo com sucesso!");
    } catch (error: any) {
      console.error("Error saving quiz:", error);
      toast.error("Erro ao salvar quiz");
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleStatus() {
    if (!quiz) return;
    
    const newStatus = quiz.status === "active" ? "paused" : "active";
    
    try {
      const { error } = await supabase
        .from("quizzes")
        .update({ status: newStatus })
        .eq("id", quiz.id);

      if (error) throw error;
      
      setQuiz(prev => prev ? { ...prev, status: newStatus } : null);
      toast.success(`Quiz ${newStatus === "active" ? "ativado" : "pausado"} com sucesso!`);
    } catch (error: any) {
      console.error("Error toggling status:", error);
      toast.error("Erro ao atualizar status");
    }
  }

  function handlePreview() {
    if (!quiz) return;
    const slug = quiz.custom_slug || quiz.id;
    window.open(`/?page=quiz&s=${slug}&preview=true`, "_blank");
  }

  function updateQuiz(updates: Partial<Quiz>) {
    setQuiz(prev => prev ? { ...prev, ...updates } : null);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Quiz não encontrado</h2>
          <Button onClick={() => navigate("dashboard/quizzes")}>
            Voltar para Quizzes
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="h-14 border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50 px-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => navigate("dashboard/quizzes")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="font-semibold text-lg">{quiz.name}</h1>
            <p className="text-xs text-muted-foreground">
              {quiz.status === "active" ? "Ativo" : quiz.status === "paused" ? "Pausado" : "Rascunho"}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="gap-2"
            onClick={handlePreview}
          >
            <Eye className="h-4 w-4" />
            <span className="hidden sm:inline">Visualizar</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={handleToggleStatus}
          >
            {quiz.status === "active" ? (
              <>
                <Pause className="h-4 w-4" />
                <span className="hidden sm:inline">Pausar</span>
              </>
            ) : (
              <>
                <Play className="h-4 w-4" />
                <span className="hidden sm:inline">Ativar</span>
              </>
            )}
          </Button>
          <Button 
            size="sm" 
            className="gap-2"
            onClick={handleSave}
            disabled={saving}
          >
            <Save className="h-4 w-4" />
            <span className="hidden sm:inline">{saving ? "Salvando..." : "Salvar"}</span>
          </Button>
        </div>
      </header>

      {/* Main Content with Tabs */}
      <div className="flex-1 flex flex-col">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          <div className="border-b border-border bg-card/30">
            <div className="container max-w-7xl mx-auto">
              <TabsList className="h-12 bg-transparent gap-1">
                <TabsTrigger value="builder" className="gap-2 data-[state=active]:bg-primary/10">
                  <Layers className="h-4 w-4" />
                  <span className="hidden sm:inline">Construtor</span>
                </TabsTrigger>
                <TabsTrigger value="flow" className="gap-2 data-[state=active]:bg-primary/10">
                  <GitBranch className="h-4 w-4" />
                  <span className="hidden sm:inline">Fluxo</span>
                </TabsTrigger>
                <TabsTrigger value="design" className="gap-2 data-[state=active]:bg-primary/10">
                  <Palette className="h-4 w-4" />
                  <span className="hidden sm:inline">Design</span>
                </TabsTrigger>
                <TabsTrigger value="leads" className="gap-2 data-[state=active]:bg-primary/10">
                  <Users className="h-4 w-4" />
                  <span className="hidden sm:inline">Leads</span>
                </TabsTrigger>
                <TabsTrigger value="analytics" className="gap-2 data-[state=active]:bg-primary/10">
                  <BarChart3 className="h-4 w-4" />
                  <span className="hidden sm:inline">Analytics</span>
                </TabsTrigger>
                <TabsTrigger value="settings" className="gap-2 data-[state=active]:bg-primary/10">
                  <Settings className="h-4 w-4" />
                  <span className="hidden sm:inline">Configurações</span>
                </TabsTrigger>
              </TabsList>
            </div>
          </div>

          <div className="flex-1 overflow-hidden">
            <TabsContent value="builder" className="h-full m-0">
              <QuizBuilderTab quizId={quiz.id} />
            </TabsContent>
            <TabsContent value="flow" className="h-full m-0">
              <QuizFlowTab quizId={quiz.id} />
            </TabsContent>
            <TabsContent value="design" className="h-full m-0">
              <QuizDesignTab quiz={quiz} onUpdate={updateQuiz} />
            </TabsContent>
            <TabsContent value="leads" className="h-full m-0">
              <QuizLeadsTab quizId={quiz.id} />
            </TabsContent>
            <TabsContent value="analytics" className="h-full m-0">
              <QuizAnalyticsTab quizId={quiz.id} />
            </TabsContent>
            <TabsContent value="settings" className="h-full m-0">
              <QuizSettingsTab quiz={quiz} onUpdate={updateQuiz} />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
}
