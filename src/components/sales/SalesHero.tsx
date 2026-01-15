import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { VSLPlayer } from "./VSLPlayer";
import { ShieldCheck, Zap } from "lucide-react";
import { useState } from "react";

interface SalesHeroProps {
  onBuyClick: () => void;
}

export const SalesHero = ({ onBuyClick }: SalesHeroProps) => {
  const [showCTA, setShowCTA] = useState(false);
  const [ctaPulsed, setCtaPulsed] = useState(false);

  const handleVideoProgress = (percent: number) => {
    if (percent >= 30 && !showCTA) {
      setShowCTA(true);
    }
    if (percent >= 70 && !ctaPulsed) {
      setCtaPulsed(true);
    }
  };

  return (
    <section className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20 pt-8 pb-16 px-4">
      <div className="container max-w-5xl mx-auto">

        {/* Headline */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-center mb-8"
        >
          <h2 className="text-2xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4 leading-tight">
            Tenha sua própria estrutura de pagamentos e vendas{" "}
            <span className="text-accent">pagando apenas R$97</span>
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
            Use para economizar taxas de gateways ou transforme em um negócio cobrando taxas de outros vendedores.
          </p>
        </motion.div>

        {/* VSL */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="mb-8"
        >
          <VSLPlayer onProgress={handleVideoProgress} />
        </motion.div>

        {/* CTA Principal */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="text-center"
        >
          <Button
            size="lg"
            onClick={onBuyClick}
            className={`
              bg-accent hover:bg-accent/90 text-accent-foreground 
              text-lg md:text-xl px-8 py-6 h-auto
              transform hover:scale-105 transition-all duration-300
              shadow-lg hover:shadow-xl
              ${ctaPulsed ? 'animate-pulse-subtle' : ''}
            `}
          >
            <ShieldCheck className="w-5 h-5 mr-2" />
            Comprar Agora por R$97
          </Button>

          {/* Trust badges */}
          <div className="flex flex-wrap items-center justify-center gap-4 mt-6 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-4 h-4 text-accent" />
              Pagamento Seguro
            </span>
            <span className="flex items-center gap-1">
              <Zap className="w-4 h-4 text-accent" />
              Acesso Imediato
            </span>
          </div>

          {/* Additional benefits */}
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 mt-4 text-sm text-foreground/80">
            <span>✔ Pagamento único</span>
            <span>✔ Sem mensalidade</span>
            <span>✔ Estrutura 100% sua</span>
            <span>✔ Atualizações gratuitas</span>
          </div>

          {/* Description text below CTA */}
          <p className="text-base text-muted-foreground/80 max-w-2xl mx-auto mt-8">
            O Gatteflow é um sistema completo de vendas digitais com checkout, pagamentos, afiliados, área de membros, automações e IA. 
            Você pode usar somente para você, reduzindo custos com gateways, ou usar como plataforma para terceiros, cobrando taxas por venda.
          </p>
        </motion.div>
      </div>
    </section>
  );
};
