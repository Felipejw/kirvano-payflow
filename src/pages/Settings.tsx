import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Settings as SettingsIcon,
  Palette,
  User,
  Bell,
  Shield,
  Save,
  Moon,
  Sun,
  Monitor
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const Settings = () => {
  const [profile, setProfile] = useState({
    full_name: "",
    email: "",
    phone: "",
    pix_key: "",
  });
  const [theme, setTheme] = useState("dark");
  const [notifications, setNotifications] = useState({
    email_sales: true,
    email_withdrawals: true,
    email_affiliates: true,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchProfile();
    // Load theme from localStorage
    const savedTheme = localStorage.getItem("theme") || "dark";
    setTheme(savedTheme);
    document.documentElement.classList.toggle("dark", savedTheme === "dark");
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
        pix_key: data.pix_key || "",
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
        pix_key: profile.pix_key,
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
            <TabsTrigger value="theme" className="gap-2">
              <Palette className="h-4 w-4" />
              Tema
            </TabsTrigger>
            <TabsTrigger value="notifications" className="gap-2">
              <Bell className="h-4 w-4" />
              Notificações
            </TabsTrigger>
            <TabsTrigger value="platform" className="gap-2">
              <SettingsIcon className="h-4 w-4" />
              Plataforma
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
                  <div className="space-y-2">
                    <Label>Chave PIX Padrão</Label>
                    <Input
                      value={profile.pix_key}
                      onChange={(e) => setProfile({ ...profile, pix_key: e.target.value })}
                      placeholder="Sua chave PIX para saques"
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
                        <p className="text-sm text-muted-foreground">Tema padrão</p>
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
                        <p className="text-sm text-muted-foreground">Modo claro</p>
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
                        <p className="text-sm text-muted-foreground">Automático</p>
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

          {/* Platform Settings */}
          <TabsContent value="platform">
            <Card variant="glass">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  Configurações da Plataforma
                </CardTitle>
                <CardDescription>Configurações gerais da sua conta</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="p-4 rounded-lg bg-secondary/50 border border-border">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Taxa da Plataforma</p>
                      <p className="text-sm text-muted-foreground">Taxa cobrada por transação</p>
                    </div>
                    <p className="text-2xl font-bold text-primary">7%</p>
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-secondary/50 border border-border">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Prazo de Saque</p>
                      <p className="text-sm text-muted-foreground">Tempo para processamento</p>
                    </div>
                    <p className="text-lg font-semibold text-accent">Imediato</p>
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-secondary/50 border border-border">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Saque Mínimo</p>
                      <p className="text-sm text-muted-foreground">Valor mínimo para solicitar saque</p>
                    </div>
                    <p className="text-lg font-semibold">R$ 10,00</p>
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
                  <p className="font-medium text-yellow-500">Contrato de Uso</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Ao utilizar a plataforma, você concorda com nossos termos de uso e política de privacidade.
                  </p>
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