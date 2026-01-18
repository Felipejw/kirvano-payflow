import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
import { usePlatformFeatures, invalidateFeaturesCache } from "@/hooks/usePlatformFeatures";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { 
  Settings, 
  LayoutDashboard, 
  Package, 
  Receipt, 
  Users, 
  MessageSquare, 
  UserCheck, 
  RefreshCw, 
  Wallet, 
  FileCode,
  BarChart3,
  CreditCard,
  FileText,
  Trophy,
  Send,
  Mail,
  Instagram,
  Loader2,
  Save
} from "lucide-react";

interface PlatformFeature {
  id: string;
  feature_key: string;
  feature_name: string;
  description: string | null;
  is_enabled: boolean;
  icon: string | null;
  menu_page: string | null;
  category: string;
  display_order: number;
}

const iconMap: Record<string, any> = {
  LayoutDashboard,
  Package,
  Receipt,
  Users,
  MessageSquare,
  UserCheck,
  RefreshCw,
  Wallet,
  FileCode,
  BarChart3,
  CreditCard,
  FileText,
  Trophy,
  Send,
  Mail,
  Instagram,
  Settings,
};

export default function SuperAdminFeatures() {
  const { isSuperAdmin, loading: roleLoading } = useUserRole();
  const { features: initialFeatures, loading: featuresLoading, refetch } = usePlatformFeatures();
  const [features, setFeatures] = useState<PlatformFeature[]>([]);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (initialFeatures.length > 0) {
      setFeatures(initialFeatures);
    }
  }, [initialFeatures]);

  const handleToggle = (featureId: string) => {
    setFeatures((prev) =>
      prev.map((f) =>
        f.id === featureId ? { ...f, is_enabled: !f.is_enabled } : f
      )
    );
    setHasChanges(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Atualizar cada feature que foi modificada
      const updates = features.map((feature) => 
        supabase
          .from("platform_features")
          .update({ is_enabled: feature.is_enabled })
          .eq("id", feature.id)
      );

      await Promise.all(updates);

      // Invalidar cache e refetch
      invalidateFeaturesCache();
      await refetch();

      toast.success("Configurações salvas com sucesso!");
      setHasChanges(false);
    } catch (error) {
      console.error("Error saving features:", error);
      toast.error("Erro ao salvar configurações");
    } finally {
      setSaving(false);
    }
  };

  if (roleLoading || featuresLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (!isSuperAdmin) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Acesso não autorizado</p>
        </div>
      </DashboardLayout>
    );
  }

  const sellerFeatures = features.filter((f) => f.category === "seller");
  const adminFeatures = features.filter((f) => f.category === "admin");

  const renderFeatureCard = (feature: PlatformFeature) => {
    const IconComponent = feature.icon ? iconMap[feature.icon] : Settings;

    return (
      <div
        key={feature.id}
        className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
      >
        <div className="flex items-center gap-4">
          <div className={`p-2 rounded-lg ${feature.is_enabled ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
            <IconComponent className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-medium">{feature.feature_name}</span>
              {!feature.is_enabled && (
                <Badge variant="secondary" className="text-xs">
                  Desativado
                </Badge>
              )}
            </div>
            {feature.description && (
              <p className="text-sm text-muted-foreground">{feature.description}</p>
            )}
            {feature.menu_page && (
              <p className="text-xs text-muted-foreground mt-1">
                Página: <code className="bg-muted px-1 rounded">{feature.menu_page}</code>
              </p>
            )}
          </div>
        </div>
        <Switch
          checked={feature.is_enabled}
          onCheckedChange={() => handleToggle(feature.id)}
        />
      </div>
    );
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Settings className="h-8 w-8 text-primary" />
              Gerenciador de Funcionalidades
            </h1>
            <p className="text-muted-foreground mt-1">
              Ative ou desative funcionalidades para todos os usuários da plataforma
            </p>
          </div>
          {hasChanges && (
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Salvar Alterações
            </Button>
          )}
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total de Funcionalidades
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{features.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Ativas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-green-500">
                {features.filter((f) => f.is_enabled).length}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Desativadas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-red-500">
                {features.filter((f) => !f.is_enabled).length}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Features do Vendedor */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Menu do Vendedor
            </CardTitle>
            <CardDescription>
              Funcionalidades visíveis para vendedores no painel deles
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {sellerFeatures.map(renderFeatureCard)}
          </CardContent>
        </Card>

        {/* Features do Admin */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Menu do Administrador
            </CardTitle>
            <CardDescription>
              Funcionalidades visíveis para administradores
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {adminFeatures.map(renderFeatureCard)}
          </CardContent>
        </Card>

        {/* Aviso */}
        <Card className="border-yellow-500/50 bg-yellow-500/5">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-yellow-500/10 rounded-lg">
                <Settings className="h-5 w-5 text-yellow-500" />
              </div>
              <div>
                <h4 className="font-medium text-yellow-500">Atenção</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  Desativar uma funcionalidade irá removê-la do menu de todos os usuários.
                  Os dados relacionados à funcionalidade não serão perdidos, apenas o acesso será bloqueado.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
