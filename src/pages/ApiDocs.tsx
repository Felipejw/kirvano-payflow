import { useState, useEffect, useRef } from "react";
import { ArrowLeft, ExternalLink, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DocsSidebar } from "@/components/docs/DocsSidebar";
import { CodeBlock } from "@/components/docs/CodeBlock";
import { CodeTabs } from "@/components/docs/CodeTabs";
import { EndpointCard } from "@/components/docs/EndpointCard";
import { ParameterTable } from "@/components/docs/ParameterTable";
import { useAppNavigate } from "@/lib/routes";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu } from "lucide-react";

const BASE_URL = "https://gfjsvuoqaheiaddvfrwb.supabase.co/functions/v1/external-payment-api";

export default function ApiDocs() {
  const [activeSection, setActiveSection] = useState("introduction");
  const navigate = useAppNavigate();
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});

  const scrollToSection = (sectionId: string) => {
    setActiveSection(sectionId);
    const element = sectionRefs.current[sectionId];
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { rootMargin: "-100px 0px -70% 0px" }
    );

    Object.values(sectionRefs.current).forEach((ref) => {
      if (ref) observer.observe(ref);
    });

    return () => observer.disconnect();
  }, []);

  const setSectionRef = (id: string) => (el: HTMLElement | null) => {
    sectionRefs.current[id] = el;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate("dashboard/settings")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
            <div className="hidden sm:flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              <span className="font-semibold">GateFlow API</span>
              <Badge variant="outline" className="text-xs">v1.0</Badge>
            </div>
          </div>
          
          {/* Mobile menu */}
          <Sheet>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="outline" size="sm">
                <Menu className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72">
              <div className="mt-6">
                <DocsSidebar activeSection={activeSection} onSectionChange={scrollToSection} />
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </header>

      <div className="container flex gap-8 py-8">
        {/* Sidebar - Desktop */}
        <aside className="hidden md:block w-64 shrink-0">
          <div className="sticky top-24">
            <DocsSidebar activeSection={activeSection} onSectionChange={scrollToSection} />
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-w-0 space-y-16">
          {/* Introduction */}
          <section id="introduction" ref={setSectionRef("introduction")}>
            <h1 className="text-3xl font-bold mb-4">API de Pagamentos PIX</h1>
            <p className="text-lg text-muted-foreground mb-6">
              Integre cobranças PIX em seu projeto externo de forma simples e segura. 
              Nossa API RESTful permite criar cobranças, consultar status e receber 
              notificações em tempo real via webhooks.
            </p>
            
            <div className="grid gap-4 md:grid-cols-3 mb-8">
              <div className="rounded-lg border border-border p-4 bg-card">
                <div className="text-2xl font-bold text-primary">REST</div>
                <p className="text-sm text-muted-foreground">API RESTful padrão</p>
              </div>
              <div className="rounded-lg border border-border p-4 bg-card">
                <div className="text-2xl font-bold text-primary">JSON</div>
                <p className="text-sm text-muted-foreground">Respostas em JSON</p>
              </div>
              <div className="rounded-lg border border-border p-4 bg-card">
                <div className="text-2xl font-bold text-primary">HTTPS</div>
                <p className="text-sm text-muted-foreground">Criptografia TLS</p>
              </div>
            </div>

            <div className="rounded-lg border border-border p-4 bg-muted/30">
              <h3 className="font-semibold mb-2">Base URL</h3>
              <code className="text-sm bg-background px-3 py-1.5 rounded border border-border block overflow-x-auto">
                {BASE_URL}
              </code>
            </div>
          </section>

          {/* Authentication */}
          <section id="authentication" ref={setSectionRef("authentication")}>
            <h2 className="text-2xl font-bold mb-4">Autenticação</h2>
            <p className="text-muted-foreground mb-6">
              Todas as requisições devem incluir sua API Key no header <code className="bg-muted px-1.5 py-0.5 rounded text-sm">X-API-Key</code>.
              Gere suas chaves em <strong>Configurações → Chaves de API</strong>.
            </p>

            <CodeBlock
              code={`// Header de autenticação
{
  "X-API-Key": "gf_live_sua_chave_api_aqui",
  "Content-Type": "application/json"
}`}
              language="json"
            />

            <div className="mt-6 rounded-lg border border-amber-500/20 bg-amber-500/5 p-4">
              <h4 className="font-semibold text-amber-500 mb-2">⚠️ Importante</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Nunca exponha sua API Key no frontend ou código público</li>
                <li>• Use variáveis de ambiente para armazenar a chave</li>
                <li>• Cada chave tem rate limit de 100 requisições/minuto</li>
              </ul>
            </div>
          </section>

          {/* Create Charge */}
          <section id="create-charge" ref={setSectionRef("create-charge")}>
            <h2 className="text-2xl font-bold mb-4">Criar Cobrança PIX</h2>
            
            <EndpointCard 
              method="POST" 
              path="/create-charge"
              description="Cria uma nova cobrança PIX e retorna o QR Code para pagamento."
            >
              <ParameterTable
                title="Body (JSON)"
                parameters={[
                  { name: "product_id", type: "string", required: false, description: "ID do produto. Opcional se a API Key estiver vinculada a um produto.", example: "uuid-do-produto" },
                  { name: "amount", type: "number", required: true, description: "Valor em reais (ex: 99.90)", example: "99.90" },
                  { name: "buyer_email", type: "string", required: true, description: "E-mail do comprador", example: "cliente@email.com" },
                  { name: "buyer_name", type: "string", required: false, description: "Nome do comprador", example: "João Silva" },
                  { name: "buyer_cpf", type: "string", required: false, description: "CPF do comprador (apenas números)", example: "12345678900" },
                  { name: "buyer_phone", type: "string", required: false, description: "Telefone com DDD", example: "11999998888" },
                  { name: "external_id", type: "string", required: false, description: "ID único do seu sistema para rastreamento", example: "pedido_123" },
                  { name: "expires_in_minutes", type: "number", required: false, description: "Tempo de expiração (padrão: 60)", example: "30" },
                ]}
              />

              <CodeTabs
                examples={[
                  {
                    language: "javascript",
                    label: "JavaScript",
                    code: `const response = await fetch("${BASE_URL}/create-charge", {
  method: "POST",
  headers: {
    "X-API-Key": "gf_live_sua_chave",
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    product_id: "seu-product-id",
    amount: 99.90,
    buyer_email: "cliente@email.com",
    buyer_name: "João Silva",
    external_id: "pedido_123"
  })
});

const data = await response.json();
console.log(data.qr_code); // URL do QR Code
console.log(data.copy_paste); // Código copia e cola`
                  },
                  {
                    language: "curl",
                    label: "cURL",
                    code: `curl -X POST "${BASE_URL}/create-charge" \\
  -H "X-API-Key: gf_live_sua_chave" \\
  -H "Content-Type: application/json" \\
  -d '{
    "product_id": "seu-product-id",
    "amount": 99.90,
    "buyer_email": "cliente@email.com",
    "buyer_name": "João Silva",
    "external_id": "pedido_123"
  }'`
                  },
                  {
                    language: "python",
                    label: "Python",
                    code: `import requests

response = requests.post(
    "${BASE_URL}/create-charge",
    headers={
        "X-API-Key": "gf_live_sua_chave",
        "Content-Type": "application/json"
    },
    json={
        "product_id": "seu-product-id",
        "amount": 99.90,
        "buyer_email": "cliente@email.com",
        "buyer_name": "João Silva",
        "external_id": "pedido_123"
    }
)

data = response.json()
print(data["qr_code"])  # URL do QR Code`
                  }
                ]}
              />

              <div className="mt-4">
                <h4 className="text-sm font-semibold mb-2">Resposta de Sucesso (201)</h4>
                <CodeBlock
                  language="json"
                  code={`{
  "success": true,
  "charge": {
    "id": "uuid-da-cobranca",
    "external_id": "pedido_123",
    "amount": 99.90,
    "status": "pending",
    "qr_code": "https://url-do-qrcode.png",
    "copy_paste": "00020126580014br.gov.bcb.pix...",
    "expires_at": "2026-01-05T13:00:00Z",
    "created_at": "2026-01-05T12:00:00Z"
  }
}`}
                />
              </div>
            </EndpointCard>
          </section>

          {/* Check Status */}
          <section id="check-status" ref={setSectionRef("check-status")}>
            <h2 className="text-2xl font-bold mb-4">Consultar Status</h2>
            
            <EndpointCard 
              method="GET" 
              path="/status?charge_id={id}"
              description="Consulta o status atual de uma cobrança específica."
            >
              <ParameterTable
                title="Query Parameters"
                parameters={[
                  { name: "charge_id", type: "string", required: true, description: "ID da cobrança retornado na criação", example: "uuid-da-cobranca" },
                ]}
              />

              <CodeTabs
                examples={[
                  {
                    language: "javascript",
                    label: "JavaScript",
                    code: `const chargeId = "uuid-da-cobranca";

const response = await fetch(
  \`${BASE_URL}/status?charge_id=\${chargeId}\`,
  {
    headers: {
      "X-API-Key": "gf_live_sua_chave"
    }
  }
);

const data = await response.json();

if (data.charge.status === "paid") {
  console.log("Pagamento confirmado!");
  console.log("Pago em:", data.charge.paid_at);
}`
                  },
                  {
                    language: "curl",
                    label: "cURL",
                    code: `curl "${BASE_URL}/status?charge_id=uuid-da-cobranca" \\
  -H "X-API-Key: gf_live_sua_chave"`
                  },
                  {
                    language: "python",
                    label: "Python",
                    code: `import requests

response = requests.get(
    f"${BASE_URL}/status",
    headers={"X-API-Key": "gf_live_sua_chave"},
    params={"charge_id": "uuid-da-cobranca"}
)

data = response.json()

if data["charge"]["status"] == "paid":
    print("Pagamento confirmado!")
    print(f"Pago em: {data['charge']['paid_at']}")`
                  }
                ]}
              />

              <div className="mt-4">
                <h4 className="text-sm font-semibold mb-2">Resposta (200)</h4>
                <CodeBlock
                  language="json"
                  code={`{
  "success": true,
  "charge": {
    "id": "uuid-da-cobranca",
    "external_id": "pedido_123",
    "amount": 99.90,
    "status": "paid",
    "paid_at": "2026-01-05T12:05:00Z",
    "buyer": {
      "email": "cliente@email.com",
      "name": "João Silva"
    }
  },
  "transaction": {
    "id": "uuid-da-transacao",
    "gateway_transaction_id": "TXN123456"
  }
}`}
                />
              </div>
            </EndpointCard>
          </section>

          {/* List Charges */}
          <section id="list-charges" ref={setSectionRef("list-charges")}>
            <h2 className="text-2xl font-bold mb-4">Listar Cobranças</h2>
            
            <EndpointCard 
              method="GET" 
              path="/charges"
              description="Lista todas as cobranças com suporte a paginação e filtros."
            >
              <ParameterTable
                title="Query Parameters"
                parameters={[
                  { name: "limit", type: "number", required: false, description: "Quantidade por página (máx: 100)", example: "20" },
                  { name: "offset", type: "number", required: false, description: "Quantidade a pular para paginação", example: "0" },
                  { name: "status", type: "string", required: false, description: "Filtrar por status: pending, paid, expired", example: "paid" },
                  { name: "product_id", type: "string", required: false, description: "Filtrar por produto específico", example: "uuid-produto" },
                ]}
              />

              <CodeTabs
                examples={[
                  {
                    language: "javascript",
                    label: "JavaScript",
                    code: `const params = new URLSearchParams({
  limit: "20",
  offset: "0",
  status: "paid"
});

const response = await fetch(
  \`${BASE_URL}/charges?\${params}\`,
  {
    headers: {
      "X-API-Key": "gf_live_sua_chave"
    }
  }
);

const data = await response.json();
console.log(\`Total: \${data.pagination.total}\`);
data.charges.forEach(charge => {
  console.log(\`\${charge.id}: R$ \${charge.amount}\`);
});`
                  },
                  {
                    language: "curl",
                    label: "cURL",
                    code: `curl "${BASE_URL}/charges?limit=20&status=paid" \\
  -H "X-API-Key: gf_live_sua_chave"`
                  },
                  {
                    language: "python",
                    label: "Python",
                    code: `import requests

response = requests.get(
    f"${BASE_URL}/charges",
    headers={"X-API-Key": "gf_live_sua_chave"},
    params={
        "limit": 20,
        "offset": 0,
        "status": "paid"
    }
)

data = response.json()
print(f"Total: {data['pagination']['total']}")

for charge in data["charges"]:
    print(f"{charge['id']}: R$ {charge['amount']}")`
                  }
                ]}
              />
            </EndpointCard>
          </section>

          {/* Webhooks */}
          <section id="webhooks" ref={setSectionRef("webhooks")}>
            <h2 className="text-2xl font-bold mb-4">Webhooks</h2>
            <p className="text-muted-foreground mb-6">
              Receba notificações em tempo real quando um pagamento for confirmado. 
              Configure um endpoint no seu servidor para receber os eventos.
            </p>

            <EndpointCard 
              method="POST" 
              path="/webhook/register"
              description="Registra uma URL para receber notificações de pagamento."
            >
              <ParameterTable
                title="Body (JSON)"
                parameters={[
                  { name: "url", type: "string", required: true, description: "URL HTTPS do seu endpoint", example: "https://seu-site.com/webhook" },
                  { name: "events", type: "string[]", required: false, description: "Eventos para receber (padrão: todos)", example: '["payment.confirmed"]' },
                ]}
              />

              <CodeBlock
                language="javascript"
                code={`const response = await fetch("${BASE_URL}/webhook/register", {
  method: "POST",
  headers: {
    "X-API-Key": "gf_live_sua_chave",
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    url: "https://seu-site.com/api/webhook",
    events: ["payment.confirmed"]
  })
});

const data = await response.json();
console.log("Webhook Secret:", data.webhook.secret);
// IMPORTANTE: Guarde o secret para validar as requisições!`}
              />
            </EndpointCard>

            <div className="mt-8">
              <h3 className="text-xl font-semibold mb-4">Payload do Webhook</h3>
              <p className="text-muted-foreground mb-4">
                Quando um pagamento for confirmado, enviaremos um POST para sua URL com o seguinte payload:
              </p>

              <CodeBlock
                language="json"
                code={`{
  "event": "payment.confirmed",
  "timestamp": "2026-01-05T12:05:00Z",
  "data": {
    "charge_id": "uuid-da-cobranca",
    "external_id": "pedido_123",
    "amount": 99.90,
    "status": "paid",
    "paid_at": "2026-01-05T12:05:00Z",
    "buyer": {
      "email": "cliente@email.com",
      "name": "João Silva",
      "cpf": "123.456.789-00"
    },
    "product": {
      "id": "uuid-do-produto",
      "name": "Nome do Produto"
    }
  }
}`}
              />
            </div>

            <div className="mt-8">
              <h3 className="text-xl font-semibold mb-4">Validando a Assinatura</h3>
              <p className="text-muted-foreground mb-4">
                Cada webhook inclui um header <code className="bg-muted px-1.5 py-0.5 rounded">X-Webhook-Signature</code> 
                com uma assinatura HMAC-SHA256. Valide para garantir que a requisição é legítima:
              </p>

              <CodeTabs
                examples={[
                  {
                    language: "javascript",
                    label: "Node.js",
                    code: `const crypto = require('crypto');

function validateWebhook(payload, signature, secret) {
  const expected = 'sha256=' + crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(payload))
    .digest('hex');
  
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expected)
  );
}

// No seu endpoint:
app.post('/webhook', (req, res) => {
  const signature = req.headers['x-webhook-signature'];
  const isValid = validateWebhook(req.body, signature, WEBHOOK_SECRET);
  
  if (!isValid) {
    return res.status(401).json({ error: 'Invalid signature' });
  }
  
  // Processar o evento
  if (req.body.event === 'payment.confirmed') {
    console.log('Pagamento confirmado:', req.body.data.charge_id);
  }
  
  res.status(200).json({ received: true });
});`
                  },
                  {
                    language: "python",
                    label: "Python",
                    code: `import hmac
import hashlib
import json

def validate_webhook(payload, signature, secret):
    expected = 'sha256=' + hmac.new(
        secret.encode(),
        json.dumps(payload).encode(),
        hashlib.sha256
    ).hexdigest()
    
    return hmac.compare_digest(signature, expected)

# No seu endpoint Flask:
@app.route('/webhook', methods=['POST'])
def webhook():
    signature = request.headers.get('X-Webhook-Signature')
    
    if not validate_webhook(request.json, signature, WEBHOOK_SECRET):
        return {'error': 'Invalid signature'}, 401
    
    if request.json['event'] == 'payment.confirmed':
        print(f"Pagamento confirmado: {request.json['data']['charge_id']}")
    
    return {'received': True}, 200`
                  }
                ]}
              />
            </div>
          </section>

          {/* Error Codes */}
          <section id="errors" ref={setSectionRef("errors")}>
            <h2 className="text-2xl font-bold mb-4">Códigos de Erro</h2>
            <p className="text-muted-foreground mb-6">
              A API retorna erros em formato padronizado com código HTTP e mensagem descritiva.
            </p>

            <div className="rounded-lg border border-border overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/50 border-b border-border">
                    <th className="text-left px-4 py-3 font-medium">Código</th>
                    <th className="text-left px-4 py-3 font-medium">Descrição</th>
                    <th className="text-left px-4 py-3 font-medium hidden md:table-cell">Solução</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-border">
                    <td className="px-4 py-3"><Badge variant="outline" className="bg-amber-500/10 text-amber-500">400</Badge></td>
                    <td className="px-4 py-3">Bad Request</td>
                    <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">Verifique os parâmetros enviados</td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="px-4 py-3"><Badge variant="outline" className="bg-rose-500/10 text-rose-500">401</Badge></td>
                    <td className="px-4 py-3">Unauthorized</td>
                    <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">API Key inválida ou ausente</td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="px-4 py-3"><Badge variant="outline" className="bg-rose-500/10 text-rose-500">403</Badge></td>
                    <td className="px-4 py-3">Forbidden</td>
                    <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">Sem permissão para o recurso</td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="px-4 py-3"><Badge variant="outline" className="bg-amber-500/10 text-amber-500">404</Badge></td>
                    <td className="px-4 py-3">Not Found</td>
                    <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">Recurso não encontrado</td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="px-4 py-3"><Badge variant="outline" className="bg-amber-500/10 text-amber-500">429</Badge></td>
                    <td className="px-4 py-3">Too Many Requests</td>
                    <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">Rate limit excedido, aguarde</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3"><Badge variant="outline" className="bg-rose-500/10 text-rose-500">500</Badge></td>
                    <td className="px-4 py-3">Server Error</td>
                    <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">Erro interno, tente novamente</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="mt-6">
              <h4 className="text-sm font-semibold mb-2">Exemplo de Resposta de Erro</h4>
              <CodeBlock
                language="json"
                code={`{
  "success": false,
  "error": "Invalid API key",
  "code": "INVALID_API_KEY"
}`}
              />
            </div>
          </section>

          {/* Complete Examples */}
          <section id="examples" ref={setSectionRef("examples")}>
            <h2 className="text-2xl font-bold mb-4">Exemplo Completo</h2>
            <p className="text-muted-foreground mb-6">
              Fluxo completo de integração: criar cobrança, exibir QR Code e verificar pagamento.
            </p>

            <CodeBlock
              language="javascript"
              code={`// 1. Criar a cobrança
async function createPixPayment(orderData) {
  const response = await fetch("${BASE_URL}/create-charge", {
    method: "POST",
    headers: {
      "X-API-Key": process.env.GATEFLOW_API_KEY,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      product_id: "seu-product-id",
      amount: orderData.total,
      buyer_email: orderData.customerEmail,
      buyer_name: orderData.customerName,
      external_id: orderData.orderId
    })
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error);
  }
  
  return response.json();
}

// 2. Exibir QR Code para o cliente
function showQRCode(charge) {
  document.getElementById('qrcode').src = charge.qr_code;
  document.getElementById('copypaste').value = charge.copy_paste;
  
  // Iniciar polling para verificar pagamento
  pollPaymentStatus(charge.id);
}

// 3. Verificar status periodicamente
async function pollPaymentStatus(chargeId) {
  const interval = setInterval(async () => {
    const response = await fetch(
      \`${BASE_URL}/status?charge_id=\${chargeId}\`,
      { headers: { "X-API-Key": process.env.GATEFLOW_API_KEY } }
    );
    
    const data = await response.json();
    
    if (data.charge.status === 'paid') {
      clearInterval(interval);
      showSuccessMessage();
      // Redirecionar ou processar pedido
    } else if (data.charge.status === 'expired') {
      clearInterval(interval);
      showExpiredMessage();
    }
  }, 5000); // Verificar a cada 5 segundos
  
  // Parar após 1 hora
  setTimeout(() => clearInterval(interval), 3600000);
}

// Uso
const charge = await createPixPayment({
  orderId: 'pedido_123',
  total: 99.90,
  customerEmail: 'cliente@email.com',
  customerName: 'João Silva'
});

showQRCode(charge.charge);`}
            />
          </section>

          {/* SDK */}
          <section id="sdk" ref={setSectionRef("sdk")}>
            <h2 className="text-2xl font-bold mb-4">SDK JavaScript</h2>
            <p className="text-muted-foreground mb-6">
              Classe utilitária para simplificar a integração com a API.
            </p>

            <CodeBlock
              language="javascript"
              code={`class GateFlowAPI {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseUrl = "${BASE_URL}";
  }

  async request(endpoint, options = {}) {
    const response = await fetch(\`\${this.baseUrl}\${endpoint}\`, {
      ...options,
      headers: {
        "X-API-Key": this.apiKey,
        "Content-Type": "application/json",
        ...options.headers
      }
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'API Error');
    }
    
    return data;
  }

  async createCharge(params) {
    return this.request("/create-charge", {
      method: "POST",
      body: JSON.stringify(params)
    });
  }

  async getStatus(chargeId) {
    return this.request(\`/status?charge_id=\${chargeId}\`);
  }

  async listCharges(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(\`/charges?\${query}\`);
  }

  async registerWebhook(url, events = ["payment.confirmed"]) {
    return this.request("/webhook/register", {
      method: "POST",
      body: JSON.stringify({ url, events })
    });
  }

  // Polling helper
  waitForPayment(chargeId, { interval = 5000, timeout = 3600000 } = {}) {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      
      const check = async () => {
        try {
          const { charge } = await this.getStatus(chargeId);
          
          if (charge.status === 'paid') {
            resolve(charge);
          } else if (charge.status === 'expired') {
            reject(new Error('Charge expired'));
          } else if (Date.now() - startTime > timeout) {
            reject(new Error('Timeout'));
          } else {
            setTimeout(check, interval);
          }
        } catch (error) {
          reject(error);
        }
      };
      
      check();
    });
  }
}

// Uso
const gateflow = new GateFlowAPI(process.env.GATEFLOW_API_KEY);

// Criar cobrança e aguardar pagamento
const { charge } = await gateflow.createCharge({
  product_id: "uuid-produto",
  amount: 99.90,
  buyer_email: "cliente@email.com"
});

console.log("QR Code:", charge.qr_code);

// Aguardar pagamento (com timeout de 10 minutos)
try {
  const paidCharge = await gateflow.waitForPayment(charge.id, { 
    timeout: 600000 
  });
  console.log("Pago!", paidCharge);
} catch (error) {
  console.error("Falha:", error.message);
}`}
            />
          </section>

          {/* Footer */}
          <div className="border-t border-border pt-8 mt-8">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-sm text-muted-foreground">
                Precisa de ajuda? Entre em contato pelo suporte.
              </p>
              <Button variant="outline" size="sm" onClick={() => navigate("dashboard/settings")}>
                <ExternalLink className="h-4 w-4 mr-2" />
                Gerenciar API Keys
              </Button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
