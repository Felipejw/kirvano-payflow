import { useState, useEffect } from "react";
import { Plus, Type, Image, Video, MousePointer, FileText, List, Timer, MessageSquare, Star, Play, BarChart3, AlertCircle, Sparkles, Loader2, Sliders, ImageIcon, Calendar, Smile, Minus, ListChecks, Clock, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import ElementConfigDialog from "./elements/ElementConfigDialog";
import SortableStep from "./SortableStep";
import SortableElement from "./SortableElement";
import LivePreview from "./LivePreview";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";

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

interface Quiz {
  id: string;
  name: string;
  primary_color?: string;
  background_color?: string;
  text_color?: string;
  button_color?: string;
  font_family?: string;
  logo_url?: string;
  show_logo?: boolean;
  show_progress_bar?: boolean;
}

interface QuizBuilderTabProps {
  quizId: string;
  quiz?: Quiz;
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
  { type: "rating", label: "Avaliação", icon: Star, description: "Escala de estrelas/números" },
  { type: "slider", label: "Slider", icon: Sliders, description: "Escala deslizante" },
  { type: "image_options", label: "Opções Imagem", icon: ImageIcon, description: "Opções com imagens" },
  { type: "date_picker", label: "Data", icon: Calendar, description: "Seletor de data" },
  { type: "emoji_rating", label: "Emoji", icon: Smile, description: "Avaliação com emojis" },
  { type: "divider", label: "Divisor", icon: Minus, description: "Linha separadora" },
  { type: "icon_list", label: "Lista Ícones", icon: ListChecks, description: "Lista com ícones" },
  { type: "countdown", label: "Countdown", icon: Clock, description: "Contagem para data" },
];

const STEP_TYPES = [
  { type: "question", label: "Pergunta" },
  { type: "info", label: "Informação" },
  { type: "form", label: "Formulário" },
  { type: "result", label: "Resultado" },
  { type: "redirect", label: "Redirecionamento" },
];

export default function QuizBuilderTab({ quizId, quiz }: QuizBuilderTabProps) {
  const [steps, setSteps] = useState<QuizStep[]>([]);
  const [elements, setElements] = useState<Record<string, QuizElement[]>>({});
  const [selectedStep, setSelectedStep] = useState<QuizStep | null>(null);
  const [loading, setLoading] = useState(true);
  const [addStepDialogOpen, setAddStepDialogOpen] = useState(false);
  const [newStepName, setNewStepName] = useState("");
  const [newStepType, setNewStepType] = useState("question");
  const [configElement, setConfigElement] = useState<QuizElement | null>(null);
  const [configDialogOpen, setConfigDialogOpen] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

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

  async function handleDuplicateStep(stepId: string) {
    try {
      const stepToDuplicate = steps.find(s => s.id === stepId);
      if (!stepToDuplicate) return;

      // Create new step
      const { data: newStep, error: stepError } = await supabase
        .from("quiz_steps")
        .insert({
          quiz_id: quizId,
          name: `${stepToDuplicate.name} (cópia)`,
          step_type: stepToDuplicate.step_type,
          order_index: steps.length,
          settings: stepToDuplicate.settings,
        })
        .select()
        .single();

      if (stepError) throw stepError;

      // Duplicate elements
      const stepElements = elements[stepId] || [];
      if (stepElements.length > 0) {
        const newElements = stepElements.map((el, idx) => ({
          step_id: newStep.id,
          element_type: el.element_type,
          order_index: idx,
          content: JSON.parse(JSON.stringify(el.content)),
          styles: JSON.parse(JSON.stringify(el.styles)),
        }));

        const { data: insertedElements, error: elementsError } = await supabase
          .from("quiz_elements")
          .insert(newElements)
          .select();

        if (elementsError) throw elementsError;

        setElements(prev => ({
          ...prev,
          [newStep.id]: insertedElements || [],
        }));
      } else {
        setElements(prev => ({ ...prev, [newStep.id]: [] }));
      }

      setSteps(prev => [...prev, newStep]);
      setSelectedStep(newStep);
      toast.success("Etapa duplicada!");
    } catch (error: any) {
      console.error("Error duplicating step:", error);
      toast.error("Erro ao duplicar etapa");
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

  async function handleDuplicateElement(elementId: string) {
    if (!selectedStep) return;

    try {
      const elementToDuplicate = (elements[selectedStep.id] || []).find(e => e.id === elementId);
      if (!elementToDuplicate) return;

      const stepElements = elements[selectedStep.id] || [];
      
      const { data, error } = await supabase
        .from("quiz_elements")
        .insert({
          step_id: selectedStep.id,
          element_type: elementToDuplicate.element_type,
          order_index: stepElements.length,
          content: JSON.parse(JSON.stringify(elementToDuplicate.content)),
          styles: JSON.parse(JSON.stringify(elementToDuplicate.styles)),
        })
        .select()
        .single();

      if (error) throw error;

      setElements(prev => ({
        ...prev,
        [selectedStep.id]: [...(prev[selectedStep.id] || []), data],
      }));
      
      toast.success("Elemento duplicado!");
    } catch (error: any) {
      console.error("Error duplicating element:", error);
      toast.error("Erro ao duplicar elemento");
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

  async function handleStepsDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = steps.findIndex(s => s.id === active.id);
    const newIndex = steps.findIndex(s => s.id === over.id);

    const newSteps = arrayMove(steps, oldIndex, newIndex);
    setSteps(newSteps);

    // Update order_index in database
    try {
      const updates = newSteps.map((step, index) => ({
        id: step.id,
        order_index: index,
      }));

      for (const update of updates) {
        await supabase
          .from("quiz_steps")
          .update({ order_index: update.order_index })
          .eq("id", update.id);
      }
    } catch (error) {
      console.error("Error updating step order:", error);
      toast.error("Erro ao reordenar etapas");
    }
  }

  async function handleElementsDragEnd(event: DragEndEvent) {
    if (!selectedStep) return;
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const stepElements = elements[selectedStep.id] || [];
    const oldIndex = stepElements.findIndex(e => e.id === active.id);
    const newIndex = stepElements.findIndex(e => e.id === over.id);

    const newElements = arrayMove(stepElements, oldIndex, newIndex);
    setElements(prev => ({
      ...prev,
      [selectedStep.id]: newElements,
    }));

    // Update order_index in database
    try {
      const updates = newElements.map((el, index) => ({
        id: el.id,
        order_index: index,
      }));

      for (const update of updates) {
        await supabase
          .from("quiz_elements")
          .update({ order_index: update.order_index })
          .eq("id", update.id);
      }
    } catch (error) {
      console.error("Error updating element order:", error);
      toast.error("Erro ao reordenar elementos");
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
      case "rating":
        return { ratingType: "stars", count: 5, label: "Como você avalia?" };
      case "slider":
        return { min: 0, max: 100, step: 1, defaultValue: 50, minLabel: "Pouco", maxLabel: "Muito" };
      case "image_options":
        return { 
          options: [
            { id: "1", text: "Opção 1", value: "1", imageUrl: "" },
            { id: "2", text: "Opção 2", value: "2", imageUrl: "" },
          ],
          multiple: false,
          columns: 2,
        };
      case "date_picker":
        return { label: "Data", placeholder: "Selecione uma data", required: true };
      case "emoji_rating":
        return { label: "Como você está se sentindo?", emojis: ["😢", "😕", "😐", "🙂", "😄"] };
      case "divider":
        return { style: "solid", spacing: "md" };
      case "icon_list":
        return { iconType: "check", items: ["Benefício 1", "Benefício 2", "Benefício 3"] };
      case "countdown":
        return { targetDate: "", text: "Oferta termina em:", showDays: true };
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
    <div className="h-full flex flex-col">
      <ResizablePanelGroup direction="horizontal" className="flex-1">
        {/* Steps List - Left Panel */}
        <ResizablePanel defaultSize={15} minSize={12} maxSize={25}>
          <div className="h-full border-r border-border bg-card/50 flex flex-col">
            <div className="p-3 border-b border-border flex items-center justify-between">
              <h3 className="font-semibold text-sm">Etapas</h3>
              <Button size="sm" variant="ghost" onClick={() => setAddStepDialogOpen(true)}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <ScrollArea className="flex-1">
              <div className="p-2 space-y-1">
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleStepsDragEnd}
                >
                  <SortableContext
                    items={steps.map(s => s.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {steps.map((step, index) => (
                      <SortableStep
                        key={step.id}
                        step={step}
                        index={index}
                        isSelected={selectedStep?.id === step.id}
                        onSelect={() => setSelectedStep(step)}
                        onDelete={() => handleDeleteStep(step.id)}
                        onDuplicate={() => handleDuplicateStep(step.id)}
                      />
                    ))}
                  </SortableContext>
                </DndContext>
                
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
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* Editor - Center */}
        <ResizablePanel defaultSize={45} minSize={30}>
          <div className="h-full bg-muted/30 p-6 overflow-auto">
            {selectedStep ? (
              <div className="max-w-md mx-auto">
                <Card className="border-2 border-dashed border-border/50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center justify-between">
                      {selectedStep.name}
                      {getStepTypeBadge(selectedStep.step_type)}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 pl-8">
                    {selectedStepElements.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                        <p className="text-sm">Arraste elementos aqui</p>
                        <p className="text-xs mt-1">ou clique na paleta ao lado</p>
                      </div>
                    ) : (
                      <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleElementsDragEnd}
                      >
                        <SortableContext
                          items={selectedStepElements.map(e => e.id)}
                          strategy={verticalListSortingStrategy}
                        >
                          {selectedStepElements.map((element) => (
                            <SortableElement
                              key={element.id}
                              element={element}
                              onDelete={() => handleDeleteElement(element.id)}
                              onDuplicate={() => handleDuplicateElement(element.id)}
                              onConfig={() => {
                                setConfigElement(element);
                                setConfigDialogOpen(true);
                              }}
                            >
                              <ElementPreview element={element} />
                            </SortableElement>
                          ))}
                        </SortableContext>
                      </DndContext>
                    )}
                  </CardContent>
                </Card>

                {/* Elements Palette - Below Editor */}
                <div className="mt-6">
                  <h4 className="text-sm font-medium mb-3">Adicionar Elemento</h4>
                  <div className="grid grid-cols-4 gap-2">
                    {ELEMENT_TYPES.slice(0, 8).map((element) => {
                      const Icon = element.icon;
                      return (
                        <Button
                          key={element.type}
                          variant="outline"
                          className="h-auto flex-col gap-1 p-2 hover:border-primary/50"
                          onClick={() => handleAddElement(element.type)}
                          disabled={!selectedStep}
                        >
                          <Icon className="h-4 w-4" />
                          <span className="text-[10px]">{element.label}</span>
                        </Button>
                      );
                    })}
                  </div>
                  <div className="grid grid-cols-4 gap-2 mt-2">
                    {ELEMENT_TYPES.slice(8).map((element) => {
                      const Icon = element.icon;
                      return (
                        <Button
                          key={element.type}
                          variant="outline"
                          className="h-auto flex-col gap-1 p-2 hover:border-primary/50"
                          onClick={() => handleAddElement(element.type)}
                          disabled={!selectedStep}
                        >
                          <Icon className="h-4 w-4" />
                          <span className="text-[10px]">{element.label}</span>
                        </Button>
                      );
                    })}
                  </div>
                </div>
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
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* Live Preview - Right Panel */}
        <ResizablePanel defaultSize={40} minSize={25}>
          <LivePreview
            quiz={quiz}
            steps={steps}
            elements={elements}
            selectedStep={selectedStep}
          />
        </ResizablePanel>
      </ResizablePanelGroup>

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

      {/* Element Config Dialog */}
      {configElement && (
        <ElementConfigDialog
          open={configDialogOpen}
          onOpenChange={setConfigDialogOpen}
          element={configElement}
          onSave={(updates) => {
            handleUpdateElement(configElement.id, updates);
            setConfigDialogOpen(false);
            setConfigElement(null);
            toast.success("Elemento atualizado!");
          }}
        />
      )}
    </div>
  );
}

// Element Preview Component (simplified - just renders content)
function ElementPreview({ element }: { element: QuizElement }) {
  const content = element.content as Record<string, any>;

  switch (element.element_type) {
    case "title":
      return <h2 className="text-xl font-bold">{content.text || "Título"}</h2>;
    case "text":
      return <p className="text-muted-foreground">{content.text || "Texto"}</p>;
    case "image":
      return (
        <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
          {content.url ? (
            <img src={content.url} alt={content.alt} className="w-full h-full object-cover rounded-lg" />
          ) : (
            <span className="text-muted-foreground text-sm">Clique para configurar imagem</span>
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
            <div key={option.id || i} className="p-3 border rounded-lg hover:border-primary/50 transition-colors">
              {option.text}
            </div>
          ))}
        </div>
      );
    case "button":
      return <Button className="w-full">{content.text || "Continuar"}</Button>;
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
    case "rating":
      return (
        <div className="text-center space-y-2">
          {content.label && <p className="text-sm">{content.label}</p>}
          <div className="flex justify-center gap-1">
            {Array.from({ length: content.count || 5 }).map((_, i) => (
              <Star key={i} className="h-6 w-6 text-amber-400" />
            ))}
          </div>
        </div>
      );
    case "slider":
      return (
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{content.minLabel || content.min || 0}</span>
            <span>{content.maxLabel || content.max || 100}</span>
          </div>
          <div className="h-2 bg-muted rounded-full">
            <div className="h-full w-1/2 bg-primary rounded-full" />
          </div>
        </div>
      );
    case "image_options":
      return (
        <div className={cn("grid gap-2", `grid-cols-${content.columns || 2}`)}>
          {(content.options || []).map((option: any, i: number) => (
            <div key={option.id || i} className="p-2 border rounded-lg text-center">
              <div className="aspect-square bg-muted rounded mb-1 flex items-center justify-center">
                {option.imageUrl ? (
                  <img src={option.imageUrl} alt={option.text} className="w-full h-full object-cover rounded" />
                ) : (
                  <ImageIcon className="h-8 w-8 text-muted-foreground" />
                )}
              </div>
              <span className="text-xs">{option.text}</span>
            </div>
          ))}
        </div>
      );
    case "date_picker":
      return (
        <div className="space-y-2">
          <Label>{content.label || "Data"}</Label>
          <div className="flex items-center gap-2 p-2 border rounded-lg">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground text-sm">{content.placeholder || "Selecione uma data"}</span>
          </div>
        </div>
      );
    case "emoji_rating":
      return (
        <div className="text-center space-y-2">
          {content.label && <p className="text-sm">{content.label}</p>}
          <div className="flex justify-center gap-3 text-2xl">
            {(content.emojis || ["😢", "😕", "😐", "🙂", "😄"]).map((emoji: string, i: number) => (
              <span key={i} className="hover:scale-125 transition-transform cursor-pointer">{emoji}</span>
            ))}
          </div>
        </div>
      );
    case "divider":
      return <hr className={cn("border-t", content.style === "dashed" ? "border-dashed" : "")} />;
    case "icon_list":
      return (
        <div className="space-y-2">
          {(content.items || []).map((item: string, i: number) => (
            <div key={i} className="flex items-center gap-2">
              <Check className="h-4 w-4 text-primary" />
              <span className="text-sm">{item}</span>
            </div>
          ))}
        </div>
      );
    case "countdown":
      return (
        <div className="text-center space-y-2">
          {content.text && <p className="text-sm">{content.text}</p>}
          <div className="flex justify-center gap-2">
            {content.showDays && <div className="bg-primary/10 px-3 py-2 rounded"><span className="font-bold">00</span><span className="text-xs block">dias</span></div>}
            <div className="bg-primary/10 px-3 py-2 rounded"><span className="font-bold">00</span><span className="text-xs block">horas</span></div>
            <div className="bg-primary/10 px-3 py-2 rounded"><span className="font-bold">00</span><span className="text-xs block">min</span></div>
            <div className="bg-primary/10 px-3 py-2 rounded"><span className="font-bold">00</span><span className="text-xs block">seg</span></div>
          </div>
        </div>
      );
    case "testimonial":
      return (
        <div className="bg-muted/50 rounded-lg p-4 text-center">
          <p className="text-sm italic mb-2">"{content.text || "Depoimento"}"</p>
          <p className="font-medium text-sm">{content.name || "Nome"}</p>
          <p className="text-xs text-muted-foreground">{content.role || "Cliente"}</p>
        </div>
      );
    case "progress":
      return (
        <div className="space-y-1">
          {content.showLabel && <div className="text-xs text-right">{content.value || 0}%</div>}
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-primary" style={{ width: `${content.value || 0}%` }} />
          </div>
        </div>
      );
    case "confetti":
    case "loading":
      return (
        <div className="p-4 bg-muted/50 rounded-lg text-center">
          {element.element_type === "confetti" ? (
            <Sparkles className="h-8 w-8 mx-auto text-amber-400" />
          ) : (
            <Loader2 className="h-8 w-8 mx-auto text-primary animate-spin" />
          )}
          <p className="text-sm text-muted-foreground mt-2">{element.element_type}</p>
        </div>
      );
    default:
      return (
        <div className="p-4 bg-muted rounded text-sm text-muted-foreground">
          {element.element_type}
        </div>
      );
  }
}
