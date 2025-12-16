import { useEffect, useState } from "react";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { getPageUrl } from "@/lib/routes";
import { ArrowRight, TrendingUp } from "lucide-react";

const stats = [
  { value: 80, suffix: "%", label: "Taxa de Conversão", prefix: "", description: "no checkout" },
  { value: 0, suffix: "%", label: "Estornos", prefix: "", description: "PIX não tem chargeback" },
  { value: 40, suffix: "%", label: "Mais Lucro", prefix: "+", description: "após migração" },
  { value: 24, suffix: "/7", label: "Saque Disponível", prefix: "", description: "a qualquer hora" },
  { value: 2, suffix: "s", label: "Aprovação PIX", prefix: "<", description: "tempo médio" },
  { value: 12, suffix: "M+", label: "Processados", prefix: "R$", description: "na plataforma" },
];

function AnimatedNumber({ value, suffix, prefix, shouldAnimate }: { value: number; suffix: string; prefix: string; shouldAnimate: boolean }) {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (!shouldAnimate) return;
    
    const duration = 2000;
    const steps = 60;
    const increment = value / steps;
    let step = 0;

    const timer = setInterval(() => {
      step++;
      setCurrent(Math.min(increment * step, value));
      if (step >= steps) clearInterval(timer);
    }, duration / steps);

    return () => clearInterval(timer);
  }, [value, shouldAnimate]);

  return (
    <span className="gradient-text">
      {prefix}{Math.floor(current)}{suffix}
    </span>
  );
}

export function Stats() {
  const { ref, isVisible } = useScrollReveal<HTMLElement>({ threshold: 0.2 });

  return (
    <section ref={ref} className="py-24 relative border-y border-border/50 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--primary)/0.03)_1px,transparent_1px)] bg-[size:100px_1px]" />
      
      <div className="container mx-auto px-4 relative z-10">
        {/* Header */}
        <div className={`text-center mb-12 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-4">
            <TrendingUp className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-primary">Resultados Comprovados</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold">
            Números que <span className="gradient-text">falam por si</span>
          </h2>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 mb-12">
          {stats.map((stat, index) => (
            <div 
              key={stat.label} 
              className={`text-center p-6 rounded-2xl bg-background/50 border border-border/50 hover:border-primary/50 group hover:scale-105 transition-all duration-500 cursor-default ${
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
              }`}
              style={{ transitionDelay: `${index * 100}ms` }}
            >
              <div className="text-3xl md:text-4xl font-bold mb-1 group-hover:scale-110 transition-transform">
                <AnimatedNumber value={stat.value} suffix={stat.suffix} prefix={stat.prefix} shouldAnimate={isVisible} />
              </div>
              <p className="text-sm font-medium text-foreground mb-1">{stat.label}</p>
              <p className="text-xs text-muted-foreground">{stat.description}</p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className={`text-center transition-all duration-700 delay-500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <Link to={getPageUrl("auth")}>
            <Button variant="gradient" size="lg" className="group">
              Quero Esses Resultados
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
