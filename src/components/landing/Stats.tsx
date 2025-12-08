import { useEffect, useState } from "react";

const stats = [
  { value: 150, suffix: "M+", label: "Transações Processadas", prefix: "R$ " },
  { value: 50, suffix: "K+", label: "Clientes Ativos", prefix: "" },
  { value: 99.9, suffix: "%", label: "Uptime Garantido", prefix: "" },
  { value: 2, suffix: "s", label: "Tempo Médio de Resposta", prefix: "<" },
];

function AnimatedNumber({ value, suffix, prefix }: { value: number; suffix: string; prefix: string }) {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
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
  }, [value]);

  return (
    <span className="gradient-text">
      {prefix}{value === 99.9 ? current.toFixed(1) : Math.floor(current)}{suffix}
    </span>
  );
}

export function Stats() {
  return (
    <section className="py-24 relative border-y border-border/50">
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent" />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-4xl md:text-5xl font-bold mb-2">
                <AnimatedNumber value={stat.value} suffix={stat.suffix} prefix={stat.prefix} />
              </div>
              <p className="text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
