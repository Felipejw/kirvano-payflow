import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Lightbulb, Send, Clock, CheckCircle, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Suggestion {
  id: string;
  title: string;
  description: string;
  status: string;
  admin_notes: string | null;
  created_at: string;
}

export default function Suggestions() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (user) {
      fetchSuggestions();
    }
  }, [user]);

  const fetchSuggestions = async () => {
    try {
      const { data, error } = await supabase
        .from("suggestions")
        .select("*")
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setSuggestions(data || []);
    } catch (error) {
      console.error("Error fetching suggestions:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.from("suggestions").insert({
        user_id: user?.id,
        title: title.trim(),
        description: description.trim(),
      });

      if (error) throw error;

      toast({
        title: "Sugestão enviada!",
        description: "Obrigado pelo seu feedback.",
      });

      setTitle("");
      setDescription("");
      fetchSuggestions();
    } catch (error) {
      console.error("Error submitting suggestion:", error);
      toast({
        title: "Erro",
        description: "Não foi possível enviar a sugestão",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
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

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Sugestões</h1>
          <p className="text-muted-foreground">
            Envie suas sugestões para melhorar a plataforma
          </p>
        </div>

        {/* Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-primary" />
              Nova Sugestão
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Input
                  placeholder="Título da sugestão"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  maxLength={100}
                />
              </div>
              <div>
                <Textarea
                  placeholder="Descreva sua sugestão em detalhes..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  maxLength={1000}
                />
              </div>
              <Button type="submit" disabled={submitting}>
                <Send className="h-4 w-4 mr-2" />
                {submitting ? "Enviando..." : "Enviar Sugestão"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* List */}
        <Card>
          <CardHeader>
            <CardTitle>Minhas Sugestões</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-muted-foreground">Carregando...</p>
            ) : suggestions.length === 0 ? (
              <p className="text-muted-foreground">
                Você ainda não enviou nenhuma sugestão.
              </p>
            ) : (
              <div className="space-y-4">
                {suggestions.map((suggestion) => (
                  <div
                    key={suggestion.id}
                    className="p-4 rounded-lg border border-border bg-card"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="font-semibold">{suggestion.title}</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          {suggestion.description}
                        </p>
                        {suggestion.admin_notes && (
                          <div className="mt-2 p-2 rounded bg-muted text-sm">
                            <span className="font-medium">Resposta:</span>{" "}
                            {suggestion.admin_notes}
                          </div>
                        )}
                        <p className="text-xs text-muted-foreground mt-2">
                          {format(new Date(suggestion.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </p>
                      </div>
                      {getStatusBadge(suggestion.status)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}