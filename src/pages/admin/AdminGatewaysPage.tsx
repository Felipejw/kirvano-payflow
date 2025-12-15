import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { 
  CreditCard, 
  Plus, 
  Pencil, 
  Trash2, 
  GripVertical,
  Banknote,
  QrCode,
  Receipt
} from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Gateway {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  is_active: boolean;
  instructions: string | null;
  required_fields: string[];
  supports_pix: boolean;
  supports_card: boolean;
  supports_boleto: boolean;
  display_order: number;
}

const AdminGatewaysPage = () => {
  const [gateways, setGateways] = useState<Gateway[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingGateway, setEditingGateway] = useState<Gateway | null>(null);
  
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    logo_url: "",
    instructions: "",
    required_fields: "client_id, client_secret",
    is_active: true,
    supports_pix: true,
    supports_card: false,
    supports_boleto: false,
    display_order: 0,
  });

  useEffect(() => {
    fetchGateways();
  }, []);

  const fetchGateways = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('payment_gateways')
      .select('*')
      .order('display_order', { ascending: true });

    if (error) {
      toast.error("Erro ao carregar gateways");
    } else if (data) {
      const mapped = data.map((g) => ({
        ...g,
        required_fields: Array.isArray(g.required_fields) ? g.required_fields as string[] : [],
        supports_pix: g.supports_pix ?? true,
        supports_card: g.supports_card ?? false,
        supports_boleto: g.supports_boleto ?? false,
        display_order: g.display_order ?? 0,
      }));
      setGateways(mapped);
    }
    setLoading(false);
  };

  const handleNew = () => {
    setEditingGateway(null);
    setFormData({
      name: "",
      slug: "",
      logo_url: "",
      instructions: "",
      required_fields: "client_id, client_secret",
      is_active: true,
      supports_pix: true,
      supports_card: false,
      supports_boleto: false,
      display_order: gateways.length,
    });
    setDialogOpen(true);
  };

  const handleEdit = (gateway: Gateway) => {
    setEditingGateway(gateway);
    setFormData({
      name: gateway.name,
      slug: gateway.slug,
      logo_url: gateway.logo_url || "",
      instructions: gateway.instructions || "",
      required_fields: gateway.required_fields.join(", "),
      is_active: gateway.is_active,
      supports_pix: gateway.supports_pix,
      supports_card: gateway.supports_card,
      supports_boleto: gateway.supports_boleto,
      display_order: gateway.display_order,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.slug) {
      toast.error("Nome e slug são obrigatórios");
      return;
    }

    setSaving(true);
    const requiredFieldsArray = formData.required_fields
      .split(",")
      .map((f) => f.trim())
      .filter(Boolean);

    const payload = {
      name: formData.name,
      slug: formData.slug,
      logo_url: formData.logo_url || null,
      instructions: formData.instructions || null,
      required_fields: requiredFieldsArray,
      is_active: formData.is_active,
      supports_pix: formData.supports_pix,
      supports_card: formData.supports_card,
      supports_boleto: formData.supports_boleto,
      display_order: formData.display_order,
    };

    if (editingGateway) {
      const { error } = await supabase
        .from('payment_gateways')
        .update(payload)
        .eq('id', editingGateway.id);

      if (error) {
        toast.error("Erro ao atualizar gateway");
      } else {
        toast.success("Gateway atualizado!");
        setDialogOpen(false);
        fetchGateways();
      }
    } else {
      const { error } = await supabase
        .from('payment_gateways')
        .insert(payload);

      if (error) {
        toast.error("Erro ao criar gateway");
      } else {
        toast.success("Gateway criado!");
        setDialogOpen(false);
        fetchGateways();
      }
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este gateway?")) return;

    const { error } = await supabase
      .from('payment_gateways')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error("Erro ao excluir gateway");
    } else {
      toast.success("Gateway excluído!");
      fetchGateways();
    }
  };

  const handleToggleActive = async (gateway: Gateway) => {
    const { error } = await supabase
      .from('payment_gateways')
      .update({ is_active: !gateway.is_active })
      .eq('id', gateway.id);

    if (error) {
      toast.error("Erro ao atualizar status");
    } else {
      fetchGateways();
    }
  };

  const handleToggleMethod = async (gateway: Gateway, method: 'pix' | 'card' | 'boleto') => {
    const fieldName = `supports_${method}` as keyof Gateway;
    const { error } = await supabase
      .from('payment_gateways')
      .update({ [fieldName]: !gateway[fieldName] })
      .eq('id', gateway.id);

    if (error) {
      toast.error("Erro ao atualizar método");
    } else {
      fetchGateways();
    }
  };

  const handleOrderChange = async (gateway: Gateway, newOrder: number) => {
    const { error } = await supabase
      .from('payment_gateways')
      .update({ display_order: newOrder })
      .eq('id', gateway.id);

    if (error) {
      toast.error("Erro ao atualizar ordem");
    } else {
      fetchGateways();
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Gateways de Pagamento</h1>
            <p className="text-muted-foreground">Gerencie os gateways disponíveis para vendedores</p>
          </div>
          <Button onClick={handleNew} className="gap-2">
            <Plus className="h-4 w-4" />
            Novo Gateway
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-primary" />
              Gateways Cadastrados
            </CardTitle>
            <CardDescription>
              Configure os métodos de pagamento suportados por cada gateway
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="py-8 text-center text-muted-foreground">Carregando...</div>
            ) : gateways.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                Nenhum gateway cadastrado
              </div>
            ) : (
              <div className="space-y-3">
                {gateways.map((gateway) => (
                  <div
                    key={gateway.id}
                    className="flex items-center gap-4 p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                  >
                    <GripVertical className="h-5 w-5 text-muted-foreground cursor-move" />
                    
                    <div className="flex items-center gap-3 min-w-[200px]">
                      {gateway.logo_url ? (
                        <img 
                          src={gateway.logo_url} 
                          alt={gateway.name} 
                          className="h-8 w-8 object-contain rounded"
                        />
                      ) : (
                        <div className="h-8 w-8 rounded bg-muted flex items-center justify-center">
                          <CreditCard className="h-4 w-4 text-muted-foreground" />
                        </div>
                      )}
                      <div>
                        <p className="font-medium">{gateway.name}</p>
                        <p className="text-xs text-muted-foreground">{gateway.slug}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant={gateway.supports_pix ? "default" : "outline"}
                        size="sm"
                        className="gap-1.5"
                        onClick={() => handleToggleMethod(gateway, 'pix')}
                      >
                        <QrCode className="h-3.5 w-3.5" />
                        PIX
                      </Button>
                      <Button
                        variant={gateway.supports_card ? "default" : "outline"}
                        size="sm"
                        className="gap-1.5"
                        onClick={() => handleToggleMethod(gateway, 'card')}
                      >
                        <CreditCard className="h-3.5 w-3.5" />
                        Cartão
                      </Button>
                      <Button
                        variant={gateway.supports_boleto ? "default" : "outline"}
                        size="sm"
                        className="gap-1.5"
                        onClick={() => handleToggleMethod(gateway, 'boleto')}
                      >
                        <Receipt className="h-3.5 w-3.5" />
                        Boleto
                      </Button>
                    </div>

                    <div className="flex items-center gap-2 ml-auto">
                      <Input
                        type="number"
                        value={gateway.display_order}
                        onChange={(e) => handleOrderChange(gateway, parseInt(e.target.value) || 0)}
                        className="w-16 text-center"
                        min={0}
                      />
                      
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={gateway.is_active}
                          onCheckedChange={() => handleToggleActive(gateway)}
                        />
                        <span className="text-sm text-muted-foreground">
                          {gateway.is_active ? "Ativo" : "Inativo"}
                        </span>
                      </div>

                      <Button variant="ghost" size="icon" onClick={() => handleEdit(gateway)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleDelete(gateway.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Gateway Form Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {editingGateway ? "Editar Gateway" : "Novo Gateway"}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nome</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Mercado Pago"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Slug</Label>
                  <Input
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    placeholder="mercadopago"
                  />
                </div>
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
                <Label>Campos Obrigatórios (separados por vírgula)</Label>
                <Input
                  value={formData.required_fields}
                  onChange={(e) => setFormData({ ...formData, required_fields: e.target.value })}
                  placeholder="client_id, client_secret"
                />
              </div>

              <div className="space-y-2">
                <Label>Instruções</Label>
                <Textarea
                  value={formData.instructions}
                  onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                  placeholder="Como obter as credenciais..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label>Ordem de Exibição</Label>
                <Input
                  type="number"
                  value={formData.display_order}
                  onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
                  min={0}
                />
              </div>

              <div className="space-y-3">
                <Label>Métodos de Pagamento Suportados</Label>
                <div className="flex items-center gap-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <Switch
                      checked={formData.supports_pix}
                      onCheckedChange={(c) => setFormData({ ...formData, supports_pix: c })}
                    />
                    <span className="text-sm">PIX</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <Switch
                      checked={formData.supports_card}
                      onCheckedChange={(c) => setFormData({ ...formData, supports_card: c })}
                    />
                    <span className="text-sm">Cartão</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <Switch
                      checked={formData.supports_boleto}
                      onCheckedChange={(c) => setFormData({ ...formData, supports_boleto: c })}
                    />
                    <span className="text-sm">Boleto</span>
                  </label>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={(c) => setFormData({ ...formData, is_active: c })}
                />
                <span className="text-sm">Gateway ativo</span>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? "Salvando..." : "Salvar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default AdminGatewaysPage;
