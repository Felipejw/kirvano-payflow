import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ShoppingCart } from "lucide-react";
import { useState, useEffect } from "react";

interface FixedCTAProps {
  onBuyClick: () => void;
}

export const FixedCTA = ({ onBuyClick }: FixedCTAProps) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setVisible(window.scrollY > 400);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-t border-border shadow-[0_-4px_20px_rgba(0,0,0,0.1)]"
        >
          <div className="container max-w-5xl mx-auto px-4 py-3 flex items-center justify-center sm:justify-between gap-4">
            <div className="hidden sm:block">
              <p className="text-base font-medium text-foreground">
                Sistema completo por apenas <span className="text-accent font-bold">R$97</span>
              </p>
              <p className="text-xs text-muted-foreground">Pagamento único • Acesso vitalício</p>
            </div>
            
            <Button
              onClick={onBuyClick}
              size="lg"
              className="bg-accent hover:bg-accent/90 text-accent-foreground font-semibold px-8 py-4 h-auto flex-shrink-0 hover:scale-105 transition-transform text-base"
            >
              <ShoppingCart className="w-5 h-5 mr-2" />
              Comprar Agora por R$97
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
