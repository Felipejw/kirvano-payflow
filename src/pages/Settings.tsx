import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Palette,
  User,
  Bell,
  Save,
  Moon,
  Sun,
  Monitor,
  CreditCard,
  AlertTriangle,
  Building2,
  Check
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { usePaymentMode, updatePaymentMode, PaymentMode } from "@/hooks/usePaymentMode";
import { cn } from "@/lib/utils";

const Settings = () => {
  const [profile, setProfile] = useState({
    full_name: "",
    email: "",
    phone: "",
  });
  const [theme, setTheme] = useState("system");
  const [notifications, setNotifications] = useState({
    email_sales: true,
    email_withdrawals: true,
    email_affiliates: true,
  });
  const [loading, setLoading] = useState(false);
  const [changingMode, setChangingMode] = useState(false);
  
  const { paymentMode, hasPendingBalance, pendingAmount, fees, loading: modeLoading, refetch } = usePaymentMode();

  useEffect(() => {
    fetchProfile();
    const savedTheme = localStorage.getItem("theme") || "system";
    setTheme(savedTheme);
  }, []);

  const fetchProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (data) {
      setProfile({
        full_name: data.full_name || "",
        email: data.email || user.email || "",
        phone: data.phone || "",
      });
    }
  };

  const handleSaveProfile = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Usuário não encontrado");
      setLoading(false);
      return;
    }

    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: profile.full_name,
        phone: profile.phone,
      })
      .eq('user_id', user.id);

    if (error) {
      toast.error("Erro ao salvar perfil");
    } else {
      toast.success("Perfil atualizado com sucesso!");
    }
    setLoading(false);
  };

  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    
    if (newTheme === "system") {
      const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      document.documentElement.classList.toggle("dark", systemDark);
    } else {
      document.documentElement.classList.toggle("dark", newTheme === "dark");
    }
    toast.success(`Tema alterado para ${newTheme === "dark" ? "escuro" : newTheme === "light" ? "claro" : "sistema"}`);
  };

  const handlePaymentModeChange = async (newMode: PaymentMode) => {
    if (hasPendingBalance) {
      toast.error("Você possui valores pendentes. Pague suas faturas antes de trocar o modo de pagamento.");
      return;
    }

    setChangingMode(true);
    const result = await updatePaymentMode(newMode);
    
    if (result.success) {
      toast.success("Modo de pagamento atualizado!");
      refetch();
    } else {
      toast.error(result.error || "Erro ao atualizar modo de pagamento");
    }
    setChangingMode(false);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL"
    }).format(value);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-bold">Configurações</h1>
          <p className="text-muted-foreground">Gerencie suas preferências e configurações da plataforma</p>
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="bg-secondary/50">
            <TabsTrigger value="profile" className="gap-2">
              <User className="h-4 w-4" />
              Perfil
            </TabsTrigger>
            <TabsTrigger value="payment-mode" className="gap-2">
              <CreditCard className="h-4 w-4" />
              Modo de Venda
            </TabsTrigger>
            <TabsTrigger value="theme" className="gap-2">
              <Palette className="h-4 w-4" />
              Tema
            </TabsTrigger>
            <TabsTrigger value="notifications" className="gap-2">
              <Bell className="h-4 w-4" />
              Notificações
            </TabsTrigger>
          </TabsList>

          {/* Profile Settings */}
          <TabsContent value="profile">
            <Card variant="glass">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5 text-primary" />
                  Informações do Perfil
                </CardTitle>
                <CardDescription>Atualize suas informações pessoais e de contato</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Nome Completo</Label>
                    <Input
                      value={profile.full_name}
                      onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                      placeholder="Seu nome completo"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>E-mail</Label>
                    <Input
                      value={profile.email}
                      disabled
                      className="opacity-50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Telefone</Label>
                    <Input
                      value={profile.phone}
                      onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                      placeholder="(11) 99999-9999"
                    />
                  </div>
                </div>
                <Button 
                  variant="gradient" 
                  className="gap-2"
                  onClick={handleSaveProfile}
                  disabled={loading}
                >
                  <Save className="h-4 w-4" />
                  {loading ? "Salvando..." : "Salvar Alterações"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Payment Mode Settings */}
          <TabsContent value="payment-mode">
            <div className="space-y-4">
              {hasPendingBalance && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Você possui <strong>{formatCurrency(pendingAmount)}</strong> em valores pendentes.
                    Pague suas faturas/saques antes de alterar o modo de pagamento.
                  </AlertDescription>
                </Alert>
              )}

              <Card variant="glass">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-primary" />
                    Modo de Pagamento
                  </CardTitle>
                  <CardDescription>
                    Escolha como deseja receber seus pagamentos. 
                    {hasPendingBalance && " (Bloqueado até pagar valores pendentes)"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {modeLoading ? (
                    <div className="flex items-center justify-center h-32">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                  ) : (
                    <div className="grid gap-4 md:grid-cols-2">
                      {/* Platform Gateway Option */}
                      <div
                        onClick={() => !hasPendingBalance && !changingMode && handlePaymentModeChange("platform_gateway")}
                        className={cn(
                          "relative cursor-pointer rounded-xl border-2 p-6 transition-all",
                          paymentMode === "platform_gateway"
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/50",
                          (hasPendingBalance || changingMode) && "opacity-50 cursor-not-allowed"
                        )}
                      >
                        {paymentMode === "platform_gateway" && (
                          <div className="absolute top-3 right-3">
                            <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center">
                              <Check className="h-4 w-4 text-primary-foreground" />
                            </div>
                          </div>
                        )}
                        <div className="flex items-start gap-3">
                          <div className={cn(
                            "p-2 rounded-lg",
                            paymentMode === "platform_gateway" ? "bg-primary text-primary-foreground" : "bg-secondary"
                          )}>
                            <Building2 className="h-5 w-5" />
                          </div>
                          <div>
                            <h3 className="font-semibold">Gateway Gateflow (BSPAY)</h3>
                            <p className="text-sm text-muted-foreground mt-1">
                              Use nosso sistema de pagamento integrado
                            </p>
                          </div>
                        </div>
                        <div className="mt-4 space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Taxa por venda:</span>
                            <Badge>{fees.platformGatewayFeePercentage}% + R$ {fees.platformGatewayFeeFixed.toFixed(2)}</Badge>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Taxa de saque:</span>
                            <Badge variant="outline">R$ {fees.platformGatewayWithdrawalFee.toFixed(2)}</Badge>
                          </div>
                        </div>
                      </div>

                      {/* Own Gateway Option */}
                      <div
                        onClick={() => !hasPendingBalance && !changingMode && handlePaymentModeChange("own_gateway")}
                        className={cn(
                          "relative cursor-pointer rounded-xl border-2 p-6 transition-all",
                          paymentMode === "own_gateway"
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/50",
                          (hasPendingBalance || changingMode) && "opacity-50 cursor-not-allowed"
                        )}
                      >
                        {paymentMode === "own_gateway" && (
                          <div className="absolute top-3 right-3">
                            <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center">
                              <Check className="h-4 w-4 text-primary-foreground" />
                            </div>
                          </div>
                        )}
                        <div className="flex items-start gap-3">
                          <div className={cn(
                            "p-2 rounded-lg",
                            paymentMode === "own_gateway" ? "bg-primary text-primary-foreground" : "bg-secondary"
                          )}>
                            <CreditCard className="h-5 w-5" />
                          </div>
                          <div>
                            <h3 className="font-semibold">Seu Gateway/Banco</h3>
                            <p className="text-sm text-muted-foreground mt-1">
                              Configure seu próprio processador de pagamentos
                            </p>
                          </div>
                        </div>
                        <div className="mt-4 space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Taxa por venda:</span>
                            <Badge>{fees.ownGatewayFeePercentage}% + R$ {fees.ownGatewayFeeFixed.toFixed(2)}</Badge>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Pagamento:</span>
                            <Badge variant="outline">Semanal (Segunda)</Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Theme Settings */}
          <TabsContent value="theme">
            <Card variant="glass">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="h-5 w-5 text-primary" />
                  Tema da Plataforma
                </CardTitle>
                <CardDescription>Escolha o tema de cores da interface</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <button
                    onClick={() => handleThemeChange("dark")}
                    className={`p-6 rounded-xl border-2 transition-all ${
                      theme === "dark" 
                        ? "border-primary bg-primary/10" 
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <div className="flex flex-col items-center gap-3">
                      <div className="p-4 rounded-full bg-secondary">
                        <Moon className="h-8 w-8" />
                      </div>
                      <div className="text-center">
                        <p className="font-semibold">Escuro</p>
                        <p className="text-sm text-muted-foreground">Ideal para ambientes escuros</p>
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => handleThemeChange("light")}
                    className={`p-6 rounded-xl border-2 transition-all ${
                      theme === "light" 
                        ? "border-primary bg-primary/10" 
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <div className="flex flex-col items-center gap-3">
                      <div className="p-4 rounded-full bg-secondary">
                        <Sun className="h-8 w-8" />
                      </div>
                      <div className="text-center">
                        <p className="font-semibold">Claro</p>
                        <p className="text-sm text-muted-foreground">Ideal para ambientes claros</p>
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => handleThemeChange("system")}
                    className={`p-6 rounded-xl border-2 transition-all ${
                      theme === "system" 
                        ? "border-primary bg-primary/10" 
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <div className="flex flex-col items-center gap-3">
                      <div className="p-4 rounded-full bg-secondary">
                        <Monitor className="h-8 w-8" />
                      </div>
                      <div className="text-center">
                        <p className="font-semibold">Sistema</p>
                        <p className="text-sm text-muted-foreground">Segue configuração do dispositivo</p>
                      </div>
                    </div>
                  </button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications Settings */}
          <TabsContent value="notifications">
            <Card variant="glass">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5 text-primary" />
                  Preferências de Notificação
                </CardTitle>
                <CardDescription>Configure como você deseja receber notificações</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/50">
                  <div>
                    <p className="font-medium">Notificações de Vendas</p>
                    <p className="text-sm text-muted-foreground">Receba um email quando realizar uma venda</p>
                  </div>
                  <Switch
                    checked={notifications.email_sales}
                    onCheckedChange={(checked) => setNotifications({ ...notifications, email_sales: checked })}
                  />
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/50">
                  <div>
                    <p className="font-medium">Notificações de Saques</p>
                    <p className="text-sm text-muted-foreground">Receba um email quando um saque for processado</p>
                  </div>
                  <Switch
                    checked={notifications.email_withdrawals}
                    onCheckedChange={(checked) => setNotifications({ ...notifications, email_withdrawals: checked })}
                  />
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/50">
                  <div>
                    <p className="font-medium">Notificações de Afiliados</p>
                    <p className="text-sm text-muted-foreground">Receba um email quando um afiliado se cadastrar</p>
                  </div>
                  <Switch
                    checked={notifications.email_affiliates}
                    onCheckedChange={(checked) => setNotifications({ ...notifications, email_affiliates: checked })}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default Settings;
