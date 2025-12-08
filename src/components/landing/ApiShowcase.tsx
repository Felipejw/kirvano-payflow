import { Button } from "@/components/ui/button";
import { ArrowRight, Check, Code, Copy } from "lucide-react";
import { useState } from "react";

const codeExample = `// Criar cobrança PIX
const response = await fetch('https://api.pixpay.com.br/v1/charges', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer seu_token_aqui',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    amount: 9990, // R$ 99,90 em centavos
    description: 'Assinatura Premium',
    customer: {
      name: 'João Silva',
      email: 'joao@email.com',
      cpf: '12345678900'
    },
    expiration: 3600 // 1 hora
  })
});

const { qr_code, qr_code_base64, charge_id } = await response.json();

// Resposta
{
  "charge_id": "chr_abc123xyz",
  "status": "pending",
  "amount": 9990,
  "qr_code": "00020126...",
  "qr_code_base64": "data:image/png;base64,...",
  "expires_at": "2024-01-15T15:30:00Z"
}`;

const features = [
  "QR Code dinâmico instantâneo",
  "Webhooks em tempo real",
  "Consulta de status",
  "Autenticação JWT/OAuth2",
  "Rate limiting configurável",
  "Logs e rastreamento",
];

export function ApiShowcase() {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(codeExample);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section className="py-24 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent" />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 border border-accent/20">
              <Code className="h-4 w-4 text-accent" />
              <span className="text-sm font-medium text-accent">API Developer-Friendly</span>
            </div>

            <h2 className="text-3xl md:text-5xl font-bold leading-tight">
              API PIX para
              <br />
              <span className="gradient-success-text">integrar qualquer plataforma</span>
            </h2>

            <p className="text-xl text-muted-foreground">
              Disponibilize soluções de pagamento PIX para terceiros. 
              Documentação completa, SDKs e suporte técnico dedicado.
            </p>

            <ul className="grid grid-cols-2 gap-4">
              {features.map((feature) => (
                <li key={feature} className="flex items-center gap-2">
                  <div className="h-5 w-5 rounded-full bg-accent/10 flex items-center justify-center">
                    <Check className="h-3 w-3 text-accent" />
                  </div>
                  <span className="text-sm">{feature}</span>
                </li>
              ))}
            </ul>

            <div className="flex items-center gap-4">
              <Button variant="success" size="lg" className="gap-2">
                Ver Documentação
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="lg">
                Testar API
              </Button>
            </div>
          </div>

          {/* Code Block */}
          <div className="relative">
            <div className="glass-card overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 bg-secondary/50 border-b border-border">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-destructive/50" />
                  <div className="h-3 w-3 rounded-full bg-yellow-500/50" />
                  <div className="h-3 w-3 rounded-full bg-accent/50" />
                </div>
                <div className="text-xs text-muted-foreground font-mono">api-example.js</div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-7 gap-1"
                  onClick={handleCopy}
                >
                  {copied ? (
                    <>
                      <Check className="h-3 w-3 text-accent" />
                      <span className="text-xs">Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3" />
                      <span className="text-xs">Copiar</span>
                    </>
                  )}
                </Button>
              </div>
              <pre className="p-4 overflow-x-auto text-sm">
                <code className="language-javascript text-muted-foreground">
                  {codeExample.split('\n').map((line, i) => (
                    <div key={i} className="leading-relaxed">
                      {line.includes('//') ? (
                        <span className="text-accent">{line}</span>
                      ) : line.includes('"') ? (
                        <span>
                          {line.split(/"/).map((part, j) => 
                            j % 2 === 1 ? (
                              <span key={j} className="text-yellow-400">"{part}"</span>
                            ) : (
                              <span key={j}>{part}</span>
                            )
                          )}
                        </span>
                      ) : (
                        <span>{line}</span>
                      )}
                    </div>
                  ))}
                </code>
              </pre>
            </div>

            {/* Glow Effect */}
            <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 via-accent/20 to-primary/20 blur-3xl opacity-30 -z-10" />
          </div>
        </div>
      </div>
    </section>
  );
}
