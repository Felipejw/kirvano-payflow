import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Copy, 
  Check, 
  Key, 
  Eye, 
  EyeOff, 
  RefreshCw,
  Code,
  Zap,
  Shield,
  Clock,
  ArrowRight,
  Settings,
  CreditCard,
  Wallet,
  Save,
  AlertCircle
} from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

const endpoints = [
  {
    method: "POST",
    path: "/v1/charges",
    description: "Criar nova cobrança PIX via BSPAY",
    badge: "Essencial",
  },
  {
    method: "GET",
    path: "/v1/charges/:id",
    description: "Consultar status de cobrança",
    badge: "Essencial",
  },
  {
    method: "POST",
    path: "/v1/webhook",
    description: "Receber confirmação de pagamento BSPAY",
    badge: "Webhook",
  },
  {
    method: "GET",
    path: "/v1/balance",
    description: "Consultar saldo disponível na BSPAY",
    badge: null,
  },
  {
    method: "POST",
    path: "/v1/webhooks",
    description: "Configurar webhook de notificação",
    badge: "Importante",
  },
];

const methodColors = {
  GET: "bg-accent/10 text-accent",
  POST: "bg-primary/10 text-primary",
  PUT: "bg-yellow-500/10 text-yellow-500",
  DELETE: "bg-destructive/10 text-destructive",
};

const ApiDocs = () => {
  const { user } = useAuth();
  const [showApiKey, setShowApiKey] = useState(false);
  const [copied, setCopied] = useState(false);
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [balance, setBalance] = useState<number | null>(null);
  const [balanceLoading, setBalanceLoading] = useState(false);

  useEffect(() => {
    if (user) {
      fetchApiKey();
    }
  }, [user]);

  const fetchApiKey = async () => {
    try {
      const { data, error } = await supabase
        .from('api_keys')
        .select('key_prefix')
        .eq('user_id', user?.id)
        .eq('status', 'active')
        .single();

      if (data) {
        setApiKey(`${data.key_prefix}${'x'.repeat(32)}`);
      }
    } catch (e) {
      console.log('No API key found');
    } finally {
      setLoading(false);
    }
  };

  const generateApiKey = async () => {
    if (!user) return;

    const newKey = `pk_live_${crypto.randomUUID().replace(/-/g, '')}`;
    const keyPrefix = newKey.substring(0, 12);
    
    // Hash the key
    const encoder = new TextEncoder();
    const data = encoder.encode(newKey);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const keyHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    // Deactivate old keys
    await supabase
      .from('api_keys')
      .update({ status: 'inactive' })
      .eq('user_id', user.id);

    // Create new key
    const { error } = await supabase
      .from('api_keys')
      .insert({
        user_id: user.id,
        name: 'API Key Principal',
        key_hash: keyHash,
        key_prefix: keyPrefix,
        permissions: ['pix:create', 'pix:read', 'pix:webhook'],
      });

    if (error) {
      toast.error('Erro ao gerar chave de API');
      return;
    }

    setApiKey(newKey);
    setShowApiKey(true);
    toast.success('Nova chave de API gerada! Copie-a agora, ela não será exibida novamente.');
  };

  const fetchBalance = async () => {
    setBalanceLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('pix-api', {
        body: {},
        method: 'GET',
      });

      // Use direct fetch for GET request
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/pix-api/balance`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.ok) {
        const balanceData = await response.json();
        setBalance(balanceData.balance);
        toast.success('Saldo atualizado');
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Erro ao consultar saldo');
      }
    } catch (e) {
      toast.error('Erro ao consultar saldo da BSPAY');
    } finally {
      setBalanceLoading(false);
    }
  };

  const handleCopy = () => {
    if (apiKey) {
      navigator.clipboard.writeText(apiKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">API PIX - BSPAY</h1>
            <p className="text-muted-foreground">Gateway de pagamentos integrado com BSPAY</p>
          </div>
          <Button variant="gradient" className="gap-2" asChild>
            <a href="https://bspay.readme.io" target="_blank" rel="noopener noreferrer">
              <Code className="h-4 w-4" />
              Documentação BSPAY
            </a>
          </Button>
        </div>

        {/* BSPAY Status Card */}
        <Card variant="glass" className="border-accent/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-accent" />
              Status BSPAY
            </CardTitle>
            <CardDescription>
              Suas credenciais BSPAY estão configuradas no servidor
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-accent animate-pulse"></div>
                <span className="text-sm font-medium">Gateway Conectado</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Wallet className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    Saldo: {balance !== null ? `R$ ${balance.toFixed(2)}` : '---'}
                  </span>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={fetchBalance}
                  disabled={balanceLoading}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${balanceLoading ? 'animate-spin' : ''}`} />
                  Atualizar
                </Button>
              </div>
            </div>
            <div className="mt-4 p-3 rounded-lg bg-muted/50">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div className="text-sm text-muted-foreground">
                  <p>As credenciais <strong>Client ID</strong> e <strong>Client Secret</strong> da BSPAY estão configuradas como secrets do servidor.</p>
                  <p className="mt-1">Para atualizar as credenciais, entre em contato com o suporte.</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* API Key Card */}
        <Card variant="glass" className="border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5 text-primary" />
              Sua Chave de API
            </CardTitle>
            <CardDescription>
              Use esta chave para autenticar suas requisições à API
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
              <div className="h-10 bg-muted animate-pulse rounded-md"></div>
            ) : apiKey ? (
              <div className="flex items-center gap-3">
                <div className="flex-1 relative">
                  <Input 
                    type={showApiKey ? "text" : "password"}
                    value={apiKey}
                    readOnly
                    className="font-mono pr-24"
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-7 w-7"
                      onClick={() => setShowApiKey(!showApiKey)}
                    >
                      {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-7 w-7"
                      onClick={handleCopy}
                    >
                      {copied ? <Check className="h-4 w-4 text-accent" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                <Button variant="outline" className="gap-2 shrink-0" onClick={generateApiKey}>
                  <RefreshCw className="h-4 w-4" />
                  Regenerar
                </Button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-4 py-4">
                <p className="text-muted-foreground text-center">
                  Você ainda não possui uma chave de API
                </p>
                <Button onClick={generateApiKey} className="gap-2">
                  <Key className="h-4 w-4" />
                  Gerar Chave de API
                </Button>
              </div>
            )}
            <p className="text-sm text-muted-foreground">
              Envie esta chave no header <code className="bg-muted px-1.5 py-0.5 rounded">x-api-key</code> das suas requisições.
            </p>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card variant="glass">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-primary/10">
                <Zap className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">PIX</p>
                <p className="text-sm text-muted-foreground">Via BSPAY</p>
              </div>
            </CardContent>
          </Card>
          <Card variant="glass">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-accent/10">
                <Clock className="h-6 w-6 text-accent" />
              </div>
              <div>
                <p className="text-2xl font-bold">Instantâneo</p>
                <p className="text-sm text-muted-foreground">Confirmação em tempo real</p>
              </div>
            </CardContent>
          </Card>
          <Card variant="glass">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-green-500/10">
                <Shield className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">Webhook</p>
                <p className="text-sm text-muted-foreground">Notificação automática</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Endpoints List */}
        <Card variant="glass">
          <CardHeader>
            <CardTitle>Endpoints Disponíveis</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {endpoints.map((endpoint) => (
              <div 
                key={endpoint.path}
                className="flex items-center justify-between p-4 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-4">
                  <span className={`px-2.5 py-1 rounded text-xs font-mono font-semibold ${methodColors[endpoint.method as keyof typeof methodColors]}`}>
                    {endpoint.method}
                  </span>
                  <code className="font-mono text-sm">{endpoint.path}</code>
                  {endpoint.badge && (
                    <Badge variant="info" className="text-xs">
                      {endpoint.badge}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-muted-foreground hidden md:block">
                    {endpoint.description}
                  </span>
                  <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Code Example */}
        <Card variant="glass">
          <CardHeader>
            <CardTitle>Exemplo de Integração</CardTitle>
            <CardDescription>Criando uma cobrança PIX via BSPAY</CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="code-block text-sm overflow-x-auto">
              <code>
{`// Criar cobrança PIX via API
const response = await fetch('${import.meta.env.VITE_SUPABASE_URL}/functions/v1/pix-api/charges', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': 'sua_chave_api_aqui'
  },
  body: JSON.stringify({
    amount: 99.90,
    buyer_email: 'cliente@email.com',
    buyer_name: 'João Silva',
    buyer_document: '12345678900',
    description: 'Pagamento do produto',
    expires_in_minutes: 30
  })
});

const charge = await response.json();

console.log(charge.qr_code);       // Código PIX copia e cola
console.log(charge.qr_code_base64); // Imagem do QR Code em base64
console.log(charge.external_id);    // ID da transação na BSPAY`}
              </code>
            </pre>
          </CardContent>
        </Card>

        {/* Webhook Example */}
        <Card variant="glass">
          <CardHeader>
            <CardTitle>Evento de Pagamento (Webhook)</CardTitle>
            <CardDescription>Payload enviado pela BSPAY quando o pagamento é confirmado</CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="code-block text-sm overflow-x-auto">
              <code>
{`// Payload recebido no seu webhook
{
  "requestBody": {
    "transactionType": "RECEIVEPIX",
    "transactionId": "c327ce8bee2a18565ec2m1zdu6px2keu",
    "external_id": "PIX123456789ABC",
    "amount": 99.90,
    "paymentType": "PIX",
    "status": "PAID",
    "dateApproval": "2024-12-08 16:07:10",
    "creditParty": {
      "name": "João Silva",
      "email": "cliente@email.com",
      "taxId": "12345678900"
    },
    "debitParty": {
      "bank": "BSPAY SOLUCOES DE PAGAMENTOS LTDA",
      "taxId": "46872831000154"
    }
  }
}`}
              </code>
            </pre>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default ApiDocs;
