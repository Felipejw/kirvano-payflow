import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { getPageUrl } from "@/lib/routes";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { 
  Zap, 
  CreditCard, 
  Building2, 
  ArrowRight, 
  Check,
  Banknote,
  Sparkles
} from "lucide-react";

const paymentFeatures = [
  {
    icon: Zap,
    title: "PIX Instantâneo",
    description: "Receba em segundos, 24 horas por dia, 7 dias por semana. Sem esperar dias úteis.",
    highlight: "Aprovação em 2s",
    color: "from-green-500 to-emerald-500",
  },
  {
    icon: CreditCard,
    title: "Cartão de Crédito",
    description: "Aceite Visa, Mastercard, Elo e American Express. Parcelamento em até 12x.",
    highlight: "Todas as bandeiras",
    color: "from-blue-500 to-indigo-500",
  },
  {
    icon: Building2,
    title: "Sua Conta Bancária",
    description: "Conecte sua própria conta do banco para receber. O dinheiro vai direto pra você.",
    highlight: "Sem intermediários",
    color: "from-purple-500 to-violet-500",
  },
];

const benefits = [
  "Saque grátis a qualquer hora",
  "Dinheiro na sua conta em segundos",
  "Sem taxa de antecipação",
  "Sem retenção de valores",
  "Dashboard em tempo real",
  "Relatórios detalhados",
];

export function PaymentMethods() {
  const { ref, isVisible } = useScrollReveal<HTMLElement>({ threshold: 0.1 });

  return (
    <section ref={ref} className="py-24 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-muted/30 via-background to-muted/30" />
      <div className="absolute top-1/2 left-0 w-[400px] h-[400px] bg-primary/5 rounded-full blur-3xl -translate-y-1/2" />
      <div className="absolute top-1/2 right-0 w-[400px] h-[400px] bg-accent/5 rounded-full blur-3xl -translate-y-1/2" />
      
      <div className="container mx-auto px-4 relative z-10">
        {/* Header */}
        <div className={`text-center mb-16 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
            <Banknote className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-primary">Formas de Pagamento</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-bold mb-4">
            Receba como{" "}
            <span className="gradient-text">você preferir</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Múltiplas opções de pagamento para seus clientes, recebimento direto para você
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
          {/* Payment Cards */}
          <div className="space-y-6">
            {paymentFeatures.map((feature, index) => (
              <Card 
                key={feature.title}
                className={`bg-background/80 backdrop-blur-sm border-border/50 hover:border-primary/50 hover:shadow-xl transition-all duration-500 group ${
                  isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-10'
                }`}
                style={{ transitionDelay: `${index * 150}ms` }}
              >
                <CardContent className="p-6 flex items-start gap-5">
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform`}>
                    <feature.icon className="h-7 w-7 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-xl font-semibold group-hover:text-primary transition-colors">
                        {feature.title}
                      </h3>
                      <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
                        {feature.highlight}
                      </span>
                    </div>
                    <p className="text-muted-foreground leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Benefits Side */}
          <div className={`transition-all duration-700 delay-300 ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-10'}`}>
            <Card className="bg-gradient-to-br from-primary/10 via-primary/5 to-accent/10 border-primary/20">
              <CardContent className="p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                    <Sparkles className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">Vantagens exclusivas</h3>
                    <p className="text-sm text-muted-foreground">Para todos os usuários</p>
                  </div>
                </div>
                
                <div className="grid gap-4">
                  {benefits.map((benefit, index) => (
                    <div 
                      key={benefit}
                      className="flex items-center gap-3 group"
                      style={{ transitionDelay: `${400 + index * 50}ms` }}
                    >
                      <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0 group-hover:bg-accent/30 transition-colors">
                        <Check className="h-4 w-4 text-accent" />
                      </div>
                      <span className="text-foreground group-hover:text-primary transition-colors">
                        {benefit}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="mt-8 pt-6 border-t border-border/50">
                  <Link to={getPageUrl("auth")}>
                    <Button variant="gradient" size="lg" className="w-full group">
                      Começar a Receber Agora
                      <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
}
