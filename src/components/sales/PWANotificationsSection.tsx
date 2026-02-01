import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import { Check, Smartphone, Signal, Battery, ShoppingCart } from "lucide-react";

const features = [
  "Notificações push em tempo real",
  "Novo PIX gerado",
  "Pedido aprovado",
  "Disparos automáticos",
  "Instalação como app nativo",
];

export const PWANotificationsSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section ref={ref} className="py-10 sm:py-14 px-5 sm:px-6 lg:px-8 relative">
      <div className="container mx-auto max-w-7xl">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* Text content */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="text-center lg:text-left"
          >
            {/* Badges */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 mb-4 sm:mb-6">
              <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 rounded-full bg-primary/20 text-primary">
                <Smartphone className="w-4 h-4" />
                <span className="font-semibold text-sm sm:text-base">Nova Funcionalidade v2</span>
              </div>
              <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 rounded-full bg-muted/50 text-muted-foreground border border-border">
                <span className="font-medium text-xs sm:text-sm">Opcional</span>
              </div>
            </div>

            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-4 sm:mb-6">
              Aplicativo PWA com{" "}
              <span className="gradient-text">Notificações Push</span>
            </h2>
            <p className="text-base sm:text-lg text-muted-foreground mb-6 sm:mb-8">
              Transforme sua plataforma em um aplicativo nativo. Seus clientes recebem 
              notificações em tempo real sobre pedidos, pagamentos e muito mais.
            </p>
            <ul className="space-y-3 sm:space-y-4 inline-flex flex-col items-start">
              {features.map((feature, index) => (
                <motion.li
                  key={feature}
                  initial={{ opacity: 0, x: -20 }}
                  animate={isInView ? { opacity: 1, x: 0 } : {}}
                  transition={{ duration: 0.4, delay: 0.2 + index * 0.1 }}
                  className="flex items-center gap-3 text-base sm:text-lg"
                >
                  <div className="w-5 h-5 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
                    <Check className="w-3 h-3 text-accent" />
                  </div>
                  <span className="text-foreground">{feature}</span>
                </motion.li>
              ))}
            </ul>
          </motion.div>

          {/* Phone Mockup */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative flex justify-center lg:justify-end lg:pr-8"
          >
            <div className="absolute -inset-4 bg-primary/10 rounded-3xl blur-2xl" />
            
            {/* iPhone mockup */}
            <div className="relative w-[280px] sm:w-[320px] aspect-[9/19.5] bg-black rounded-[2.5rem] p-2 shadow-2xl border-4 border-gray-800">
              {/* Dynamic Island */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-black rounded-b-2xl z-20" />
              
              {/* Screen */}
              <div className="relative w-full h-full bg-gradient-to-b from-gray-900 to-black rounded-[2rem] overflow-hidden">
                {/* Status bar */}
                <div className="absolute top-0 left-0 right-0 h-12 bg-transparent z-10 flex items-center justify-between px-6 pt-2">
                  <div className="flex items-center gap-1 text-white text-xs font-medium">
                    <span>9:41</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Signal className="w-3 h-3 text-white" />
                    <Signal className="w-3 h-3 text-white rotate-180" />
                    <Battery className="w-4 h-4 text-white" />
                  </div>
                </div>

                {/* Notifications */}
                <div className="absolute top-12 left-0 right-0 px-3 pt-2 space-y-2 z-10">
                  {/* Notification 1 */}
                  <motion.div
                    initial={{ opacity: 0, x: 100 }}
                    animate={isInView ? { opacity: 1, x: 0 } : {}}
                    transition={{ duration: 0.5, delay: 0.8 }}
                    className="bg-blue-500/20 backdrop-blur-md rounded-xl p-3 border border-white/10 shadow-lg"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center border border-white/10">
                        <ShoppingCart className="w-5 h-5 text-blue-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <p className="font-semibold text-white text-sm leading-tight">Venda confirmada</p>
                          <span className="text-xs text-white/60 flex-shrink-0">10:51</span>
                        </div>
                        <p className="text-xs text-white/80 leading-relaxed">
                          Produto: Curso Premium - R$ 297,00
                        </p>
                      </div>
                    </div>
                  </motion.div>

                  {/* Notification 2 */}
                  <motion.div
                    initial={{ opacity: 0, x: 100 }}
                    animate={isInView ? { opacity: 1, x: 0 } : {}}
                    transition={{ duration: 0.5, delay: 1.2 }}
                    className="bg-green-500/20 backdrop-blur-md rounded-xl p-3 border border-white/10 shadow-lg"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center border border-white/10">
                        <Check className="w-5 h-5 text-green-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <p className="font-semibold text-white text-sm leading-tight">PIX Aprovado</p>
                          <span className="text-xs text-white/60 flex-shrink-0">10:52</span>
                        </div>
                        <p className="text-xs text-white/80 leading-relaxed">
                          Pagamento de R$ 497,00 confirmado
                        </p>
                      </div>
                    </div>
                  </motion.div>
                </div>

                {/* Background gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-black opacity-50" />
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
