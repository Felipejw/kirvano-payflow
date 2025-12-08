import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
  ArrowRight
} from "lucide-react";
import { useState } from "react";

const endpoints = [
  {
    method: "POST",
    path: "/v1/charges",
    description: "Criar nova cobrança PIX",
    badge: "Essencial",
  },
  {
    method: "GET",
    path: "/v1/charges/:id",
    description: "Consultar status de cobrança",
    badge: "Essencial",
  },
  {
    method: "DELETE",
    path: "/v1/charges/:id",
    description: "Cancelar cobrança pendente",
    badge: null,
  },
  {
    method: "GET",
    path: "/v1/charges",
    description: "Listar todas as cobranças",
    badge: null,
  },
  {
    method: "POST",
    path: "/v1/webhooks",
    description: "Configurar webhook de notificação",
    badge: "Importante",
  },
  {
    method: "GET",
    path: "/v1/balance",
    description: "Consultar saldo disponível",
    badge: null,
  },
];

const methodColors = {
  GET: "bg-accent/10 text-accent",
  POST: "bg-primary/10 text-primary",
  PUT: "bg-yellow-500/10 text-yellow-500",
  DELETE: "bg-destructive/10 text-destructive",
};

const ApiDocs = () => {
  const [showApiKey, setShowApiKey] = useState(false);
  const [copied, setCopied] = useState(false);
  const apiKey = "pk_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx";

  const handleCopy = () => {
    navigator.clipboard.writeText(apiKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">API PIX</h1>
            <p className="text-muted-foreground">Documentação e chaves de acesso</p>
          </div>
          <Button variant="gradient" className="gap-2">
            <Code className="h-4 w-4" />
            Ver Documentação Completa
          </Button>
        </div>

        {/* API Key Card */}
        <Card variant="glass" className="border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5 text-primary" />
              Chave de API
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
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
              <Button variant="outline" className="gap-2 shrink-0">
                <RefreshCw className="h-4 w-4" />
                Regenerar
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Use esta chave para autenticar suas requisições. Mantenha-a em segurança e nunca a exponha em código cliente.
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
                <p className="text-2xl font-bold">2.5k</p>
                <p className="text-sm text-muted-foreground">Requisições/dia</p>
              </div>
            </CardContent>
          </Card>
          <Card variant="glass">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-accent/10">
                <Clock className="h-6 w-6 text-accent" />
              </div>
              <div>
                <p className="text-2xl font-bold">45ms</p>
                <p className="text-sm text-muted-foreground">Latência média</p>
              </div>
            </CardContent>
          </Card>
          <Card variant="glass">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-green-500/10">
                <Shield className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">99.9%</p>
                <p className="text-sm text-muted-foreground">Uptime</p>
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
          </CardHeader>
          <CardContent>
            <pre className="code-block text-sm overflow-x-auto">
              <code>
{`// Instale o SDK
npm install @pixpay/node-sdk

// Configure o cliente
import { PixPay } from '@pixpay/node-sdk';

const client = new PixPay({
  apiKey: process.env.PIXPAY_API_KEY,
  environment: 'production'
});

// Crie uma cobrança PIX
const charge = await client.charges.create({
  amount: 9990, // R$ 99,90
  description: 'Assinatura Premium',
  customer: {
    name: 'João Silva',
    email: 'joao@email.com',
    cpf: '12345678900'
  },
  expiresIn: 3600 // 1 hora
});

console.log(charge.qrCode); // QR Code PIX
console.log(charge.qrCodeBase64); // Imagem do QR Code`}
              </code>
            </pre>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default ApiDocs;
