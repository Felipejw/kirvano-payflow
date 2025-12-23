import { useState, useEffect } from "react";
import { Plus, GripVertical, Trash2, Type, Image, Video, MousePointer, FileText, List, Timer, ChevronRight, MessageSquare, Star, Award, Play, BarChart3, AlertCircle, Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface QuizStep {
  id: string;
  quiz_id: string;
  name: string;
  order_index: number;
  step_type: string;
  settings: any;
  created_at: string;
}

interface QuizElement {
  id: string;
  step_id: string;
  element_type: string;
  order_index: number;
  content: any;
  styles: any;
  created_at: string;
}

interface QuizBuilderTabProps {
  quizId: string;
}

const ELEMENT_TYPES = [
  { type: "title", label: "Título", icon: Type, description: "Título grande" },
  { type: "text", label: "Texto", icon: FileText, description: "Parágrafo de texto" },
  { type: "image", label: "Imagem", icon: Image, description: "Imagem ou GIF" },
  { type: "video", label: "Vídeo", icon: Video, description: "Vídeo do YouTube/Vimeo" },
  { type: "options", label: "Opções", icon: List, description: "Múltipla escolha" },
  { type: "button", label: "Botão", icon: MousePointer, description: "Botão de ação" },
  { type: "input", label: "Campo", icon: Type, description: "Campo de entrada" },
  { type: "timer", label: "Timer", icon: Timer, description: "Contagem regressiva" },
  { type: "testimonial", label: "Depoimento", icon: MessageSquare, description: "Prova social" },
  { type: "alert", label: "Alerta", icon: AlertCircle, description: "Mensagem de destaque" },
  { type: "progress", label: "Progresso", icon: BarChart3, description: "Barra de progresso" },
  { type: "confetti", label: "Confetti", icon: Sparkles, description: "Animação de celebração" },
  { type: "loading", label: "Loading", icon: Loader2, description: "Animação de carregamento" },
];

const STEP_TYPES = [
  { type: "question", label: "Pergunta" },
  { type: "info", label: "Informação" },
  { type: "form", label: "Formulário" },
  { type: "result", label: "Resultado" },
  { type: "redirect", label: "Redirecionamento" },
];

export default function QuizBuilderTab({ quizId }: QuizBuilderTabProps) {
  const [steps, setSteps] = useState<QuizStep[]>([]);
  const [elements, setElements] = useState<Record<string, QuizElement[]>>({});
  const [selectedStep, setSelectedStep] = useState<QuizStep | null>(null);
  const [loading, setLoading] = useState(true);
  const [addStepDialogOpen, setAddStepDialogOpen] = useState(false);
  const [editStepDialogOpen, setEditStepDialogOpen] = useState(false);
  const [newStepName, setNewStepName] = useState("");
  const [newStepType, setNewStepType] = useState("question");

  useEffect(() => {
    fetchSteps();
  }, [quizId]);

  async function fetchSteps() {
    try {
      setLoading(true);
      
      const { data: stepsData, error: stepsError } = await supabase
        .from("quiz_steps")
        .select("*")
        .eq("quiz_id", quizId)
        .order("order_index");

      if (stepsError) throw stepsError;
      
      setSteps(stepsData || []);
      
      if (stepsData && stepsData.length > 0) {
        setSelectedStep(stepsData[0]);
        
        // Fetch elements for all steps
        const stepIds = stepsData.map(s => s.id);
        const { data: elementsData, error: elementsError } = await supabase
          .from("quiz_elements")
          .select("*")
          .in("step_id", stepIds)
          .order("order_index");

        if (!elementsError && elementsData) {
          const elementsByStep: Record<string, QuizElement[]> = {};
          stepsData.forEach(step => {
            elementsByStep[step.id] = elementsData.filter(e => e.step_id === step.id);
          });
          setElements(elementsByStep);
        }
      }
    } catch (error: any) {
      console.error("Error fetching steps:", error);
      toast.error("Erro ao carregar etapas");
    } finally {
      setLoading(false);
    }
  }

  async function handleAddStep() {
    if (!newStepName.trim()) {
      toast.error("Nome é obrigatório");
      return;
    }

    try {
      const { data, error } = await supabase
        .from("quiz_steps")
        .insert({
          quiz_id: quizId,
          name: newStepName.trim(),
          step_type: newStepType,
          order_index: steps.length,
        })
        .select()
        .single();

      if (error) throw error;

      setSteps(prev => [...prev, data]);
      setElements(prev => ({ ...prev, [data.id]: [] }));
      setSelectedStep(data);
      setAddStepDialogOpen(false);
      setNewStepName("");
      setNewStepType("question");
      toast.success("Etapa criada!");
    } catch (error: any) {
      console.error("Error adding step:", error);
      toast.error("Erro ao criar etapa");
    }
  }

  async function handleDeleteStep(stepId: string) {
    try {
      const { error } = await supabase
        .from("quiz_steps")
        .delete()
        .eq("id", stepId);

      if (error) throw error;

      const updatedSteps = steps.filter(s => s.id !== stepId);
      setSteps(updatedSteps);
      
      if (selectedStep?.id === stepId) {
        setSelectedStep(updatedSteps[0] || null);
      }
      
      toast.success("Etapa excluída!");
    } catch (error: any) {
      console.error("Error deleting step:", error);
      toast.error("Erro ao excluir etapa");
    }
  }

  async function handleAddElement(elementType: string) {
    if (!selectedStep) return;

    try {
      const stepElements = elements[selectedStep.id] || [];
      const defaultContent = getDefaultContent(elementType);
      
      const { data, error } = await supabase
        .from("quiz_elements")
        .insert({
          step_id: selectedStep.id,
          element_type: elementType,
          order_index: stepElements.length,
          content: defaultContent,
          styles: {},
        })
        .select()
        .single();

      if (error) throw error;

      setElements(prev => ({
        ...prev,
        [selectedStep.id]: [...(prev[selectedStep.id] || []), data],
      }));
      
      toast.success("Elemento adicionado!");
    } catch (error: any) {
      console.error("Error adding element:", error);
      toast.error("Erro ao adicionar elemento");
    }
  }

  async function handleDeleteElement(elementId: string) {
    if (!selectedStep) return;

    try {
      const { error } = await supabase
        .from("quiz_elements")
        .delete()
        .eq("id", elementId);

      if (error) throw error;

      setElements(prev => ({
        ...prev,
        [selectedStep.id]: (prev[selectedStep.id] || []).filter(e => e.id !== elementId),
      }));
      
      toast.success("Elemento removido!");
    } catch (error: any) {
      console.error("Error deleting element:", error);
      toast.error("Erro ao remover elemento");
    }
  }

  async function handleUpdateElement(elementId: string, updates: Partial<QuizElement>) {
    if (!selectedStep) return;

    try {
      const { error } = await supabase
        .from("quiz_elements")
        .update(updates)
        .eq("id", elementId);

      if (error) throw error;

      setElements(prev => ({
        ...prev,
        [selectedStep.id]: (prev[selectedStep.id] || []).map(e => 
          e.id === elementId ? { ...e, ...updates } : e
        ),
      }));
    } catch (error: any) {
      console.error("Error updating element:", error);
    }
  }

  function getDefaultContent(elementType: string): Record<string, any> {
    switch (elementType) {
      case "title":
        return { text: "Novo Título" };
      case "text":
        return { text: "Digite seu texto aqui..." };
      case "image":
        return { url: "", alt: "Imagem" };
      case "video":
        return { url: "", provider: "youtube" };
      case "options":
        return { 
          options: [
            { id: "1", text: "Opção 1", value: "1" },
            { id: "2", text: "Opção 2", value: "2" },
            { id: "3", text: "Opção 3", value: "3" },
          ],
          multiple: false,
        };
      case "button":
        return { text: "Continuar", action: "next" };
      case "input":
        return { label: "Campo", placeholder: "Digite aqui...", type: "text", required: true };
      case "timer":
        return { duration: 60, autoAdvance: false };
      case "testimonial":
        return { name: "Nome", avatar: "", text: "Depoimento aqui...", role: "Cliente" };
      case "alert":
        return { type: "info", text: "Mensagem importante!" };
      case "progress":
        return { value: 50, showLabel: true };
      case "confetti":
        return { trigger: "onLoad", duration: 3000 };
      case "loading":
        return { text: "Carregando...", duration: 2000 };
      default:
        return {};
    }
  }

  function getStepTypeBadge(stepType: string) {
    const typeConfig: Record<string, { label: string; className: string }> = {
      question: { label: "Pergunta", className: "bg-blue-500/20 text-blue-400" },
      info: { label: "Info", className: "bg-cyan-500/20 text-cyan-400" },
      form: { label: "Formulário", className: "bg-purple-500/20 text-purple-400" },
      result: { label: "Resultado", className: "bg-emerald-500/20 text-emerald-400" },
      redirect: { label: "Redirect", className: "bg-amber-500/20 text-amber-400" },
    };
    const config = typeConfig[stepType] || { label: stepType, className: "bg-muted" };
    return <Badge className={cn("text-xs", config.className)}>{config.label}</Badge>;
  }

  const selectedStepElements = selectedStep ? elements[selectedStep.id] || [] : [];

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="h-full flex">
      {/* Steps List - Left Panel */}
      <div className="w-64 border-r border-border bg-card/50 flex flex-col">
        <div className="p-3 border-b border-border flex items-center justify-between">
          <h3 className="font-semibold text-sm">Etapas</h3>
          <Button size="sm" variant="ghost" onClick={() => setAddStepDialogOpen(true)}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-1">
            {steps.map((step, index) => (
              <div
                key={step.id}
                className={cn(
                  "group flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors",
                  selectedStep?.id === step.id 
                    ? "bg-primary/10 border border-primary/30" 
                    : "hover:bg-muted/50"
                )}
                onClick={() => setSelectedStep(step)}
              >
                <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">{String(index + 1).padStart(2, "0")}</span>
                    <span className="text-sm font-medium truncate">{step.name}</span>
                  </div>
                  <div className="mt-1">{getStepTypeBadge(step.step_type)}</div>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6 opacity-0 group-hover:opacity-100 shrink-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteStep(step.id);
                  }}
                >
                  <Trash2 className="h-3 w-3 text-destructive" />
                </Button>
              </div>
            ))}
            
            {steps.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <p className="text-sm">Nenhuma etapa</p>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="mt-2"
                  onClick={() => setAddStepDialogOpen(true)}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Criar Primeira Etapa
                </Button>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Preview - Center */}
      <div className="flex-1 bg-muted/30 p-6 overflow-auto">
        {selectedStep ? (
          <div className="max-w-md mx-auto">
            <Card className="border-2 border-dashed border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center justify-between">
                  {selectedStep.name}
                  {getStepTypeBadge(selectedStep.step_type)}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {selectedStepElements.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                    <p className="text-sm">Arraste elementos aqui</p>
                    <p className="text-xs mt-1">ou clique na paleta ao lado</p>
                  </div>
                ) : (
                  selectedStepElements.map((element) => (
                    <ElementPreview
                      key={element.id}
                      element={element}
                      onUpdate={(updates) => handleUpdateElement(element.id, updates)}
                      onDelete={() => handleDeleteElement(element.id)}
                    />
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="h-full flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <Loader2 className="h-12 w-12 mx-auto mb-4 opacity-30" />
              <p>Selecione ou crie uma etapa para começar</p>
            </div>
          </div>
        )}
      </div>

      {/* Elements Palette - Right Panel */}
      <div className="w-64 border-l border-border bg-card/50 flex flex-col">
        <div className="p-3 border-b border-border">
          <h3 className="font-semibold text-sm">Elementos</h3>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-2 grid grid-cols-2 gap-2">
            {ELEMENT_TYPES.map((element) => {
              const Icon = element.icon;
              return (
                <Button
                  key={element.type}
                  variant="outline"
                  className="h-auto flex-col gap-1 p-3 hover:border-primary/50"
                  onClick={() => handleAddElement(element.type)}
                  disabled={!selectedStep}
                >
                  <Icon className="h-5 w-5" />
                  <span className="text-xs">{element.label}</span>
                </Button>
              );
            })}
          </div>
        </ScrollArea>
      </div>

      {/* Add Step Dialog */}
      <Dialog open={addStepDialogOpen} onOpenChange={setAddStepDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Etapa</DialogTitle>
            <DialogDescription>
              Adicione uma nova etapa ao seu quiz
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nome da Etapa</Label>
              <Input
                placeholder="Ex: Pergunta 1"
                value={newStepName}
                onChange={(e) => setNewStepName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select value={newStepType} onValueChange={setNewStepType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STEP_TYPES.map((type) => (
                    <SelectItem key={type.type} value={type.type}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddStepDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAddStep}>Criar Etapa</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Element Preview Component
function ElementPreview({ 
  element, 
  onUpdate, 
  onDelete 
}: { 
  element: QuizElement; 
  onUpdate: (updates: Partial<QuizElement>) => void;
  onDelete: () => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const content = element.content as Record<string, any>;

  const renderElement = () => {
    switch (element.element_type) {
      case "title":
        return (
          <h2 
            className="text-xl font-bold cursor-text"
            onClick={() => setIsEditing(true)}
          >
            {content.text || "Título"}
          </h2>
        );
      case "text":
        return (
          <p 
            className="text-muted-foreground cursor-text"
            onClick={() => setIsEditing(true)}
          >
            {content.text || "Texto"}
          </p>
        );
      case "image":
        return (
          <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
            {content.url ? (
              <img src={content.url} alt={content.alt} className="w-full h-full object-cover rounded-lg" />
            ) : (
              <span className="text-muted-foreground text-sm">Clique para adicionar imagem</span>
            )}
          </div>
        );
      case "video":
        return (
          <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
            <Play className="h-12 w-12 text-muted-foreground" />
          </div>
        );
      case "options":
        return (
          <div className="space-y-2">
            {(content.options || []).map((option: any, i: number) => (
              <div 
                key={option.id || i}
                className="p-3 border rounded-lg hover:border-primary/50 cursor-pointer transition-colors"
              >
                {option.text}
              </div>
            ))}
          </div>
        );
      case "button":
        return (
          <Button className="w-full" onClick={() => setIsEditing(true)}>
            {content.text || "Continuar"}
          </Button>
        );
      case "input":
        return (
          <div className="space-y-2">
            <Label>{content.label || "Campo"}</Label>
            <Input placeholder={content.placeholder || "Digite aqui..."} disabled />
          </div>
        );
      case "timer":
        return (
          <div className="text-center p-4 bg-primary/10 rounded-lg">
            <div className="text-2xl font-bold">{Math.floor((content.duration || 60) / 60)}:{String((content.duration || 60) % 60).padStart(2, "0")}</div>
          </div>
        );
      case "alert":
        return (
          <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg text-sm">
            {content.text || "Mensagem de alerta"}
          </div>
        );
      default:
        return (
          <div className="p-4 bg-muted rounded text-sm text-muted-foreground">
            {element.element_type}
          </div>
        );
    }
  };

  return (
    <div className="group relative">
      {renderElement()}
      <div className="absolute -right-2 -top-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button 
          size="icon" 
          variant="destructive" 
          className="h-6 w-6"
          onClick={onDelete}
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}
