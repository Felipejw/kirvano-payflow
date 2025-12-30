import { useState } from "react";
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
import { Eye, EyeOff, Copy, Check, Key, Save } from "lucide-react";
import { toast } from "sonner";

interface GatewayCredentialsDialogProps {
  gateway: 'bspay' | 'pixup';
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface CredentialField {
  key: string;
  label: string;
  envName: string;
}

const gatewayCredentials: Record<string, CredentialField[]> = {
  bspay: [
    { key: 'client_id', label: 'Client ID', envName: 'BSPAY_CLIENT_ID' },
    { key: 'client_secret', label: 'Client Secret', envName: 'BSPAY_CLIENT_SECRET' },
  ],
  pixup: [
    { key: 'client_id', label: 'Client ID', envName: 'PIXUP_CLIENT_ID' },
    { key: 'client_secret', label: 'Client Secret', envName: 'PIXUP_CLIENT_SECRET' },
  ],
};

export function GatewayCredentialsDialog({
  gateway,
  open,
  onOpenChange,
}: GatewayCredentialsDialogProps) {
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const credentials = gatewayCredentials[gateway] || [];
  const gatewayName = gateway === 'bspay' ? 'BSPAY' : 'PIXUP';

  const toggleShowSecret = (key: string) => {
    setShowSecrets((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const copyToClipboard = async (envName: string) => {
    try {
      // Note: We can't actually access the secret values from the frontend
      // We just copy the env name as a reference
      await navigator.clipboard.writeText(`${envName}`);
      setCopiedField(envName);
      toast.success(`Nome da variável ${envName} copiado!`);
      setTimeout(() => setCopiedField(null), 2000);
    } catch {
      toast.error("Falha ao copiar");
    }
  };

  const handleUpdateCredentials = () => {
    // Show info message - secrets need to be updated via Lovable's secret management
    toast.info(
      `Para atualizar as credenciais do ${gatewayName}, entre em contato com o administrador do sistema ou atualize diretamente nas configurações do Cloud.`,
      { duration: 5000 }
    );
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Credenciais do {gatewayName}
          </DialogTitle>
          <DialogDescription>
            Visualize e gerencie as credenciais de API do gateway {gatewayName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-sm">
            <p className="text-yellow-600 dark:text-yellow-400">
              <strong>Nota:</strong> Por segurança, os valores das credenciais são armazenados de forma criptografada e não podem ser visualizados diretamente. Para atualizar, clique em "Alterar Credenciais".
            </p>
          </div>

          {credentials.map((field) => (
            <div key={field.key} className="space-y-2">
              <Label htmlFor={field.key}>{field.label}</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    id={field.key}
                    type={showSecrets[field.key] ? "text" : "password"}
                    value="••••••••••••••••••••••"
                    readOnly
                    className="pr-10 bg-muted"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => toggleShowSecret(field.key)}
                  >
                    {showSecrets[field.key] ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => copyToClipboard(field.envName)}
                  title={`Copiar nome da variável: ${field.envName}`}
                >
                  {copiedField === field.envName ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Variável de ambiente: <code className="bg-muted px-1 py-0.5 rounded">{field.envName}</code>
              </p>
            </div>
          ))}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
          <Button onClick={handleUpdateCredentials}>
            <Save className="h-4 w-4 mr-2" />
            Alterar Credenciais
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
