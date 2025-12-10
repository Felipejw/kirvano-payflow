import { useEffect, useState } from "react";
import { useScrollReveal } from "@/hooks/useScrollReveal";

const stats = [
  { value: 150, suffix: "M+", label: "Transações Processadas", prefix: "R$ " },
  { value: 50, suffix: "K+", label: "Clientes Ativos", prefix: "" },
  { value: 99.9, suffix: "%", label: "Uptime Garantido", prefix: "" },
  { value: 2, suffix: "s", label: "Tempo Médio de Resposta", prefix: "<" },
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
      {prefix}{value === 99.9 ? current.toFixed(1) : Math.floor(current)}{suffix}
    </span>
  );
}

export function Stats() {
  const { ref, isVisible } = useScrollReveal<HTMLElement>({ threshold: 0.3 });

  return (
    <section ref={ref} className="py-24 relative border-y border-border/50 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--primary)/0.03)_1px,transparent_1px)] bg-[size:100px_1px]" />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <div 
              key={stat.label} 
              className={`text-center group hover:scale-105 transition-all duration-500 cursor-default ${
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
              }`}
              style={{ transitionDelay: `${index * 150}ms` }}
            >
              <div className="text-4xl md:text-5xl font-bold mb-2 group-hover:scale-110 transition-transform">
                <AnimatedNumber value={stat.value} suffix={stat.suffix} prefix={stat.prefix} shouldAnimate={isVisible} />
              </div>
              <p className="text-muted-foreground group-hover:text-foreground transition-colors">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}