import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { getPageUrl } from "@/lib/routes";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { 
  Check, 
  ArrowRight, 
  Sparkles,
  Zap,
  Shield,
  Clock
} from "lucide-react";

const benefits = [
  "Taxa mais baixa: 4,99% + R$1",
  "Zero estorno com PIX",
  "Saque grátis 24/7",
  "Order bump e recuperação de carrinho",
  "Área de membros inclusa",
  "Pixel integrado com Meta, Google, TikTok",
  "Suporte via WhatsApp",
  "Sem cartão de crédito para começar",
];

const highlights = [
  { icon: Zap, text: "Ativação instantânea" },
  { icon: Shield, text: "100% seguro" },
  { icon: Clock, text: "Suporte 24h" },
];

export function FinalCTA() {
  const { ref, isVisible } = useScrollReveal<HTMLElement>({ threshold: 0.2 });

  return (
    <section ref={ref} className="py-24 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-primary/5 to-background" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/10 rounded-full blur-3xl" />
      <div className="absolute top-0 left-0 w-full h-full bg-[linear-gradient(to_right,hsl(var(--border)/0.05)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border)/0.05)_1px,transparent_1px)] bg-[size:4rem_4rem]" />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className={`max-w-4xl mx-auto text-center transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 border border-accent/20 mb-8">
            <Sparkles className="h-4 w-4 text-accent animate-pulse" />
            <span className="text-sm font-medium text-accent">Comece em menos de 5 minutos</span>
          </div>

          {/* Heading */}
          <h2 className="text-3xl md:text-5xl lg:text-6xl font-bold mb-6">
            Pronto para{" "}
            <span className="gradient-text">aumentar seus lucros?</span>
          </h2>
          
          <p className="text-xl text-muted-foreground mb-12 max-w-2xl mx-auto">
            Junte-se a milhares de infoprodutores que já economizam com a Gatteflow
          </p>

          {/* Benefits Grid */}
          <div className={`grid grid-cols-1 sm:grid-cols-2 gap-4 mb-12 text-left max-w-2xl mx-auto transition-all duration-700 delay-200 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            {benefits.map((benefit, index) => (
              <div 
                key={benefit}
                className="flex items-center gap-3 p-3 rounded-xl bg-background/50 border border-border/50 hover:border-primary/50 hover:bg-primary/5 transition-all group"
                style={{ transitionDelay: `${200 + index * 50}ms` }}
              >
                <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0 group-hover:bg-accent/30 group-hover:scale-110 transition-all">
                  <Check className="h-4 w-4 text-accent" />
                </div>
                <span className="text-sm font-medium group-hover:text-primary transition-colors">
                  {benefit}
                </span>
              </div>
            ))}
          </div>

          {/* Highlights */}
          <div className={`flex flex-wrap items-center justify-center gap-6 mb-12 transition-all duration-700 delay-400 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            {highlights.map((item) => (
              <div key={item.text} className="flex items-center gap-2 text-muted-foreground">
                <item.icon className="h-5 w-5 text-primary" />
                <span className="text-sm font-medium">{item.text}</span>
              </div>
            ))}
          </div>

          {/* CTA Button */}
          <div className={`transition-all duration-700 delay-500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <Link to={getPageUrl("auth")}>
              <Button variant="gradient" size="xl" className="group text-lg px-10 py-7 shadow-2xl shadow-primary/25 hover:shadow-primary/40 transition-shadow">
                <span className="flex items-center gap-3">
                  Criar Minha Conta Grátis
                  <ArrowRight className="h-6 w-6 group-hover:translate-x-1 transition-transform" />
                </span>
              </Button>
            </Link>
            <p className="text-sm text-muted-foreground mt-4">
              Sem cartão de crédito • Sem compromisso • Cancele quando quiser
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
