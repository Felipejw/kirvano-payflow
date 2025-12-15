import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { RefreshCw, Plus, Trash2, MessageSquare, Mail, TrendingUp, DollarSign, Target, Clock } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { Json } from "@/integrations/supabase/types";

interface MessageInterval {
  type: "minutes" | "hours" | "days";
  value: number;
  channel: "whatsapp" | "email" | "both";
}

interface RecoveryCampaign {
  id: string;
  seller_id: string;
  is_active: boolean;
  message_intervals: Json;
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
}

interface RecoveryStats {
  totalMessages: number;
  successfulMessages: number;
  recoveredSales: number;
  recoveredAmount: number;
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
      }

      // Fetch recovery messages
      const { data: messagesData } = await supabase
        .from("recovery_messages")
        .select("*")
        .eq("seller_id", user?.id)
        .order("sent_at", { ascending: false })
        .limit(50);

      setMessages(messagesData || []);

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

        {/* Global Status Warning */}
        {globalSettings && !globalSettings.is_enabled && (
          <Card className="border-yellow-500/50 bg-yellow-500/10">
            <CardContent className="py-4">
              <p className="text-yellow-400 text-sm">
                ⚠️ O serviço de recuperação está desativado globalmente pelo administrador.
              </p>
            </CardContent>
          </Card>
        )}

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

            <Button onClick={saveCampaign} disabled={saving} className="w-full">
              {saving ? "Salvando..." : "Salvar Campanha"}
            </Button>
          </CardContent>
        </Card>

        {/* Recent Messages */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle>Mensagens Recentes</CardTitle>
            <CardDescription>
              Histórico das últimas mensagens de recuperação enviadas
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
                    <TableHead>Data</TableHead>
                    <TableHead>Canal</TableHead>
                    <TableHead>Mensagem #</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Erro</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {messages.map((message) => (
                    <TableRow key={message.id}>
                      <TableCell>
                        {message.sent_at
                          ? format(new Date(message.sent_at), "dd/MM/yyyy HH:mm", { locale: ptBR })
                          : "-"}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getChannelIcon(message.channel)}
                          <span className="capitalize">{message.channel}</span>
                        </div>
                      </TableCell>
                      <TableCell>{message.message_number}ª</TableCell>
                      <TableCell>{getStatusBadge(message.status)}</TableCell>
                      <TableCell className="max-w-[200px] truncate text-destructive">
                        {message.error_message || "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
