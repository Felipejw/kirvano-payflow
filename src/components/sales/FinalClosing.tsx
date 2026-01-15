import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { ShieldCheck, ArrowRight } from "lucide-react";

interface FinalClosingProps {
  onBuyClick: () => void;
}

export const FinalClosing = ({ onBuyClick }: FinalClosingProps) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section ref={ref} className="py-24 px-4 bg-gradient-to-b from-background to-muted/50">
      <div className="container max-w-4xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-6 leading-tight">
            Ou você continua pagando taxas,{" "}
            <span className="text-accent">ou passa a controlar tudo</span>
          </h2>
          <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
            A estrutura já está pronta. A decisão é sua.
          </p>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={isInView ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 0.4, delay: 0.3 }}
          >
            <Button
              size="lg"
              onClick={onBuyClick}
              className="bg-accent hover:bg-accent/90 text-accent-foreground text-xl px-10 py-7 h-auto transform hover:scale-105 transition-all duration-300 shadow-xl hover:shadow-2xl group"
            >
              <ShieldCheck className="w-6 h-6 mr-2" />
              Comprar Agora por R$97
              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
              <span>✓ Pagamento único</span>
              <span>✓ Acesso vitalício</span>
              <span>✓ Suporte incluso</span>
            </div>
          </motion.div>
        </motion.div>

        {/* Decorative gradient */}
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-accent/5 to-transparent pointer-events-none" />
      </div>
    </section>
  );
};
