import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  Palette, 
  Layout, 
  Type, 
  Timer, 
  Globe, 
  Upload, 
  Loader2,
  Shield,
  Bell,
  Eye,
  CheckCircle,
  AlertCircle,
  Copy
} from "lucide-react";

interface CheckoutTemplate {
  id?: string;
  name: string;
  description: string | null;
  primary_color: string;
  background_color: string;
  text_color: string;
  button_color: string;
  button_text_color: string;
  border_radius: string;
  font_family: string;
  logo_url: string | null;
  favicon_url: string | null;
  page_title: string;
  layout: string;
  show_product_image: boolean;
  show_product_description: boolean;
  show_order_summary: boolean;
  require_cpf: boolean;
  require_phone: boolean;
  require_address: boolean;
  enable_timer: boolean;
  timer_minutes: number;
  timer_text: string;
  show_stock: boolean;
  stock_count: number;
  stock_text: string;
  show_security_badge: boolean;
  show_guarantee: boolean;
  guarantee_days: number;
  guarantee_text: string;
  enable_email_notification: boolean;
  enable_sms_notification: boolean;
  facebook_pixel: string | null;
  tiktok_pixel: string | null;
  google_analytics: string | null;
  custom_domain: string | null;
  custom_slug: string | null;
  domain_verified: boolean;
}

interface CheckoutTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template?: Partial<CheckoutTemplate> | null;
  onSuccess: () => void;
}

const defaultTemplate: Omit<CheckoutTemplate, 'id'> = {
  name: "",
  description: null,
  primary_color: "#00b4d8",
  background_color: "#0a1628",
  text_color: "#ffffff",
  button_color: "#00b4d8",
  button_text_color: "#0a1628",
  border_radius: "12",
  font_family: "Inter",
  logo_url: null,
  favicon_url: null,
  page_title: "Checkout Seguro",
  layout: "one-column",
  show_product_image: true,
  show_product_description: true,
  show_order_summary: true,
  require_cpf: true,
  require_phone: true,
  require_address: false,
  enable_timer: true,
  timer_minutes: 15,
  timer_text: "Oferta expira em",
  show_stock: false,
  stock_count: 10,
  stock_text: "Apenas {count} unidades restantes!",
  show_security_badge: true,
  show_guarantee: true,
  guarantee_days: 7,
  guarantee_text: "Garantia incondicional de 7 dias",
  enable_email_notification: true,
  enable_sms_notification: false,
  facebook_pixel: null,
  tiktok_pixel: null,
  google_analytics: null,
  custom_domain: null,
  custom_slug: null,
  domain_verified: false,
};

export function CheckoutTemplateDialog({ open, onOpenChange, template, onSuccess }: CheckoutTemplateDialogProps) {
  const [formData, setFormData] = useState<CheckoutTemplate>({ ...defaultTemplate } as CheckoutTemplate);
  const [loading, setLoading] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (template) {
      setFormData({ ...defaultTemplate, ...template } as CheckoutTemplate);
    } else {
      setFormData({ ...defaultTemplate } as CheckoutTemplate);
    }
  }, [template, open]);

  const updateField = <K extends keyof CheckoutTemplate>(key: K, value: CheckoutTemplate[K]) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    setUploadingLogo(true);

    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/templates/${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('checkout-assets')
      .upload(fileName, file);

    if (uploadError) {
      toast.error("Erro ao fazer upload da logo");
      setUploadingLogo(false);
      return;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('checkout-assets')
      .getPublicUrl(fileName);

    updateField("logo_url", publicUrl);
    toast.success("Logo enviada com sucesso!");
    setUploadingLogo(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name) {
      toast.error("Nome do template é obrigatório");
      return;
    }

    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Usuário não autenticado");
      setLoading(false);
      return;
    }

    const templateData = {
      user_id: user.id,
      name: formData.name,
      description: formData.description,
      primary_color: formData.primary_color,
      background_color: formData.background_color,
      text_color: formData.text_color,
      button_color: formData.button_color,
      button_text_color: formData.button_text_color,
      border_radius: formData.border_radius,
      font_family: formData.font_family,
      logo_url: formData.logo_url,
      favicon_url: formData.favicon_url,
      page_title: formData.page_title,
      layout: formData.layout,
      show_product_image: formData.show_product_image,
      show_product_description: formData.show_product_description,
      show_order_summary: formData.show_order_summary,
      require_cpf: formData.require_cpf,
      require_phone: formData.require_phone,
      require_address: formData.require_address,
      enable_timer: formData.enable_timer,
      timer_minutes: formData.timer_minutes,
      timer_text: formData.timer_text,
      show_stock: formData.show_stock,
      stock_count: formData.stock_count,
      stock_text: formData.stock_text,
      show_security_badge: formData.show_security_badge,
      show_guarantee: formData.show_guarantee,
      guarantee_days: formData.guarantee_days,
      guarantee_text: formData.guarantee_text,
      enable_email_notification: formData.enable_email_notification,
      enable_sms_notification: formData.enable_sms_notification,
      facebook_pixel: formData.facebook_pixel,
      tiktok_pixel: formData.tiktok_pixel,
      google_analytics: formData.google_analytics,
      custom_domain: formData.custom_domain,
      custom_slug: formData.custom_slug,
    };

    let error;

    if (template?.id) {
      const result = await supabase
        .from('checkout_templates')
        .update(templateData)
        .eq('id', template.id);
      error = result.error;
    } else {
      const result = await supabase
        .from('checkout_templates')
        .insert(templateData);
      error = result.error;
    }

    if (error) {
      toast.error("Erro ao salvar template");
      console.error(error);
    } else {
      toast.success(template?.id ? "Template atualizado!" : "Template criado!");
      onSuccess();
      onOpenChange(false);
    }

    setLoading(false);
  };

  const copyDnsInstructions = () => {
    const instructions = `
Configuração DNS para: ${formData.custom_domain}

Adicione os seguintes registros DNS:

Tipo: A
Nome: @ (ou subdomínio)
Valor: 185.158.133.1

Tipo: TXT
Nome: _lovable
Valor: lovable_verify=${formData.id || 'seu-template-id'}
    `.trim();
    
    navigator.clipboard.writeText(instructions);
    toast.success("Instruções copiadas!");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>
            {template?.id ? "Editar Template" : "Novo Template de Checkout"}
          </DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="max-h-[75vh] pr-4">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome do Template *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => updateField("name", e.target.value)}
                  placeholder="Ex: Checkout Premium"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Input
                  id="description"
                  value={formData.description || ""}
                  onChange={(e) => updateField("description", e.target.value)}
                  placeholder="Descrição breve do template"
                />
              </div>
            </div>

            <Tabs defaultValue="appearance" className="space-y-4">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="appearance" className="text-xs sm:text-sm">
                  <Palette className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Aparência</span>
                </TabsTrigger>
                <TabsTrigger value="layout" className="text-xs sm:text-sm">
                  <Layout className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Layout</span>
                </TabsTrigger>
                <TabsTrigger value="fields" className="text-xs sm:text-sm">
                  <Type className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Campos</span>
                </TabsTrigger>
                <TabsTrigger value="urgency" className="text-xs sm:text-sm">
                  <Timer className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Urgência</span>
                </TabsTrigger>
                <TabsTrigger value="domain" className="text-xs sm:text-sm">
                  <Globe className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Domínio</span>
                </TabsTrigger>
              </TabsList>

              {/* Appearance Tab */}
              <TabsContent value="appearance" className="space-y-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Cores</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Cor Principal</Label>
                        <div className="flex gap-2">
                          <Input
                            type="color"
                            value={formData.primary_color}
                            onChange={(e) => updateField("primary_color", e.target.value)}
                            className="w-12 h-10 p-1 cursor-pointer"
                          />
                          <Input
                            value={formData.primary_color}
                            onChange={(e) => updateField("primary_color", e.target.value)}
                            className="flex-1"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Cor de Fundo</Label>
                        <div className="flex gap-2">
                          <Input
                            type="color"
                            value={formData.background_color}
                            onChange={(e) => updateField("background_color", e.target.value)}
                            className="w-12 h-10 p-1 cursor-pointer"
                          />
                          <Input
                            value={formData.background_color}
                            onChange={(e) => updateField("background_color", e.target.value)}
                            className="flex-1"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Cor do Texto</Label>
                        <div className="flex gap-2">
                          <Input
                            type="color"
                            value={formData.text_color}
                            onChange={(e) => updateField("text_color", e.target.value)}
                            className="w-12 h-10 p-1 cursor-pointer"
                          />
                          <Input
                            value={formData.text_color}
                            onChange={(e) => updateField("text_color", e.target.value)}
                            className="flex-1"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Cor do Botão</Label>
                        <div className="flex gap-2">
                          <Input
                            type="color"
                            value={formData.button_color}
                            onChange={(e) => updateField("button_color", e.target.value)}
                            className="w-12 h-10 p-1 cursor-pointer"
                          />
                          <Input
                            value={formData.button_color}
                            onChange={(e) => updateField("button_color", e.target.value)}
                            className="flex-1"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Texto do Botão</Label>
                        <div className="flex gap-2">
                          <Input
                            type="color"
                            value={formData.button_text_color}
                            onChange={(e) => updateField("button_text_color", e.target.value)}
                            className="w-12 h-10 p-1 cursor-pointer"
                          />
                          <Input
                            value={formData.button_text_color}
                            onChange={(e) => updateField("button_text_color", e.target.value)}
                            className="flex-1"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Fonte</Label>
                        <Select value={formData.font_family} onValueChange={(v) => updateField("font_family", v)}>
                          <SelectTrigger>
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
                        <Label>Arredondamento</Label>
                        <Select value={formData.border_radius} onValueChange={(v) => updateField("border_radius", v)}>
                          <SelectTrigger>
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

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Branding</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Logo</Label>
                      <div className="flex gap-2">
                        <Input
                          value={formData.logo_url || ""}
                          onChange={(e) => updateField("logo_url", e.target.value)}
                          placeholder="https://seusite.com/logo.png"
                          className="flex-1"
                        />
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleLogoUpload}
                        />
                        <Button 
                          type="button"
                          variant="outline" 
                          onClick={() => fileInputRef.current?.click()}
                          disabled={uploadingLogo}
                        >
                          {uploadingLogo ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                        </Button>
                      </div>
                      {formData.logo_url && (
                        <img src={formData.logo_url} alt="Logo" className="h-12 object-contain mt-2" />
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label>Título da Página</Label>
                      <Input
                        value={formData.page_title}
                        onChange={(e) => updateField("page_title", e.target.value)}
                        placeholder="Checkout Seguro"
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Layout Tab */}
              <TabsContent value="layout" className="space-y-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Estrutura</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Tipo de Layout</Label>
                      <Select value={formData.layout} onValueChange={(v) => updateField("layout", v)}>
                        <SelectTrigger>
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
                        <Label>Mostrar Imagem do Produto</Label>
                        <Switch
                          checked={formData.show_product_image}
                          onCheckedChange={(v) => updateField("show_product_image", v)}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label>Mostrar Descrição</Label>
                        <Switch
                          checked={formData.show_product_description}
                          onCheckedChange={(v) => updateField("show_product_description", v)}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label>Mostrar Resumo do Pedido</Label>
                        <Switch
                          checked={formData.show_order_summary}
                          onCheckedChange={(v) => updateField("show_order_summary", v)}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Fields Tab */}
              <TabsContent value="fields" className="space-y-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Campos Obrigatórios</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Email</Label>
                        <p className="text-xs text-muted-foreground">Sempre obrigatório</p>
                      </div>
                      <Switch checked disabled />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Telefone</Label>
                        <p className="text-xs text-muted-foreground">Número com DDD</p>
                      </div>
                      <Switch
                        checked={formData.require_phone}
                        onCheckedChange={(v) => updateField("require_phone", v)}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>CPF</Label>
                        <p className="text-xs text-muted-foreground">Documento do comprador</p>
                      </div>
                      <Switch
                        checked={formData.require_cpf}
                        onCheckedChange={(v) => updateField("require_cpf", v)}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Endereço</Label>
                        <p className="text-xs text-muted-foreground">Endereço completo</p>
                      </div>
                      <Switch
                        checked={formData.require_address}
                        onCheckedChange={(v) => updateField("require_address", v)}
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Urgency Tab */}
              <TabsContent value="urgency" className="space-y-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Timer e Escassez</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label>Timer de Expiração</Label>
                      <Switch
                        checked={formData.enable_timer}
                        onCheckedChange={(v) => updateField("enable_timer", v)}
                      />
                    </div>
                    {formData.enable_timer && (
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Minutos</Label>
                          <Input
                            type="number"
                            value={formData.timer_minutes}
                            onChange={(e) => updateField("timer_minutes", parseInt(e.target.value) || 15)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Texto</Label>
                          <Input
                            value={formData.timer_text}
                            onChange={(e) => updateField("timer_text", e.target.value)}
                          />
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <Label>Mostrar Estoque</Label>
                      <Switch
                        checked={formData.show_stock}
                        onCheckedChange={(v) => updateField("show_stock", v)}
                      />
                    </div>
                    {formData.show_stock && (
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Quantidade</Label>
                          <Input
                            type="number"
                            value={formData.stock_count}
                            onChange={(e) => updateField("stock_count", parseInt(e.target.value) || 10)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Texto</Label>
                          <Input
                            value={formData.stock_text}
                            onChange={(e) => updateField("stock_text", e.target.value)}
                          />
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Selos de Confiança</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label>Selo de Segurança</Label>
                      <Switch
                        checked={formData.show_security_badge}
                        onCheckedChange={(v) => updateField("show_security_badge", v)}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label>Selo de Garantia</Label>
                      <Switch
                        checked={formData.show_guarantee}
                        onCheckedChange={(v) => updateField("show_guarantee", v)}
                      />
                    </div>
                    {formData.show_guarantee && (
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Dias de Garantia</Label>
                          <Input
                            type="number"
                            value={formData.guarantee_days}
                            onChange={(e) => updateField("guarantee_days", parseInt(e.target.value) || 7)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Texto</Label>
                          <Input
                            value={formData.guarantee_text}
                            onChange={(e) => updateField("guarantee_text", e.target.value)}
                          />
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Domain Tab */}
              <TabsContent value="domain" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Globe className="h-5 w-5 text-primary" />
                      Domínio Personalizado
                    </CardTitle>
                    <CardDescription>
                      Configure um domínio próprio para o checkout deste template
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Domínio</Label>
                      <Input
                        value={formData.custom_domain || ""}
                        onChange={(e) => updateField("custom_domain", e.target.value)}
                        placeholder="checkout.seudominio.com"
                      />
                      <p className="text-xs text-muted-foreground">
                        Ex: checkout.seudominio.com ou pagar.suaempresa.com.br
                      </p>
                    </div>

                    {formData.custom_domain && (
                      <Card className="bg-secondary/50">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm flex items-center gap-2">
                            {formData.domain_verified ? (
                              <>
                                <CheckCircle className="h-4 w-4 text-green-500" />
                                Domínio Verificado
                              </>
                            ) : (
                              <>
                                <AlertCircle className="h-4 w-4 text-yellow-500" />
                                Configuração Necessária
                              </>
                            )}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          {!formData.domain_verified && (
                            <>
                              <p className="text-sm text-muted-foreground">
                                Configure os seguintes registros DNS no seu provedor:
                              </p>
                              <div className="space-y-2 text-xs font-mono bg-background/50 p-3 rounded">
                                <p><strong>Tipo:</strong> A</p>
                                <p><strong>Nome:</strong> {formData.custom_domain?.split('.')[0] || '@'}</p>
                                <p><strong>Valor:</strong> 185.158.133.1</p>
                              </div>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={copyDnsInstructions}
                                className="w-full"
                              >
                                <Copy className="h-4 w-4 mr-2" />
                                Copiar Instruções
                              </Button>
                              <p className="text-xs text-muted-foreground">
                                A propagação DNS pode levar até 48 horas.
                              </p>
                            </>
                          )}
                        </CardContent>
                      </Card>
                    )}

                    <div className="space-y-2">
                      <Label>Slug Personalizado (opcional)</Label>
                      <Input
                        value={formData.custom_slug || ""}
                        onChange={(e) => updateField("custom_slug", e.target.value)}
                        placeholder="meu-checkout"
                      />
                      <p className="text-xs text-muted-foreground">
                        URL final: {formData.custom_domain || 'seudominio.com'}/{formData.custom_slug || 'checkout'}/[produto]
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Pixels de Rastreamento</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Facebook Pixel ID</Label>
                      <Input
                        value={formData.facebook_pixel || ""}
                        onChange={(e) => updateField("facebook_pixel", e.target.value)}
                        placeholder="123456789012345"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>TikTok Pixel ID</Label>
                      <Input
                        value={formData.tiktok_pixel || ""}
                        onChange={(e) => updateField("tiktok_pixel", e.target.value)}
                        placeholder="ABCDEF123456"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Google Analytics ID</Label>
                      <Input
                        value={formData.google_analytics || ""}
                        onChange={(e) => updateField("google_analytics", e.target.value)}
                        placeholder="G-XXXXXXXXXX"
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            <div className="flex gap-3 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                className="flex-1" 
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                className="flex-1 btn-primary-gradient" 
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  template?.id ? "Atualizar Template" : "Criar Template"
                )}
              </Button>
            </div>
          </form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
