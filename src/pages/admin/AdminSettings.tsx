import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Save, ArrowLeft, Trash2, AlertTriangle, Package, CreditCard, Users, ShoppingCart, Percent, DollarSign } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAppNavigate } from "@/lib/routes";
import { useUserRole } from "@/hooks/useUserRole";
import { GatewayManagement } from "@/components/admin/GatewayManagement";
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
}

export default function AdminSettings() {
  const [settings, setSettings] = useState<PlatformSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const { toast } = useToast();
  const navigate = useAppNavigate();
  const { isAdmin, loading: roleLoading } = useUserRole();

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
      setSettings({
        ...data,
        fee_percentage: data.fee_percentage || 4,
        fee_fixed_per_sale: data.fee_fixed_per_sale || 1,
        invoice_due_days: data.invoice_due_days || 3,
      });
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
      const { error } = await supabase
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
        })
        .eq("id", settings.id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Configurações salvas com sucesso"
      });
    } catch (error) {
      console.error("Error saving settings:", error);
      toast({
        title: "Erro",
        description: "Falha ao salvar configurações",
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

        {/* Taxas da Plataforma - NEW SECTION */}
        <Card className="glass-card border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Percent className="h-5 w-5 text-primary" />
              Taxas da Plataforma (Cobrança Semanal)
            </CardTitle>
            <CardDescription>
              Configure as taxas cobradas por venda. A cobrança é feita semanalmente toda segunda-feira via PIX.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="fee_percentage">Taxa Percentual (%)</Label>
                <Input
                  id="fee_percentage"
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={settings.fee_percentage}
                  onChange={(e) => setSettings({ ...settings, fee_percentage: Number(e.target.value) })}
                />
                <p className="text-xs text-muted-foreground">
                  Porcentagem sobre cada venda
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="fee_fixed_per_sale">Valor Fixo por Venda (R$)</Label>
                <Input
                  id="fee_fixed_per_sale"
                  type="number"
                  min="0"
                  step="0.01"
                  value={settings.fee_fixed_per_sale}
                  onChange={(e) => setSettings({ ...settings, fee_fixed_per_sale: Number(e.target.value) })}
                />
                <p className="text-xs text-muted-foreground">
                  Adicional fixo por venda
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="invoice_due_days">Dias para Pagamento</Label>
                <Input
                  id="invoice_due_days"
                  type="number"
                  min="1"
                  max="30"
                  value={settings.invoice_due_days}
                  onChange={(e) => setSettings({ ...settings, invoice_due_days: Number(e.target.value) })}
                />
                <p className="text-xs text-muted-foreground">
                  Dias após segunda-feira
                </p>
              </div>
            </div>

            <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
              <div className="flex items-center gap-3">
                <DollarSign className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium text-primary">
                    Taxa atual: {settings.fee_percentage}% + R$ {settings.fee_fixed_per_sale.toFixed(2)} por venda
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Exemplo: Venda de R$ 100,00 = Taxa de R$ {calculateExampleFee(100).toFixed(2)}
                  </p>
                </div>
              </div>
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
