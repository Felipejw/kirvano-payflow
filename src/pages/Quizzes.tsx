import { useState, useEffect } from "react";
import { Plus, MoreHorizontal, Copy, ExternalLink, Trash2, Edit, BarChart3, Search, Filter, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useAppNavigate } from "@/lib/routes";
import { DashboardLayout } from "@/components/layout/DashboardLayout";

interface Quiz {
  id: string;
  name: string;
  description: string | null;
  status: string;
  custom_slug: string | null;
  created_at: string;
  updated_at: string;
  leads_count?: number;
  completion_rate?: number;
}

interface QuizStats {
  quiz_id: string;
  total_leads: number;
  completed_leads: number;
  qualified_leads: number;
}

export default function Quizzes() {
  const { user } = useAuth();
  const navigate = useAppNavigate();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [quizStats, setQuizStats] = useState<Record<string, QuizStats>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);
  const [formData, setFormData] = useState({ name: "", description: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      fetchQuizzes();
    }
  }, [user]);

  async function fetchQuizzes() {
    try {
      setLoading(true);
      
      // Fetch quizzes
      const { data: quizzesData, error: quizzesError } = await supabase
        .from("quizzes")
        .select("*")
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false });

      if (quizzesError) throw quizzesError;

      // Fetch leads stats for each quiz
      if (quizzesData && quizzesData.length > 0) {
        const quizIds = quizzesData.map(q => q.id);
        
        const { data: leadsData, error: leadsError } = await supabase
          .from("quiz_leads")
          .select("quiz_id, status")
          .in("quiz_id", quizIds);

        if (!leadsError && leadsData) {
          const stats: Record<string, QuizStats> = {};
          quizIds.forEach(id => {
            const quizLeads = leadsData.filter(l => l.quiz_id === id);
            stats[id] = {
              quiz_id: id,
              total_leads: quizLeads.length,
              completed_leads: quizLeads.filter(l => l.status === "completed").length,
              qualified_leads: quizLeads.filter(l => l.status === "qualified" || l.status === "completed").length,
            };
          });
          setQuizStats(stats);
        }
      }

      setQuizzes(quizzesData || []);
    } catch (error: any) {
      console.error("Error fetching quizzes:", error);
      toast.error("Erro ao carregar quizzes");
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateQuiz() {
    if (!formData.name.trim()) {
      toast.error("Nome é obrigatório");
      return;
    }

    try {
      setIsSubmitting(true);

      const { data, error } = await supabase
        .from("quizzes")
        .insert({
          user_id: user?.id,
          name: formData.name.trim(),
          description: formData.description.trim() || null,
          status: "draft",
        })
        .select()
        .single();

      if (error) throw error;

      toast.success("Quiz criado com sucesso!");
      setCreateDialogOpen(false);
      setFormData({ name: "", description: "" });
      
      // Navigate to quiz builder
      navigate("dashboard/quizzes/builder", { id: data.id });
    } catch (error: any) {
      console.error("Error creating quiz:", error);
      toast.error("Erro ao criar quiz");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDeleteQuiz() {
    if (!selectedQuiz) return;

    try {
      setIsSubmitting(true);

      const { error } = await supabase
        .from("quizzes")
        .delete()
        .eq("id", selectedQuiz.id);

      if (error) throw error;

      toast.success("Quiz excluído com sucesso!");
      setDeleteDialogOpen(false);
      setSelectedQuiz(null);
      fetchQuizzes();
    } catch (error: any) {
      console.error("Error deleting quiz:", error);
      toast.error("Erro ao excluir quiz");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDuplicateQuiz(quiz: Quiz) {
    try {
      const { data, error } = await supabase
        .from("quizzes")
        .insert({
          user_id: user?.id,
          name: `${quiz.name} (cópia)`,
          description: quiz.description,
          status: "draft",
        })
        .select()
        .single();

      if (error) throw error;

      toast.success("Quiz duplicado com sucesso!");
      fetchQuizzes();
    } catch (error: any) {
      console.error("Error duplicating quiz:", error);
      toast.error("Erro ao duplicar quiz");
    }
  }

  async function handleToggleStatus(quiz: Quiz) {
    const newStatus = quiz.status === "active" ? "paused" : "active";
    
    try {
      const { error } = await supabase
        .from("quizzes")
        .update({ status: newStatus })
        .eq("id", quiz.id);

      if (error) throw error;

      toast.success(`Quiz ${newStatus === "active" ? "ativado" : "pausado"} com sucesso!`);
      fetchQuizzes();
    } catch (error: any) {
      console.error("Error toggling quiz status:", error);
      toast.error("Erro ao atualizar status do quiz");
    }
  }

  function copyQuizLink(quiz: Quiz) {
    const slug = quiz.custom_slug || quiz.id;
    const link = `${window.location.origin}/?page=quiz&s=${slug}`;
    navigator.clipboard.writeText(link);
    toast.success("Link copiado para a área de transferência!");
  }

  const filteredQuizzes = quizzes.filter(quiz => {
    const matchesSearch = quiz.name.toLowerCase().includes(search.toLowerCase()) ||
                         (quiz.description?.toLowerCase().includes(search.toLowerCase()));
    const matchesStatus = statusFilter === "all" || quiz.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">Ativo</Badge>;
      case "paused":
        return <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">Pausado</Badge>;
      default:
        return <Badge className="bg-muted text-muted-foreground">Rascunho</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // Stats cards data
  const totalQuizzes = quizzes.length;
  const activeQuizzes = quizzes.filter(q => q.status === "active").length;
  const totalLeads = Object.values(quizStats).reduce((acc, s) => acc + s.total_leads, 0);
  const totalCompleted = Object.values(quizStats).reduce((acc, s) => acc + s.completed_leads, 0);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <MessageSquare className="h-6 w-6 text-primary" />
              Quizzes / Funis
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Crie quizzes interativos para capturar e qualificar leads
            </p>
          </div>
          <Button onClick={() => setCreateDialogOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Novo Quiz
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="bg-card/50 border-border/50">
            <CardHeader className="pb-2">
              <CardDescription>Total de Quizzes</CardDescription>
              <CardTitle className="text-2xl">{totalQuizzes}</CardTitle>
            </CardHeader>
          </Card>
          <Card className="bg-card/50 border-border/50">
            <CardHeader className="pb-2">
              <CardDescription>Quizzes Ativos</CardDescription>
              <CardTitle className="text-2xl text-emerald-400">{activeQuizzes}</CardTitle>
            </CardHeader>
          </Card>
          <Card className="bg-card/50 border-border/50">
            <CardHeader className="pb-2">
              <CardDescription>Total de Leads</CardDescription>
              <CardTitle className="text-2xl">{totalLeads}</CardTitle>
            </CardHeader>
          </Card>
          <Card className="bg-card/50 border-border/50">
            <CardHeader className="pb-2">
              <CardDescription>Leads Finalizados</CardDescription>
              <CardTitle className="text-2xl text-primary">{totalCompleted}</CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar quizzes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-40">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="active">Ativos</SelectItem>
              <SelectItem value="paused">Pausados</SelectItem>
              <SelectItem value="draft">Rascunhos</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Quiz List */}
        {loading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-5 bg-muted rounded w-3/4" />
                  <div className="h-4 bg-muted rounded w-1/2 mt-2" />
                </CardHeader>
                <CardContent>
                  <div className="h-4 bg-muted rounded w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredQuizzes.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhum quiz encontrado</h3>
              <p className="text-muted-foreground text-center mb-4">
                {search || statusFilter !== "all" 
                  ? "Tente ajustar os filtros de busca"
                  : "Crie seu primeiro quiz para começar a capturar leads"
                }
              </p>
              {!search && statusFilter === "all" && (
                <Button onClick={() => setCreateDialogOpen(true)} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Criar Primeiro Quiz
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredQuizzes.map((quiz) => {
              const stats = quizStats[quiz.id];
              const completionRate = stats && stats.total_leads > 0 
                ? Math.round((stats.completed_leads / stats.total_leads) * 100) 
                : 0;

              return (
                <Card 
                  key={quiz.id} 
                  className="group hover:border-primary/50 transition-colors cursor-pointer"
                  onClick={() => navigate("dashboard/quizzes/builder", { id: quiz.id })}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1 flex-1 min-w-0">
                        <CardTitle className="text-lg truncate">{quiz.name}</CardTitle>
                        {quiz.description && (
                          <CardDescription className="line-clamp-2">
                            {quiz.description}
                          </CardDescription>
                        )}
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="icon" className="shrink-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem 
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate("dashboard/quizzes/builder", { id: quiz.id });
                            }}
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={(e) => {
                            e.stopPropagation();
                            copyQuizLink(quiz);
                          }}>
                            <Copy className="h-4 w-4 mr-2" />
                            Copiar Link
                          </DropdownMenuItem>
                          {quiz.status === "active" && (
                            <DropdownMenuItem onClick={(e) => {
                              e.stopPropagation();
                              window.open(`/?page=quiz&s=${quiz.custom_slug || quiz.id}`, "_blank");
                            }}>
                              <ExternalLink className="h-4 w-4 mr-2" />
                              Visualizar
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem onClick={(e) => {
                            e.stopPropagation();
                            handleDuplicateQuiz(quiz);
                          }}>
                            <Copy className="h-4 w-4 mr-2" />
                            Duplicar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={(e) => {
                            e.stopPropagation();
                            handleToggleStatus(quiz);
                          }}>
                            {quiz.status === "active" ? "Pausar" : "Ativar"}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            className="text-destructive focus:text-destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedQuiz(quiz);
                              setDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-4">
                        {getStatusBadge(quiz.status)}
                        <span className="text-muted-foreground">
                          {formatDate(quiz.created_at)}
                        </span>
                      </div>
                    </div>
                    
                    {stats && (
                      <div className="mt-4 pt-4 border-t border-border/50 grid grid-cols-3 gap-2 text-center">
                        <div>
                          <p className="text-lg font-semibold">{stats.total_leads}</p>
                          <p className="text-xs text-muted-foreground">Leads</p>
                        </div>
                        <div>
                          <p className="text-lg font-semibold text-emerald-400">{stats.completed_leads}</p>
                          <p className="text-xs text-muted-foreground">Finalizados</p>
                        </div>
                        <div>
                          <p className="text-lg font-semibold text-primary">{completionRate}%</p>
                          <p className="text-xs text-muted-foreground">Conclusão</p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Create Quiz Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Criar Novo Quiz</DialogTitle>
            <DialogDescription>
              Dê um nome ao seu quiz para começar a criar as etapas e perguntas.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome do Quiz *</Label>
              <Input
                id="name"
                placeholder="Ex: Quiz de Qualificação"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Descrição (opcional)</Label>
              <Textarea
                id="description"
                placeholder="Descreva o objetivo do seu quiz..."
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreateQuiz} disabled={isSubmitting}>
              {isSubmitting ? "Criando..." : "Criar Quiz"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir Quiz</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir o quiz "{selectedQuiz?.name}"? 
              Esta ação não pode ser desfeita e todos os leads associados serão perdidos.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDeleteQuiz} disabled={isSubmitting}>
              {isSubmitting ? "Excluindo..." : "Excluir"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
