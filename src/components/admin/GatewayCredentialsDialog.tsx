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
import { Eye, EyeOff, Copy, Check, Key, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

interface GatewayCredentialsDialogProps {
  gateway: 'bspay' | 'pixup';
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface Credentials {
  client_id: string | null;
  client_secret: string | null;
}

export function GatewayCredentialsDialog({
  gateway,
  open,
  onOpenChange,
}: GatewayCredentialsDialogProps) {
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [credentials, setCredentials] = useState<Credentials | null>(null);
  const [error, setError] = useState<string | null>(null);

  const gatewayName = gateway === 'bspay' ? 'BSPAY' : 'PIXUP';

  useEffect(() => {
    if (open) {
      fetchCredentials();
    } else {
      // Reset state when dialog closes
      setCredentials(null);
      setShowSecrets({});
      setError(null);
    }
  }, [open, gateway]);

  const fetchCredentials = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error: invokeError } = await supabase.functions.invoke('get-gateway-credentials', {
        body: { gateway }
      });

      if (invokeError) {
        throw invokeError;
      }

      if (data.error) {
        throw new Error(data.error);
      }

      setCredentials(data.credentials);
    } catch (err: any) {
      console.error('Error fetching credentials:', err);
      setError(err.message || 'Erro ao carregar credenciais');
      toast.error('Erro ao carregar credenciais');
    } finally {
      setLoading(false);
    }
  };

  const toggleShowSecret = (key: string) => {
    setShowSecrets((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const copyToClipboard = async (key: 'client_id' | 'client_secret', label: string) => {
    const value = credentials?.[key];
    if (!value) {
      toast.error('Valor não disponível para copiar');
      return;
    }

    try {
      await navigator.clipboard.writeText(value);
      setCopiedField(key);
      toast.success(`${label} copiado!`);
      setTimeout(() => setCopiedField(null), 2000);
    } catch {
      toast.error("Falha ao copiar");
    }
  };

  const getMaskedValue = (value: string | null) => {
    if (!value) return 'Não configurado';
    return '••••••••••••••••••••••';
  };

  const getDisplayValue = (key: 'client_id' | 'client_secret') => {
    const value = credentials?.[key];
    if (!value) return 'Não configurado';
    return showSecrets[key] ? value : getMaskedValue(value);
  };

  const fields = [
    { key: 'client_id' as const, label: 'Client ID' },
    { key: 'client_secret' as const, label: 'Client Secret' },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Credenciais do {gatewayName}
          </DialogTitle>
          <DialogDescription>
            Visualize e copie as credenciais de API do gateway {gatewayName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {error && (
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-sm">
              <p className="text-destructive">{error}</p>
            </div>
          )}

          {loading ? (
            <div className="space-y-4">
              {fields.map((field) => (
                <div key={field.key} className="space-y-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ))}
            </div>
          ) : (
            fields.map((field) => (
              <div key={field.key} className="space-y-2">
                <Label htmlFor={field.key}>{field.label}</Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      id={field.key}
                      type="text"
                      value={getDisplayValue(field.key)}
                      readOnly
                      className="pr-10 bg-muted font-mono text-sm"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => toggleShowSecret(field.key)}
                      disabled={!credentials?.[field.key]}
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
                    onClick={() => copyToClipboard(field.key, field.label)}
                    disabled={!credentials?.[field.key]}
                    title={`Copiar ${field.label}`}
                  >
                    {copiedField === field.key ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            ))
          )}

          {!loading && !error && (
            <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-sm">
              <p className="text-yellow-600 dark:text-yellow-400">
                <strong>Segurança:</strong> Essas credenciais são sensíveis. Para alterá-las, acesse as configurações de secrets do Cloud.
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
          {!loading && !error && (
            <Button onClick={fetchCredentials} variant="secondary">
              <Loader2 className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
