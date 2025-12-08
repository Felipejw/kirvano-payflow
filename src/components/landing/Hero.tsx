import { Button } from "@/components/ui/button";
import { ArrowRight, Play, QrCode, Shield, Zap } from "lucide-react";
import { Link } from "react-router-dom";

export function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/20 via-background to-background" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-pulse animation-delay-200" />
      
      {/* Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--border)/0.1)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border)/0.1)_1px,transparent_1px)] bg-[size:4rem_4rem]" />

      <div className="relative z-10 container mx-auto px-4 py-20">
        <div className="max-w-5xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-8 animate-fade-in">
            <Zap className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-primary">Plataforma de Pagamentos PIX #1 do Brasil</span>
          </div>

          {/* Main Heading */}
          <h1 className="text-5xl md:text-7xl font-bold leading-tight mb-6 animate-slide-up">
            Gateway de Pagamentos
            <br />
            <span className="gradient-text">Completo e Escalável</span>
          </h1>

          {/* Subtitle */}
          <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto mb-10 animate-slide-up animation-delay-100">
            Gerencie vendas, processe pagamentos PIX e disponibilize sua API 
            para terceiros. Tudo em uma única plataforma.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16 animate-slide-up animation-delay-200">
            <Link to="/dashboard">
              <Button variant="gradient" size="xl" className="group">
                Acessar Dashboard
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Button variant="glass" size="xl" className="gap-2">
              <Play className="h-5 w-5" />
              Ver Demo
            </Button>
          </div>

          {/* Feature Pills */}
          <div className="flex flex-wrap items-center justify-center gap-4 animate-slide-up animation-delay-300">
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/50 border border-border/50">
              <QrCode className="h-5 w-5 text-primary" />
              <span className="text-sm">PIX Instantâneo</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/50 border border-border/50">
              <Shield className="h-5 w-5 text-accent" />
              <span className="text-sm">Antifraude Integrado</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/50 border border-border/50">
              <Zap className="h-5 w-5 text-yellow-500" />
              <span className="text-sm">API em Milissegundos</span>
            </div>
          </div>
        </div>

        {/* Dashboard Preview */}
        <div className="mt-20 relative animate-slide-up animation-delay-400">
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent z-10 pointer-events-none" />
          <div className="glass-card p-2 max-w-5xl mx-auto shadow-glow-primary">
            <div className="bg-secondary rounded-lg overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 bg-card border-b border-border">
                <div className="h-3 w-3 rounded-full bg-destructive/50" />
                <div className="h-3 w-3 rounded-full bg-yellow-500/50" />
                <div className="h-3 w-3 rounded-full bg-accent/50" />
                <div className="flex-1 flex justify-center">
                  <div className="px-4 py-1 rounded-full bg-secondary text-xs text-muted-foreground">
                    pixpay.com.br/dashboard
                  </div>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-4 gap-4">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-24 rounded-lg bg-card/50 border border-border/30 animate-pulse" />
                  ))}
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-2 h-64 rounded-lg bg-card/50 border border-border/30 animate-pulse" />
                  <div className="h-64 rounded-lg bg-card/50 border border-border/30 animate-pulse" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
