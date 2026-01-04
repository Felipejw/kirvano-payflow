import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, Eye, EyeOff, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Gateway {
  id: string;
  name: string;
  slug: string;
  instructions: string | null;
  required_fields: string[];
}

interface GatewayConfigDialogProps {
  gateway: Gateway | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existingCredentials?: Record<string, string>;
  onSaved: () => void;
}

const fieldLabels: Record<string, string> = {
  client_id: "Client ID",
  client_secret: "Client Secret",
  access_token: "Access Token",
  email: "Email",
  token: "Token",
  seller_id: "Seller ID",
  x_picpay_token: "X-PicPay-Token",
  x_seller_token: "X-Seller-Token",
  secret_key: "Secret Key",
  company_id: "Company ID",
};

export function GatewayConfigDialog({
  gateway,
  open,
  onOpenChange,
  existingCredentials,
  onSaved,
}: GatewayConfigDialogProps) {
  const [credentials, setCredentials] = useState<Record<string, string>>({});
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (gateway && existingCredentials) {
      setCredentials(existingCredentials);
    } else if (gateway) {
      const fields = gateway.required_fields || [];
      const initial: Record<string, string> = {};
      fields.forEach((field) => {
        initial[field] = "";
      });
      setCredentials(initial);
    }
  }, [gateway, existingCredentials]);

  const handleSave = async () => {
    if (!gateway) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Usuário não autenticado");
      return;
    }

    // Validate all fields are filled
    const requiredFields = gateway.required_fields || [];
    const emptyFields = requiredFields.filter((field) => !credentials[field]?.trim());
    if (emptyFields.length > 0) {
      toast.error(`Preencha todos os campos obrigatórios: ${emptyFields.map(f => fieldLabels[f] || f).join(", ")}`);
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from("seller_gateway_credentials")
        .upsert({
          user_id: user.id,
          gateway_id: gateway.id,
          credentials,
          is_active: true,
        }, {
          onConflict: "user_id,gateway_id"
        });

      if (error) throw error;

      toast.success(`${gateway.name} configurado com sucesso!`);
      onSaved();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error saving credentials:", error);
      toast.error(error.message || "Erro ao salvar credenciais");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!gateway) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    setDeleting(true);
    try {
      const { error } = await supabase
        .from("seller_gateway_credentials")
        .delete()
        .eq("user_id", user.id)
        .eq("gateway_id", gateway.id);

      if (error) throw error;

      toast.success("Credenciais removidas");
      onSaved();
      onOpenChange(false);
    } catch (error: any) {
      toast.error("Erro ao remover credenciais");
    } finally {
      setDeleting(false);
    }
  };

  const toggleShowSecret = (field: string) => {
    setShowSecrets((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  if (!gateway) return null;

  const requiredFields = gateway.required_fields || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Configurar {gateway.name}</DialogTitle>
          <DialogDescription>
            Insira suas credenciais de API para receber pagamentos diretamente em sua conta.
          </DialogDescription>
        </DialogHeader>

        {gateway.instructions && (
          <div className="flex gap-2 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-sm">
            <AlertCircle className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
            <p className="text-blue-200">{gateway.instructions}</p>
          </div>
        )}

        <div className="space-y-4 py-4">
          {requiredFields.map((field) => (
            <div key={field} className="space-y-2">
              <Label htmlFor={field}>{fieldLabels[field] || field}</Label>
              <div className="relative">
                <Input
                  id={field}
                  type={showSecrets[field] ? "text" : "password"}
                  placeholder={`Digite seu ${fieldLabels[field] || field}`}
                  value={credentials[field] || ""}
                  onChange={(e) =>
                    setCredentials((prev) => ({ ...prev, [field]: e.target.value }))
                  }
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => toggleShowSecret(field)}
                >
                  {showSecrets[field] ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
            </div>
          ))}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          {existingCredentials && (
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
              className="sm:mr-auto"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {deleting ? "Removendo..." : "Remover"}
            </Button>
          )}
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Salvando..." : "Salvar Credenciais"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
