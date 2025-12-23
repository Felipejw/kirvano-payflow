import { useState, useEffect } from "react";
import { GitBranch, Plus, ArrowRight, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface QuizStep {
  id: string;
  name: string;
  order_index: number;
  step_type: string;
}

interface QuizConnection {
  id: string;
  source_step_id: string;
  target_step_id: string;
  condition: any;
  is_default: boolean;
}

interface QuizFlowTabProps {
  quizId: string;
}

export default function QuizFlowTab({ quizId }: QuizFlowTabProps) {
  const [steps, setSteps] = useState<QuizStep[]>([]);
  const [connections, setConnections] = useState<QuizConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStep, setSelectedStep] = useState<string | null>(null);
  const [connectingFrom, setConnectingFrom] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, [quizId]);

  async function fetchData() {
    try {
      setLoading(true);
      
      const [stepsRes, connectionsRes] = await Promise.all([
        supabase.from("quiz_steps").select("*").eq("quiz_id", quizId).order("order_index"),
        supabase.from("quiz_connections").select("*").eq("quiz_id", quizId),
      ]);

      if (stepsRes.error) throw stepsRes.error;
      if (connectionsRes.error) throw connectionsRes.error;

      setSteps(stepsRes.data || []);
      setConnections(connectionsRes.data || []);
    } catch (error: any) {
      console.error("Error fetching flow data:", error);
      toast.error("Erro ao carregar fluxo");
    } finally {
      setLoading(false);
    }
  }

  async function handleConnect(targetStepId: string) {
    if (!connectingFrom || connectingFrom === targetStepId) {
      setConnectingFrom(null);
      return;
    }

    try {
      // Check if connection already exists
      const existing = connections.find(
        c => c.source_step_id === connectingFrom && c.target_step_id === targetStepId
      );
      
      if (existing) {
        toast.error("Conexão já existe");
        setConnectingFrom(null);
        return;
      }

      const { data, error } = await supabase
        .from("quiz_connections")
        .insert({
          quiz_id: quizId,
          source_step_id: connectingFrom,
          target_step_id: targetStepId,
          is_default: true,
        })
        .select()
        .single();

      if (error) throw error;

      setConnections(prev => [...prev, data]);
      toast.success("Conexão criada!");
    } catch (error: any) {
      console.error("Error creating connection:", error);
      toast.error("Erro ao criar conexão");
    } finally {
      setConnectingFrom(null);
    }
  }

  async function handleDeleteConnection(connectionId: string) {
    try {
      const { error } = await supabase
        .from("quiz_connections")
        .delete()
        .eq("id", connectionId);

      if (error) throw error;

      setConnections(prev => prev.filter(c => c.id !== connectionId));
      toast.success("Conexão removida!");
    } catch (error: any) {
      console.error("Error deleting connection:", error);
      toast.error("Erro ao remover conexão");
    }
  }

  function getStepConnections(stepId: string) {
    return connections.filter(c => c.source_step_id === stepId);
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

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (steps.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <GitBranch className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="font-semibold mb-2">Nenhuma etapa criada</h3>
          <p className="text-sm text-muted-foreground">
            Crie etapas no Construtor para configurar o fluxo
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto p-6">
      <div className="max-w-4xl mx-auto space-y-4">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <GitBranch className="h-5 w-5" />
              Fluxo do Quiz
            </h2>
            <p className="text-sm text-muted-foreground">
              Conecte as etapas para definir o caminho do usuário
            </p>
          </div>
          {connectingFrom && (
            <Badge variant="secondary" className="animate-pulse">
              Clique em uma etapa para conectar
            </Badge>
          )}
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {steps.map((step, index) => {
            const stepConnections = getStepConnections(step.id);
            const isConnecting = connectingFrom === step.id;
            const isTarget = connectingFrom && connectingFrom !== step.id;

            return (
              <Card
                key={step.id}
                className={cn(
                  "relative transition-all cursor-pointer",
                  isConnecting && "ring-2 ring-primary",
                  isTarget && "ring-2 ring-primary/50 hover:ring-primary",
                  selectedStep === step.id && "border-primary"
                )}
                onClick={() => {
                  if (connectingFrom) {
                    handleConnect(step.id);
                  } else {
                    setSelectedStep(step.id === selectedStep ? null : step.id);
                  }
                }}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      {step.name}
                    </CardTitle>
                    {getStepTypeBadge(step.step_type)}
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  {/* Connections from this step */}
                  <div className="space-y-2 mt-2">
                    {stepConnections.map((conn) => {
                      const targetStep = steps.find(s => s.id === conn.target_step_id);
                      return (
                        <div 
                          key={conn.id}
                          className="flex items-center justify-between text-xs bg-muted/50 p-2 rounded group"
                        >
                          <div className="flex items-center gap-1">
                            <ArrowRight className="h-3 w-3 text-primary" />
                            <span>{targetStep?.name || "Etapa removida"}</span>
                          </div>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-5 w-5 opacity-0 group-hover:opacity-100"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteConnection(conn.id);
                            }}
                          >
                            <Trash2 className="h-3 w-3 text-destructive" />
                          </Button>
                        </div>
                      );
                    })}
                  </div>

                  {/* Add connection button */}
                  <Button
                    size="sm"
                    variant="ghost"
                    className="w-full mt-2 text-xs"
                    onClick={(e) => {
                      e.stopPropagation();
                      setConnectingFrom(isConnecting ? null : step.id);
                    }}
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    {isConnecting ? "Cancelar" : "Conectar"}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="mt-8 p-4 bg-muted/30 rounded-lg">
          <h3 className="font-semibold text-sm mb-2">Como funciona:</h3>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Clique em "Conectar" para iniciar uma conexão</li>
            <li>• Depois clique na etapa de destino</li>
            <li>• O fluxo linear é criado automaticamente pela ordem das etapas</li>
            <li>• Use conexões para criar caminhos alternativos baseados em respostas</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
