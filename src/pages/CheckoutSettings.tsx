import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { 
  Palette, 
  Layout, 
  Shield, 
  Timer,
  Image,
  Type,
  Eye,
  Save,
  Smartphone,
  Monitor,
  CreditCard,
  Bell,
  CheckCircle
} from "lucide-react";

interface CheckoutConfig {
  // Aparência
  primaryColor: string;
  backgroundColor: string;
  textColor: string;
  buttonColor: string;
  buttonTextColor: string;
  fontFamily: string;
  borderRadius: string;
  
  // Layout
  layout: "one-column" | "two-column";
  showProductImage: boolean;
  showProductDescription: boolean;
  showOrderSummary: boolean;
  
  // Campos
  requirePhone: boolean;
  requireCpf: boolean;
  requireAddress: boolean;
  
  // Timer e Urgência
  enableTimer: boolean;
  timerMinutes: number;
  showStock: boolean;
  stockCount: number;
  
  // Selos e Garantias
  showSecurityBadge: boolean;
  showGuarantee: boolean;
  guaranteeDays: number;
  guaranteeText: string;
  
  // Logo e Branding
  logoUrl: string;
  faviconUrl: string;
  pageTitle: string;
  
  // Notificações
  enableEmailNotification: boolean;
  enableSmsNotification: boolean;
  
  // Pixels e Tracking
  facebookPixel: string;
  googleAnalytics: string;
  tiktokPixel: string;
}

const defaultConfig: CheckoutConfig = {
  primaryColor: "#00b4d8",
  backgroundColor: "#0a1628",
  textColor: "#ffffff",
  buttonColor: "#00b4d8",
  buttonTextColor: "#0a1628",
  fontFamily: "Inter",
  borderRadius: "12",
  
  layout: "one-column",
  showProductImage: true,
  showProductDescription: true,
  showOrderSummary: true,
  
  requirePhone: true,
  requireCpf: true,
  requireAddress: false,
  
  enableTimer: true,
  timerMinutes: 15,
  showStock: false,
  stockCount: 10,
  
  showSecurityBadge: true,
  showGuarantee: true,
  guaranteeDays: 7,
  guaranteeText: "Garantia incondicional de 7 dias",
  
  logoUrl: "",
  faviconUrl: "",
  pageTitle: "Checkout Seguro",
  
  enableEmailNotification: true,
  enableSmsNotification: false,
  
  facebookPixel: "",
  googleAnalytics: "",
  tiktokPixel: "",
};

const CheckoutSettings = () => {
  const [config, setConfig] = useState<CheckoutConfig>(defaultConfig);
  const [previewMode, setPreviewMode] = useState<"desktop" | "mobile">("desktop");
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const updateConfig = (key: keyof CheckoutConfig, value: any) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    // Simular salvamento (depois implementar no Supabase)
    await new Promise(resolve => setTimeout(resolve, 1000));
    toast({
      title: "Configurações salvas",
      description: "As configurações do checkout foram atualizadas com sucesso.",
    });
    setSaving(false);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold gradient-text">Configurar Checkout</h1>
            <p className="text-muted-foreground">Personalize a experiência de compra dos seus clientes</p>
          </div>
          <Button 
            onClick={handleSave} 
            disabled={saving}
            className="btn-primary-gradient"
          >
            <Save className="h-4 w-4 mr-2" />
            {saving ? "Salvando..." : "Salvar Alterações"}
          </Button>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Configurações */}
          <div className="lg:col-span-2 space-y-6">
            <Tabs defaultValue="appearance" className="space-y-6">
              <TabsList className="grid w-full grid-cols-5 bg-secondary">
                <TabsTrigger value="appearance" className="flex items-center gap-2">
                  <Palette className="h-4 w-4" />
                  <span className="hidden sm:inline">Aparência</span>
                </TabsTrigger>
                <TabsTrigger value="layout" className="flex items-center gap-2">
                  <Layout className="h-4 w-4" />
                  <span className="hidden sm:inline">Layout</span>
                </TabsTrigger>
                <TabsTrigger value="fields" className="flex items-center gap-2">
                  <Type className="h-4 w-4" />
                  <span className="hidden sm:inline">Campos</span>
                </TabsTrigger>
                <TabsTrigger value="urgency" className="flex items-center gap-2">
                  <Timer className="h-4 w-4" />
                  <span className="hidden sm:inline">Urgência</span>
                </TabsTrigger>
                <TabsTrigger value="tracking" className="flex items-center gap-2">
                  <Bell className="h-4 w-4" />
                  <span className="hidden sm:inline">Tracking</span>
                </TabsTrigger>
              </TabsList>

              {/* Aparência */}
              <TabsContent value="appearance" className="space-y-4">
                <Card className="glass-card">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Palette className="h-5 w-5 text-primary" />
                      Cores e Estilo
                    </CardTitle>
                    <CardDescription>Configure as cores do seu checkout</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Cor Principal</Label>
                        <div className="flex gap-2">
                          <Input
                            type="color"
                            value={config.primaryColor}
                            onChange={(e) => updateConfig("primaryColor", e.target.value)}
                            className="w-12 h-10 p-1 cursor-pointer"
                          />
                          <Input
                            value={config.primaryColor}
                            onChange={(e) => updateConfig("primaryColor", e.target.value)}
                            className="input-dark flex-1"
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Cor de Fundo</Label>
                        <div className="flex gap-2">
                          <Input
                            type="color"
                            value={config.backgroundColor}
                            onChange={(e) => updateConfig("backgroundColor", e.target.value)}
                            className="w-12 h-10 p-1 cursor-pointer"
                          />
                          <Input
                            value={config.backgroundColor}
                            onChange={(e) => updateConfig("backgroundColor", e.target.value)}
                            className="input-dark flex-1"
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Cor do Botão</Label>
                        <div className="flex gap-2">
                          <Input
                            type="color"
                            value={config.buttonColor}
                            onChange={(e) => updateConfig("buttonColor", e.target.value)}
                            className="w-12 h-10 p-1 cursor-pointer"
                          />
                          <Input
                            value={config.buttonColor}
                            onChange={(e) => updateConfig("buttonColor", e.target.value)}
                            className="input-dark flex-1"
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Cor do Texto do Botão</Label>
                        <div className="flex gap-2">
                          <Input
                            type="color"
                            value={config.buttonTextColor}
                            onChange={(e) => updateConfig("buttonTextColor", e.target.value)}
                            className="w-12 h-10 p-1 cursor-pointer"
                          />
                          <Input
                            value={config.buttonTextColor}
                            onChange={(e) => updateConfig("buttonTextColor", e.target.value)}
                            className="input-dark flex-1"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Fonte</Label>
                        <Select value={config.fontFamily} onValueChange={(v) => updateConfig("fontFamily", v)}>
                          <SelectTrigger className="input-dark">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Inter">Inter</SelectItem>
                            <SelectItem value="Roboto">Roboto</SelectItem>
                            <SelectItem value="Poppins">Poppins</SelectItem>
                            <SelectItem value="Open Sans">Open Sans</SelectItem>
                            <SelectItem value="Montserrat">Montserrat</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Arredondamento dos Cantos</Label>
                        <Select value={config.borderRadius} onValueChange={(v) => updateConfig("borderRadius", v)}>
                          <SelectTrigger className="input-dark">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="0">Sem arredondamento</SelectItem>
                            <SelectItem value="4">Pequeno (4px)</SelectItem>
                            <SelectItem value="8">Médio (8px)</SelectItem>
                            <SelectItem value="12">Grande (12px)</SelectItem>
                            <SelectItem value="16">Extra grande (16px)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="glass-card">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Image className="h-5 w-5 text-primary" />
                      Logo e Branding
                    </CardTitle>
                    <CardDescription>Configure sua marca no checkout</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>URL da Logo</Label>
                      <Input
                        value={config.logoUrl}
                        onChange={(e) => updateConfig("logoUrl", e.target.value)}
                        placeholder="https://seusite.com/logo.png"
                        className="input-dark"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Título da Página</Label>
                      <Input
                        value={config.pageTitle}
                        onChange={(e) => updateConfig("pageTitle", e.target.value)}
                        placeholder="Checkout Seguro"
                        className="input-dark"
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Layout */}
              <TabsContent value="layout" className="space-y-4">
                <Card className="glass-card">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Layout className="h-5 w-5 text-primary" />
                      Estrutura do Checkout
                    </CardTitle>
                    <CardDescription>Configure o layout e elementos visíveis</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Tipo de Layout</Label>
                      <Select value={config.layout} onValueChange={(v: "one-column" | "two-column") => updateConfig("layout", v)}>
                        <SelectTrigger className="input-dark">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="one-column">Uma Coluna</SelectItem>
                          <SelectItem value="two-column">Duas Colunas</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Mostrar Imagem do Produto</Label>
                          <p className="text-sm text-muted-foreground">Exibe a capa do produto</p>
                        </div>
                        <Switch
                          checked={config.showProductImage}
                          onCheckedChange={(v) => updateConfig("showProductImage", v)}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Mostrar Descrição do Produto</Label>
                          <p className="text-sm text-muted-foreground">Exibe a descrição completa</p>
                        </div>
                        <Switch
                          checked={config.showProductDescription}
                          onCheckedChange={(v) => updateConfig("showProductDescription", v)}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Mostrar Resumo do Pedido</Label>
                          <p className="text-sm text-muted-foreground">Exibe o resumo com valores</p>
                        </div>
                        <Switch
                          checked={config.showOrderSummary}
                          onCheckedChange={(v) => updateConfig("showOrderSummary", v)}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Campos */}
              <TabsContent value="fields" className="space-y-4">
                <Card className="glass-card">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Type className="h-5 w-5 text-primary" />
                      Campos do Formulário
                    </CardTitle>
                    <CardDescription>Configure quais campos são obrigatórios</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Email</Label>
                        <p className="text-sm text-muted-foreground">Sempre obrigatório</p>
                      </div>
                      <Switch checked disabled />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Nome Completo</Label>
                        <p className="text-sm text-muted-foreground">Sempre obrigatório</p>
                      </div>
                      <Switch checked disabled />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Telefone</Label>
                        <p className="text-sm text-muted-foreground">Número com DDD</p>
                      </div>
                      <Switch
                        checked={config.requirePhone}
                        onCheckedChange={(v) => updateConfig("requirePhone", v)}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>CPF</Label>
                        <p className="text-sm text-muted-foreground">Documento do comprador</p>
                      </div>
                      <Switch
                        checked={config.requireCpf}
                        onCheckedChange={(v) => updateConfig("requireCpf", v)}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Endereço</Label>
                        <p className="text-sm text-muted-foreground">Endereço completo</p>
                      </div>
                      <Switch
                        checked={config.requireAddress}
                        onCheckedChange={(v) => updateConfig("requireAddress", v)}
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Urgência */}
              <TabsContent value="urgency" className="space-y-4">
                <Card className="glass-card">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Timer className="h-5 w-5 text-primary" />
                      Gatilhos de Urgência
                    </CardTitle>
                    <CardDescription>Configure elementos que geram urgência</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Timer de Expiração</Label>
                        <p className="text-sm text-muted-foreground">Contagem regressiva no checkout</p>
                      </div>
                      <Switch
                        checked={config.enableTimer}
                        onCheckedChange={(v) => updateConfig("enableTimer", v)}
                      />
                    </div>
                    
                    {config.enableTimer && (
                      <div className="space-y-2">
                        <Label>Tempo em minutos</Label>
                        <Input
                          type="number"
                          value={config.timerMinutes}
                          onChange={(e) => updateConfig("timerMinutes", parseInt(e.target.value) || 15)}
                          className="input-dark"
                        />
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Mostrar Estoque</Label>
                        <p className="text-sm text-muted-foreground">Exibe quantidade limitada</p>
                      </div>
                      <Switch
                        checked={config.showStock}
                        onCheckedChange={(v) => updateConfig("showStock", v)}
                      />
                    </div>
                    
                    {config.showStock && (
                      <div className="space-y-2">
                        <Label>Quantidade em Estoque</Label>
                        <Input
                          type="number"
                          value={config.stockCount}
                          onChange={(e) => updateConfig("stockCount", parseInt(e.target.value) || 10)}
                          className="input-dark"
                        />
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card className="glass-card">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="h-5 w-5 text-primary" />
                      Selos e Garantias
                    </CardTitle>
                    <CardDescription>Configure elementos de confiança</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Selo de Compra Segura</Label>
                        <p className="text-sm text-muted-foreground">Ícones de segurança</p>
                      </div>
                      <Switch
                        checked={config.showSecurityBadge}
                        onCheckedChange={(v) => updateConfig("showSecurityBadge", v)}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Selo de Garantia</Label>
                        <p className="text-sm text-muted-foreground">Exibe garantia de satisfação</p>
                      </div>
                      <Switch
                        checked={config.showGuarantee}
                        onCheckedChange={(v) => updateConfig("showGuarantee", v)}
                      />
                    </div>
                    
                    {config.showGuarantee && (
                      <>
                        <div className="space-y-2">
                          <Label>Dias de Garantia</Label>
                          <Input
                            type="number"
                            value={config.guaranteeDays}
                            onChange={(e) => updateConfig("guaranteeDays", parseInt(e.target.value) || 7)}
                            className="input-dark"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label>Texto da Garantia</Label>
                          <Textarea
                            value={config.guaranteeText}
                            onChange={(e) => updateConfig("guaranteeText", e.target.value)}
                            className="input-dark"
                          />
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Tracking */}
              <TabsContent value="tracking" className="space-y-4">
                <Card className="glass-card">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Bell className="h-5 w-5 text-primary" />
                      Notificações
                    </CardTitle>
                    <CardDescription>Configure notificações de compra</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Notificação por Email</Label>
                        <p className="text-sm text-muted-foreground">Envia email após compra</p>
                      </div>
                      <Switch
                        checked={config.enableEmailNotification}
                        onCheckedChange={(v) => updateConfig("enableEmailNotification", v)}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Notificação por SMS</Label>
                        <p className="text-sm text-muted-foreground">Envia SMS após compra</p>
                      </div>
                      <Switch
                        checked={config.enableSmsNotification}
                        onCheckedChange={(v) => updateConfig("enableSmsNotification", v)}
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card className="glass-card">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Eye className="h-5 w-5 text-primary" />
                      Pixels de Rastreamento
                    </CardTitle>
                    <CardDescription>Configure os pixels de conversão</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Facebook Pixel ID</Label>
                      <Input
                        value={config.facebookPixel}
                        onChange={(e) => updateConfig("facebookPixel", e.target.value)}
                        placeholder="123456789012345"
                        className="input-dark"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Google Analytics ID</Label>
                      <Input
                        value={config.googleAnalytics}
                        onChange={(e) => updateConfig("googleAnalytics", e.target.value)}
                        placeholder="G-XXXXXXXXXX"
                        className="input-dark"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label>TikTok Pixel ID</Label>
                      <Input
                        value={config.tiktokPixel}
                        onChange={(e) => updateConfig("tiktokPixel", e.target.value)}
                        placeholder="XXXXXXXXXXXXXXXXX"
                        className="input-dark"
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Preview */}
          <div className="space-y-4">
            <Card className="glass-card sticky top-24">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Eye className="h-5 w-5 text-primary" />
                    Preview
                  </CardTitle>
                  <div className="flex gap-1">
                    <Button
                      variant={previewMode === "desktop" ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setPreviewMode("desktop")}
                    >
                      <Monitor className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={previewMode === "mobile" ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setPreviewMode("mobile")}
                    >
                      <Smartphone className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div 
                  className={`mx-auto transition-all duration-300 ${previewMode === "mobile" ? "max-w-[280px]" : "w-full"}`}
                  style={{
                    backgroundColor: config.backgroundColor,
                    borderRadius: `${config.borderRadius}px`,
                    fontFamily: config.fontFamily,
                  }}
                >
                  <div className="p-4 space-y-4">
                    {/* Logo */}
                    {config.logoUrl ? (
                      <img src={config.logoUrl} alt="Logo" className="h-8 mx-auto" />
                    ) : (
                      <div className="h-8 w-24 bg-secondary/50 rounded mx-auto flex items-center justify-center">
                        <span className="text-xs text-muted-foreground">Logo</span>
                      </div>
                    )}
                    
                    {/* Product */}
                    {config.showProductImage && (
                      <div className="h-32 bg-secondary/30 rounded-lg flex items-center justify-center">
                        <Image className="h-8 w-8 text-muted-foreground" />
                      </div>
                    )}
                    
                    <div style={{ color: config.textColor }}>
                      <h3 className="font-semibold">Produto de Exemplo</h3>
                      {config.showProductDescription && (
                        <p className="text-sm opacity-70">Descrição do produto aparece aqui</p>
                      )}
                    </div>
                    
                    {/* Timer */}
                    {config.enableTimer && (
                      <div 
                        className="text-center py-2 rounded-lg text-sm font-medium"
                        style={{ backgroundColor: `${config.primaryColor}20`, color: config.primaryColor }}
                      >
                        ⏰ Oferta expira em {config.timerMinutes}:00
                      </div>
                    )}
                    
                    {/* Stock */}
                    {config.showStock && (
                      <div className="text-center text-sm text-yellow-500">
                        🔥 Apenas {config.stockCount} unidades restantes!
                      </div>
                    )}
                    
                    {/* Form Fields Preview */}
                    <div className="space-y-2">
                      <div className="h-10 bg-secondary/30 rounded-lg" />
                      <div className="h-10 bg-secondary/30 rounded-lg" />
                      {config.requirePhone && <div className="h-10 bg-secondary/30 rounded-lg" />}
                      {config.requireCpf && <div className="h-10 bg-secondary/30 rounded-lg" />}
                    </div>
                    
                    {/* Order Summary */}
                    {config.showOrderSummary && (
                      <div className="border-t border-border/20 pt-3 space-y-1">
                        <div className="flex justify-between text-sm" style={{ color: config.textColor }}>
                          <span>Subtotal</span>
                          <span>R$ 97,00</span>
                        </div>
                        <div className="flex justify-between font-semibold" style={{ color: config.textColor }}>
                          <span>Total</span>
                          <span>R$ 97,00</span>
                        </div>
                      </div>
                    )}
                    
                    {/* Button */}
                    <button
                      className="w-full py-3 font-semibold transition-transform hover:scale-[1.02] flex items-center justify-center gap-2"
                      style={{ 
                        backgroundColor: config.buttonColor, 
                        color: config.buttonTextColor,
                        borderRadius: `${config.borderRadius}px`
                      }}
                    >
                      <CreditCard className="h-4 w-4" />
                      COMPRAR AGORA
                    </button>
                    
                    {/* Security Badge */}
                    {config.showSecurityBadge && (
                      <div className="flex items-center justify-center gap-2 text-xs" style={{ color: config.textColor, opacity: 0.6 }}>
                        <Shield className="h-4 w-4" />
                        Compra 100% Segura
                      </div>
                    )}
                    
                    {/* Guarantee */}
                    {config.showGuarantee && (
                      <div className="flex items-center justify-center gap-2 text-xs text-accent">
                        <CheckCircle className="h-4 w-4" />
                        {config.guaranteeDays} dias de garantia
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default CheckoutSettings;
