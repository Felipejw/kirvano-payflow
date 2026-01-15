import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import { CheckCircle, Lock, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ClosingOfferProps {
  onBuyClick: () => void;
}

const benefits = [
  "Checkout com sua marca",
  "Integração com seus próprios bancos",
  "Dashboard completo de vendas",
  "Área de membros automática",
  "Sistema de afiliados",
  "Recuperação de vendas por WhatsApp e Email",
  "Disparo em massa",
  "Quiz integrado",
  "Pixel de rastreamento e UTMs",
  "API para integrações",
  "Sistema 100% White Label",
  "Atualizações gratuitas",
];

export const ClosingOffer = ({ onBuyClick }: ClosingOfferProps) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section ref={ref} className="py-12 md:py-16 bg-background">
      <div className="container max-w-5xl mx-auto px-4">
        {/* Headline */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-6 md:mb-10"
        >
          <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold mb-3 md:mb-4 px-2 leading-snug">
            Tenha acesso ao Gatteflow hoje com{" "}
            <span className="text-accent">pagamento único</span>
          </h2>
          <p className="text-sm sm:text-base md:text-lg text-muted-foreground max-w-2xl mx-auto px-2">
            Toda a estrutura de pagamentos, vendas e automações em um único sistema — sem mensalidades.
          </p>
        </motion.div>

        {/* Central Card */}
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.95 }}
          animate={isInView ? { opacity: 1, y: 0, scale: 1 } : {}}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="max-w-xl md:max-w-2xl mx-auto"
        >
          <div className="bg-muted/30 backdrop-blur-sm border border-accent/20 rounded-xl md:rounded-2xl shadow-xl p-6 md:p-8 lg:p-10">
            {/* Card Title */}
            <h3 className="text-lg md:text-xl lg:text-2xl font-semibold text-center mb-6 md:mb-8">
              O que você recebe ao comprar o Gatteflow
            </h3>

            {/* Benefits Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 md:gap-3 mb-8 md:mb-10">
              {benefits.map((benefit, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={isInView ? { opacity: 1, x: 0 } : {}}
                  transition={{ duration: 0.4, delay: 0.3 + index * 0.05 }}
                  className="flex items-center gap-2"
                >
                  <CheckCircle className="w-4 h-4 md:w-5 md:h-5 text-accent flex-shrink-0" />
                  <span className="text-sm md:text-base text-foreground">{benefit}</span>
                </motion.div>
              ))}
            </div>

            {/* Price Block */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={isInView ? { opacity: 1 } : {}}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="text-center mb-6 md:mb-8"
            >
              <p className="text-base md:text-lg text-muted-foreground line-through mb-1">
                De R$297,00
              </p>
              <p className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-accent mb-2">
                R$97
              </p>
              <p className="text-sm md:text-base text-muted-foreground font-medium">
                💡 Pagamento único. Sem mensalidades.
              </p>
              <p className="text-xs md:text-sm text-muted-foreground mt-1">
                Você compra uma vez e pode usar sem pagar nada por mês.
              </p>
            </motion.div>

            {/* CTA Button */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="text-center"
            >
              <Button
                onClick={onBuyClick}
                size="lg"
                className="bg-accent hover:bg-accent/90 text-accent-foreground font-semibold text-base md:text-lg px-6 md:px-8 py-4 md:py-5 h-auto hover:scale-105 transition-all w-full sm:w-auto"
              >
                <ShoppingCart className="w-5 h-5 mr-2" />
                Comprar Agora por R$97
              </Button>
              
              {/* Microcopy */}
              <p className="text-xs md:text-sm text-muted-foreground mt-4 flex items-center justify-center gap-2">
                <Lock className="w-3.5 h-3.5 md:w-4 md:h-4 flex-shrink-0" />
                Pagamento seguro via Pix • Acesso imediato
              </p>
            </motion.div>
          </div>
        </motion.div>

        {/* Urgency Message */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="text-center text-xs text-muted-foreground/70 mt-6 max-w-md mx-auto px-4"
        >
          Oferta especial de lançamento com pagamento único.
          <br />
          O valor pode ser reajustado nas próximas versões.
        </motion.p>
      </div>
    </section>
  );
};
