import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { VSLPlayer } from "./VSLPlayer";
import { ShieldCheck, Zap, CheckCircle } from "lucide-react";
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
    <section className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20 py-12 md:py-16 px-4">
      <div className="container max-w-5xl mx-auto">

        {/* Headline */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-center mb-6 md:mb-8"
        >
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-3 md:mb-4 leading-tight px-2">
            Tenha sua própria estrutura de pagamentos e vendas{" "}
            <span className="text-accent">pagando apenas R$97</span>
          </h2>
          <p className="text-base md:text-lg lg:text-xl text-muted-foreground max-w-3xl mx-auto px-2">
            Use para economizar taxas de gateways ou transforme em um negócio cobrando taxas de outros vendedores.
          </p>
        </motion.div>

        {/* VSL */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="mb-6 md:mb-8"
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
              text-base sm:text-lg md:text-xl px-6 sm:px-8 py-5 md:py-6 h-auto
              transform hover:scale-105 transition-all duration-300
              shadow-lg hover:shadow-xl
              ${ctaPulsed ? 'animate-pulse-subtle' : ''}
            `}
          >
            <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5 mr-2 flex-shrink-0" />
            Comprar Agora por R$97
          </Button>

          {/* Trust badges */}
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 mt-5 md:mt-6 text-xs sm:text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-accent flex-shrink-0" />
              Pagamento Seguro
            </span>
            <span className="flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-accent flex-shrink-0" />
              Acesso Imediato
            </span>
          </div>

          {/* Additional benefits */}
          <div className="flex flex-col sm:flex-row flex-wrap items-center justify-center gap-2 sm:gap-x-4 md:gap-x-6 mt-4 text-xs sm:text-sm text-foreground/80">
            <span className="flex items-center gap-1.5">
              <CheckCircle className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
              Pagamento único
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
              Sem mensalidade
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
              Estrutura 100% sua
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
              Atualizações gratuitas
            </span>
          </div>

          {/* Description text below CTA */}
          <p className="text-sm md:text-base text-muted-foreground/80 max-w-2xl mx-auto mt-6 md:mt-8 px-2">
            O Gatteflow é uma estrutura completa para quem quer vender online sem depender de gateways caros. Você pode usar apenas para você, economizando taxas, ou transformar em uma plataforma e cobrar por cada venda feita nela.
          </p>
        </motion.div>
      </div>
    </section>
  );
};
