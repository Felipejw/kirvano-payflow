import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Zap, Ban, Wallet, Clock } from "lucide-react";
import { Link } from "react-router-dom";
import { useScrollReveal } from "@/hooks/useScrollReveal";

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
  const { ref: headerRef, isVisible: headerVisible } = useScrollReveal<HTMLDivElement>({ threshold: 0.2 });
  const { ref: cardRef, isVisible: cardVisible } = useScrollReveal<HTMLDivElement>({ threshold: 0.2 });

  return (
    <section id="pricing" className="py-24 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,_var(--tw-gradient-stops))] from-accent/5 via-transparent to-transparent" />
      
      {/* Animated background */}
      <div className="absolute top-1/4 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-float" />
      <div className="absolute bottom-1/4 left-0 w-96 h-96 bg-accent/5 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
      
      <div className="container mx-auto px-4 relative z-10">
        <div 
          ref={headerRef}
          className={`text-center mb-16 transition-all duration-700 ${
            headerVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`}
        >
          <h2 className="text-3xl md:text-5xl font-bold mb-4">
            Preço simples e
            <br />
            <span className="gradient-success-text">transparente</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Sem taxas escondidas. Sem mensalidade. Pague apenas quando vender.
          </p>
        </div>

        <div 
          ref={cardRef}
          className={`max-w-xl mx-auto transition-all duration-700 ${
            cardVisible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-12 scale-95'
          }`}
          style={{ transitionDelay: '200ms' }}
        >
          <Card 
            variant="glass"
            className="relative border-primary/50 shadow-glow-primary hover:shadow-glow-accent transition-all duration-500 group"
          >
            <div className="absolute -top-4 left-1/2 -translate-x-1/2">
              <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-gradient-primary text-primary-foreground text-xs font-semibold animate-pulse-glow">
                <Zap className="h-3 w-3" />
                Único Plano
              </div>
            </div>
            
            <CardHeader className="text-center pb-2">
              <CardTitle className="text-2xl group-hover:text-primary transition-colors">Plano Completo</CardTitle>
              <p className="text-sm text-muted-foreground">Acesso total a todas as funcionalidades</p>
            </CardHeader>
            
            <CardContent className="space-y-8">
              <div className="text-center py-6 border-y border-border/50">
                <span className="text-6xl font-bold group-hover:scale-110 inline-block transition-transform">6,99%</span>
                <p className="text-lg text-muted-foreground mt-2">por transação aprovada</p>
                <p className="text-sm text-accent mt-1">Sem mensalidade • Sem taxa de adesão</p>
              </div>

              {/* Diferenciais */}
              <div className="space-y-3">
                <p className="text-sm font-semibold text-center mb-4">Diferenciais exclusivos:</p>
                {differentials.map((diff, index) => (
                  <div 
                    key={diff.text} 
                    className={`flex items-center gap-3 p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 hover:scale-[1.02] transition-all duration-300 cursor-default group/item ${
                      cardVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'
                    }`}
                    style={{ transitionDelay: `${400 + index * 100}ms` }}
                  >
                    <diff.icon className="h-5 w-5 text-accent shrink-0 group-hover/item:scale-110 transition-transform" />
                    <span className="text-sm font-medium">{diff.text}</span>
                  </div>
                ))}
              </div>

              {/* Features */}
              <div className="space-y-3">
                <p className="text-sm font-semibold text-center mb-4">Tudo incluído:</p>
                <div className="grid grid-cols-2 gap-2">
                  {features.map((feature, index) => (
                    <div 
                      key={feature} 
                      className={`flex items-start gap-2 hover:translate-x-1 transition-all duration-300 cursor-default ${
                        cardVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
                      }`}
                      style={{ transitionDelay: `${600 + index * 50}ms` }}
                    >
                      <Check className="h-4 w-4 text-accent shrink-0 mt-0.5" />
                      <span className="text-sm">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              <Link to="/auth" className="block">
                <Button 
                  variant="gradient" 
                  className="w-full group/btn relative overflow-hidden"
                  size="lg"
                >
                  <span className="relative z-10">Começar Agora - É Grátis</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-primary via-accent to-primary bg-[length:200%_100%] opacity-0 group-hover/btn:opacity-100 group-hover/btn:animate-shimmer transition-opacity" />
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