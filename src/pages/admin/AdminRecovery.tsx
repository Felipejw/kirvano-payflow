import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { RefreshCw, Settings2, Users, DollarSign, TrendingUp, MessageSquare, Target, Play, Pause } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface RecoverySettings {
  id: string;
  is_enabled: boolean;
  recovery_fee_percentage: number;
  max_messages_per_charge: number;
  min_interval_minutes: number;
}

interface RecoveryCampaign {
  id: string;
  seller_id: string;
  is_active: boolean;
  created_at: string;
  seller_profile?: {
    full_name: string | null;
    email: string | null;
  } | null;
}

interface PlatformStats {
  totalCampaigns: number;
  activeCampaigns: number;
  totalMessages: number;
  recoveredSales: number;
  recoveredAmount: number;
  totalFees: number;
}

export default function AdminRecovery() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<RecoverySettings | null>(null);
  const [campaigns, setCampaigns] = useState<RecoveryCampaign[]>([]);
  const [stats, setStats] = useState<PlatformStats>({
    totalCampaigns: 0,
    activeCampaigns: 0,
    totalMessages: 0,
    recoveredSales: 0,
    recoveredAmount: 0,
    totalFees: 0,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch settings
      const { data: settingsData, error: settingsError } = await supabase
        .from("recovery_settings")
        .select("*")
        .single();

      if (settingsError && settingsError.code !== "PGRST116") {
        throw settingsError;
      }

      setSettings(settingsData);

      // Fetch all campaigns
      const { data: campaignsData } = await supabase
        .from("recovery_campaigns")
        .select("*")
        .order("created_at", { ascending: false });

      // Fetch profiles for campaigns
      if (campaignsData && campaignsData.length > 0) {
        const sellerIds = campaignsData.map(c => c.seller_id);
        const { data: profilesData } = await supabase
          .from("profiles")
          .select("user_id, full_name, email")
          .in("user_id", sellerIds);

        const profilesMap = new Map(profilesData?.map(p => [p.user_id, p]) || []);
        
        const campaignsWithProfiles = campaignsData.map(c => ({
          ...c,
          seller_profile: profilesMap.get(c.seller_id) || null
        }));
        
        setCampaigns(campaignsWithProfiles);
      } else {
        setCampaigns([]);
      }

      // Calculate stats
      const totalCampaigns = campaigns?.length || 0;
      const activeCampaigns = campaigns?.filter(c => c.is_active).length || 0;

      // Get total messages
      const { count: messagesCount } = await supabase
        .from("recovery_messages")
        .select("*", { count: "exact", head: true });

      // Get recovered transactions
      const { data: recoveredTransactions } = await supabase
        .from("transactions")
        .select("amount, recovery_fee")
        .eq("is_recovered", true);

      const recoveredSales = recoveredTransactions?.length || 0;
      const recoveredAmount = recoveredTransactions?.reduce((sum, t) => sum + Number(t.amount), 0) || 0;
      const totalFees = recoveredTransactions?.reduce((sum, t) => sum + Number(t.recovery_fee || 0), 0) || 0;

      setStats({
        totalCampaigns,
        activeCampaigns,
        totalMessages: messagesCount || 0,
        recoveredSales,
        recoveredAmount,
        totalFees,
      });
    } catch (error) {
      console.error("Error fetching admin recovery data:", error);
      toast.error("Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    if (!settings) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from("recovery_settings")
        .update({
          is_enabled: settings.is_enabled,
          recovery_fee_percentage: settings.recovery_fee_percentage,
          max_messages_per_charge: settings.max_messages_per_charge,
          min_interval_minutes: settings.min_interval_minutes,
        })
        .eq("id", settings.id);

      if (error) throw error;

      toast.success("Configurações salvas com sucesso!");
    } catch (error: any) {
      console.error("Error saving settings:", error);
      toast.error("Erro ao salvar configurações");
    } finally {
      setSaving(false);
    }
  };

  const toggleCampaign = async (campaignId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from("recovery_campaigns")
        .update({ is_active: !currentStatus })
        .eq("id", campaignId);

      if (error) throw error;

      setCampaigns(campaigns.map(c =>
        c.id === campaignId ? { ...c, is_active: !currentStatus } : c
      ));

      toast.success(currentStatus ? "Campanha pausada" : "Campanha ativada");
    } catch (error: any) {
      console.error("Error toggling campaign:", error);
      toast.error("Erro ao alterar campanha");
    }
  };

  const triggerRecoveryProcess = async () => {
    try {
      toast.info("Iniciando processamento de recuperação...");
      
      const { data, error } = await supabase.functions.invoke("process-sales-recovery");

      if (error) throw error;

      toast.success(`Processamento concluído! ${data?.sent || 0} mensagens enviadas.`);
      fetchData();
    } catch (error: any) {
      console.error("Error triggering recovery:", error);
      toast.error("Erro ao processar recuperação");
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
            <h1 className="text-2xl font-bold text-foreground">Recuperação de Vendas (Admin)</h1>
            <p className="text-muted-foreground">
              Gerencie o serviço de recuperação de vendas da plataforma
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={triggerRecoveryProcess}>
              <Play className="h-4 w-4 mr-2" />
              Executar Agora
            </Button>
            <Button variant="outline" onClick={fetchData}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Atualizar
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Campanhas Ativas
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {stats.activeCampaigns}/{stats.totalCampaigns}
              </div>
              <p className="text-xs text-muted-foreground">
                vendedores usando
              </p>
            </CardContent>
          </Card>

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
                total da plataforma
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
                R$ {stats.recoveredAmount.toFixed(2).replace(".", ",")} em vendas
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Taxas Coletadas
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">
                R$ {stats.totalFees.toFixed(2).replace(".", ",")}
              </div>
              <p className="text-xs text-muted-foreground">
                em taxas de recuperação
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Global Settings */}
        <Card className="bg-card border-border">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Settings2 className="h-5 w-5 text-primary" />
              <CardTitle>Configurações Globais</CardTitle>
            </div>
            <CardDescription>
              Configure os parâmetros do serviço de recuperação
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {settings && (
              <>
                <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30 border border-border">
                  <div>
                    <Label className="text-base font-medium">Serviço Ativo</Label>
                    <p className="text-sm text-muted-foreground">
                      Ativar ou desativar o serviço de recuperação globalmente
                    </p>
                  </div>
                  <Switch
                    checked={settings.is_enabled}
                    onCheckedChange={(checked) =>
                      setSettings({ ...settings, is_enabled: checked })
                    }
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label>Taxa de Recuperação (%)</Label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      step="0.5"
                      value={settings.recovery_fee_percentage}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          recovery_fee_percentage: parseFloat(e.target.value) || 0,
                        })
                      }
                    />
                    <p className="text-xs text-muted-foreground">
                      Taxa cobrada sobre vendas recuperadas
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>Máx. Mensagens por Cobrança</Label>
                    <Input
                      type="number"
                      min="1"
                      max="20"
                      value={settings.max_messages_per_charge}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          max_messages_per_charge: parseInt(e.target.value) || 1,
                        })
                      }
                    />
                    <p className="text-xs text-muted-foreground">
                      Limite de mensagens por cobrança
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>Intervalo Mínimo (minutos)</Label>
                    <Input
                      type="number"
                      min="5"
                      value={settings.min_interval_minutes}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          min_interval_minutes: parseInt(e.target.value) || 5,
                        })
                      }
                    />
                    <p className="text-xs text-muted-foreground">
                      Tempo mínimo entre mensagens
                    </p>
                  </div>
                </div>

                <Button onClick={saveSettings} disabled={saving}>
                  {saving ? "Salvando..." : "Salvar Configurações"}
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        {/* Campaigns Table */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle>Campanhas dos Vendedores</CardTitle>
            <CardDescription>
              Gerencie as campanhas de recuperação de cada vendedor
            </CardDescription>
          </CardHeader>
          <CardContent>
            {campaigns.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhuma campanha criada ainda</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Vendedor</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Criada em</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {campaigns.map((campaign) => (
                    <TableRow key={campaign.id}>
                      <TableCell className="font-medium">
                        {campaign.seller_profile?.full_name || "N/A"}
                      </TableCell>
                      <TableCell>
                        {campaign.seller_profile?.email || "-"}
                      </TableCell>
                      <TableCell>
                        {campaign.is_active ? (
                          <Badge className="bg-green-500/20 text-green-400">Ativa</Badge>
                        ) : (
                          <Badge variant="secondary">Pausada</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {format(new Date(campaign.created_at), "dd/MM/yyyy", { locale: ptBR })}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleCampaign(campaign.id, campaign.is_active)}
                        >
                          {campaign.is_active ? (
                            <>
                              <Pause className="h-4 w-4 mr-1" />
                              Pausar
                            </>
                          ) : (
                            <>
                              <Play className="h-4 w-4 mr-1" />
                              Ativar
                            </>
                          )}
                        </Button>
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
