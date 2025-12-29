import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Mail,
  Send,
  Pause,
  Play,
  XCircle,
  Users,
  CheckCircle,
  AlertCircle,
  Clock,
  Loader2,
  Plus,
  Trash2,
  Eye,
  FileText,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface EmailBroadcast {
  id: string;
  name: string;
  subject: string;
  html_content: string;
  status: string;
  total_recipients: number;
  sent_count: number;
  failed_count: number;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
  interval_min_seconds: number;
  interval_max_seconds: number;
}

interface EmailRecipient {
  id: string;
  email: string;
  name: string | null;
  status: string;
  error_message: string | null;
  sent_at: string | null;
}

export default function AdminEmailBroadcast() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("campaign");
  const [loading, setLoading] = useState(false);
  const [broadcasts, setBroadcasts] = useState<EmailBroadcast[]>([]);
  const [activeBroadcast, setActiveBroadcast] = useState<EmailBroadcast | null>(null);
  const [recipients, setRecipients] = useState<EmailRecipient[]>([]);
  
  // Form state
  const [name, setName] = useState("");
  const [subject, setSubject] = useState("");
  const [htmlContent, setHtmlContent] = useState("");
  const [minInterval, setMinInterval] = useState(3);
  const [maxInterval, setMaxInterval] = useState(8);
  const [emailList, setEmailList] = useState("");
  const [parsedEmails, setParsedEmails] = useState<{ email: string; name: string }[]>([]);

  // Fetch broadcasts
  const fetchBroadcasts = async () => {
    const { data, error } = await supabase
      .from("email_broadcasts")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setBroadcasts(data);
      
      // Find active broadcast (running or paused)
      const active = data.find(b => b.status === "running" || b.status === "paused");
      if (active) {
        setActiveBroadcast(active);
        fetchRecipients(active.id);
      }
    }
  };

  // Fetch recipients for a broadcast
  const fetchRecipients = async (broadcastId: string) => {
    const { data, error } = await supabase
      .from("email_broadcast_recipients")
      .select("*")
      .eq("broadcast_id", broadcastId)
      .order("created_at", { ascending: true });

    if (!error && data) {
      setRecipients(data);
    }
  };

  // Subscribe to realtime updates
  useEffect(() => {
    fetchBroadcasts();

    const broadcastChannel = supabase
      .channel("email_broadcasts_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "email_broadcasts" },
        () => fetchBroadcasts()
      )
      .subscribe();

    const recipientChannel = supabase
      .channel("email_recipients_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "email_broadcast_recipients" },
        () => {
          if (activeBroadcast) {
            fetchRecipients(activeBroadcast.id);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(broadcastChannel);
      supabase.removeChannel(recipientChannel);
    };
  }, [activeBroadcast?.id]);

  // Parse email list
  const parseEmailList = () => {
    const lines = emailList.split("\n").filter(line => line.trim());
    const parsed: { email: string; name: string }[] = [];

    for (const line of lines) {
      const trimmedLine = line.trim();
      if (!trimmedLine) continue;

      // Try different formats: "email, name" or "email;name" or "name <email>" or just "email"
      let email = "";
      let name = "";

      if (trimmedLine.includes("<") && trimmedLine.includes(">")) {
        // Format: Name <email@example.com>
        const match = trimmedLine.match(/^(.+?)\s*<(.+?)>$/);
        if (match) {
          name = match[1].trim();
          email = match[2].trim();
        }
      } else if (trimmedLine.includes(",")) {
        // Format: email, name or name, email
        const parts = trimmedLine.split(",").map(p => p.trim());
        if (parts[0].includes("@")) {
          email = parts[0];
          name = parts[1] || "";
        } else {
          name = parts[0];
          email = parts[1] || "";
        }
      } else if (trimmedLine.includes(";")) {
        // Format: email;name
        const parts = trimmedLine.split(";").map(p => p.trim());
        if (parts[0].includes("@")) {
          email = parts[0];
          name = parts[1] || "";
        } else {
          name = parts[0];
          email = parts[1] || "";
        }
      } else {
        // Just email
        email = trimmedLine;
      }

      // Validate email
      if (email && email.includes("@")) {
        parsed.push({ email, name });
      }
    }

    setParsedEmails(parsed);
    toast.success(`${parsed.length} emails identificados`);
  };

  // Create and start broadcast
  const handleCreateBroadcast = async () => {
    if (!name || !subject || !htmlContent) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    if (parsedEmails.length === 0) {
      toast.error("Adicione pelo menos um email");
      return;
    }

    setLoading(true);
    try {
      // Create broadcast
      const { data: broadcast, error: broadcastError } = await supabase
        .from("email_broadcasts")
        .insert({
          admin_id: user?.id,
          name,
          subject,
          html_content: htmlContent,
          interval_min_seconds: minInterval,
          interval_max_seconds: maxInterval,
          total_recipients: parsedEmails.length,
          status: "draft",
        })
        .select()
        .single();

      if (broadcastError) throw broadcastError;

      // Insert recipients
      const recipientsData = parsedEmails.map(p => ({
        broadcast_id: broadcast.id,
        email: p.email,
        name: p.name || null,
      }));

      const { error: recipientsError } = await supabase
        .from("email_broadcast_recipients")
        .insert(recipientsData);

      if (recipientsError) throw recipientsError;

      // Start broadcast
      const { error: startError } = await supabase.functions.invoke("email-broadcast", {
        body: { action: "start", broadcastId: broadcast.id },
      });

      if (startError) throw startError;

      toast.success("Disparo iniciado com sucesso!");
      setActiveTab("status");
      
      // Clear form
      setName("");
      setSubject("");
      setHtmlContent("");
      setEmailList("");
      setParsedEmails([]);

      fetchBroadcasts();
    } catch (error: any) {
      console.error("Error creating broadcast:", error);
      toast.error(error.message || "Erro ao criar disparo");
    } finally {
      setLoading(false);
    }
  };

  // Control broadcast
  const handleBroadcastAction = async (action: "pause" | "resume" | "cancel") => {
    if (!activeBroadcast) return;

    setLoading(true);
    try {
      const { error } = await supabase.functions.invoke("email-broadcast", {
        body: { action, broadcastId: activeBroadcast.id },
      });

      if (error) throw error;

      const messages = {
        pause: "Disparo pausado",
        resume: "Disparo retomado",
        cancel: "Disparo cancelado",
      };

      toast.success(messages[action]);
      fetchBroadcasts();
    } catch (error: any) {
      toast.error(error.message || "Erro ao controlar disparo");
    } finally {
      setLoading(false);
    }
  };

  // View broadcast details
  const viewBroadcast = (broadcast: EmailBroadcast) => {
    setActiveBroadcast(broadcast);
    fetchRecipients(broadcast.id);
    setActiveTab("status");
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
      draft: { variant: "secondary", label: "Rascunho" },
      running: { variant: "default", label: "Enviando" },
      paused: { variant: "outline", label: "Pausado" },
      completed: { variant: "secondary", label: "Concluído" },
      cancelled: { variant: "destructive", label: "Cancelado" },
    };

    const config = variants[status] || { variant: "secondary", label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  // Calculate progress
  const getProgress = (broadcast: EmailBroadcast) => {
    if (broadcast.total_recipients === 0) return 0;
    return Math.round(((broadcast.sent_count + broadcast.failed_count) / broadcast.total_recipients) * 100);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Mail className="h-8 w-8 text-primary" />
            Disparo de Emails
          </h1>
          <p className="text-muted-foreground mt-1">
            Envie emails em massa para sua lista de contatos
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="campaign" className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Nova Campanha
            </TabsTrigger>
            <TabsTrigger value="status" className="flex items-center gap-2">
              <Send className="h-4 w-4" />
              Status
              {activeBroadcast?.status === "running" && (
                <span className="ml-1 h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              )}
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Histórico
            </TabsTrigger>
          </TabsList>

          {/* New Campaign Tab */}
          <TabsContent value="campaign" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              {/* Campaign Details */}
              <Card>
                <CardHeader>
                  <CardTitle>Detalhes da Campanha</CardTitle>
                  <CardDescription>Configure os detalhes do email</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome da Campanha *</Label>
                    <Input
                      id="name"
                      placeholder="Ex: Promoção de Natal"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="subject">Assunto do Email *</Label>
                    <Input
                      id="subject"
                      placeholder="Ex: 🎄 Oferta Especial de Natal!"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="content">Corpo do Email (HTML) *</Label>
                    <Textarea
                      id="content"
                      placeholder="<h1>Olá {{nome}}!</h1><p>Seu conteúdo aqui...</p>"
                      value={htmlContent}
                      onChange={(e) => setHtmlContent(e.target.value)}
                      className="min-h-[200px] font-mono text-sm"
                    />
                    <p className="text-xs text-muted-foreground">
                      Use {"{{nome}}"} para personalizar com o nome do destinatário
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="minInterval">Intervalo Mínimo (s)</Label>
                      <Input
                        id="minInterval"
                        type="number"
                        min={1}
                        value={minInterval}
                        onChange={(e) => setMinInterval(Number(e.target.value))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="maxInterval">Intervalo Máximo (s)</Label>
                      <Input
                        id="maxInterval"
                        type="number"
                        min={1}
                        value={maxInterval}
                        onChange={(e) => setMaxInterval(Number(e.target.value))}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Email List */}
              <Card>
                <CardHeader>
                  <CardTitle>Lista de Emails</CardTitle>
                  <CardDescription>
                    Cole a lista de emails (um por linha)
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="emailList">Emails</Label>
                    <Textarea
                      id="emailList"
                      placeholder={`email@exemplo.com, Nome\noutro@email.com;João\nMaria <maria@email.com>\nsimples@email.com`}
                      value={emailList}
                      onChange={(e) => setEmailList(e.target.value)}
                      className="min-h-[200px] font-mono text-sm"
                    />
                    <p className="text-xs text-muted-foreground">
                      Formatos: email,nome | email;nome | Nome {"<email>"} | email
                    </p>
                  </div>

                  <Button onClick={parseEmailList} variant="outline" className="w-full">
                    <Users className="h-4 w-4 mr-2" />
                    Processar Lista
                  </Button>

                  {parsedEmails.length > 0 && (
                    <div className="rounded-lg border p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{parsedEmails.length} emails identificados</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setParsedEmails([])}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="max-h-[150px] overflow-y-auto space-y-1 text-sm">
                        {parsedEmails.slice(0, 10).map((p, i) => (
                          <div key={i} className="flex items-center gap-2 text-muted-foreground">
                            <Mail className="h-3 w-3" />
                            <span>{p.email}</span>
                            {p.name && <span className="text-xs">({p.name})</span>}
                          </div>
                        ))}
                        {parsedEmails.length > 10 && (
                          <p className="text-muted-foreground">
                            ... e mais {parsedEmails.length - 10} emails
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Preview and Submit */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="font-medium">Pronto para enviar?</p>
                    <p className="text-sm text-muted-foreground">
                      {parsedEmails.length} destinatários | Intervalo: {minInterval}-{maxInterval}s
                    </p>
                  </div>
                  <Button
                    onClick={handleCreateBroadcast}
                    disabled={loading || !name || !subject || !htmlContent || parsedEmails.length === 0}
                    size="lg"
                  >
                    {loading ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4 mr-2" />
                    )}
                    Iniciar Disparo
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Status Tab */}
          <TabsContent value="status" className="space-y-6">
            {activeBroadcast ? (
              <>
                {/* Progress Card */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          {activeBroadcast.name}
                          {getStatusBadge(activeBroadcast.status)}
                        </CardTitle>
                        <CardDescription>{activeBroadcast.subject}</CardDescription>
                      </div>
                      <div className="flex gap-2">
                        {activeBroadcast.status === "running" && (
                          <Button
                            variant="outline"
                            onClick={() => handleBroadcastAction("pause")}
                            disabled={loading}
                          >
                            <Pause className="h-4 w-4 mr-2" />
                            Pausar
                          </Button>
                        )}
                        {activeBroadcast.status === "paused" && (
                          <Button
                            variant="outline"
                            onClick={() => handleBroadcastAction("resume")}
                            disabled={loading}
                          >
                            <Play className="h-4 w-4 mr-2" />
                            Retomar
                          </Button>
                        )}
                        {(activeBroadcast.status === "running" || activeBroadcast.status === "paused") && (
                          <Button
                            variant="destructive"
                            onClick={() => handleBroadcastAction("cancel")}
                            disabled={loading}
                          >
                            <XCircle className="h-4 w-4 mr-2" />
                            Cancelar
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Progresso</span>
                        <span>
                          {activeBroadcast.sent_count + activeBroadcast.failed_count} / {activeBroadcast.total_recipients}
                        </span>
                      </div>
                      <Progress value={getProgress(activeBroadcast)} />
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div className="rounded-lg border p-4 text-center">
                        <CheckCircle className="h-6 w-6 text-green-500 mx-auto mb-2" />
                        <p className="text-2xl font-bold">{activeBroadcast.sent_count}</p>
                        <p className="text-sm text-muted-foreground">Enviados</p>
                      </div>
                      <div className="rounded-lg border p-4 text-center">
                        <AlertCircle className="h-6 w-6 text-red-500 mx-auto mb-2" />
                        <p className="text-2xl font-bold">{activeBroadcast.failed_count}</p>
                        <p className="text-sm text-muted-foreground">Falhas</p>
                      </div>
                      <div className="rounded-lg border p-4 text-center">
                        <Clock className="h-6 w-6 text-yellow-500 mx-auto mb-2" />
                        <p className="text-2xl font-bold">
                          {activeBroadcast.total_recipients - activeBroadcast.sent_count - activeBroadcast.failed_count}
                        </p>
                        <p className="text-sm text-muted-foreground">Pendentes</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Recipients Table */}
                <Card>
                  <CardHeader>
                    <CardTitle>Destinatários</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="rounded-md border max-h-[400px] overflow-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Email</TableHead>
                            <TableHead>Nome</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Enviado em</TableHead>
                            <TableHead>Erro</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {recipients.map((recipient) => (
                            <TableRow key={recipient.id}>
                              <TableCell className="font-mono text-sm">
                                {recipient.email}
                              </TableCell>
                              <TableCell>{recipient.name || "-"}</TableCell>
                              <TableCell>
                                {recipient.status === "sent" && (
                                  <Badge variant="secondary" className="bg-green-500/10 text-green-500">
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    Enviado
                                  </Badge>
                                )}
                                {recipient.status === "failed" && (
                                  <Badge variant="destructive">
                                    <AlertCircle className="h-3 w-3 mr-1" />
                                    Falhou
                                  </Badge>
                                )}
                                {recipient.status === "pending" && (
                                  <Badge variant="outline">
                                    <Clock className="h-3 w-3 mr-1" />
                                    Pendente
                                  </Badge>
                                )}
                              </TableCell>
                              <TableCell>
                                {recipient.sent_at
                                  ? format(new Date(recipient.sent_at), "dd/MM HH:mm:ss", { locale: ptBR })
                                  : "-"}
                              </TableCell>
                              <TableCell className="max-w-[200px] truncate text-red-500 text-xs">
                                {recipient.error_message || "-"}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <Mail className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium">Nenhum disparo ativo</h3>
                  <p className="text-muted-foreground mt-1">
                    Crie uma nova campanha para começar a enviar emails
                  </p>
                  <Button className="mt-4" onClick={() => setActiveTab("campaign")}>
                    <Plus className="h-4 w-4 mr-2" />
                    Nova Campanha
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle>Histórico de Campanhas</CardTitle>
                <CardDescription>Todas as campanhas de email enviadas</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Campanha</TableHead>
                        <TableHead>Assunto</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Enviados</TableHead>
                        <TableHead>Falhas</TableHead>
                        <TableHead>Data</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {broadcasts.map((broadcast) => (
                        <TableRow key={broadcast.id}>
                          <TableCell className="font-medium">{broadcast.name}</TableCell>
                          <TableCell className="max-w-[200px] truncate">
                            {broadcast.subject}
                          </TableCell>
                          <TableCell>{getStatusBadge(broadcast.status)}</TableCell>
                          <TableCell>
                            <span className="text-green-500">{broadcast.sent_count}</span>
                            <span className="text-muted-foreground">/{broadcast.total_recipients}</span>
                          </TableCell>
                          <TableCell>
                            <span className="text-red-500">{broadcast.failed_count}</span>
                          </TableCell>
                          <TableCell>
                            {format(new Date(broadcast.created_at), "dd/MM/yyyy", { locale: ptBR })}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => viewBroadcast(broadcast)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                      {broadcasts.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                            Nenhuma campanha encontrada
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
