import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { CreditCard, Plus, Edit, Trash2 } from "lucide-react";
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
}

export function GatewayManagement() {
  const [gateways, setGateways] = useState<Gateway[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingGateway, setEditingGateway] = useState<Gateway | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    logo_url: "",
    instructions: "",
    required_fields: "",
    is_active: true,
  });

  useEffect(() => {
    fetchGateways();
  }, []);

  const fetchGateways = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("payment_gateways")
      .select("*")
      .order("name");

    if (error) {
      toast.error("Erro ao carregar gateways");
    } else {
      const mapped = (data || []).map((g) => ({
        ...g,
        instructions: g.instructions || null,
        logo_url: g.logo_url || null,
        required_fields: Array.isArray(g.required_fields) ? g.required_fields as string[] : [],
      }));
      setGateways(mapped);
    }
    setLoading(false);
  };

  const handleEdit = (gateway: Gateway) => {
    setEditingGateway(gateway);
    setFormData({
      name: gateway.name,
      slug: gateway.slug,
      logo_url: gateway.logo_url || "",
      instructions: gateway.instructions || "",
      required_fields: (gateway.required_fields || []).join(", "),
      is_active: gateway.is_active,
    });
    setDialogOpen(true);
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
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.slug) {
      toast.error("Nome e slug são obrigatórios");
      return;
    }

    setSaving(true);
    const requiredFields = formData.required_fields
      .split(",")
      .map((f) => f.trim())
      .filter((f) => f);

    try {
      if (editingGateway) {
        const { error } = await supabase
          .from("payment_gateways")
          .update({
            name: formData.name,
            slug: formData.slug,
            logo_url: formData.logo_url || null,
            instructions: formData.instructions || null,
            required_fields: requiredFields,
            is_active: formData.is_active,
          })
          .eq("id", editingGateway.id);

        if (error) throw error;
        toast.success("Gateway atualizado!");
      } else {
        const { error } = await supabase.from("payment_gateways").insert({
          name: formData.name,
          slug: formData.slug,
          logo_url: formData.logo_url || null,
          instructions: formData.instructions || null,
          required_fields: requiredFields,
          is_active: formData.is_active,
        });

        if (error) throw error;
        toast.success("Gateway criado!");
      }

      fetchGateways();
      setDialogOpen(false);
    } catch (error: any) {
      toast.error(error.message || "Erro ao salvar gateway");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (gateway: Gateway) => {
    if (!confirm(`Tem certeza que deseja excluir o gateway "${gateway.name}"?`)) {
      return;
    }

    const { error } = await supabase
      .from("payment_gateways")
      .delete()
      .eq("id", gateway.id);

    if (error) {
      toast.error("Erro ao excluir gateway");
    } else {
      toast.success("Gateway excluído!");
      fetchGateways();
    }
  };

  const toggleActive = async (gateway: Gateway) => {
    const { error } = await supabase
      .from("payment_gateways")
      .update({ is_active: !gateway.is_active })
      .eq("id", gateway.id);

    if (error) {
      toast.error("Erro ao atualizar gateway");
    } else {
      fetchGateways();
    }
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-primary" />
              Gateways de Pagamento
            </CardTitle>
            <CardDescription>Gerencie os gateways disponíveis para vendedores</CardDescription>
          </div>
          <Button onClick={handleNew}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Gateway
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-8 text-center text-muted-foreground">Carregando...</div>
          ) : gateways.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              Nenhum gateway configurado
            </div>
          ) : (
            <div className="space-y-3">
              {gateways.map((gateway) => (
                <div
                  key={gateway.id}
                  className="flex items-center justify-between p-4 rounded-lg bg-secondary/50 border border-border"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 flex items-center justify-center rounded-lg bg-background">
                      {gateway.logo_url ? (
                        <img
                          src={gateway.logo_url}
                          alt={gateway.name}
                          className="w-8 h-8 object-contain"
                        />
                      ) : (
                        <CreditCard className="h-6 w-6 text-muted-foreground" />
                      )}
                    </div>
                    <div>
                      <h4 className="font-medium">{gateway.name}</h4>
                      <p className="text-sm text-muted-foreground">{gateway.slug}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Switch
                      checked={gateway.is_active}
                      onCheckedChange={() => toggleActive(gateway)}
                    />
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(gateway)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive"
                      onClick={() => handleDelete(gateway)}
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

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingGateway ? "Editar Gateway" : "Novo Gateway"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
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
                  placeholder="mercado_pago"
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
            <div className="flex items-center justify-between">
              <Label>Ativo</Label>
              <Switch
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
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
    </>
  );
}
