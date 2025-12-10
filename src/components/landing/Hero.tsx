import { Button } from "@/components/ui/button";
import { ArrowRight, Play, Ban, Wallet, Clock, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

export function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/20 via-background to-background" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-float" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl animate-pulse-glow" />
      
      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-primary/30 rounded-full animate-float"
            style={{
              left: `${15 + i * 15}%`,
              top: `${20 + (i % 3) * 25}%`,
              animationDelay: `${i * 0.5}s`,
              animationDuration: `${4 + i}s`,
            }}
          />
        ))}
      </div>
      
      {/* Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--border)/0.1)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border)/0.1)_1px,transparent_1px)] bg-[size:4rem_4rem]" />

      <div className="relative z-10 container mx-auto px-4 py-20">
        <div className="max-w-5xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 border border-accent/20 mb-8 animate-fade-in hover:scale-105 transition-transform cursor-default group">
            <Sparkles className="h-4 w-4 text-accent group-hover:animate-spin" />
            <span className="text-sm font-bold text-accent">Taxa de apenas 4,99%</span>
          </div>

          {/* Main Heading */}
          <h1 className="text-5xl md:text-7xl font-bold leading-tight mb-6 animate-slide-up">
            Venda Produtos Digitais
            <br />
            <span className="gradient-text bg-clip-text">com PIX Instantâneo</span>
          </h1>

          {/* Subtitle */}
          <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto mb-10 animate-slide-up" style={{ animationDelay: '100ms' }}>
            A plataforma mais completa para infoprodutores. Checkout otimizado, 
            sistema de afiliados e área de membros em um só lugar.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16 animate-slide-up" style={{ animationDelay: '200ms' }}>
            <Link to="/auth">
              <Button variant="gradient" size="xl" className="group relative overflow-hidden">
                <span className="relative z-10 flex items-center gap-2">
                  Começar Agora
                  <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-primary via-accent to-primary bg-[length:200%_100%] group-hover:animate-shimmer" />
              </Button>
            </Link>
            <Button variant="glass" size="xl" className="gap-2 group">
              <Play className="h-5 w-5 group-hover:scale-110 transition-transform" />
              Ver Demo
            </Button>
          </div>

          {/* Feature Pills - Diferenciais */}
          <div className="flex flex-wrap items-center justify-center gap-4 animate-slide-up" style={{ animationDelay: '300ms' }}>
            {[
              { icon: Ban, text: "0 Estorno", color: "text-destructive", hoverBg: "hover:bg-destructive/10" },
              { icon: Wallet, text: "Sem Taxa de Saque", color: "text-accent", hoverBg: "hover:bg-accent/10" },
              { icon: Clock, text: "Saque a Qualquer Hora", color: "text-primary", hoverBg: "hover:bg-primary/10" },
            ].map((item, index) => (
              <div 
                key={item.text}
                className={`flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/50 border border-border/50 hover:border-primary/50 ${item.hoverBg} transition-all duration-300 hover:scale-105 cursor-default group`}
                style={{ animationDelay: `${400 + index * 100}ms` }}
              >
                <item.icon className={`h-5 w-5 ${item.color} group-hover:scale-110 transition-transform`} />
                <span className="text-sm font-medium">{item.text}</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}
