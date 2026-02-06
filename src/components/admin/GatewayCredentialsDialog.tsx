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
import { Eye, EyeOff, Copy, Check, Key, Loader2, Save, Edit2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { useUserRole } from "@/hooks/useUserRole";

interface GatewayCredentialsDialogProps {
  gateway: 'bspay' | 'pixup' | 'ghostpay';
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
  const [saving, setSaving] = useState(false);
  const [credentials, setCredentials] = useState<Credentials | null>(null);
  const [editCredentials, setEditCredentials] = useState<Credentials>({ client_id: '', client_secret: '' });
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [source, setSource] = useState<'platform' | 'admin'>('admin');
  
  const { isSuperAdmin } = useUserRole();

  const gatewayName = gateway === 'bspay' ? 'BSPAY' : gateway === 'ghostpay' ? 'GHOSTPAY' : 'PIXUP';

  useEffect(() => {
    if (open) {
      fetchCredentials();
    } else {
      // Reset state when dialog closes
      setCredentials(null);
      setEditCredentials({ client_id: '', client_secret: '' });
      setShowSecrets({});
      setError(null);
      setIsEditing(false);
    }
  }, [open, gateway]);

  const fetchCredentialsFallback = async () => {
    console.log('[GatewayCredentials] Edge Function falhou, tentando fallback direto no banco...');
    
    const { data: gatewayData, error: gwError } = await supabase
      .from('payment_gateways')
      .select('id')
      .eq('slug', gateway)
      .maybeSingle();

    if (gwError || !gatewayData) {
      console.error('[GatewayCredentials] Fallback: gateway não encontrado no banco:', gwError);
      throw new Error('Gateway não encontrado no banco de dados');
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuário não autenticado');

    // Se for super_admin, credenciais globais vêm de env vars (só acessíveis via Edge Function)
    if (isSuperAdmin) {
      console.log('[GatewayCredentials] Fallback: super_admin sem Edge Function - mostrando aviso');
      setCredentials({ client_id: null, client_secret: null });
      setSource('platform');
      setError('edge_function_unavailable');
      return;
    }

    // Admin: buscar credenciais próprias diretamente do banco
    const { data: sellerCreds, error: credsError } = await supabase
      .from('seller_gateway_credentials')
      .select('credentials')
      .eq('user_id', user.id)
      .eq('gateway_id', gatewayData.id)
      .eq('is_active', true)
      .maybeSingle();

    if (credsError) {
      console.error('[GatewayCredentials] Fallback: erro ao buscar credenciais:', credsError);
      throw credsError;
    }

    const creds = (sellerCreds?.credentials as unknown as Credentials) || { client_id: null, client_secret: null };
    console.log('[GatewayCredentials] Fallback: credenciais carregadas do banco com sucesso');
    setCredentials(creds);
    setEditCredentials({
      client_id: creds.client_id || '',
      client_secret: creds.client_secret || '',
    });
    setSource('admin');
  };

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
      setEditCredentials({
        client_id: data.credentials?.client_id || '',
        client_secret: data.credentials?.client_secret || '',
      });
      setSource(data.source || 'admin');
    } catch (err: any) {
      console.warn('[GatewayCredentials] Edge Function falhou:', err.message || err);
      
      // Fallback: buscar direto do banco
      try {
        await fetchCredentialsFallback();
      } catch (fallbackErr: any) {
        console.error('[GatewayCredentials] Fallback também falhou:', fallbackErr);
        setError(fallbackErr.message || 'Erro ao carregar credenciais');
        toast.error('Erro ao carregar credenciais');
      }
    } finally {
      setLoading(false);
    }
  };

  const saveCredentials = async () => {
    setSaving(true);
    
    try {
      // Get the gateway_id
      const { data: gatewayData, error: gatewayError } = await supabase
        .from('payment_gateways')
        .select('id')
        .eq('slug', gateway)
        .maybeSingle();

      if (gatewayError || !gatewayData) {
        throw new Error('Gateway não encontrado');
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      // Check if credential already exists
      const { data: existing } = await supabase
        .from('seller_gateway_credentials')
        .select('id')
        .eq('user_id', user.id)
        .eq('gateway_id', gatewayData.id)
        .maybeSingle();

      const credentialData = {
        client_id: editCredentials.client_id || null,
        client_secret: editCredentials.client_secret || null,
      };

      if (existing) {
        // Update
        const { error: updateError } = await supabase
          .from('seller_gateway_credentials')
          .update({
            credentials: credentialData,
            is_active: true,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id);

        if (updateError) throw updateError;
      } else {
        // Insert
        const { error: insertError } = await supabase
          .from('seller_gateway_credentials')
          .insert({
            user_id: user.id,
            gateway_id: gatewayData.id,
            credentials: credentialData,
            is_active: true,
          });

        if (insertError) throw insertError;
      }

      toast.success('Credenciais salvas com sucesso!');
      setCredentials(credentialData);
      setIsEditing(false);
    } catch (err: any) {
      console.error('Error saving credentials:', err);
      toast.error(err.message || 'Erro ao salvar credenciais');
    } finally {
      setSaving(false);
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

  const fields = gateway === 'ghostpay' 
    ? [
        { key: 'client_id' as const, label: 'Company ID' },
        { key: 'client_secret' as const, label: 'Secret Key' },
      ]
    : [
        { key: 'client_id' as const, label: 'Client ID' },
        { key: 'client_secret' as const, label: 'Client Secret' },
      ];

  const canEdit = !isSuperAdmin && source === 'admin';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Credenciais do {gatewayName}
          </DialogTitle>
          <DialogDescription>
            {isSuperAdmin 
              ? `Visualize as credenciais globais do gateway ${gatewayName}`
              : `Gerencie suas credenciais de API do gateway ${gatewayName}`
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {error && error !== 'edge_function_unavailable' && (
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-sm">
              <p className="text-destructive">{error}</p>
            </div>
          )}

          {error === 'edge_function_unavailable' && isSuperAdmin && (
            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-sm">
              <p className="text-amber-600 dark:text-amber-400">
                <strong>Função Edge indisponível:</strong> As credenciais globais são configuradas diretamente no servidor via variáveis de ambiente. Use o painel do servidor para gerenciá-las.
              </p>
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
          ) : isEditing ? (
            // Edit mode for admins
            fields.map((field) => (
              <div key={field.key} className="space-y-2">
                <Label htmlFor={`edit-${field.key}`}>{field.label}</Label>
                <Input
                  id={`edit-${field.key}`}
                  type={showSecrets[field.key] ? "text" : "password"}
                  value={editCredentials[field.key] || ''}
                  onChange={(e) => setEditCredentials(prev => ({ ...prev, [field.key]: e.target.value }))}
                  placeholder={`Digite o ${field.label}`}
                  className="font-mono text-sm"
                />
              </div>
            ))
          ) : (
            // View mode
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

          {!loading && !error && !isEditing && (
            <div className={`p-3 rounded-lg text-sm ${isSuperAdmin ? 'bg-blue-500/10 border border-blue-500/20' : 'bg-yellow-500/10 border border-yellow-500/20'}`}>
              <p className={isSuperAdmin ? 'text-blue-600 dark:text-blue-400' : 'text-yellow-600 dark:text-yellow-400'}>
                {isSuperAdmin ? (
                  <>
                    <strong>Super Admin:</strong> Estas são as credenciais globais da plataforma configuradas via secrets do Cloud.
                  </>
                ) : (
                  <>
                    <strong>Suas Credenciais:</strong> Configure suas próprias credenciais para processar pagamentos diretamente.
                  </>
                )}
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
          
          {!loading && !error && isEditing && (
            <>
              <Button variant="ghost" onClick={() => setIsEditing(false)}>
                Cancelar
              </Button>
              <Button onClick={saveCredentials} disabled={saving}>
                {saving ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Salvar
              </Button>
            </>
          )}
          
          {!loading && !error && !isEditing && (
            <>
              <Button onClick={fetchCredentials} variant="secondary">
                <Loader2 className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Atualizar
              </Button>
              {canEdit && (
                <Button onClick={() => setIsEditing(true)}>
                  <Edit2 className="h-4 w-4 mr-2" />
                  Editar
                </Button>
              )}
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
