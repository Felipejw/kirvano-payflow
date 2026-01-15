import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import { Wallet, Percent, Globe, Zap, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";

const benefits = [
  {
    icon: Wallet,
    title: "Receba diretamente",
    description: "O dinheiro cai direto na sua conta, sem intermediários."
  },
  {
    icon: Percent,
    title: "Sem taxas abusivas",
    description: "Economize até 70% comparado com gateways tradicionais."
  },
  {
    icon: Globe,
    title: "Seu domínio, sua marca",
    description: "Checkout personalizado com seu logo e cores."
  },
  {
    icon: Zap,
    title: "Aprovação instantânea",
    description: "PIX confirmado em segundos, sem burocracia."
  },
];

interface UseOwnSectionProps {
  onBuyClick?: () => void;
}

export const UseOwnSection = ({ onBuyClick }: UseOwnSectionProps) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section ref={ref} className="py-12 md:py-16 px-4 bg-muted/30">
      <div className="container max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-8 md:mb-10"
        >
          <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-foreground mb-3 md:mb-4 px-2 leading-snug">
            Use para <span className="text-accent">você mesmo</span>
          </h2>
          <p className="text-sm sm:text-base md:text-lg text-muted-foreground max-w-2xl mx-auto px-2">
            Tenha controle total sobre seus pagamentos e economize em cada venda.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-6 mb-10 md:mb-12">
          {benefits.map((benefit, index) => (
            <motion.div
              key={benefit.title}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.2 + index * 0.1 }}
              whileHover={{ y: -5 }}
              className="bg-card p-5 md:p-6 rounded-xl border border-border hover:border-accent transition-all duration-300 hover:shadow-lg hover:shadow-accent/10 group min-h-[160px] flex flex-col"
            >
              <motion.div 
                className="w-12 h-12 md:w-14 md:h-14 rounded-xl bg-gradient-to-br from-accent/20 to-accent/5 flex items-center justify-center mb-3 md:mb-4 group-hover:from-accent/30 group-hover:to-accent/10 transition-all flex-shrink-0"
                whileHover={{ rotate: [0, -10, 10, 0] }}
                transition={{ duration: 0.5 }}
              >
                <benefit.icon className="w-6 h-6 md:w-7 md:h-7 text-accent" />
              </motion.div>
              <h3 className="text-base md:text-lg font-semibold text-foreground mb-2">{benefit.title}</h3>
              <p className="text-sm text-muted-foreground flex-grow">{benefit.description}</p>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="text-center"
        >
          <Button 
            onClick={onBuyClick}
            size="lg"
            className="bg-accent hover:bg-accent/90 text-accent-foreground font-semibold text-base md:text-lg px-6 md:px-8 py-4 md:py-5 h-auto hover:scale-105 transition-all"
          >
            <ShoppingCart className="w-5 h-5 mr-2" />
            Comprar Agora por R$97
          </Button>
        </motion.div>
      </div>
    </section>
  );
};
