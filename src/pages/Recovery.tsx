import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { RefreshCw, Plus, Trash2, MessageSquare, Mail, TrendingUp, DollarSign, Target, Clock, User, Package, Info, Users } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { Json } from "@/integrations/supabase/types";
import { RecoveryClientsTab } from "@/components/recovery/RecoveryClientsTab";

interface MessageInterval {
  type: "minutes" | "hours" | "days";
  value: number;
  channel: "whatsapp" | "email" | "both";
  template?: string;
}

interface RecoveryCampaign {
  id: string;
  seller_id: string;
  is_active: boolean;
  message_intervals: Json;
  custom_whatsapp_template: string | null;
  custom_email_subject: string | null;
  created_at: string;
  updated_at: string;
}

interface RecoveryMessage {
  id: string;
  original_charge_id: string;
  channel: string;
  status: string;
  message_number: number;
  sent_at: string;
  error_message: string | null;
  charge?: {
    buyer_name: string | null;
    buyer_email: string;
    buyer_phone: string | null;
    amount: number;
    product?: {
      name: string;
    } | null;
  };
}

interface RecoveryStats {
  totalMessages: number;
  successfulMessages: number;
  recoveredSales: number;
  recoveredAmount: number;
}

interface RecoveryClient {
  chargeId: string;
  buyerName: string | null;
  buyerEmail: string;
  buyerPhone: string | null;
  productName: string;
  productId: string;
  amount: number;
  expiredAt: string;
  messagesSent: number;
  maxMessages: number;
  status: "em_andamento" | "recuperado" | "esgotado" | "aguardando";
  lastMessageAt: string | null;
  nextMessageAt: string | null;
  messages: {
    id: string;
    channel: string;
    status: string;
    messageNumber: number;
    sentAt: string;
    errorMessage: string | null;
  }[];
}

export default function Recovery() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [campaign, setCampaign] = useState<RecoveryCampaign | null>(null);
  const [messages, setMessages] = useState<RecoveryMessage[]>([]);
  const [stats, setStats] = useState<RecoveryStats>({
    totalMessages: 0,
    successfulMessages: 0,
    recoveredSales: 0,
    recoveredAmount: 0,
  });
  const [globalSettings, setGlobalSettings] = useState<{ is_enabled: boolean; recovery_fee_percentage: number } | null>(null);
  const [intervals, setIntervals] = useState<MessageInterval[]>([
    { type: "minutes", value: 30, channel: "whatsapp" },
    { type: "hours", value: 2, channel: "email" },
    { type: "days", value: 1, channel: "both" },
  ]);
  const [isActive, setIsActive] = useState(false);
  const [customWhatsappTemplate, setCustomWhatsappTemplate] = useState("");
  const [customEmailSubject, setCustomEmailSubject] = useState("");
  const [recoveryClients, setRecoveryClients] = useState<RecoveryClient[]>([]);
  const [maxMessagesPerCharge, setMaxMessagesPerCharge] = useState(3);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch global settings
      const { data: settings } = await supabase
        .from("recovery_settings")
        .select("*")
        .single();

      setGlobalSettings(settings);
      if (settings) {
        setMaxMessagesPerCharge(settings.max_messages_per_charge || 3);
      }

      // Fetch user's campaign
      const { data: campaignData } = await supabase
        .from("recovery_campaigns")
        .select("*")
        .eq("seller_id", user?.id)
        .maybeSingle();

      if (campaignData) {
        setCampaign(campaignData);
        const parsedIntervals = Array.isArray(campaignData.message_intervals) 
          ? campaignData.message_intervals as unknown as MessageInterval[]
          : [];
        setIntervals(parsedIntervals);
        setIsActive(campaignData.is_active);
        setCustomWhatsappTemplate(campaignData.custom_whatsapp_template || "");
        setCustomEmailSubject(campaignData.custom_email_subject || "");
      }

      // Fetch recovery messages with charge info
      const { data: messagesData } = await supabase
        .from("recovery_messages")
        .select("*")
        .eq("seller_id", user?.id)
        .order("sent_at", { ascending: false })
        .limit(50);

      // Fetch charge details for each message
      if (messagesData && messagesData.length > 0) {
        const chargeIds = [...new Set(messagesData.map(m => m.original_charge_id))];
        const { data: charges } = await supabase
          .from("pix_charges")
          .select(`
            id,
            buyer_name,
            buyer_email,
            buyer_phone,
            amount,
            products:product_id (
              name
            )
          `)
          .in("id", chargeIds);

        const chargeMap = new Map(charges?.map(c => [c.id, {
          buyer_name: c.buyer_name,
          buyer_email: c.buyer_email,
          buyer_phone: c.buyer_phone,
          amount: c.amount,
          product: c.products as { name: string } | null
        }]));

        setMessages(messagesData.map(m => ({
          ...m,
          charge: chargeMap.get(m.original_charge_id)
        })));
      } else {
        setMessages([]);
      }

      // Calculate stats
      const totalMessages = messagesData?.length || 0;
      const successfulMessages = messagesData?.filter(m => m.status === "sent").length || 0;

      // Fetch recovered transactions
      const { data: recoveredTransactions } = await supabase
        .from("transactions")
        .select("amount, recovery_fee")
        .eq("seller_id", user?.id)
        .eq("is_recovered", true);

      const recoveredSales = recoveredTransactions?.length || 0;
      const recoveredAmount = recoveredTransactions?.reduce((sum, t) => sum + Number(t.amount), 0) || 0;

      setStats({
        totalMessages,
        successfulMessages,
        recoveredSales,
        recoveredAmount,
      });

      // Fetch clients in recovery (expired charges)
      const { data: expiredCharges } = await supabase
        .from("pix_charges")
        .select(`
          id,
          product_id,
          buyer_email,
          buyer_name,
          buyer_phone,
          amount,
          expires_at,
          status,
          paid_at,
          products:product_id (
            name
          )
        `)
        .eq("seller_id", user?.id)
        .in("status", ["expired", "paid"])
        .eq("is_recovery", false)
        .is("original_charge_id", null)
        .order("expires_at", { ascending: false })
        .limit(100);

      if (expiredCharges && expiredCharges.length > 0) {
        // Get all recovery messages for these charges
        const chargeIds = expiredCharges.map(c => c.id);
        const { data: allRecoveryMessages } = await supabase
          .from("recovery_messages")
          .select("*")
          .in("original_charge_id", chargeIds)
          .order("message_number", { ascending: true });

        // Group messages by charge
        const messagesByCharge = new Map<string, typeof allRecoveryMessages>();
        allRecoveryMessages?.forEach(msg => {
          const existing = messagesByCharge.get(msg.original_charge_id) || [];
          existing.push(msg);
          messagesByCharge.set(msg.original_charge_id, existing);
        });

        // Build recovery clients list
        const configuredIntervals = campaignData 
          ? (Array.isArray(campaignData.message_intervals) ? campaignData.message_intervals.length : 0)
          : intervals.length;
        const maxMsgs = Math.min(settings?.max_messages_per_charge || 3, configuredIntervals || 3);

        const clients: RecoveryClient[] = expiredCharges.map(charge => {
          const msgs = messagesByCharge.get(charge.id) || [];
          const messagesSent = msgs.length;
          const lastMsg = msgs[msgs.length - 1];
          
          // Determine status
          let status: RecoveryClient["status"];
          if (charge.status === "paid" && charge.paid_at) {
            // Check if paid after recovery messages were sent
            const firstMsgTime = msgs[0]?.sent_at;
            if (firstMsgTime && new Date(charge.paid_at) > new Date(firstMsgTime)) {
              status = "recuperado";
            } else {
              status = "recuperado"; // Consider as recovered if paid
            }
          } else if (messagesSent >= maxMsgs) {
            status = "esgotado";
          } else if (messagesSent === 0) {
            status = "aguardando";
          } else {
            status = "em_andamento";
          }

          // Calculate next message time
          let nextMessageAt: string | null = null;
          if (status === "em_andamento" || status === "aguardando") {
            const parsedIntervals = campaignData 
              ? (Array.isArray(campaignData.message_intervals) 
                  ? campaignData.message_intervals as unknown as MessageInterval[]
                  : [])
              : intervals;
            
            if (parsedIntervals.length > messagesSent) {
              const nextInterval = parsedIntervals[messagesSent];
              const referenceTime = lastMsg 
                ? new Date(lastMsg.sent_at) 
                : new Date(charge.expires_at);
              
              let minutes = nextInterval.value;
              if (nextInterval.type === "hours") minutes *= 60;
              if (nextInterval.type === "days") minutes *= 60 * 24;
              
              nextMessageAt = new Date(referenceTime.getTime() + minutes * 60 * 1000).toISOString();
            }
          }

          return {
            chargeId: charge.id,
            buyerName: charge.buyer_name,
            buyerEmail: charge.buyer_email,
            buyerPhone: charge.buyer_phone,
            productName: (charge.products as any)?.name || "Produto",
            productId: charge.product_id || "",
            amount: charge.amount,
            expiredAt: charge.expires_at,
            messagesSent,
            maxMessages: maxMsgs,
            status,
            lastMessageAt: lastMsg?.sent_at || null,
            nextMessageAt,
            messages: msgs.map(m => ({
              id: m.id,
              channel: m.channel,
              status: m.status,
              messageNumber: m.message_number,
              sentAt: m.sent_at || m.created_at,
              errorMessage: m.error_message
            }))
          };
        });

        // Filter to show only charges that have recovery messages or are waiting for first message
        const relevantClients = clients.filter(c => 
          c.messagesSent > 0 || c.status === "aguardando"
        );

        setRecoveryClients(relevantClients);
      } else {
        setRecoveryClients([]);
      }
    } catch (error) {
      console.error("Error fetching recovery data:", error);
      toast.error("Erro ao carregar dados de recuperação");
    } finally {
      setLoading(false);
    }
  };

  const saveCampaign = async () => {
    if (!user) return;

    setSaving(true);
    try {
      if (campaign) {
        // Update existing campaign
        const { error } = await supabase
          .from("recovery_campaigns")
          .update({
            is_active: isActive,
            message_intervals: intervals as unknown as Json,
            custom_whatsapp_template: customWhatsappTemplate || null,
            custom_email_subject: customEmailSubject || null,
          })
          .eq("id", campaign.id);

        if (error) throw error;
      } else {
        // Create new campaign
        const { error } = await supabase
          .from("recovery_campaigns")
          .insert({
            seller_id: user.id,
            is_active: isActive,
            message_intervals: intervals as unknown as Json,
            custom_whatsapp_template: customWhatsappTemplate || null,
            custom_email_subject: customEmailSubject || null,
          });

        if (error) throw error;
      }

      toast.success("Campanha salva com sucesso!");
      fetchData();
    } catch (error: any) {
      console.error("Error saving campaign:", error);
      toast.error("Erro ao salvar campanha");
    } finally {
      setSaving(false);
    }
  };

  const addInterval = () => {
    setIntervals([...intervals, { type: "hours", value: 1, channel: "whatsapp" }]);
  };

  const removeInterval = (index: number) => {
    setIntervals(intervals.filter((_, i) => i !== index));
  };

  const updateInterval = (index: number, field: keyof MessageInterval, value: any) => {
    const newIntervals = [...intervals];
    newIntervals[index] = { ...newIntervals[index], [field]: value };
    setIntervals(newIntervals);
  };

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case "whatsapp":
        return <MessageSquare className="h-4 w-4 text-green-500" />;
      case "email":
        return <Mail className="h-4 w-4 text-blue-500" />;
      case "both":
        return (
          <div className="flex gap-1">
            <MessageSquare className="h-4 w-4 text-green-500" />
            <Mail className="h-4 w-4 text-blue-500" />
          </div>
        );
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "sent":
        return <Badge className="bg-green-500/20 text-green-400">Enviado</Badge>;
      case "failed":
        return <Badge variant="destructive">Falhou</Badge>;
      case "pending":
        return <Badge variant="secondary">Pendente</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-64" />
          <div className="grid gap-4 md:grid-cols-4">
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
          <Skeleton className="h-96" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Recuperação de Vendas</h1>
            <p className="text-muted-foreground">
              Recupere vendas perdidas automaticamente via WhatsApp e Email
            </p>
          </div>
          <Button variant="outline" onClick={fetchData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Mensagens Enviadas
              </CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{stats.totalMessages}</div>
              <p className="text-xs text-muted-foreground">
                {stats.successfulMessages} com sucesso
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Vendas Recuperadas
              </CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-500">{stats.recoveredSales}</div>
              <p className="text-xs text-muted-foreground">
                conversões do total
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Valor Recuperado
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-500">
                R$ {stats.recoveredAmount.toFixed(2).replace(".", ",")}
              </div>
              <p className="text-xs text-muted-foreground">
                em vendas
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Taxa de Conversão
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">
                {stats.totalMessages > 0
                  ? ((stats.recoveredSales / stats.totalMessages) * 100).toFixed(1)
                  : 0}%
              </div>
              <p className="text-xs text-muted-foreground">
                das mensagens
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="clients" className="space-y-6">
          <TabsList className="bg-secondary/50">
            <TabsTrigger value="clients" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Clientes ({recoveryClients.length})
            </TabsTrigger>
            <TabsTrigger value="config">Configuração</TabsTrigger>
            <TabsTrigger value="messages">Mensagens ({stats.totalMessages})</TabsTrigger>
          </TabsList>

          <TabsContent value="clients" className="space-y-6">
            <RecoveryClientsTab 
              clients={recoveryClients}
              campaignId={campaign?.id || null}
              onRefresh={fetchData}
              loading={loading}
            />
          </TabsContent>

          <TabsContent value="config" className="space-y-6">
            {/* Campaign Configuration */}
            <Card className="bg-card border-border">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Configuração da Campanha</CardTitle>
                    <CardDescription>
                      Configure quando e como as mensagens de recuperação serão enviadas
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Label htmlFor="campaign-active" className="text-sm">
                      Campanha ativa
                    </Label>
                    <Switch
                      id="campaign-active"
                      checked={isActive}
                      onCheckedChange={setIsActive}
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Fee Info */}
                {globalSettings && (
                  <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                    <p className="text-sm text-muted-foreground">
                      <strong className="text-primary">Taxa de recuperação:</strong>{" "}
                      {globalSettings.recovery_fee_percentage}% sobre vendas recuperadas
                    </p>
                  </div>
                )}

                {/* Message Intervals */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-base font-medium">Sequência de Mensagens</Label>
                    <Button variant="outline" size="sm" onClick={addInterval}>
                      <Plus className="h-4 w-4 mr-2" />
                      Adicionar
                    </Button>
                  </div>

                  <div className="space-y-3">
                    {intervals.map((interval, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-3 p-4 rounded-lg bg-muted/30 border border-border"
                      >
                        <div className="flex items-center gap-2 text-sm text-muted-foreground min-w-[100px]">
                          <Clock className="h-4 w-4" />
                          {index + 1}ª mensagem:
                        </div>

                        <Input
                          type="number"
                          min="1"
                          value={interval.value}
                          onChange={(e) => updateInterval(index, "value", parseInt(e.target.value) || 1)}
                          className="w-20"
                        />

                        <Select
                          value={interval.type}
                          onValueChange={(value) => updateInterval(index, "type", value)}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="minutes">minutos</SelectItem>
                            <SelectItem value="hours">horas</SelectItem>
                            <SelectItem value="days">dias</SelectItem>
                          </SelectContent>
                        </Select>

                        <span className="text-muted-foreground">via</span>

                        <Select
                          value={interval.channel}
                          onValueChange={(value) => updateInterval(index, "channel", value)}
                        >
                          <SelectTrigger className="w-36">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="whatsapp">WhatsApp</SelectItem>
                            <SelectItem value="email">Email</SelectItem>
                            <SelectItem value="both">Ambos</SelectItem>
                          </SelectContent>
                        </Select>

                        {intervals.length > 1 && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeInterval(index)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Custom Templates */}
                <div className="space-y-4 pt-4 border-t border-border">
                  <div className="flex items-center gap-2">
                    <Label className="text-base font-medium">Personalização de Mensagens</Label>
                    <Badge variant="outline" className="text-xs">Opcional</Badge>
                  </div>
                  
                  <div className="p-4 rounded-lg bg-muted/30 border border-border space-y-2">
                    <div className="flex items-start gap-2">
                      <Info className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <p className="text-xs text-muted-foreground">
                        Use as variáveis: <code className="px-1 py-0.5 bg-secondary rounded">{`{nome}`}</code>, <code className="px-1 py-0.5 bg-secondary rounded">{`{produto}`}</code>, <code className="px-1 py-0.5 bg-secondary rounded">{`{valor}`}</code>, <code className="px-1 py-0.5 bg-secondary rounded">{`{link}`}</code>
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="whatsapp-template">Template WhatsApp</Label>
                    <Textarea
                      id="whatsapp-template"
                      value={customWhatsappTemplate}
                      onChange={(e) => setCustomWhatsappTemplate(e.target.value)}
                      placeholder="Olá {nome}! Vi que você não finalizou a compra do {produto}. O link ainda está disponível: {link}"
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email-subject">Assunto do Email</Label>
                    <Input
                      id="email-subject"
                      value={customEmailSubject}
                      onChange={(e) => setCustomEmailSubject(e.target.value)}
                      placeholder="{nome}, seu pedido está te esperando!"
                    />
                  </div>
                </div>

                <Button onClick={saveCampaign} disabled={saving} className="w-full">
                  {saving ? "Salvando..." : "Salvar Campanha"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="messages" className="space-y-6">
            {/* Recent Messages */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle>Mensagens Enviadas</CardTitle>
                <CardDescription>
                  Histórico das mensagens de recuperação com detalhes do cliente
                </CardDescription>
              </CardHeader>
              <CardContent>
                {messages.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhuma mensagem de recuperação enviada ainda</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Cliente</TableHead>
                        <TableHead>Produto</TableHead>
                        <TableHead>Valor</TableHead>
                        <TableHead>Canal</TableHead>
                        <TableHead>Msg #</TableHead>
                        <TableHead>Data</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {messages.map((message) => (
                        <TableRow key={message.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-muted-foreground" />
                              <div>
                                <p className="font-medium text-sm">
                                  {message.charge?.buyer_name || "Cliente"}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {message.charge?.buyer_email}
                                </p>
                                {message.charge?.buyer_phone && (
                                  <p className="text-xs text-muted-foreground">
                                    {message.charge.buyer_phone}
                                  </p>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Package className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm truncate max-w-[150px]">
                                {message.charge?.product?.name || "Produto"}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="font-medium text-primary">
                              R$ {Number(message.charge?.amount || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {getChannelIcon(message.channel)}
                              <span className="capitalize text-sm">{message.channel}</span>
                            </div>
                          </TableCell>
                          <TableCell>{message.message_number}ª</TableCell>
                          <TableCell>
                            <span className="text-sm text-muted-foreground">
                              {message.sent_at
                                ? format(new Date(message.sent_at), "dd/MM HH:mm", { locale: ptBR })
                                : "-"}
                            </span>
                          </TableCell>
                          <TableCell>{getStatusBadge(message.status)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
