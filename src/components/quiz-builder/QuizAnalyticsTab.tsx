import { useState, useEffect, useMemo } from "react";
import { BarChart3, TrendingUp, TrendingDown, Users, Target, Clock, Download, RefreshCw, ChevronDown, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip as RechartsTooltip, Cell, FunnelChart, Funnel, LabelList } from "recharts";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface QuizAnalyticsTabProps {
  quizId: string;
}

interface AnalyticsData {
  totalLeads: number;
  completedLeads: number;
  abandonedLeads: number;
  conversionRate: number;
  averageTime: number;
  stepStats: StepStat[];
  responseHeatmap: ResponseHeatmap[];
  dailyLeads: DailyLead[];
}

interface StepStat {
  stepId: string;
  stepName: string;
  orderIndex: number;
  totalVisits: number;
  dropoffs: number;
  dropoffRate: number;
}

interface ResponseHeatmap {
  stepId: string;
  stepName: string;
  elementId: string;
  elementType: string;
  responses: { value: string; count: number; percentage: number }[];
}

interface DailyLead {
  date: string;
  started: number;
  completed: number;
}

const COLORS = ["hsl(var(--primary))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"];

export default function QuizAnalyticsTab({ quizId }: QuizAnalyticsTabProps) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [period, setPeriod] = useState("7d");
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);

  useEffect(() => {
    fetchAnalytics();
  }, [quizId, period]);

  async function fetchAnalytics() {
    try {
      setLoading(true);

      // Calculate date range
      const now = new Date();
      let startDate = new Date();
      switch (period) {
        case "24h":
          startDate.setHours(startDate.getHours() - 24);
          break;
        case "7d":
          startDate.setDate(startDate.getDate() - 7);
          break;
        case "30d":
          startDate.setDate(startDate.getDate() - 30);
          break;
        case "90d":
          startDate.setDate(startDate.getDate() - 90);
          break;
        default:
          startDate.setDate(startDate.getDate() - 7);
      }

      // Fetch leads
      const { data: leads, error: leadsError } = await supabase
        .from("quiz_leads")
        .select("*")
        .eq("quiz_id", quizId)
        .gte("started_at", startDate.toISOString());

      if (leadsError) throw leadsError;

      // Fetch steps
      const { data: steps, error: stepsError } = await supabase
        .from("quiz_steps")
        .select("id, name, order_index")
        .eq("quiz_id", quizId)
        .order("order_index");

      if (stepsError) throw stepsError;

      // Fetch elements
      const stepIds = steps?.map(s => s.id) || [];
      const { data: elements } = await supabase
        .from("quiz_elements")
        .select("id, step_id, element_type")
        .in("step_id", stepIds);

      // Fetch responses
      const leadIds = leads?.map(l => l.id) || [];
      const { data: responses } = await supabase
        .from("quiz_lead_responses")
        .select("*")
        .in("lead_id", leadIds);

      // Calculate metrics
      const totalLeads = leads?.length || 0;
      const completedLeads = leads?.filter(l => l.status === "completed").length || 0;
      const abandonedLeads = leads?.filter(l => l.status !== "completed").length || 0;
      const conversionRate = totalLeads > 0 ? (completedLeads / totalLeads) * 100 : 0;

      // Average time (from started_at to completed_at for completed leads)
      let totalTime = 0;
      let timeCount = 0;
      leads?.forEach(lead => {
        if (lead.completed_at && lead.started_at) {
          const start = new Date(lead.started_at).getTime();
          const end = new Date(lead.completed_at).getTime();
          totalTime += (end - start) / 1000; // in seconds
          timeCount++;
        }
      });
      const averageTime = timeCount > 0 ? totalTime / timeCount : 0;

      // Step stats (visits and dropoffs)
      const stepStats: StepStat[] = (steps || []).map((step, index) => {
        // Count leads that visited this step
        const visitsAtStep = leads?.filter(l => {
          const leadResponses = responses?.filter(r => r.lead_id === l.id) || [];
          const visitedSteps = leadResponses.map(r => r.step_id);
          return visitedSteps.includes(step.id) || l.current_step_id === step.id;
        }).length || 0;

        // Count leads that dropped at this step (visited but didn't go further)
        const nextStep = steps?.[index + 1];
        let dropoffs = 0;
        if (nextStep) {
          leads?.forEach(l => {
            const leadResponses = responses?.filter(r => r.lead_id === l.id) || [];
            const visitedSteps = leadResponses.map(r => r.step_id);
            const visitedCurrent = visitedSteps.includes(step.id) || l.current_step_id === step.id;
            const visitedNext = visitedSteps.includes(nextStep.id);
            if (visitedCurrent && !visitedNext && l.status !== "completed") {
              dropoffs++;
            }
          });
        } else {
          // Last step - dropoffs are non-completed
          dropoffs = leads?.filter(l => l.current_step_id === step.id && l.status !== "completed").length || 0;
        }

        return {
          stepId: step.id,
          stepName: step.name,
          orderIndex: step.order_index,
          totalVisits: Math.max(visitsAtStep, index === 0 ? totalLeads : 0),
          dropoffs,
          dropoffRate: visitsAtStep > 0 ? (dropoffs / visitsAtStep) * 100 : 0,
        };
      });

      // Response heatmap
      const responseHeatmap: ResponseHeatmap[] = [];
      const optionsElements = elements?.filter(e => e.element_type === "options") || [];
      
      for (const element of optionsElements) {
        const step = steps?.find(s => s.id === element.step_id);
        const elementResponses = responses?.filter(r => r.element_id === element.id) || [];
        
        // Count response values
        const valueCounts: Record<string, number> = {};
        elementResponses.forEach(r => {
          const value = typeof r.response === "string" ? r.response : JSON.stringify(r.response);
          valueCounts[value] = (valueCounts[value] || 0) + 1;
        });

        const total = elementResponses.length;
        const responseArray = Object.entries(valueCounts)
          .map(([value, count]) => ({
            value,
            count,
            percentage: total > 0 ? (count / total) * 100 : 0,
          }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5);

        if (responseArray.length > 0) {
          responseHeatmap.push({
            stepId: element.step_id,
            stepName: step?.name || "Etapa",
            elementId: element.id,
            elementType: element.element_type,
            responses: responseArray,
          });
        }
      }

      // Daily leads
      const dailyMap: Record<string, { started: number; completed: number }> = {};
      leads?.forEach(lead => {
        const date = new Date(lead.started_at).toISOString().split("T")[0];
        if (!dailyMap[date]) {
          dailyMap[date] = { started: 0, completed: 0 };
        }
        dailyMap[date].started++;
        if (lead.status === "completed") {
          dailyMap[date].completed++;
        }
      });

      const dailyLeads = Object.entries(dailyMap)
        .map(([date, data]) => ({ date, ...data }))
        .sort((a, b) => a.date.localeCompare(b.date));

      setAnalytics({
        totalLeads,
        completedLeads,
        abandonedLeads,
        conversionRate,
        averageTime,
        stepStats,
        responseHeatmap,
        dailyLeads,
      });
    } catch (error: any) {
      console.error("Error fetching analytics:", error);
      toast.error("Erro ao carregar analytics");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  async function handleExportLeads() {
    try {
      const { data: leads, error } = await supabase
        .from("quiz_leads")
        .select(`
          *,
          quiz_lead_responses (*)
        `)
        .eq("quiz_id", quizId)
        .eq("status", "completed");

      if (error) throw error;

      // Convert to CSV
      const headers = ["ID", "Nome", "Email", "Telefone", "Status", "Iniciado em", "Completado em", "UTM Source", "UTM Medium", "UTM Campaign"];
      const rows = leads?.map(lead => [
        lead.id,
        lead.name || "",
        lead.email || "",
        lead.phone || "",
        lead.status,
        lead.started_at,
        lead.completed_at || "",
        lead.utm_source || "",
        lead.utm_medium || "",
        lead.utm_campaign || "",
      ]) || [];

      const csv = [headers.join(","), ...rows.map(row => row.map(cell => `"${cell}"`).join(","))].join("\n");
      
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `quiz-leads-${new Date().toISOString().split("T")[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);

      toast.success("Leads exportados com sucesso!");
    } catch (error: any) {
      console.error("Error exporting leads:", error);
      toast.error("Erro ao exportar leads");
    }
  }

  function formatTime(seconds: number): string {
    if (seconds < 60) return `${Math.round(seconds)}s`;
    if (seconds < 3600) return `${Math.round(seconds / 60)}min`;
    return `${Math.round(seconds / 3600)}h`;
  }

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <BarChart3 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="font-semibold mb-2">Sem dados</h3>
          <p className="text-sm text-muted-foreground">
            Ainda não há dados de analytics para este quiz
          </p>
        </div>
      </div>
    );
  }

  // Prepare funnel data
  const funnelData = analytics.stepStats.map((step, index) => ({
    name: step.stepName.length > 15 ? step.stepName.slice(0, 15) + "..." : step.stepName,
    value: step.totalVisits,
    fill: COLORS[index % COLORS.length],
  }));

  return (
    <div className="h-full overflow-auto p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Analytics do Quiz
            </h2>
            <p className="text-sm text-muted-foreground">
              Métricas e performance do seu quiz
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="24h">Últimas 24h</SelectItem>
                <SelectItem value="7d">Últimos 7 dias</SelectItem>
                <SelectItem value="30d">Últimos 30 dias</SelectItem>
                <SelectItem value="90d">Últimos 90 dias</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="icon"
              onClick={() => {
                setRefreshing(true);
                fetchAnalytics();
              }}
              disabled={refreshing}
            >
              <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
            </Button>
            <Button variant="outline" onClick={handleExportLeads}>
              <Download className="h-4 w-4 mr-2" />
              Exportar Leads
            </Button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Leads</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.totalLeads}</div>
              <p className="text-xs text-muted-foreground">
                {analytics.completedLeads} completaram o quiz
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Taxa de Conversão</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold flex items-center gap-2">
                {analytics.conversionRate.toFixed(1)}%
                {analytics.conversionRate >= 50 ? (
                  <TrendingUp className="h-4 w-4 text-emerald-500" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-amber-500" />
                )}
              </div>
              <Progress value={analytics.conversionRate} className="h-1 mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Taxa de Abandono</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {analytics.totalLeads > 0
                  ? ((analytics.abandonedLeads / analytics.totalLeads) * 100).toFixed(1)
                  : 0}%
              </div>
              <p className="text-xs text-muted-foreground">
                {analytics.abandonedLeads} leads abandonaram
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tempo Médio</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatTime(analytics.averageTime)}</div>
              <p className="text-xs text-muted-foreground">
                Para completar o quiz
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Funnel Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Funil de Etapas</CardTitle>
              <CardDescription>Visualização do fluxo de leads por etapa</CardDescription>
            </CardHeader>
            <CardContent>
              {funnelData.length > 0 ? (
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={funnelData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                      <XAxis type="number" />
                      <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 12 }} />
                      <RechartsTooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                        }}
                      />
                      <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                        {funnelData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  Sem dados de funil
                </div>
              )}
            </CardContent>
          </Card>

          {/* Daily Leads Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Leads por Dia</CardTitle>
              <CardDescription>Evolução de leads ao longo do tempo</CardDescription>
            </CardHeader>
            <CardContent>
              {analytics.dailyLeads.length > 0 ? (
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analytics.dailyLeads}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis
                        dataKey="date"
                        tickFormatter={(value) => new Date(value).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}
                        tick={{ fontSize: 11 }}
                      />
                      <YAxis tick={{ fontSize: 11 }} />
                      <RechartsTooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                        }}
                        labelFormatter={(value) => new Date(value).toLocaleDateString("pt-BR")}
                      />
                      <Bar dataKey="started" name="Iniciados" fill="hsl(var(--muted-foreground))" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="completed" name="Completados" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  Sem dados diários
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Step Dropoff Analysis */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Análise de Abandono por Etapa</CardTitle>
            <CardDescription>Identifique onde os leads estão saindo do quiz</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.stepStats.map((step, index) => (
                <div key={step.stepId} className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium truncate">{step.stepName}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">{step.totalVisits} visitas</span>
                        {step.dropoffRate > 20 && (
                          <Badge variant="destructive" className="text-xs">
                            {step.dropoffRate.toFixed(0)}% abandono
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Progress
                        value={100 - step.dropoffRate}
                        className="h-2 flex-1"
                      />
                      <span className="text-xs text-muted-foreground w-12 text-right">
                        {step.dropoffs} saíram
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Response Heatmap */}
        {analytics.responseHeatmap.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Mapa de Respostas</CardTitle>
              <CardDescription>Distribuição das respostas por pergunta</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {analytics.responseHeatmap.map((item) => (
                  <div key={item.elementId}>
                    <h4 className="font-medium mb-3">{item.stepName}</h4>
                    <div className="space-y-2">
                      {item.responses.map((response, idx) => (
                        <TooltipProvider key={idx}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="flex items-center gap-3">
                                <div className="w-32 truncate text-sm">{response.value}</div>
                                <div className="flex-1 h-6 bg-muted rounded-full overflow-hidden">
                                  <div
                                    className="h-full rounded-full transition-all"
                                    style={{
                                      width: `${response.percentage}%`,
                                      backgroundColor: COLORS[idx % COLORS.length],
                                    }}
                                  />
                                </div>
                                <div className="w-16 text-right text-sm font-medium">
                                  {response.count} ({response.percentage.toFixed(0)}%)
                                </div>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{response.value}: {response.count} respostas</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
