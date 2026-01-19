import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Palette, 
  Globe, 
  Image as ImageIcon, 
  Save, 
  Loader2,
  CheckCircle,
  AlertTriangle,
  ExternalLink,
  Copy,
  Server
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface TenantSettings {
  id: string;
  brand_name: string;
  logo_url: string | null;
  favicon_url: string | null;
  primary_color: string;
  secondary_color: string;
  accent_color: string | null;
  custom_domain: string | null;
  domain_verified: boolean;
  support_email: string | null;
  support_phone: string | null;
  whatsapp_url: string | null;
  terms_url: string | null;
  privacy_url: string | null;
}

export const WhiteLabelSettings = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tenant, setTenant] = useState<TenantSettings | null>(null);
  const [formData, setFormData] = useState({
    brand_name: "",
    logo_url: "",
    favicon_url: "",
    primary_color: "#00b4d8",
    secondary_color: "#0a1628",
    accent_color: "#00b4d8",
    custom_domain: "",
    support_email: "",
    support_phone: "",
    whatsapp_url: "",
    terms_url: "",
    privacy_url: "",
  });

  useEffect(() => {
    fetchTenant();
  }, [user]);

  const fetchTenant = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("tenants")
        .select("*")
        .eq("admin_user_id", user.id)
        .maybeSingle();

      if (error && error.code !== "PGRST116") {
        console.error("Error fetching tenant:", error);
        toast.error("Erro ao carregar configurações");
        return;
      }

      if (data) {
        setTenant(data as TenantSettings);
        setFormData({
          brand_name: data.brand_name || "",
          logo_url: data.logo_url || "",
          favicon_url: data.favicon_url || "",
          primary_color: data.primary_color || "#00b4d8",
          secondary_color: data.secondary_color || "#0a1628",
          accent_color: data.accent_color || "#00b4d8",
          custom_domain: data.custom_domain || "",
          support_email: data.support_email || "",
          support_phone: data.support_phone || "",
          whatsapp_url: data.whatsapp_url || "",
          terms_url: data.terms_url || "",
          privacy_url: data.privacy_url || "",
        });
      }
    } catch (err) {
      console.error("Error in fetchTenant:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);

    try {
      if (tenant) {
        // Update existing tenant
        const { error } = await supabase
          .from("tenants")
          .update({
            brand_name: formData.brand_name,
            logo_url: formData.logo_url || null,
            favicon_url: formData.favicon_url || null,
            primary_color: formData.primary_color,
            secondary_color: formData.secondary_color,
            accent_color: formData.accent_color,
            custom_domain: formData.custom_domain || null,
            support_email: formData.support_email || null,
            support_phone: formData.support_phone || null,
            whatsapp_url: formData.whatsapp_url || null,
            terms_url: formData.terms_url || null,
            privacy_url: formData.privacy_url || null,
            domain_verified: false, // Reset when domain changes
          })
          .eq("id", tenant.id);

        if (error) throw error;
        toast.success("Configurações atualizadas com sucesso!");
      } else {
        // Create new tenant
        const { error } = await supabase
          .from("tenants")
          .insert({
            admin_user_id: user.id,
            brand_name: formData.brand_name || "Minha Marca",
            logo_url: formData.logo_url || null,
            favicon_url: formData.favicon_url || null,
            primary_color: formData.primary_color,
            secondary_color: formData.secondary_color,
            accent_color: formData.accent_color,
            custom_domain: formData.custom_domain || null,
            support_email: formData.support_email || null,
            support_phone: formData.support_phone || null,
            whatsapp_url: formData.whatsapp_url || null,
            terms_url: formData.terms_url || null,
            privacy_url: formData.privacy_url || null,
          });

        if (error) throw error;
        toast.success("Configurações criadas com sucesso!");
      }

      fetchTenant();
    } catch (err) {
      console.error("Error saving tenant:", err);
      toast.error("Erro ao salvar configurações");
    } finally {
      setSaving(false);
    }
  };

  const copyDNSRecord = () => {
    const record = `CNAME @ gatteflow.store`;
    navigator.clipboard.writeText(record);
    toast.success("Registro DNS copiado!");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Branding Card */}
      <Card variant="glass">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5 text-primary" />
            Identidade Visual
          </CardTitle>
          <CardDescription>
            Configure o logo, favicon e nome da sua marca
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nome da Marca</Label>
              <Input
                value={formData.brand_name}
                onChange={(e) => setFormData({ ...formData, brand_name: e.target.value })}
                placeholder="Minha Empresa"
              />
            </div>
            <div className="space-y-2">
              <Label>URL do Logo</Label>
              <Input
                value={formData.logo_url}
                onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
                placeholder="https://..."
              />
            </div>
            <div className="space-y-2">
              <Label>URL do Favicon</Label>
              <Input
                value={formData.favicon_url}
                onChange={(e) => setFormData({ ...formData, favicon_url: e.target.value })}
                placeholder="https://..."
              />
            </div>
          </div>

          {formData.logo_url && (
            <div className="p-4 bg-secondary/50 rounded-lg">
              <Label className="text-sm text-muted-foreground mb-2 block">Preview do Logo:</Label>
              <img 
                src={formData.logo_url} 
                alt="Logo preview" 
                className="h-12 object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Colors Card */}
      <Card variant="glass">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5 text-primary" />
            Cores do Sistema
          </CardTitle>
          <CardDescription>
            Personalize as cores da interface
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Cor Primária</Label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={formData.primary_color}
                  onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
                  className="w-14 h-10 p-1 cursor-pointer"
                />
                <Input
                  value={formData.primary_color}
                  onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
                  placeholder="#00b4d8"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Cor Secundária</Label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={formData.secondary_color}
                  onChange={(e) => setFormData({ ...formData, secondary_color: e.target.value })}
                  className="w-14 h-10 p-1 cursor-pointer"
                />
                <Input
                  value={formData.secondary_color}
                  onChange={(e) => setFormData({ ...formData, secondary_color: e.target.value })}
                  placeholder="#0a1628"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Cor de Destaque</Label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={formData.accent_color}
                  onChange={(e) => setFormData({ ...formData, accent_color: e.target.value })}
                  className="w-14 h-10 p-1 cursor-pointer"
                />
                <Input
                  value={formData.accent_color}
                  onChange={(e) => setFormData({ ...formData, accent_color: e.target.value })}
                  placeholder="#00b4d8"
                />
              </div>
            </div>
          </div>

          {/* Color Preview */}
          <div className="mt-4 p-4 rounded-lg border border-border">
            <Label className="text-sm text-muted-foreground mb-2 block">Preview:</Label>
            <div className="flex gap-2">
              <div 
                className="w-16 h-16 rounded-lg border border-border"
                style={{ backgroundColor: formData.primary_color }}
              />
              <div 
                className="w-16 h-16 rounded-lg border border-border"
                style={{ backgroundColor: formData.secondary_color }}
              />
              <div 
                className="w-16 h-16 rounded-lg border border-border"
                style={{ backgroundColor: formData.accent_color }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Custom Domain Card */}
      <Card variant="glass">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-primary" />
            Domínio Customizado
          </CardTitle>
          <CardDescription>
            Configure seu domínio próprio para acessar o sistema
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Seu Domínio</Label>
            <Input
              value={formData.custom_domain}
              onChange={(e) => setFormData({ ...formData, custom_domain: e.target.value })}
              placeholder="app.suamarca.com.br"
            />
          </div>

          {/* Server IP Info */}
          <div className="p-4 rounded-lg border border-blue-200 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-950/20">
            <div className="flex items-center gap-2 mb-3">
              <Server className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <span className="font-medium text-blue-700 dark:text-blue-400">IP do Servidor para Apontamento DNS</span>
            </div>
            <div className="flex items-center gap-3 mb-2">
              <code className="text-lg font-mono bg-blue-100 dark:bg-blue-900 px-4 py-2 rounded-lg text-blue-800 dark:text-blue-200">
                72.60.60.102
              </code>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => {
                  navigator.clipboard.writeText("72.60.60.102");
                  toast.success("IP copiado!");
                }}
                className="border-blue-300 hover:bg-blue-100 dark:border-blue-700 dark:hover:bg-blue-900"
              >
                <Copy className="h-4 w-4 mr-2" />
                Copiar
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Configure um registro <strong>A</strong> no DNS do seu domínio apontando para este IP.
            </p>
          </div>

          {formData.custom_domain && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <p>Após configurar o registro A, entre em contato para validação do domínio.</p>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {tenant?.domain_verified && (
            <Badge variant="outline" className="gap-1 text-green-500 border-green-500">
              <CheckCircle className="h-3 w-3" />
              Domínio verificado
            </Badge>
          )}
        </CardContent>
      </Card>

      {/* Support Info Card */}
      <Card variant="glass">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ExternalLink className="h-5 w-5 text-primary" />
            Informações de Suporte
          </CardTitle>
          <CardDescription>
            Configure os dados de contato que serão exibidos para seus usuários
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>E-mail de Suporte</Label>
              <Input
                type="email"
                value={formData.support_email}
                onChange={(e) => setFormData({ ...formData, support_email: e.target.value })}
                placeholder="suporte@suamarca.com"
              />
            </div>
            <div className="space-y-2">
              <Label>Telefone de Suporte</Label>
              <Input
                value={formData.support_phone}
                onChange={(e) => setFormData({ ...formData, support_phone: e.target.value })}
                placeholder="(11) 99999-9999"
              />
            </div>
            <div className="space-y-2">
              <Label>Link do WhatsApp</Label>
              <Input
                value={formData.whatsapp_url}
                onChange={(e) => setFormData({ ...formData, whatsapp_url: e.target.value })}
                placeholder="https://wa.me/5511999999999"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>URL dos Termos de Uso</Label>
              <Input
                value={formData.terms_url}
                onChange={(e) => setFormData({ ...formData, terms_url: e.target.value })}
                placeholder="https://suamarca.com/termos"
              />
            </div>
            <div className="space-y-2">
              <Label>URL da Política de Privacidade</Label>
              <Input
                value={formData.privacy_url}
                onChange={(e) => setFormData({ ...formData, privacy_url: e.target.value })}
                placeholder="https://suamarca.com/privacidade"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button 
          variant="gradient" 
          onClick={handleSave} 
          disabled={saving}
          className="gap-2"
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {saving ? "Salvando..." : "Salvar Configurações"}
        </Button>
      </div>
    </div>
  );
};
