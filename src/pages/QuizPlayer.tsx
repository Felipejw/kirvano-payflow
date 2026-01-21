import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import QuizStepRenderer from "@/components/quiz-player/QuizStepRenderer";

interface Quiz {
  id: string;
  name: string;
  description: string | null;
  logo_url: string | null;
  background_color: string | null;
  primary_color: string | null;
  text_color: string | null;
  button_color: string | null;
  font_family: string | null;
  show_progress_bar: boolean;
  show_logo: boolean;
  allow_back_navigation: boolean;
}

interface QuizStep {
  id: string;
  name: string;
  order_index: number;
  step_type: string;
  settings: any;
}

interface QuizElement {
  id: string;
  step_id: string;
  element_type: string;
  order_index: number;
  content: any;
  styles: any;
}

interface QuizConnection {
  id: string;
  source_step_id: string;
  target_step_id: string;
  condition: any;
  is_default: boolean;
}

export default function QuizPlayer() {
  const [searchParams] = useSearchParams();
  const quizId = searchParams.get("id") || searchParams.get("quizId") || "";
  const slug = searchParams.get("slug") || searchParams.get("s") || "";

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [steps, setSteps] = useState<QuizStep[]>([]);
  const [elements, setElements] = useState<Record<string, QuizElement[]>>({});
  const [connections, setConnections] = useState<QuizConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Player state
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [responses, setResponses] = useState<Record<string, any>>({});
  const [leadId, setLeadId] = useState<string | null>(null);
  const [sessionId] = useState(() => crypto.randomUUID());
  const [stepHistory, setStepHistory] = useState<string[]>([]);

  // Fetch quiz data
  useEffect(() => {
    fetchQuizData();
  }, [quizId, slug]);

  async function fetchQuizData() {
    try {
      setLoading(true);
      setError(null);

      // Find quiz by ID or slug
      let quizQuery = supabase.from("quizzes").select("*");
      
      if (quizId) {
        quizQuery = quizQuery.eq("id", quizId);
      } else if (slug) {
        quizQuery = quizQuery.eq("custom_slug", slug);
      } else {
        setError("Quiz não encontrado");
        setLoading(false);
        return;
      }

      const { data: quizData, error: quizError } = await quizQuery.single();

      if (quizError || !quizData) {
        setError("Quiz não encontrado");
        setLoading(false);
        return;
      }

      if (quizData.status !== "active") {
        setError("Este quiz está pausado");
        setLoading(false);
        return;
      }

      setQuiz(quizData);

      // Fetch steps
      const { data: stepsData, error: stepsError } = await supabase
        .from("quiz_steps")
        .select("*")
        .eq("quiz_id", quizData.id)
        .order("order_index");

      if (stepsError) throw stepsError;
      setSteps(stepsData || []);

      if (stepsData && stepsData.length > 0) {
        setStepHistory([stepsData[0].id]);

        // Fetch elements for all steps
        const stepIds = stepsData.map((s) => s.id);
        const { data: elementsData } = await supabase
          .from("quiz_elements")
          .select("*")
          .in("step_id", stepIds)
          .order("order_index");

        if (elementsData) {
          const elementsByStep: Record<string, QuizElement[]> = {};
          stepsData.forEach((step) => {
            elementsByStep[step.id] = elementsData.filter((e) => e.step_id === step.id);
          });
          setElements(elementsByStep);
        }

        // Fetch connections
        const { data: connectionsData } = await supabase
          .from("quiz_connections")
          .select("*")
          .eq("quiz_id", quizData.id);

        setConnections(connectionsData || []);
      }

      // Create lead
      await createLead(quizData.id);
    } catch (err: any) {
      console.error("Error fetching quiz:", err);
      setError("Erro ao carregar quiz");
    } finally {
      setLoading(false);
    }
  }

  async function createLead(quizId: string) {
    try {
      const urlParams = new URLSearchParams(window.location.search);

      // SECURITY: lead PII is not writable/readable from the browser; use backend function
      const { data, error } = await supabase.functions.invoke('quiz-public', {
        body: {
          // route
          __path: '/leads',
          quiz_id: quizId,
          session_id: sessionId,
          user_agent: navigator.userAgent,
          ip_address: null,
          utm_source: urlParams.get("utm_source"),
          utm_medium: urlParams.get("utm_medium"),
          utm_campaign: urlParams.get("utm_campaign"),
          utm_content: urlParams.get("utm_content"),
          utm_term: urlParams.get("utm_term"),
        },
      });

      if (!error && data?.lead_id) setLeadId(data.lead_id);
    } catch (err) {
      console.error("Error creating lead:", err);
    }
  }

  // Save response
  const saveResponse = useCallback(
    async (stepId: string, elementId: string | null, response: any) => {
      if (!leadId) return;

      try {
        await supabase.functions.invoke('quiz-public', {
          body: {
            __path: '/responses',
            lead_id: leadId,
            session_id: sessionId,
            step_id: stepId,
            element_id: elementId,
            response,
          },
        });

        // Update lead interaction count
        await supabase.functions.invoke('quiz-public', {
          body: {
            __path: '/leads/update',
            lead_id: leadId,
            session_id: sessionId,
            current_step_id: stepId,
            last_interaction_at: new Date().toISOString(),
            interaction_count: (responses[stepId] ? Object.keys(responses).length : Object.keys(responses).length + 1),
          },
        });
      } catch (err) {
        console.error("Error saving response:", err);
      }
    },
    [leadId, responses, sessionId]
  );

  // Update lead info (name, email, phone)
  const updateLeadInfo = useCallback(
    async (info: { name?: string; email?: string; phone?: string }) => {
      if (!leadId) return;

      try {
        await supabase.functions.invoke('quiz-public', {
          body: {
            __path: '/leads/update',
            lead_id: leadId,
            session_id: sessionId,
            ...info,
          },
        });
      } catch (err) {
        console.error("Error updating lead info:", err);
      }
    },
    [leadId, sessionId]
  );

  // Handle response and navigation
  const handleResponse = useCallback(
    (stepId: string, elementId: string | null, value: any) => {
      setResponses((prev) => ({
        ...prev,
        [stepId]: {
          ...(prev[stepId] || {}),
          [elementId || "step"]: value,
        },
      }));

      saveResponse(stepId, elementId, value);
    },
    [saveResponse]
  );

  // Navigate to next step
  const goToNextStep = useCallback(async () => {
    const currentStep = steps[currentStepIndex];
    if (!currentStep) return;

    // Find connections from current step
    const stepConnections = connections.filter((c) => c.source_step_id === currentStep.id);
    let nextStepId: string | null = null;

    // Check conditional connections first
    const currentResponses = responses[currentStep.id] || {};
    
    for (const conn of stepConnections) {
      if (conn.condition && !conn.is_default) {
        const { type, value } = conn.condition;
        const responseValue = Object.values(currentResponses)[0]; // Get first response

        let matches = false;
        switch (type) {
          case "equals":
            matches = responseValue === value;
            break;
          case "contains":
            matches = String(responseValue).toLowerCase().includes(String(value).toLowerCase());
            break;
          case "not_equals":
            matches = responseValue !== value;
            break;
          case "greater_than":
            matches = Number(responseValue) > Number(value);
            break;
          case "less_than":
            matches = Number(responseValue) < Number(value);
            break;
        }

        if (matches) {
          nextStepId = conn.target_step_id;
          break;
        }
      }
    }

    // If no conditional match, use default connection
    if (!nextStepId) {
      const defaultConn = stepConnections.find((c) => c.is_default);
      if (defaultConn) {
        nextStepId = defaultConn.target_step_id;
      }
    }

    // If no connection, go to next in order
    if (!nextStepId && currentStepIndex < steps.length - 1) {
      nextStepId = steps[currentStepIndex + 1].id;
    }

    if (nextStepId) {
      const nextIndex = steps.findIndex((s) => s.id === nextStepId);
      if (nextIndex !== -1) {
        setCurrentStepIndex(nextIndex);
        setStepHistory((prev) => [...prev, nextStepId!]);
      }
    } else {
      // Quiz completed
      await completeQuiz();
    }
  }, [steps, currentStepIndex, connections, responses]);

  // Go back
  const goBack = useCallback(() => {
    if (stepHistory.length > 1) {
      const newHistory = stepHistory.slice(0, -1);
      const prevStepId = newHistory[newHistory.length - 1];
      const prevIndex = steps.findIndex((s) => s.id === prevStepId);
      
      if (prevIndex !== -1) {
        setCurrentStepIndex(prevIndex);
        setStepHistory(newHistory);
      }
    }
  }, [stepHistory, steps]);

  // Complete quiz
  async function completeQuiz() {
    if (!leadId) return;

    try {
      await supabase.functions.invoke('quiz-public', {
        body: {
          __path: '/leads/update',
          lead_id: leadId,
          session_id: sessionId,
          status: 'completed',
          completed_at: new Date().toISOString(),
        },
      });
    } catch (err) {
      console.error("Error completing quiz:", err);
    }
  }

  // Calculate progress
  const progress = steps.length > 0 ? ((currentStepIndex + 1) / steps.length) * 100 : 0;
  const currentStep = steps[currentStepIndex];
  const currentElements = currentStep ? elements[currentStep.id] || [] : [];

  // Apply custom styles
  const containerStyle: React.CSSProperties = {
    backgroundColor: quiz?.background_color || undefined,
    color: quiz?.text_color || undefined,
    fontFamily: quiz?.font_family || undefined,
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Carregando quiz...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Oops!</h1>
          <p className="text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  if (!quiz || steps.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Quiz vazio</h1>
          <p className="text-muted-foreground">Este quiz ainda não tem etapas</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col" style={containerStyle}>
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-4">
          {quiz.allow_back_navigation && stepHistory.length > 1 && (
            <Button variant="ghost" size="icon" onClick={goBack}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
          )}
          
          {quiz.show_logo && quiz.logo_url && (
            <img src={quiz.logo_url} alt={quiz.name} className="h-8 object-contain" />
          )}

          <div className="flex-1" />

          {quiz.show_progress_bar && (
            <div className="w-32">
              <Progress value={progress} className="h-2" />
            </div>
          )}
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-2xl">
          {currentStep && (
            <QuizStepRenderer
              step={currentStep}
              elements={currentElements}
              responses={responses[currentStep.id] || {}}
              onResponse={handleResponse}
              onNext={goToNextStep}
              onUpdateLeadInfo={updateLeadInfo}
              quiz={quiz}
            />
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="py-4 text-center text-xs text-muted-foreground">
        Powered by GateFlow
      </footer>
    </div>
  );
}
