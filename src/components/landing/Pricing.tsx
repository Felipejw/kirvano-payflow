import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Zap, Ban, Wallet, Clock } from "lucide-react";
import { Link } from "react-router-dom";

const features = [
  "Checkout customizável",
  "Pagamentos PIX instantâneo",
  "Sistema de afiliados completo",
  "Área de membros",
  "Order bump & upsell",
  "Webhooks e integrações",
  "Dashboard analítico",
  "Suporte dedicado",
];

const differentials = [
  { icon: Ban, text: "0 Estorno - PIX não tem chargeback" },
  { icon: Wallet, text: "Sem Taxa de Saque - Receba 100%" },
  { icon: Clock, text: "Saque 24/7 - A qualquer hora" },
];

export function Pricing() {
  return (
    <section id="pricing" className="py-24 relative">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,_var(--tw-gradient-stops))] from-accent/5 via-transparent to-transparent" />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold mb-4">
            Preço simples e
            <br />
            <span className="gradient-success-text">transparente</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Sem taxas escondidas. Sem mensalidade. Pague apenas quando vender.
          </p>
        </div>

        <div className="max-w-xl mx-auto">
          <Card 
            variant="glass"
            className="relative border-primary/50 shadow-glow-primary"
          >
            <div className="absolute -top-4 left-1/2 -translate-x-1/2">
              <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-gradient-primary text-primary-foreground text-xs font-semibold">
                <Zap className="h-3 w-3" />
                Único Plano
              </div>
            </div>
            
            <CardHeader className="text-center pb-2">
              <CardTitle className="text-2xl">Plano Completo</CardTitle>
              <p className="text-sm text-muted-foreground">Acesso total a todas as funcionalidades</p>
            </CardHeader>
            
            <CardContent className="space-y-8">
              <div className="text-center py-6 border-y border-border/50">
                <span className="text-6xl font-bold">4,99%</span>
                <p className="text-lg text-muted-foreground mt-2">por transação aprovada</p>
                <p className="text-sm text-accent mt-1">Sem mensalidade • Sem taxa de adesão</p>
              </div>

              {/* Diferenciais */}
              <div className="space-y-3">
                <p className="text-sm font-semibold text-center mb-4">Diferenciais exclusivos:</p>
                {differentials.map((diff) => (
                  <div key={diff.text} className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30">
                    <diff.icon className="h-5 w-5 text-accent shrink-0" />
                    <span className="text-sm font-medium">{diff.text}</span>
                  </div>
                ))}
              </div>

              {/* Features */}
              <div className="space-y-3">
                <p className="text-sm font-semibold text-center mb-4">Tudo incluído:</p>
                <div className="grid grid-cols-2 gap-2">
                  {features.map((feature) => (
                    <div key={feature} className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-accent shrink-0 mt-0.5" />
                      <span className="text-sm">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              <Link to="/auth" className="block">
                <Button 
                  variant="gradient" 
                  className="w-full"
                  size="lg"
                >
                  Começar Agora - É Grátis
                </Button>
              </Link>
              
              <p className="text-xs text-center text-muted-foreground">
                Crie sua conta gratuitamente e comece a vender em minutos
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
