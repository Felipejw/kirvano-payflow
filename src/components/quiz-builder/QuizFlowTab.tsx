import { useState, useEffect } from "react";
import { GitBranch } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { ReactFlowProvider } from "reactflow";
import FlowCanvas from "./flow/FlowCanvas";

interface QuizStep {
  id: string;
  name: string;
  order_index: number;
  step_type: string;
  position_x: number;
  position_y: number;
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
    <div className="h-[calc(100vh-200px)] min-h-[500px] w-full">
      <ReactFlowProvider>
        <FlowCanvas
          quizId={quizId}
          steps={steps}
          connections={connections}
          onRefresh={fetchData}
        />
      </ReactFlowProvider>
    </div>
  );
}
