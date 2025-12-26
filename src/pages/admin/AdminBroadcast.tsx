import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  MessageSquare, 
  Upload, 
  Play, 
  Pause, 
  StopCircle, 
  Trash2, 
  Plus,
  Image as ImageIcon,
  Video,
  FileText,
  CheckCircle2,
  XCircle,
  Clock,
  Users,
  RefreshCw,
  Send,
  Save,
  BarChart3,
  FileStack,
  TrendingUp,
  Target,
  Copy,
  CalendarIcon
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, Legend } from "recharts";
import { cn } from "@/lib/utils";

interface Contact {
  id: string;
  phone: string;
  name: string;
  selected: boolean;
}

interface Recipient {
  id: string;
  phone: string;
  name: string | null;
  status: string;
  error_message: string | null;
  sent_at: string | null;
}

interface Broadcast {
  id: string;
  name: string;
  message: string;
  media_type: string | null;
  media_url: string | null;
  interval_seconds: number;
  interval_min_seconds: number | null;
  interval_max_seconds: number | null;
  status: string;
  total_recipients: number;
  sent_count: number;
  failed_count: number;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
  scheduled_at: string | null;
}

interface Template {
  id: string;
  name: string;
  message: string;
  media_type: string | null;
  media_url: string | null;
  created_at: string;
}

export default function AdminBroadcast() {
  const [campaignName, setCampaignName] = useState("");
  const [message, setMessage] = useState("");
  const [mediaType, setMediaType] = useState<"none" | "image" | "video" | "document">("none");
  const [mediaUrl, setMediaUrl] = useState("");
  const [intervalMin, setIntervalMin] = useState(30);
  const [intervalMax, setIntervalMax] = useState(60);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [manualPhone, setManualPhone] = useState("");
  const [manualName, setManualName] = useState("");
  const [currentBroadcast, setCurrentBroadcast] = useState<Broadcast | null>(null);
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  
  // Scheduling
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduledDate, setScheduledDate] = useState<Date | undefined>(undefined);
  const [scheduledTime, setScheduledTime] = useState("12:00");
  
  // Bulk contacts
  const [bulkContacts, setBulkContacts] = useState("");
  
  // Templates
  const [templates, setTemplates] = useState<Template[]>([]);
  const [templateName, setTemplateName] = useState("");
  const [isSavingTemplate, setIsSavingTemplate] = useState(false);
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  
  // Reports
  const [allBroadcasts, setAllBroadcasts] = useState<Broadcast[]>([]);
  const [selectedTab, setSelectedTab] = useState("campaign");

  // Load data on mount
  useEffect(() => {
    loadActiveBroadcast();
    loadTemplates();
    loadAllBroadcasts();
  }, []);

  // Subscribe to realtime updates
  useEffect(() => {
    if (!currentBroadcast) return;

    const broadcastChannel = supabase
      .channel('broadcast-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'whatsapp_broadcasts',
          filter: `id=eq.${currentBroadcast.id}`
        },
        (payload) => {
          if (payload.new) {
            setCurrentBroadcast(payload.new as Broadcast);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'whatsapp_broadcast_recipients',
          filter: `broadcast_id=eq.${currentBroadcast.id}`
        },
        (payload) => {
          if (payload.eventType === 'UPDATE' && payload.new) {
            setRecipients(prev => 
              prev.map(r => r.id === (payload.new as Recipient).id ? (payload.new as Recipient) : r)
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(broadcastChannel);
    };
  }, [currentBroadcast?.id]);

  const loadActiveBroadcast = async () => {
    const { data } = await supabase
      .from('whatsapp_broadcasts')
      .select('*')
      .in('status', ['running', 'paused'])
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (data) {
      setCurrentBroadcast(data);
      loadRecipients(data.id);
    }
  };

  const loadRecipients = async (broadcastId: string) => {
    const { data } = await supabase
      .from('whatsapp_broadcast_recipients')
      .select('*')
      .eq('broadcast_id', broadcastId)
      .order('sent_at', { ascending: false, nullsFirst: false });

    if (data) {
      setRecipients(data);
    }
  };

  const loadTemplates = async () => {
    const { data } = await supabase
      .from('broadcast_templates')
      .select('*')
      .order('created_at', { ascending: false });

    if (data) {
      setTemplates(data);
    }
  };

  const loadAllBroadcasts = async () => {
    const { data } = await supabase
      .from('whatsapp_broadcasts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (data) {
      setAllBroadcasts(data);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `broadcast_${Date.now()}.${fileExt}`;
      
      const { data, error } = await supabase.storage
        .from('checkout-assets')
        .upload(`broadcasts/${fileName}`, file);

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from('checkout-assets')
        .getPublicUrl(`broadcasts/${fileName}`);

      setMediaUrl(urlData.publicUrl);
      toast.success("Arquivo enviado com sucesso!");
    } catch (error) {
      toast.error("Erro ao enviar arquivo");
      console.error(error);
    } finally {
      setIsUploading(false);
    }
  };

  // Process bulk contacts from textarea
  const processBulkContacts = () => {
    if (!bulkContacts.trim()) {
      toast.error("Cole ou digite os contatos");
      return;
    }

    const lines = bulkContacts.split('\n').filter(line => line.trim());
    const newContacts: Contact[] = [];

    lines.forEach((line, idx) => {
      const parts = line.split(',').map(p => p.trim());
      const phone = parts[0]?.replace(/\D/g, '');
      const name = parts[1] || '';

      if (phone && phone.length >= 10) {
        newContacts.push({
          id: `bulk-${Date.now()}-${idx}`,
          phone,
          name,
          selected: true
        });
      }
    });

    if (newContacts.length === 0) {
      toast.error("Nenhum contato válido encontrado");
      return;
    }

    setContacts(prev => [...prev, ...newContacts]);
    setBulkContacts("");
    toast.success(`${newContacts.length} contatos adicionados!`);
  };

  const addManualContact = () => {
    if (!manualPhone) {
      toast.error("Informe o telefone");
      return;
    }

    setContacts(prev => [...prev, {
      id: `manual-${Date.now()}`,
      phone: manualPhone.replace(/\D/g, ''),
      name: manualName,
      selected: true
    }]);

    setManualPhone("");
    setManualName("");
  };

  const removeContact = (id: string) => {
    setContacts(prev => prev.filter(c => c.id !== id));
  };

  const toggleContact = (id: string) => {
    setContacts(prev => prev.map(c => 
      c.id === id ? { ...c, selected: !c.selected } : c
    ));
  };

  // Template functions
  const saveTemplate = async () => {
    if (!templateName || !message) {
      toast.error("Preencha o nome do template e a mensagem");
      return;
    }

    setIsSavingTemplate(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('broadcast_templates')
        .insert({
          user_id: user?.id,
          name: templateName,
          message,
          media_type: mediaType === 'none' ? null : mediaType,
          media_url: mediaType === 'none' ? null : mediaUrl,
        });

      if (error) throw error;

      toast.success("Template salvo com sucesso!");
      setTemplateDialogOpen(false);
      setTemplateName("");
      loadTemplates();
    } catch (error) {
      toast.error("Erro ao salvar template");
      console.error(error);
    } finally {
      setIsSavingTemplate(false);
    }
  };

  const loadTemplate = (template: Template) => {
    setMessage(template.message);
    setMediaType(template.media_type as "none" | "image" | "video" | "document" || "none");
    setMediaUrl(template.media_url || "");
    toast.success(`Template "${template.name}" carregado!`);
  };

  const deleteTemplate = async (id: string) => {
    const { error } = await supabase
      .from('broadcast_templates')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error("Erro ao excluir template");
      return;
    }

    toast.success("Template excluído!");
    loadTemplates();
  };

  // Duplicate campaign function
  const duplicateCampaign = async (broadcastId: string) => {
    const broadcast = allBroadcasts.find(b => b.id === broadcastId);
    if (!broadcast) return;

    // Load recipients from the campaign
    const { data: recipientsData } = await supabase
      .from('whatsapp_broadcast_recipients')
      .select('phone, name')
      .eq('broadcast_id', broadcastId);

    // Fill form with campaign data
    setCampaignName(`(Cópia) ${broadcast.name}`);
    setMessage(broadcast.message);
    setMediaType(broadcast.media_type as "none" | "image" | "video" | "document" || "none");
    setMediaUrl(broadcast.media_url || "");
    setIntervalMin(broadcast.interval_min_seconds || 30);
    setIntervalMax(broadcast.interval_max_seconds || 60);

    // Add recipients as contacts
    if (recipientsData) {
      const duplicatedContacts: Contact[] = recipientsData.map((r, idx) => ({
        id: `dup-${Date.now()}-${idx}`,
        phone: r.phone,
        name: r.name || '',
        selected: true
      }));
      setContacts(duplicatedContacts);
    }

    setSelectedTab("campaign");
    toast.success(`Campanha "${broadcast.name}" duplicada!`);
  };

  // Cancel scheduled broadcast
  const cancelScheduledBroadcast = async (broadcastId: string) => {
    const { error } = await supabase
      .from('whatsapp_broadcasts')
      .update({ status: 'cancelled', completed_at: new Date().toISOString() })
      .eq('id', broadcastId);

    if (error) {
      toast.error("Erro ao cancelar agendamento");
      return;
    }

    toast.success("Agendamento cancelado!");
    loadAllBroadcasts();
  };

  const startBroadcast = async () => {
    const selectedContacts = contacts.filter(c => c.selected);
    
    if (!campaignName || !message) {
      toast.error("Preencha o nome e a mensagem da campanha");
      return;
    }

    if (selectedContacts.length === 0) {
      toast.error("Selecione ao menos um contato");
      return;
    }

    if (intervalMin > intervalMax) {
      toast.error("Intervalo mínimo não pode ser maior que o máximo");
      return;
    }

    // Validate scheduling
    if (isScheduled) {
      if (!scheduledDate) {
        toast.error("Selecione a data do agendamento");
        return;
      }

      const [hours, minutes] = scheduledTime.split(':').map(Number);
      const scheduledDateTime = new Date(scheduledDate);
      scheduledDateTime.setHours(hours, minutes, 0, 0);

      if (scheduledDateTime <= new Date()) {
        toast.error("A data/hora deve ser no futuro");
        return;
      }
    }

    setIsCreating(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      // Build scheduled_at if scheduled
      let scheduledAt: string | null = null;
      if (isScheduled && scheduledDate) {
        const [hours, minutes] = scheduledTime.split(':').map(Number);
        const scheduledDateTime = new Date(scheduledDate);
        scheduledDateTime.setHours(hours, minutes, 0, 0);
        scheduledAt = scheduledDateTime.toISOString();
      }
      
      // Create broadcast
      const { data: broadcast, error: broadcastError } = await supabase
        .from('whatsapp_broadcasts')
        .insert({
          admin_id: user?.id,
          name: campaignName,
          message,
          media_type: mediaType === 'none' ? null : mediaType,
          media_url: mediaType === 'none' ? null : mediaUrl,
          interval_seconds: intervalMin,
          interval_min_seconds: intervalMin,
          interval_max_seconds: intervalMax,
          total_recipients: selectedContacts.length,
          status: isScheduled ? 'scheduled' : 'pending',
          scheduled_at: scheduledAt
        })
        .select()
        .single();

      if (broadcastError) throw broadcastError;

      // Create recipients
      const recipientsData = selectedContacts.map(c => ({
        broadcast_id: broadcast.id,
        phone: c.phone,
        name: c.name || null
      }));

      const { error: recipientsError } = await supabase
        .from('whatsapp_broadcast_recipients')
        .insert(recipientsData);

      if (recipientsError) throw recipientsError;

      // If not scheduled, start immediately
      if (!isScheduled) {
        const { error: functionError } = await supabase.functions.invoke('whatsapp-broadcast', {
          body: { action: 'start', broadcastId: broadcast.id }
        });

        if (functionError) throw functionError;

        setCurrentBroadcast(broadcast);
        loadRecipients(broadcast.id);
        toast.success("Disparo iniciado!");
      } else {
        toast.success(`Campanha agendada para ${format(new Date(scheduledAt!), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`);
        loadAllBroadcasts();
      }

      // Clear form
      setCampaignName("");
      setMessage("");
      setMediaType("none");
      setMediaUrl("");
      setContacts([]);
      setIsScheduled(false);
      setScheduledDate(undefined);
      setScheduledTime("12:00");

    } catch (error) {
      console.error(error);
      toast.error("Erro ao criar campanha");
    } finally {
      setIsCreating(false);
    }
  };

  const pauseBroadcast = async () => {
    if (!currentBroadcast) return;
    
    await supabase.functions.invoke('whatsapp-broadcast', {
      body: { action: 'pause', broadcastId: currentBroadcast.id }
    });
    toast.success("Disparo pausado");
  };

  const resumeBroadcast = async () => {
    if (!currentBroadcast) return;
    
    await supabase.functions.invoke('whatsapp-broadcast', {
      body: { action: 'resume', broadcastId: currentBroadcast.id }
    });
    toast.success("Disparo retomado");
  };

  const cancelBroadcast = async () => {
    if (!currentBroadcast) return;
    
    await supabase.functions.invoke('whatsapp-broadcast', {
      body: { action: 'cancel', broadcastId: currentBroadcast.id }
    });
    setCurrentBroadcast(null);
    toast.success("Disparo cancelado");
    loadAllBroadcasts();
  };

  const selectedCount = contacts.filter(c => c.selected).length;
  const progressPercent = currentBroadcast 
    ? ((currentBroadcast.sent_count + currentBroadcast.failed_count) / currentBroadcast.total_recipients) * 100 
    : 0;

  // Calculate estimated time remaining
  const getEstimatedTimeRemaining = () => {
    if (!currentBroadcast || currentBroadcast.status !== 'running') return null;
    
    const remaining = currentBroadcast.total_recipients - (currentBroadcast.sent_count + currentBroadcast.failed_count);
    if (remaining <= 0) return null;
    
    const avgInterval = ((currentBroadcast.interval_min_seconds || 30) + (currentBroadcast.interval_max_seconds || 60)) / 2;
    const totalSeconds = remaining * avgInterval;
    
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    
    if (hours > 0) {
      return `~${hours}h ${minutes}min restantes`;
    } else if (minutes > 0) {
      return `~${minutes}min restantes`;
    } else {
      return `<1min restante`;
    }
  };
  const estimatedTimeRemaining = getEstimatedTimeRemaining();

  // Reports data
  const completedBroadcasts = allBroadcasts.filter(b => b.status === 'completed');
  const totalSent = completedBroadcasts.reduce((acc, b) => acc + b.sent_count, 0);
  const totalFailed = completedBroadcasts.reduce((acc, b) => acc + b.failed_count, 0);
  const totalRecipients = completedBroadcasts.reduce((acc, b) => acc + b.total_recipients, 0);
  const successRate = totalRecipients > 0 ? ((totalSent / totalRecipients) * 100).toFixed(1) : 0;

  const pieData = [
    { name: 'Enviados', value: totalSent, color: '#22c55e' },
    { name: 'Falhas', value: totalFailed, color: '#ef4444' },
  ];

  const barData = completedBroadcasts.slice(0, 10).map(b => ({
    name: b.name.substring(0, 15),
    enviados: b.sent_count,
    falhas: b.failed_count,
  }));

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Disparo em Massa WhatsApp</h1>
            <p className="text-muted-foreground">Envie mensagens para múltiplos contatos</p>
          </div>
          <MessageSquare className="h-10 w-10 text-primary" />
        </div>

        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="campaign" className="gap-2">
              <Send className="h-4 w-4" />
              Nova Campanha
            </TabsTrigger>
            <TabsTrigger value="templates" className="gap-2">
              <FileStack className="h-4 w-4" />
              Templates
            </TabsTrigger>
            <TabsTrigger value="reports" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              Relatórios
            </TabsTrigger>
          </TabsList>

          {/* Campaign Tab */}
          <TabsContent value="campaign">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Form Column */}
              <div className="space-y-6">
                {/* Campaign Settings */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Send className="h-5 w-5" />
                      Nova Campanha
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Nome da Campanha</Label>
                      <Input 
                        placeholder="Ex: Black Friday 2024"
                        value={campaignName}
                        onChange={(e) => setCampaignName(e.target.value)}
                      />
                    </div>

                    {/* Template selector */}
                    {templates.length > 0 && (
                      <div className="space-y-2">
                        <Label>Carregar Template</Label>
                        <Select onValueChange={(value) => {
                          const template = templates.find(t => t.id === value);
                          if (template) loadTemplate(template);
                        }}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione um template..." />
                          </SelectTrigger>
                          <SelectContent>
                            {templates.map((template) => (
                              <SelectItem key={template.id} value={template.id}>
                                {template.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>Mensagem</Label>
                        <Dialog open={templateDialogOpen} onOpenChange={setTemplateDialogOpen}>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="sm" disabled={!message}>
                              <Save className="h-4 w-4 mr-1" />
                              Salvar Template
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Salvar como Template</DialogTitle>
                              <DialogDescription>
                                Salve esta mensagem para reutilizar em campanhas futuras
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                              <div className="space-y-2">
                                <Label>Nome do Template</Label>
                                <Input
                                  placeholder="Ex: Promoção padrão"
                                  value={templateName}
                                  onChange={(e) => setTemplateName(e.target.value)}
                                />
                              </div>
                              <div className="p-3 bg-muted rounded-lg text-sm">
                                <p className="text-muted-foreground mb-1">Prévia da mensagem:</p>
                                <p>{message.substring(0, 100)}{message.length > 100 ? '...' : ''}</p>
                              </div>
                            </div>
                            <DialogFooter>
                              <Button variant="outline" onClick={() => setTemplateDialogOpen(false)}>
                                Cancelar
                              </Button>
                              <Button onClick={saveTemplate} disabled={isSavingTemplate}>
                                {isSavingTemplate ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : null}
                                Salvar Template
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </div>
                      <Textarea 
                        placeholder="Olá {{nome}}! Aproveite nossa oferta especial..."
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        rows={4}
                      />
                      <p className="text-xs text-muted-foreground">
                        Use {"{{nome}}"} para personalizar com o nome do contato
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label>Tipo de Mídia</Label>
                      <div className="flex gap-2">
                        <Button
                          variant={mediaType === "none" ? "default" : "outline"}
                          size="sm"
                          onClick={() => setMediaType("none")}
                        >
                          Nenhum
                        </Button>
                        <Button
                          variant={mediaType === "image" ? "default" : "outline"}
                          size="sm"
                          onClick={() => setMediaType("image")}
                        >
                          <ImageIcon className="h-4 w-4 mr-1" />
                          Imagem
                        </Button>
                        <Button
                          variant={mediaType === "video" ? "default" : "outline"}
                          size="sm"
                          onClick={() => setMediaType("video")}
                        >
                          <Video className="h-4 w-4 mr-1" />
                          Vídeo
                        </Button>
                        <Button
                          variant={mediaType === "document" ? "default" : "outline"}
                          size="sm"
                          onClick={() => setMediaType("document")}
                        >
                          <FileText className="h-4 w-4 mr-1" />
                          Documento
                        </Button>
                      </div>
                    </div>

                    {mediaType !== "none" && (
                      <div className="space-y-2">
                        <Label>Upload de Mídia</Label>
                        <div className="flex gap-2">
                          <Input
                            type="file"
                            accept={
                              mediaType === "image" ? "image/*" :
                              mediaType === "video" ? "video/*" :
                              "*"
                            }
                            onChange={handleFileUpload}
                            disabled={isUploading}
                          />
                        </div>
                        {mediaUrl && (
                          <p className="text-xs text-green-500 flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3" />
                            Arquivo enviado
                          </p>
                        )}
                      </div>
                    )}

                    <div className="space-y-4">
                      <Label>Intervalo Randômico entre mensagens</Label>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-xs text-muted-foreground">Mínimo (segundos)</Label>
                          <Input
                            type="number"
                            min={15}
                            max={300}
                            value={intervalMin}
                            onChange={(e) => setIntervalMin(Number(e.target.value))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs text-muted-foreground">Máximo (segundos)</Label>
                          <Input
                            type="number"
                            min={15}
                            max={300}
                            value={intervalMax}
                            onChange={(e) => setIntervalMax(Number(e.target.value))}
                          />
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        O intervalo será um valor aleatório entre {intervalMin}s e {intervalMax}s
                      </p>
                    </div>

                    {/* Scheduling */}
                    <Separator />
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label>Agendar para depois</Label>
                          <p className="text-xs text-muted-foreground">
                            O disparo será iniciado automaticamente na data/hora escolhida
                          </p>
                        </div>
                        <Switch
                          checked={isScheduled}
                          onCheckedChange={setIsScheduled}
                        />
                      </div>

                      {isScheduled && (
                        <div className="grid grid-cols-2 gap-4 pt-2">
                          <div className="space-y-2">
                            <Label className="text-xs text-muted-foreground">Data</Label>
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button
                                  variant="outline"
                                  className={cn(
                                    "w-full justify-start text-left font-normal",
                                    !scheduledDate && "text-muted-foreground"
                                  )}
                                >
                                  <CalendarIcon className="mr-2 h-4 w-4" />
                                  {scheduledDate ? format(scheduledDate, "dd/MM/yyyy") : "Selecione"}
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                  mode="single"
                                  selected={scheduledDate}
                                  onSelect={setScheduledDate}
                                  disabled={(date) => date < new Date()}
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                          </div>
                          <div className="space-y-2">
                            <Label className="text-xs text-muted-foreground">Horário</Label>
                            <Input
                              type="time"
                              value={scheduledTime}
                              onChange={(e) => setScheduledTime(e.target.value)}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Contacts */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Contatos
                      <Badge variant="secondary">{selectedCount} selecionados</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Bulk paste area */}
                    <div className="space-y-2">
                      <Label>Cole ou digite os contatos</Label>
                      <Textarea
                        placeholder="11999990000,João Silva&#10;21888881111,Maria Santos&#10;31777772222&#10;(um contato por linha, nome é opcional)"
                        value={bulkContacts}
                        onChange={(e) => setBulkContacts(e.target.value)}
                        rows={5}
                        className="font-mono text-sm"
                      />
                      <p className="text-xs text-muted-foreground">
                        Formato: telefone,nome (um por linha, nome é opcional)
                      </p>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={processBulkContacts}
                        disabled={!bulkContacts.trim()}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Processar Lista
                      </Button>
                    </div>

                    <Separator />

                    <p className="text-sm text-muted-foreground text-center">ou adicione individualmente</p>

                    <div className="flex gap-2">
                      <Input
                        placeholder="Telefone (ex: 11999999999)"
                        value={manualPhone}
                        onChange={(e) => setManualPhone(e.target.value)}
                        className="flex-1"
                      />
                      <Input
                        placeholder="Nome (opcional)"
                        value={manualName}
                        onChange={(e) => setManualName(e.target.value)}
                        className="flex-1"
                      />
                      <Button size="icon" onClick={addManualContact}>
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>

                    <ScrollArea className="h-48 border rounded-md">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-12"></TableHead>
                            <TableHead>Nome</TableHead>
                            <TableHead>Telefone</TableHead>
                            <TableHead className="w-12"></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {contacts.map((contact) => (
                            <TableRow key={contact.id}>
                              <TableCell>
                                <input
                                  type="checkbox"
                                  checked={contact.selected}
                                  onChange={() => toggleContact(contact.id)}
                                  className="rounded"
                                />
                              </TableCell>
                              <TableCell>{contact.name || '-'}</TableCell>
                              <TableCell>{contact.phone}</TableCell>
                              <TableCell>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => removeContact(contact.id)}
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                          {contacts.length === 0 && (
                            <TableRow>
                              <TableCell colSpan={4} className="text-center text-muted-foreground">
                                Nenhum contato adicionado
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </ScrollArea>

                    <Button 
                      className="w-full" 
                      disabled={selectedCount === 0 || !campaignName || !message || isCreating}
                      onClick={startBroadcast}
                    >
                      {isCreating ? (
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      ) : isScheduled ? (
                        <CalendarIcon className="h-4 w-4 mr-2" />
                      ) : (
                        <Play className="h-4 w-4 mr-2" />
                      )}
                      {isScheduled ? `Agendar Disparo (${selectedCount} contatos)` : `Iniciar Disparo (${selectedCount} contatos)`}
                    </Button>
                  </CardContent>
                </Card>
              </div>

              {/* Status Column */}
              <div className="space-y-6">
                {/* Active Broadcast Status */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <RefreshCw className={`h-5 w-5 ${currentBroadcast?.status === 'running' ? 'animate-spin' : ''}`} />
                      Status do Envio
                    </CardTitle>
                    <CardDescription>
                      {currentBroadcast ? currentBroadcast.name : "Nenhum disparo ativo"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {currentBroadcast ? (
                      <>
                        <div className="flex gap-2">
                          {currentBroadcast.status === 'running' ? (
                            <Button variant="outline" onClick={pauseBroadcast}>
                              <Pause className="h-4 w-4 mr-2" />
                              Pausar
                            </Button>
                          ) : currentBroadcast.status === 'paused' ? (
                            <Button variant="outline" onClick={resumeBroadcast}>
                              <Play className="h-4 w-4 mr-2" />
                              Retomar
                            </Button>
                          ) : null}
                          <Button variant="destructive" onClick={cancelBroadcast}>
                            <StopCircle className="h-4 w-4 mr-2" />
                            Cancelar
                          </Button>
                        </div>

                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Progresso</span>
                            <span>{currentBroadcast.sent_count + currentBroadcast.failed_count} / {currentBroadcast.total_recipients} ({progressPercent.toFixed(1)}%)</span>
                          </div>
                          <Progress value={progressPercent} />
                          {estimatedTimeRemaining && (
                            <p className="text-xs text-muted-foreground text-center flex items-center justify-center gap-1">
                              <Clock className="h-3 w-3" />
                              {estimatedTimeRemaining}
                            </p>
                          )}
                        </div>

                        <div className="grid grid-cols-3 gap-4 text-center">
                          <div className="p-3 bg-muted rounded-lg">
                            <p className="text-2xl font-bold">{currentBroadcast.total_recipients}</p>
                            <p className="text-xs text-muted-foreground">Total</p>
                          </div>
                          <div className="p-3 bg-green-500/10 rounded-lg">
                            <p className="text-2xl font-bold text-green-500">{currentBroadcast.sent_count}</p>
                            <p className="text-xs text-muted-foreground">Enviados</p>
                          </div>
                          <div className="p-3 bg-red-500/10 rounded-lg">
                            <p className="text-2xl font-bold text-red-500">{currentBroadcast.failed_count}</p>
                            <p className="text-xs text-muted-foreground">Falhas</p>
                          </div>
                        </div>

                        <Separator />

                        <div className="space-y-2">
                          <Label>Log de Envios</Label>
                          <ScrollArea className="h-64 border rounded-md">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Status</TableHead>
                                  <TableHead>Nome</TableHead>
                                  <TableHead>Telefone</TableHead>
                                  <TableHead>Hora</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {recipients.map((recipient) => (
                                  <TableRow key={recipient.id}>
                                    <TableCell>
                                      {recipient.status === 'sent' && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                                      {recipient.status === 'failed' && <XCircle className="h-4 w-4 text-red-500" />}
                                      {recipient.status === 'pending' && <Clock className="h-4 w-4 text-muted-foreground" />}
                                    </TableCell>
                                    <TableCell>{recipient.name || '-'}</TableCell>
                                    <TableCell>{recipient.phone}</TableCell>
                                    <TableCell className="text-xs text-muted-foreground">
                                      {recipient.sent_at 
                                        ? format(new Date(recipient.sent_at), "HH:mm:ss")
                                        : '-'}
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </ScrollArea>
                        </div>
                      </>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>Nenhum disparo em andamento</p>
                        <p className="text-sm">Crie uma nova campanha para começar</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Templates Tab */}
          <TabsContent value="templates">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileStack className="h-5 w-5" />
                  Templates Salvos
                </CardTitle>
                <CardDescription>
                  Reutilize mensagens em diferentes campanhas
                </CardDescription>
              </CardHeader>
              <CardContent>
                {templates.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {templates.map((template) => (
                      <Card key={template.id} className="relative">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base flex items-center gap-2">
                            {template.media_type === 'image' && <ImageIcon className="h-4 w-4 text-blue-500" />}
                            {template.media_type === 'video' && <Video className="h-4 w-4 text-purple-500" />}
                            {template.media_type === 'document' && <FileText className="h-4 w-4 text-orange-500" />}
                            {template.name}
                          </CardTitle>
                          <CardDescription className="text-xs">
                            Criado em {format(new Date(template.created_at), "dd/MM/yyyy", { locale: ptBR })}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <p className="text-sm text-muted-foreground line-clamp-3">
                            {template.message}
                          </p>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              className="flex-1"
                              onClick={() => {
                                loadTemplate(template);
                                setSelectedTab("campaign");
                              }}
                            >
                              Usar Template
                            </Button>
                            <Button
                              variant="destructive"
                              size="icon"
                              onClick={() => deleteTemplate(template.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <FileStack className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium mb-2">Nenhum template salvo</p>
                    <p className="text-sm">Crie uma mensagem e salve como template para reutilizar</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Reports Tab */}
          <TabsContent value="reports">
            <div className="space-y-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-full bg-primary/10">
                        <Send className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{completedBroadcasts.length}</p>
                        <p className="text-sm text-muted-foreground">Campanhas</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-full bg-green-500/10">
                        <CheckCircle2 className="h-6 w-6 text-green-500" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{totalSent}</p>
                        <p className="text-sm text-muted-foreground">Mensagens Enviadas</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-full bg-red-500/10">
                        <XCircle className="h-6 w-6 text-red-500" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{totalFailed}</p>
                        <p className="text-sm text-muted-foreground">Falhas</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-full bg-blue-500/10">
                        <Target className="h-6 w-6 text-blue-500" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{successRate}%</p>
                        <p className="text-sm text-muted-foreground">Taxa de Sucesso</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Pie Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle>Distribuição de Resultados</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {totalRecipients > 0 ? (
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={pieData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                            outerRadius={100}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {pieData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                        <p>Nenhum dado disponível</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Bar Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle>Desempenho por Campanha</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {barData.length > 0 ? (
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={barData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" fontSize={12} />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="enviados" fill="#22c55e" name="Enviados" />
                          <Bar dataKey="falhas" fill="#ef4444" name="Falhas" />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                        <p>Nenhum dado disponível</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Campaigns History */}
              <Card>
                <CardHeader>
                  <CardTitle>Histórico de Campanhas</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Campanha</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Enviados</TableHead>
                        <TableHead>Falhas</TableHead>
                        <TableHead>Taxa Sucesso</TableHead>
                        <TableHead>Data</TableHead>
                        <TableHead className="w-24">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {allBroadcasts.map((broadcast) => {
                        const rate = broadcast.total_recipients > 0
                          ? ((broadcast.sent_count / broadcast.total_recipients) * 100).toFixed(1)
                          : '0';
                        return (
                          <TableRow key={broadcast.id}>
                            <TableCell className="font-medium">{broadcast.name}</TableCell>
                            <TableCell>
                              <Badge variant={
                                broadcast.status === 'completed' ? 'default' :
                                broadcast.status === 'running' ? 'secondary' :
                                broadcast.status === 'scheduled' ? 'outline' :
                                broadcast.status === 'cancelled' ? 'destructive' :
                                'outline'
                              }>
                                {broadcast.status === 'scheduled' && (
                                  <Clock className="h-3 w-3 mr-1" />
                                )}
                                {broadcast.status === 'scheduled' 
                                  ? `Agendado ${broadcast.scheduled_at ? format(new Date(broadcast.scheduled_at), "dd/MM HH:mm") : ''}` 
                                  : broadcast.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-green-500">{broadcast.sent_count}</TableCell>
                            <TableCell className="text-red-500">{broadcast.failed_count}</TableCell>
                            <TableCell>{rate}%</TableCell>
                            <TableCell className="text-muted-foreground">
                              {format(new Date(broadcast.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  onClick={() => duplicateCampaign(broadcast.id)}
                                  title="Duplicar campanha"
                                >
                                  <Copy className="h-4 w-4" />
                                </Button>
                                {broadcast.status === 'scheduled' && (
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    onClick={() => cancelScheduledBroadcast(broadcast.id)}
                                    title="Cancelar agendamento"
                                  >
                                    <StopCircle className="h-4 w-4 text-destructive" />
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                      {allBroadcasts.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center text-muted-foreground">
                            Nenhuma campanha registrada
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
