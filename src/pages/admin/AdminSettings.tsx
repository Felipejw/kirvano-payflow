import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Save, ArrowLeft, Trash2, AlertTriangle, Package, CreditCard, Users, ShoppingCart, Percent, DollarSign, Zap, CheckCircle, Key } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAppNavigate } from "@/lib/routes";
import { useUserRole } from "@/hooks/useUserRole";
import { GatewayManagement } from "@/components/admin/GatewayManagement";
import { GatewayCredentialsDialog } from "@/components/admin/GatewayCredentialsDialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface PlatformSettings {
  id: string;
  platform_fee: number;
  pix_enabled: boolean;
  maintenance_mode: boolean;
  support_email: string | null;
  support_phone: string | null;
  terms_url: string | null;
  privacy_url: string | null;
  fee_percentage: number;
  fee_fixed_per_sale: number;
  invoice_due_days: number;
  platform_gateway_fee_percentage: number;
  platform_gateway_fee_fixed: number;
  platform_gateway_withdrawal_fee: number;
  own_gateway_fee_percentage: number;
  own_gateway_fee_fixed: number;
  platform_gateway_type: 'bspay' | 'pixup';
}

export default function AdminSettings() {
  const [settings, setSettings] = useState<PlatformSettings | null>(null);
  const [initialSettings, setInitialSettings] = useState<PlatformSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingGateway, setSavingGateway] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [credentialsDialogOpen, setCredentialsDialogOpen] = useState(false);
  const { toast } = useToast();
  const navigate = useAppNavigate();
  const { isAdmin, loading: roleLoading } = useUserRole();

  // Check if gateway selection has changed
  const hasGatewayChanges = settings?.platform_gateway_type !== initialSettings?.platform_gateway_type;

  const handleClearData = async (type: 'all' | 'products' | 'transactions' | 'affiliates' | 'charges') => {
    setDeleting(type);
    try {
      const { data, error } = await supabase.functions.invoke('clear-test-data', {
        body: { type }
      });
      
      if (error) throw error;
      
      toast({
        title: "Sucesso",
        description: data.message || 'Dados removidos com sucesso!'
      });
    } catch (error: any) {
      console.error('Error clearing data:', error);
      toast({
        title: "Erro",
        description: error.message || 'Erro ao limpar dados',
        variant: "destructive"
      });
    } finally {
      setDeleting(null);
    }
  };

  useEffect(() => {
    if (!roleLoading && !isAdmin) {
      toast({
        title: "Acesso negado",
        description: "Você não tem permissão para acessar esta página",
        variant: "destructive"
      });
      navigate("dashboard");
    }
  }, [isAdmin, roleLoading, navigate, toast]);

  useEffect(() => {
    if (isAdmin) {
      fetchSettings();
    }
  }, [isAdmin]);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from("platform_settings")
        .select("*")
        .single();

      if (error) throw error;
      const processedSettings = {
        ...data,
        fee_percentage: data.fee_percentage || 4,
        fee_fixed_per_sale: data.fee_fixed_per_sale || 1,
        invoice_due_days: data.invoice_due_days || 3,
        platform_gateway_fee_percentage: data.platform_gateway_fee_percentage || 5.99,
        platform_gateway_fee_fixed: data.platform_gateway_fee_fixed || 1,
        platform_gateway_withdrawal_fee: data.platform_gateway_withdrawal_fee || 5,
        own_gateway_fee_percentage: data.own_gateway_fee_percentage || 3.99,
        own_gateway_fee_fixed: data.own_gateway_fee_fixed || 1,
        platform_gateway_type: (data.platform_gateway_type as 'bspay' | 'pixup') || 'bspay',
      };
      setSettings(processedSettings);
      setInitialSettings(processedSettings);
    } catch (error) {
      console.error("Error fetching settings:", error);
      toast({
        title: "Erro",
        description: "Falha ao carregar configurações",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!settings) return;

    setSaving(true);
    try {
      console.log("Saving settings:", {
        id: settings.id,
        platform_gateway_type: settings.platform_gateway_type,
      });

      const { data, error, count } = await supabase
        .from("platform_settings")
        .update({
          platform_fee: settings.platform_fee,
          pix_enabled: settings.pix_enabled,
          maintenance_mode: settings.maintenance_mode,
          support_email: settings.support_email,
          support_phone: settings.support_phone,
          terms_url: settings.terms_url,
          privacy_url: settings.privacy_url,
          fee_percentage: settings.fee_percentage,
          fee_fixed_per_sale: settings.fee_fixed_per_sale,
          invoice_due_days: settings.invoice_due_days,
          platform_gateway_fee_percentage: settings.platform_gateway_fee_percentage,
          platform_gateway_fee_fixed: settings.platform_gateway_fee_fixed,
          platform_gateway_withdrawal_fee: settings.platform_gateway_withdrawal_fee,
          own_gateway_fee_percentage: settings.own_gateway_fee_percentage,
          own_gateway_fee_fixed: settings.own_gateway_fee_fixed,
          platform_gateway_type: settings.platform_gateway_type,
        })
        .eq("id", settings.id)
        .select();

      if (error) {
        console.error("Supabase error:", error);
        throw error;
      }

      console.log("Update result:", { data, count });

      if (!data || data.length === 0) {
        throw new Error("Nenhuma configuração foi atualizada. Verifique suas permissões de admin.");
      }

      // Update initial settings to reflect saved state
      setInitialSettings({ ...settings });

      toast({
        title: "Sucesso",
        description: `Configurações salvas! Gateway: ${settings.platform_gateway_type?.toUpperCase()}`
      });
    } catch (error: any) {
      console.error("Error saving settings:", error);
      toast({
        title: "Erro ao salvar",
        description: error.message || "Falha ao salvar configurações. Verifique se você tem permissão de admin.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  // Calculate example fee
  const calculateExampleFee = (saleValue: number) => {
    if (!settings) return 0;
    return (saleValue * settings.fee_percentage / 100) + settings.fee_fixed_per_sale;
  };

  // Save gateway selection only
  const handleSaveGateway = async () => {
    if (!settings) return;

    setSavingGateway(true);
    try {
      const { data, error } = await supabase
        .from("platform_settings")
        .update({
          platform_gateway_type: settings.platform_gateway_type,
        })
        .eq("id", settings.id)
        .select();

      if (error) {
        console.error("Supabase error:", error);
        throw error;
      }

      if (!data || data.length === 0) {
        throw new Error("Nenhuma configuração foi atualizada. Verifique suas permissões de admin.");
      }

      // Update initial settings to reflect saved state
      setInitialSettings({ ...settings });

      toast({
        title: "Gateway salvo!",
        description: `Gateway ${settings.platform_gateway_type?.toUpperCase()} ativado com sucesso.`
      });
    } catch (error: any) {
      console.error("Error saving gateway:", error);
      toast({
        title: "Erro ao salvar",
        description: error.message || "Falha ao salvar gateway.",
        variant: "destructive"
      });
    } finally {
      setSavingGateway(false);
    }
  };

  if (roleLoading || loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!isAdmin || !settings) {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-4xl">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("admin")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Configurações da Plataforma</h1>
            <p className="text-muted-foreground">
              Gerencie as configurações globais
            </p>
          </div>
        </div>

        {/* Seleção de Gateway da Plataforma */}
        <Card className={`glass-card transition-all ${hasGatewayChanges ? 'border-yellow-500 ring-2 ring-yellow-500/30' : 'border-yellow-500/30'}`}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-yellow-500" />
                  Gateway Ativo da Plataforma
                  {hasGatewayChanges && (
                    <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-yellow-500/20 text-yellow-600 rounded-full animate-pulse">
                      Não salvo
                    </span>
                  )}
                </CardTitle>
                <CardDescription>
                  Escolha qual gateway processar os pagamentos da Opção A (Gateway da Plataforma)
                </CardDescription>
              </div>
              <Button 
                onClick={handleSaveGateway} 
                disabled={!hasGatewayChanges || savingGateway}
                size="sm"
                className={hasGatewayChanges ? 'bg-yellow-500 hover:bg-yellow-600 text-black' : ''}
              >
                {savingGateway ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Salvar Gateway
                  </>
                )}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              {/* BSPAY */}
              <div 
                className={`relative cursor-pointer rounded-lg border-2 p-4 transition-all ${
                  settings.platform_gateway_type === 'bspay' 
                    ? 'border-primary bg-primary/5' 
                    : 'border-border hover:border-primary/50'
                }`}
                onClick={() => setSettings({ ...settings, platform_gateway_type: 'bspay' })}
              >
                {settings.platform_gateway_type === 'bspay' && (
                  <CheckCircle className="absolute right-2 top-2 h-5 w-5 text-primary" />
                )}
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-500/10">
                    <span className="font-bold text-blue-500">BS</span>
                  </div>
                  <div>
                    <h3 className="font-semibold">BSPAY</h3>
                    <p className="text-sm text-muted-foreground">Gateway principal</p>
                  </div>
                </div>
              </div>

              {/* PIXUP */}
              <div 
                className={`relative cursor-pointer rounded-lg border-2 p-4 transition-all ${
                  settings.platform_gateway_type === 'pixup' 
                    ? 'border-primary bg-primary/5' 
                    : 'border-border hover:border-primary/50'
                }`}
                onClick={() => setSettings({ ...settings, platform_gateway_type: 'pixup' })}
              >
                {settings.platform_gateway_type === 'pixup' && (
                  <CheckCircle className="absolute right-2 top-2 h-5 w-5 text-primary" />
                )}
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-500/10">
                    <span className="font-bold text-green-500">PX</span>
                  </div>
                  <div>
                    <h3 className="font-semibold">PIXUP</h3>
                    <p className="text-sm text-muted-foreground">Gateway alternativo</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Credentials Management */}
            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setCredentialsDialogOpen(true)}
                className="flex-1"
              >
                <Key className="h-4 w-4 mr-2" />
                Ver Credenciais do {settings.platform_gateway_type === 'pixup' ? 'PIXUP' : 'BSPAY'}
              </Button>
            </div>

            <div className={`p-3 rounded-lg ${hasGatewayChanges ? 'bg-yellow-500/20 border-yellow-500/50' : 'bg-yellow-500/10 border-yellow-500/20'} border`}>
              <p className="text-sm">
                <strong>Gateway selecionado:</strong> {settings.platform_gateway_type === 'pixup' ? 'PIXUP' : 'BSPAY'}
                {hasGatewayChanges ? (
                  <span className="text-yellow-600 dark:text-yellow-400 ml-2 font-medium">
                    ← Clique em "Salvar Gateway" para aplicar
                  </span>
                ) : (
                  <span className="text-green-600 dark:text-green-400 ml-2">
                    ✓ Salvo
                  </span>
                )}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Gateway Credentials Dialog */}
        <GatewayCredentialsDialog
          gateway={settings.platform_gateway_type}
          open={credentialsDialogOpen}
          onOpenChange={setCredentialsDialogOpen}
        />

        {/* Taxas Gateway Plataforma (Opção A) */}
        <Card className="glass-card border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Percent className="h-5 w-5 text-primary" />
              Taxas Opção A - Gateway Plataforma ({settings.platform_gateway_type === 'pixup' ? 'PIXUP' : 'BSPAY'})
            </CardTitle>
            <CardDescription>
              Taxas para vendedores que usam nosso gateway integrado
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label>Taxa Percentual (%)</Label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={settings.platform_gateway_fee_percentage}
                  onChange={(e) => setSettings({ ...settings, platform_gateway_fee_percentage: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label>Valor Fixo por Venda (R$)</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={settings.platform_gateway_fee_fixed}
                  onChange={(e) => setSettings({ ...settings, platform_gateway_fee_fixed: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label>Taxa de Saque (R$)</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={settings.platform_gateway_withdrawal_fee}
                  onChange={(e) => setSettings({ ...settings, platform_gateway_withdrawal_fee: Number(e.target.value) })}
                />
              </div>
            </div>
            <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
              <p className="text-sm">
                <strong>Taxa atual:</strong> {settings.platform_gateway_fee_percentage}% + R$ {settings.platform_gateway_fee_fixed.toFixed(2)} por venda + R$ {settings.platform_gateway_withdrawal_fee.toFixed(2)} por saque
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Taxas Gateway Próprio (Opção B) */}
        <Card className="glass-card border-blue-500/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Percent className="h-5 w-5 text-blue-500" />
              Taxas Opção B - Gateway Próprio (Cobrança Semanal)
            </CardTitle>
            <CardDescription>
              Taxas para vendedores que usam seu próprio gateway/banco
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label>Taxa Percentual (%)</Label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={settings.own_gateway_fee_percentage}
                  onChange={(e) => setSettings({ ...settings, own_gateway_fee_percentage: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label>Valor Fixo por Venda (R$)</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={settings.own_gateway_fee_fixed}
                  onChange={(e) => setSettings({ ...settings, own_gateway_fee_fixed: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label>Dias para Pagamento</Label>
                <Input
                  type="number"
                  min="1"
                  max="30"
                  value={settings.invoice_due_days}
                  onChange={(e) => setSettings({ ...settings, invoice_due_days: Number(e.target.value) })}
                />
              </div>
            </div>
            <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <p className="text-sm">
                <strong>Taxa atual:</strong> {settings.own_gateway_fee_percentage}% + R$ {settings.own_gateway_fee_fixed.toFixed(2)} por venda (cobrança semanal)
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Gateways Management */}
        <GatewayManagement />

        {/* Pagamentos */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Pagamentos</CardTitle>
            <CardDescription>
              Configurações de métodos de pagamento
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>PIX Habilitado</Label>
                <p className="text-sm text-muted-foreground">
                  Permitir pagamentos via PIX
                </p>
              </div>
              <Switch
                checked={settings.pix_enabled}
                onCheckedChange={(checked) => setSettings({ ...settings, pix_enabled: checked })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Manutenção */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Modo Manutenção</CardTitle>
            <CardDescription>
              Ativar modo de manutenção da plataforma
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <Label>Manutenção Ativa</Label>
                <p className="text-sm text-muted-foreground">
                  Quando ativado, apenas admins podem acessar
                </p>
              </div>
              <Switch
                checked={settings.maintenance_mode}
                onCheckedChange={(checked) => setSettings({ ...settings, maintenance_mode: checked })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Suporte */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Informações de Suporte</CardTitle>
            <CardDescription>
              Configure os canais de suporte exibidos para usuários
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="support_email">Email de Suporte</Label>
                <Input
                  id="support_email"
                  type="email"
                  placeholder="suporte@exemplo.com"
                  value={settings.support_email || ""}
                  onChange={(e) => setSettings({ ...settings, support_email: e.target.value || null })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="support_phone">Telefone de Suporte</Label>
                <Input
                  id="support_phone"
                  type="tel"
                  placeholder="(11) 99999-9999"
                  value={settings.support_phone || ""}
                  onChange={(e) => setSettings({ ...settings, support_phone: e.target.value || null })}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Links Legais */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Links Legais</CardTitle>
            <CardDescription>
              URLs para páginas de termos e privacidade
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="terms_url">URL dos Termos de Uso</Label>
                <Input
                  id="terms_url"
                  type="url"
                  placeholder="https://exemplo.com/termos"
                  value={settings.terms_url || ""}
                  onChange={(e) => setSettings({ ...settings, terms_url: e.target.value || null })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="privacy_url">URL da Política de Privacidade</Label>
                <Input
                  id="privacy_url"
                  type="url"
                  placeholder="https://exemplo.com/privacidade"
                  value={settings.privacy_url || ""}
                  onChange={(e) => setSettings({ ...settings, privacy_url: e.target.value || null })}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Separator />

        {/* Danger Zone */}
        <Card className="glass-card border-destructive/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Zona de Perigo
            </CardTitle>
            <CardDescription>
              Ações destrutivas para limpar dados de teste. Use com cuidado!
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              {/* Delete Transactions */}
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" className="w-full justify-start gap-2 border-destructive/50 hover:bg-destructive/10">
                    <CreditCard className="h-4 w-4 text-destructive" />
                    <span>Excluir Transações</span>
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Excluir Todas as Transações</AlertDialogTitle>
                    <AlertDialogDescription>
                      Esta ação irá remover <strong>todas as transações</strong> do sistema.
                      Esta ação não pode ser desfeita.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={() => handleClearData('transactions')}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      disabled={deleting === 'transactions'}
                    >
                      {deleting === 'transactions' ? "Excluindo..." : "Confirmar Exclusão"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              {/* Delete Sales (PIX Charges) */}
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" className="w-full justify-start gap-2 border-destructive/50 hover:bg-destructive/10">
                    <ShoppingCart className="h-4 w-4 text-destructive" />
                    <span>Excluir Vendas</span>
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Excluir Todas as Vendas</AlertDialogTitle>
                    <AlertDialogDescription>
                      Esta ação irá remover <strong>todas as vendas (cobranças PIX)</strong> do sistema.
                      Esta ação não pode ser desfeita.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={() => handleClearData('charges')}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      disabled={deleting === 'charges'}
                    >
                      {deleting === 'charges' ? "Excluindo..." : "Confirmar Exclusão"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              {/* Delete Affiliates */}
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" className="w-full justify-start gap-2 border-destructive/50 hover:bg-destructive/10">
                    <Users className="h-4 w-4 text-destructive" />
                    <span>Excluir Afiliados</span>
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Excluir Todos os Afiliados</AlertDialogTitle>
                    <AlertDialogDescription>
                      Esta ação irá remover <strong>todos os afiliados</strong> do sistema.
                      Esta ação não pode ser desfeita.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={() => handleClearData('affiliates')}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      disabled={deleting === 'affiliates'}
                    >
                      {deleting === 'affiliates' ? "Excluindo..." : "Confirmar Exclusão"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              {/* Delete Products */}
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" className="w-full justify-start gap-2 border-destructive/50 hover:bg-destructive/10">
                    <Package className="h-4 w-4 text-destructive" />
                    <span>Excluir Produtos</span>
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Excluir Todos os Produtos</AlertDialogTitle>
                    <AlertDialogDescription>
                      Esta ação irá remover <strong>todos os produtos</strong> do sistema.
                      Esta ação não pode ser desfeita.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={() => handleClearData('products')}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      disabled={deleting === 'products'}
                    >
                      {deleting === 'products' ? "Excluindo..." : "Confirmar Exclusão"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>

            {/* Delete All */}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="w-full gap-2">
                  <Trash2 className="h-4 w-4" />
                  <span>Excluir TODOS os Dados</span>
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Excluir TODOS os Dados</AlertDialogTitle>
                  <AlertDialogDescription>
                    <span className="text-destructive font-semibold">ATENÇÃO:</span> Esta ação irá remover <strong>TODOS os dados</strong> do sistema (produtos, transações, vendas, afiliados).
                    Esta ação <strong>NÃO PODE SER DESFEITA</strong>.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={() => handleClearData('all')}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    disabled={deleting === 'all'}
                  >
                    {deleting === 'all' ? "Excluindo..." : "Confirmar Exclusão Total"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving} className="gap-2">
            <Save className="h-4 w-4" />
            {saving ? "Salvando..." : "Salvar Configurações"}
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
}
