import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  MessageSquare, 
  Upload, 
  Play, 
  Pause, 
  StopCircle, 
  Download, 
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
  Send
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import * as XLSX from "xlsx";

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
  status: string;
  total_recipients: number;
  sent_count: number;
  failed_count: number;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
}

export default function AdminBroadcast() {
  const [campaignName, setCampaignName] = useState("");
  const [message, setMessage] = useState("");
  const [mediaType, setMediaType] = useState<"none" | "image" | "video" | "document">("none");
  const [mediaUrl, setMediaUrl] = useState("");
  const [intervalSeconds, setIntervalSeconds] = useState(30);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [manualPhone, setManualPhone] = useState("");
  const [manualName, setManualName] = useState("");
  const [currentBroadcast, setCurrentBroadcast] = useState<Broadcast | null>(null);
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // Load broadcasts on mount
  useEffect(() => {
    loadActiveBroadcast();
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

  const importFromSystem = async () => {
    const { data, error } = await supabase
      .from('pix_charges')
      .select('buyer_phone, buyer_name')
      .not('buyer_phone', 'is', null)
      .eq('status', 'paid');

    if (error) {
      toast.error("Erro ao importar contatos");
      return;
    }

    const uniquePhones = new Map<string, string>();
    data?.forEach(charge => {
      if (charge.buyer_phone && !uniquePhones.has(charge.buyer_phone)) {
        uniquePhones.set(charge.buyer_phone, charge.buyer_name || '');
      }
    });

    const imported: Contact[] = Array.from(uniquePhones).map(([phone, name], idx) => ({
      id: `imported-${idx}`,
      phone,
      name,
      selected: true
    }));

    setContacts(prev => [...prev, ...imported]);
    toast.success(`${imported.length} contatos importados!`);
  };

  const importFromCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const workbook = XLSX.read(event.target?.result, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json<{ telefone?: string; phone?: string; nome?: string; name?: string }>(sheet);

        const imported: Contact[] = data.map((row, idx) => ({
          id: `csv-${idx}`,
          phone: row.telefone || row.phone || '',
          name: row.nome || row.name || '',
          selected: true
        })).filter(c => c.phone);

        setContacts(prev => [...prev, ...imported]);
        toast.success(`${imported.length} contatos importados!`);
      } catch (error) {
        toast.error("Erro ao ler arquivo");
      }
    };
    reader.readAsBinaryString(file);
  };

  const addManualContact = () => {
    if (!manualPhone) {
      toast.error("Informe o telefone");
      return;
    }

    setContacts(prev => [...prev, {
      id: `manual-${Date.now()}`,
      phone: manualPhone,
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

    setIsCreating(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Create broadcast
      const { data: broadcast, error: broadcastError } = await supabase
        .from('whatsapp_broadcasts')
        .insert({
          admin_id: user?.id,
          name: campaignName,
          message,
          media_type: mediaType === 'none' ? null : mediaType,
          media_url: mediaType === 'none' ? null : mediaUrl,
          interval_seconds: intervalSeconds,
          total_recipients: selectedContacts.length
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

      // Start broadcast via edge function
      const { error: functionError } = await supabase.functions.invoke('whatsapp-broadcast', {
        body: { action: 'start', broadcastId: broadcast.id }
      });

      if (functionError) throw functionError;

      setCurrentBroadcast(broadcast);
      loadRecipients(broadcast.id);
      toast.success("Disparo iniciado!");

      // Clear form
      setCampaignName("");
      setMessage("");
      setMediaType("none");
      setMediaUrl("");
      setContacts([]);

    } catch (error) {
      console.error(error);
      toast.error("Erro ao iniciar disparo");
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
  };

  const selectedCount = contacts.filter(c => c.selected).length;
  const progressPercent = currentBroadcast 
    ? ((currentBroadcast.sent_count + currentBroadcast.failed_count) / currentBroadcast.total_recipients) * 100 
    : 0;

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

                <div className="space-y-2">
                  <Label>Mensagem</Label>
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

                <div className="space-y-2">
                  <Label>Intervalo entre mensagens: {intervalSeconds}s</Label>
                  <Slider
                    value={[intervalSeconds]}
                    onValueChange={([val]) => setIntervalSeconds(val)}
                    min={15}
                    max={120}
                    step={5}
                  />
                  <p className="text-xs text-muted-foreground">
                    Intervalo recomendado: 30-60 segundos para evitar bloqueios
                  </p>
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
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" onClick={importFromSystem}>
                    <Download className="h-4 w-4 mr-1" />
                    Importar Clientes
                  </Button>
                  <label>
                    <Button variant="outline" size="sm" asChild>
                      <span>
                        <Upload className="h-4 w-4 mr-1" />
                        Importar CSV/Excel
                      </span>
                    </Button>
                    <input
                      type="file"
                      accept=".csv,.xlsx,.xls"
                      className="hidden"
                      onChange={importFromCSV}
                    />
                  </label>
                </div>

                <Separator />

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
                  ) : (
                    <Play className="h-4 w-4 mr-2" />
                  )}
                  Iniciar Disparo ({selectedCount} contatos)
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
                      {(currentBroadcast.status === 'running' || currentBroadcast.status === 'paused') && (
                        <Button variant="destructive" onClick={cancelBroadcast}>
                          <StopCircle className="h-4 w-4 mr-2" />
                          Cancelar
                        </Button>
                      )}
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Progresso</span>
                        <span>{currentBroadcast.sent_count + currentBroadcast.failed_count}/{currentBroadcast.total_recipients}</span>
                      </div>
                      <Progress value={progressPercent} />
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 text-center">
                        <CheckCircle2 className="h-6 w-6 mx-auto text-green-500 mb-1" />
                        <p className="text-2xl font-bold text-green-500">{currentBroadcast.sent_count}</p>
                        <p className="text-xs text-muted-foreground">Enviados</p>
                      </div>
                      <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-center">
                        <XCircle className="h-6 w-6 mx-auto text-red-500 mb-1" />
                        <p className="text-2xl font-bold text-red-500">{currentBroadcast.failed_count}</p>
                        <p className="text-xs text-muted-foreground">Falhas</p>
                      </div>
                      <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 text-center">
                        <Clock className="h-6 w-6 mx-auto text-yellow-500 mb-1" />
                        <p className="text-2xl font-bold text-yellow-500">
                          {currentBroadcast.total_recipients - currentBroadcast.sent_count - currentBroadcast.failed_count}
                        </p>
                        <p className="text-xs text-muted-foreground">Pendentes</p>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>Crie uma campanha para iniciar o disparo</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recipients Log */}
            <Card>
              <CardHeader>
                <CardTitle>Histórico de Envios</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px]">
                  <div className="space-y-2">
                    {recipients.map((recipient) => (
                      <div 
                        key={recipient.id}
                        className={`flex items-center justify-between p-3 rounded-lg border ${
                          recipient.status === 'sent' ? 'bg-green-500/5 border-green-500/20' :
                          recipient.status === 'failed' ? 'bg-red-500/5 border-red-500/20' :
                          'bg-muted/30 border-border'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          {recipient.status === 'sent' ? (
                            <CheckCircle2 className="h-5 w-5 text-green-500" />
                          ) : recipient.status === 'failed' ? (
                            <XCircle className="h-5 w-5 text-red-500" />
                          ) : (
                            <Clock className="h-5 w-5 text-muted-foreground" />
                          )}
                          <div>
                            <p className="font-medium">{recipient.name || 'Sem nome'}</p>
                            <p className="text-sm text-muted-foreground">{recipient.phone}</p>
                            {recipient.error_message && (
                              <p className="text-xs text-red-500">{recipient.error_message}</p>
                            )}
                          </div>
                        </div>
                        {recipient.sent_at && (
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(recipient.sent_at), "HH:mm:ss", { locale: ptBR })}
                          </p>
                        )}
                      </div>
                    ))}
                    {recipients.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        <p>Nenhum envio registrado</p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
