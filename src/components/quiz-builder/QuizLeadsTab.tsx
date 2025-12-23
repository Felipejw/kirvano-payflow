import { useState, useEffect } from "react";
import { Users, Download, Search, Filter, Mail, Phone, Calendar, TrendingUp, CheckCircle, Clock, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface QuizLead {
  id: string;
  quiz_id: string;
  session_id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  status: string;
  current_step_id: string | null;
  interaction_count: number;
  started_at: string;
  completed_at: string | null;
  last_interaction_at: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
}

interface QuizStep {
  id: string;
  name: string;
  order_index: number;
}

interface QuizLeadsTabProps {
  quizId: string;
}

export default function QuizLeadsTab({ quizId }: QuizLeadsTabProps) {
  const [leads, setLeads] = useState<QuizLead[]>([]);
  const [steps, setSteps] = useState<QuizStep[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    fetchData();
  }, [quizId]);

  async function fetchData() {
    try {
      setLoading(true);
      
      const [leadsRes, stepsRes] = await Promise.all([
        supabase.from("quiz_leads").select("*").eq("quiz_id", quizId).order("started_at", { ascending: false }),
        supabase.from("quiz_steps").select("id, name, order_index").eq("quiz_id", quizId).order("order_index"),
      ]);

      if (leadsRes.error) throw leadsRes.error;
      if (stepsRes.error) throw stepsRes.error;

      setLeads(leadsRes.data || []);
      setSteps(stepsRes.data || []);
    } catch (error: any) {
      console.error("Error fetching leads:", error);
      toast.error("Erro ao carregar leads");
    } finally {
      setLoading(false);
    }
  }

  function exportToCSV() {
    if (leads.length === 0) {
      toast.error("Nenhum lead para exportar");
      return;
    }

    const headers = ["Nome", "Email", "Telefone", "Status", "Interações", "Início", "Conclusão", "UTM Source", "UTM Medium", "UTM Campaign"];
    const rows = leads.map(lead => [
      lead.name || "",
      lead.email || "",
      lead.phone || "",
      lead.status,
      lead.interaction_count,
      new Date(lead.started_at).toLocaleString("pt-BR"),
      lead.completed_at ? new Date(lead.completed_at).toLocaleString("pt-BR") : "",
      lead.utm_source || "",
      lead.utm_medium || "",
      lead.utm_campaign || "",
    ]);

    const csvContent = [headers.join(","), ...rows.map(row => row.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `leads-quiz-${quizId}.csv`;
    link.click();
    
    toast.success("Leads exportados!");
  }

  const filteredLeads = leads.filter(lead => {
    const matchesSearch = 
      (lead.name?.toLowerCase().includes(search.toLowerCase())) ||
      (lead.email?.toLowerCase().includes(search.toLowerCase())) ||
      (lead.phone?.includes(search));
    const matchesStatus = statusFilter === "all" || lead.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Stats
  const totalLeads = leads.length;
  const completedLeads = leads.filter(l => l.status === "completed").length;
  const qualifiedLeads = leads.filter(l => l.status === "qualified" || l.status === "completed").length;
  const inProgressLeads = leads.filter(l => l.status === "in_progress").length;
  const completionRate = totalLeads > 0 ? Math.round((completedLeads / totalLeads) * 100) : 0;

  function getStatusBadge(status: string) {
    switch (status) {
      case "completed":
        return <Badge className="bg-emerald-500/20 text-emerald-400">Finalizado</Badge>;
      case "qualified":
        return <Badge className="bg-blue-500/20 text-blue-400">Qualificado</Badge>;
      case "in_progress":
        return <Badge className="bg-amber-500/20 text-amber-400">Em Progresso</Badge>;
      case "abandoned":
        return <Badge className="bg-red-500/20 text-red-400">Abandonado</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  }

  function getLeadProgress(lead: QuizLead) {
    if (!lead.current_step_id || steps.length === 0) return 0;
    const currentStep = steps.find(s => s.id === lead.current_step_id);
    if (!currentStep) return 0;
    return Math.round(((currentStep.order_index + 1) / steps.length) * 100);
  }

  function formatDate(dateString: string | null) {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col p-6 overflow-hidden">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-5 mb-6 shrink-0">
        <Card className="bg-card/50">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              Total Leads
            </CardDescription>
            <CardTitle className="text-2xl">{totalLeads}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="bg-card/50">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Em Progresso
            </CardDescription>
            <CardTitle className="text-2xl text-amber-400">{inProgressLeads}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="bg-card/50">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              Qualificados
            </CardDescription>
            <CardTitle className="text-2xl text-blue-400">{qualifiedLeads}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="bg-card/50">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <CheckCircle className="h-3 w-3" />
              Finalizados
            </CardDescription>
            <CardTitle className="text-2xl text-emerald-400">{completedLeads}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="bg-card/50">
          <CardHeader className="pb-2">
            <CardDescription>Taxa Conclusão</CardDescription>
            <CardTitle className="text-2xl text-primary">{completionRate}%</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-4 shrink-0">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, email ou telefone..."
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
            <SelectItem value="in_progress">Em Progresso</SelectItem>
            <SelectItem value="qualified">Qualificados</SelectItem>
            <SelectItem value="completed">Finalizados</SelectItem>
            <SelectItem value="abandoned">Abandonados</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" onClick={exportToCSV} className="gap-2">
          <Download className="h-4 w-4" />
          Exportar CSV
        </Button>
      </div>

      {/* Leads Table */}
      <Card className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          {filteredLeads.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="font-semibold mb-2">Nenhum lead encontrado</h3>
              <p className="text-sm text-muted-foreground">
                {search || statusFilter !== "all" 
                  ? "Tente ajustar os filtros"
                  : "Leads aparecerão aqui quando pessoas responderem seu quiz"
                }
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Lead</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Progresso</TableHead>
                  <TableHead>Interações</TableHead>
                  <TableHead>Início</TableHead>
                  <TableHead>UTM</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLeads.map((lead) => (
                  <TableRow key={lead.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{lead.name || "Anônimo"}</p>
                        {lead.email && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {lead.email}
                          </p>
                        )}
                        {lead.phone && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {lead.phone}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(lead.status)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-primary rounded-full"
                            style={{ width: `${getLeadProgress(lead)}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {getLeadProgress(lead)}%
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>{lead.interaction_count}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {formatDate(lead.started_at)}
                      </div>
                    </TableCell>
                    <TableCell>
                      {lead.utm_source && (
                        <Badge variant="outline" className="text-xs">
                          {lead.utm_source}
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </ScrollArea>
      </Card>
    </div>
  );
}
