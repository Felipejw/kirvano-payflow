import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Zap } from "lucide-react";

const plans = [
  {
    name: "Starter",
    description: "Para começar a vender online",
    price: "1,99%",
    priceLabel: "por transação",
    features: [
      "Checkout customizável",
      "Pagamentos PIX",
      "Painel de vendas",
      "Relatórios básicos",
      "Suporte por email",
    ],
    cta: "Começar Grátis",
    popular: false,
  },
  {
    name: "Pro",
    description: "Para negócios em crescimento",
    price: "1,49%",
    priceLabel: "por transação",
    features: [
      "Tudo do Starter, mais:",
      "Sistema de afiliados",
      "Área de membros",
      "Order bump & upsell",
      "Webhooks personalizados",
      "Suporte prioritário",
    ],
    cta: "Começar Agora",
    popular: true,
  },
  {
    name: "Enterprise",
    description: "Solução completa + API",
    price: "Sob consulta",
    priceLabel: "negociação especial",
    features: [
      "Tudo do Pro, mais:",
      "API PIX ilimitada",
      "White-label disponível",
      "SLA garantido 99.9%",
      "Gerente de conta",
      "Integração dedicada",
    ],
    cta: "Falar com Vendas",
    popular: false,
  },
];

export function Pricing() {
  return (
    <section className="py-24 relative">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,_var(--tw-gradient-stops))] from-accent/5 via-transparent to-transparent" />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold mb-4">
            Planos que crescem
            <br />
            <span className="gradient-success-text">com seu negócio</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Sem taxas escondidas. Pague apenas pelo que usar.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {plans.map((plan) => (
            <Card 
              key={plan.name} 
              variant="glass"
              className={`relative ${plan.popular ? 'border-primary/50 shadow-glow-primary' : ''}`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-gradient-primary text-primary-foreground text-xs font-semibold">
                    <Zap className="h-3 w-3" />
                    Mais Popular
                  </div>
                </div>
              )}
              <CardHeader className="text-center pb-2">
                <CardTitle className="text-xl">{plan.name}</CardTitle>
                <p className="text-sm text-muted-foreground">{plan.description}</p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="text-center">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  <p className="text-sm text-muted-foreground">{plan.priceLabel}</p>
                </div>

                <ul className="space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-accent shrink-0 mt-0.5" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button 
                  variant={plan.popular ? "gradient" : "outline"} 
                  className="w-full"
                  size="lg"
                >
                  {plan.cta}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
