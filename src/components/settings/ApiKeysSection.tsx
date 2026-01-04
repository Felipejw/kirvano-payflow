import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { 
  Key, 
  Plus, 
  Trash2, 
  Copy, 
  Eye, 
  EyeOff, 
  RefreshCw,
  Code,
  ExternalLink,
  AlertTriangle
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface ApiKey {
  id: string;
  name: string;
  key_prefix: string;
  status: string;
  created_at: string;
  last_used_at: string | null;
  expires_at: string | null;
}

// Generate a secure API key
function generateApiKey(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = 'gf_'; // prefix for GateFlow
  for (let i = 0; i < 45; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Hash API key using Web Crypto API
async function hashApiKey(key: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(key);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export function ApiKeysSection() {
  const { user } = useAuth();
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [showNewKey, setShowNewKey] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [docsOpen, setDocsOpen] = useState(false);

  const fetchApiKeys = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('api_keys')
        .select('id, name, key_prefix, status, created_at, last_used_at, expires_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setApiKeys(data || []);
    } catch (error) {
      console.error('Error fetching API keys:', error);
      toast.error('Erro ao carregar API keys');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApiKeys();
  }, [user]);

  const handleCreateKey = async () => {
    if (!user || !newKeyName.trim()) {
      toast.error('Nome da API key é obrigatório');
      return;
    }

    setCreating(true);
    try {
      const newKey = generateApiKey();
      const keyHash = await hashApiKey(newKey);
      const keyPrefix = newKey.substring(0, 8);

      const { error } = await supabase
        .from('api_keys')
        .insert({
          user_id: user.id,
          name: newKeyName.trim(),
          key_hash: keyHash,
          key_prefix: keyPrefix,
          status: 'active',
        });

      if (error) throw error;

      setShowNewKey(newKey);
      setNewKeyName("");
      await fetchApiKeys();
      toast.success('API key criada com sucesso!');
    } catch (error) {
      console.error('Error creating API key:', error);
      toast.error('Erro ao criar API key');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteKey = async (keyId: string) => {
    try {
      const { error } = await supabase
        .from('api_keys')
        .delete()
        .eq('id', keyId);

      if (error) throw error;

      await fetchApiKeys();
      toast.success('API key removida');
    } catch (error) {
      console.error('Error deleting API key:', error);
      toast.error('Erro ao remover API key');
    }
  };

  const handleToggleStatus = async (keyId: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
      const { error } = await supabase
        .from('api_keys')
        .update({ status: newStatus })
        .eq('id', keyId);

      if (error) throw error;

      await fetchApiKeys();
      toast.success(`API key ${newStatus === 'active' ? 'ativada' : 'desativada'}`);
    } catch (error) {
      console.error('Error toggling API key status:', error);
      toast.error('Erro ao atualizar status');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copiado para a área de transferência!');
  };

  const baseUrl = 'https://gfjsvuoqaheiaddvfrwb.supabase.co/functions/v1/external-payment-api';

  const codeExample = `// Criar uma cobrança PIX
const response = await fetch('${baseUrl}/create-charge', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': 'SUA_API_KEY_AQUI'
  },
  body: JSON.stringify({
    product_id: 'id-do-produto-no-gateflow',
    amount: 99.90,
    buyer_email: 'cliente@email.com',
    buyer_name: 'Nome do Cliente',
    buyer_document: '12345678900'
  })
});

const data = await response.json();
console.log(data.qr_code); // Código PIX copia e cola
console.log(data.charge_id); // ID para consultar status`;

  const statusExample = `// Consultar status de uma cobrança
const response = await fetch('${baseUrl}/status?charge_id=ID_DA_COBRANCA', {
  method: 'GET',
  headers: {
    'X-API-Key': 'SUA_API_KEY_AQUI'
  }
});

const data = await response.json();
console.log(data.charge.status); // pending, paid, expired`;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              API Keys
            </CardTitle>
            <CardDescription>
              Gerencie suas chaves de API para integração externa
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDocsOpen(!docsOpen)}
            >
              <Code className="h-4 w-4 mr-2" />
              Documentação
            </Button>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Nova API Key
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Criar Nova API Key</DialogTitle>
                  <DialogDescription>
                    Crie uma nova chave de API para integrar seu projeto externo.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="keyName">Nome da API Key</Label>
                    <Input
                      id="keyName"
                      placeholder="Ex: Meu Projeto Externo"
                      value={newKeyName}
                      onChange={(e) => setNewKeyName(e.target.value)}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleCreateKey} disabled={creating}>
                    {creating ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : null}
                    Criar API Key
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* New Key Display */}
        {showNewKey && (
          <div className="p-4 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg space-y-3">
            <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
              <AlertTriangle className="h-5 w-5" />
              <span className="font-medium">API Key criada! Copie agora, ela não será exibida novamente.</span>
            </div>
            <div className="flex items-center gap-2">
              <code className="flex-1 p-2 bg-white dark:bg-gray-900 rounded border text-sm break-all">
                {showNewKey}
              </code>
              <Button size="sm" variant="outline" onClick={() => copyToClipboard(showNewKey)}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setShowNewKey(null)}>
              Entendido, já copiei
            </Button>
          </div>
        )}

        {/* Documentation */}
        <Collapsible open={docsOpen} onOpenChange={setDocsOpen}>
          <CollapsibleContent className="space-y-4">
            <div className="p-4 bg-muted/50 rounded-lg space-y-4">
              <h4 className="font-medium">Endpoints Disponíveis</h4>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge>POST</Badge>
                  <code className="text-sm">/create-charge</code>
                  <span className="text-sm text-muted-foreground">- Criar cobrança PIX</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">GET</Badge>
                  <code className="text-sm">/status?charge_id=xxx</code>
                  <span className="text-sm text-muted-foreground">- Consultar status</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">GET</Badge>
                  <code className="text-sm">/charges</code>
                  <span className="text-sm text-muted-foreground">- Listar cobranças</span>
                </div>
              </div>

              <div className="space-y-2">
                <h5 className="font-medium text-sm">Criar Cobrança:</h5>
                <div className="relative">
                  <pre className="p-3 bg-gray-900 text-gray-100 rounded text-xs overflow-x-auto">
                    {codeExample}
                  </pre>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="absolute top-2 right-2"
                    onClick={() => copyToClipboard(codeExample)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <h5 className="font-medium text-sm">Consultar Status:</h5>
                <div className="relative">
                  <pre className="p-3 bg-gray-900 text-gray-100 rounded text-xs overflow-x-auto">
                    {statusExample}
                  </pre>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="absolute top-2 right-2"
                    onClick={() => copyToClipboard(statusExample)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="p-3 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded text-sm">
                <strong>Importante:</strong> O <code>product_id</code> deve ser de um produto cadastrado no GateFlow que pertence à sua conta.
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* API Keys List */}
        {loading ? (
          <div className="flex items-center justify-center p-8">
            <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : apiKeys.length === 0 ? (
          <div className="text-center p-8 text-muted-foreground">
            <Key className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhuma API key criada</p>
            <p className="text-sm">Crie uma API key para integrar seu projeto externo</p>
          </div>
        ) : (
          <div className="space-y-3">
            {apiKeys.map((key) => (
              <div
                key={key.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{key.name}</span>
                    <Badge variant={key.status === 'active' ? 'default' : 'secondary'}>
                      {key.status === 'active' ? 'Ativa' : 'Inativa'}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <code>{key.key_prefix}...</code>
                    <span>Criada: {new Date(key.created_at).toLocaleDateString('pt-BR')}</span>
                    {key.last_used_at && (
                      <span>Último uso: {new Date(key.last_used_at).toLocaleDateString('pt-BR')}</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleToggleStatus(key.id, key.status)}
                  >
                    {key.status === 'active' ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Remover API Key?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Esta ação é irreversível. Todas as integrações que usam esta key deixarão de funcionar.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDeleteKey(key.id)}>
                          Remover
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
