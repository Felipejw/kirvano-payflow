import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Lightbulb, Clock, CheckCircle, XCircle, MessageSquare } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Suggestion {
  id: string;
  user_id: string;
  title: string;
  description: string;
  status: string;
  admin_notes: string | null;
  created_at: string;
  user_email?: string;
}

export default function AdminSuggestions() {
  const { toast } = useToast();
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [selectedSuggestion, setSelectedSuggestion] = useState<Suggestion | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [newStatus, setNewStatus] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSuggestions();
  }, []);

  const fetchSuggestions = async () => {
    try {
      const { data: suggestionsData, error } = await supabase
        .from("suggestions")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch user emails
      const userIds = [...new Set(suggestionsData?.map((s) => s.user_id) || [])];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, email")
        .in("user_id", userIds);

      const emailMap = new Map(profiles?.map((p) => [p.user_id, p.email]) || []);

      const enrichedSuggestions = suggestionsData?.map((s) => ({
        ...s,
        user_email: emailMap.get(s.user_id) || "Desconhecido",
      })) || [];

      setSuggestions(enrichedSuggestions);
    } catch (error) {
      console.error("Error fetching suggestions:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSuggestion = async () => {
    if (!selectedSuggestion) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from("suggestions")
        .update({
          status: newStatus,
          admin_notes: adminNotes.trim() || null,
        })
        .eq("id", selectedSuggestion.id);

      if (error) throw error;

      toast({
        title: "Sugestão atualizada!",
        description: "As alterações foram salvas.",
      });

      setSelectedSuggestion(null);
      fetchSuggestions();
    } catch (error) {
      console.error("Error updating suggestion:", error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar a sugestão",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const openEditDialog = (suggestion: Suggestion) => {
    setSelectedSuggestion(suggestion);
    setNewStatus(suggestion.status);
    setAdminNotes(suggestion.admin_notes || "");
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary" className="gap-1"><Clock className="h-3 w-3" />Pendente</Badge>;
      case "reviewed":
        return <Badge variant="outline" className="gap-1 text-blue-500 border-blue-500"><CheckCircle className="h-3 w-3" />Analisada</Badge>;
      case "approved":
        return <Badge className="gap-1 bg-green-500"><CheckCircle className="h-3 w-3" />Aprovada</Badge>;
      case "rejected":
        return <Badge variant="destructive" className="gap-1"><XCircle className="h-3 w-3" />Rejeitada</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const filteredSuggestions = filter === "all"
    ? suggestions
    : suggestions.filter((s) => s.status === filter);

  const stats = {
    total: suggestions.length,
    pending: suggestions.filter((s) => s.status === "pending").length,
    reviewed: suggestions.filter((s) => s.status === "reviewed").length,
    approved: suggestions.filter((s) => s.status === "approved").length,
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Sugestões dos Usuários</h1>
          <p className="text-muted-foreground">
            Visualize e gerencie as sugestões enviadas pelos usuários
          </p>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-sm text-muted-foreground">Total</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-yellow-500">{stats.pending}</div>
              <p className="text-sm text-muted-foreground">Pendentes</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-blue-500">{stats.reviewed}</div>
              <p className="text-sm text-muted-foreground">Analisadas</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-green-500">{stats.approved}</div>
              <p className="text-sm text-muted-foreground">Aprovadas</p>
            </CardContent>
          </Card>
        </div>

        {/* Filter */}
        <div className="flex items-center gap-4">
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filtrar por status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="pending">Pendentes</SelectItem>
              <SelectItem value="reviewed">Analisadas</SelectItem>
              <SelectItem value="approved">Aprovadas</SelectItem>
              <SelectItem value="rejected">Rejeitadas</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-primary" />
              Sugestões ({filteredSuggestions.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-muted-foreground">Carregando...</p>
            ) : filteredSuggestions.length === 0 ? (
              <p className="text-muted-foreground">Nenhuma sugestão encontrada.</p>
            ) : (
              <div className="space-y-4">
                {filteredSuggestions.map((suggestion) => (
                  <div
                    key={suggestion.id}
                    className="p-4 rounded-lg border border-border bg-card hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="font-semibold">{suggestion.title}</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          {suggestion.description}
                        </p>
                        {suggestion.admin_notes && (
                          <div className="mt-2 p-2 rounded bg-muted text-sm">
                            <span className="font-medium">Sua resposta:</span>{" "}
                            {suggestion.admin_notes}
                          </div>
                        )}
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          <span>{suggestion.user_email}</span>
                          <span>
                            {format(new Date(suggestion.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        {getStatusBadge(suggestion.status)}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditDialog(suggestion)}
                        >
                          <MessageSquare className="h-4 w-4 mr-1" />
                          Responder
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!selectedSuggestion} onOpenChange={() => setSelectedSuggestion(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Responder Sugestão</DialogTitle>
          </DialogHeader>
          {selectedSuggestion && (
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold">{selectedSuggestion.title}</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  {selectedSuggestion.description}
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pendente</SelectItem>
                    <SelectItem value="reviewed">Analisada</SelectItem>
                    <SelectItem value="approved">Aprovada</SelectItem>
                    <SelectItem value="rejected">Rejeitada</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Resposta (opcional)</label>
                <Textarea
                  placeholder="Escreva uma resposta para o usuário..."
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setSelectedSuggestion(null)}>
                  Cancelar
                </Button>
                <Button onClick={handleUpdateSuggestion} disabled={saving}>
                  {saving ? "Salvando..." : "Salvar"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}