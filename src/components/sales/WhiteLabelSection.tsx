import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import { Palette, Type, Globe, ImageIcon } from "lucide-react";

// Import real dashboard screenshot
import dashboardImg from "@/assets/screenshots/dashboard.png";

const customizations = [
  { icon: Type, label: "Nome da marca" },
  { icon: ImageIcon, label: "Logotipo" },
  { icon: Palette, label: "Cores" },
  { icon: Globe, label: "Domínio próprio" },
];

export const WhiteLabelSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section ref={ref} className="py-16 md:py-24 px-4 bg-muted/30">
      <div className="container max-w-5xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 items-center">
          {/* Text content */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="order-2 lg:order-1"
          >
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-4 md:mb-6">
              Coloque sua <span className="text-accent">marca</span> no sistema
            </h2>
            <p className="text-base md:text-lg text-muted-foreground mb-6 md:mb-8">
              White-label completo: configure seu logo, cores, domínio próprio e 
              transforme em um produto 100% seu. Seus clientes nunca saberão que 
              você usou uma plataforma pronta.
            </p>

            {/* Customization options */}
            <div className="grid grid-cols-2 gap-3 md:gap-4">
              {customizations.map((item, index) => (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={isInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.4, delay: 0.3 + index * 0.1 }}
                  className="flex items-center gap-2 md:gap-3 p-3 md:p-4 bg-card rounded-lg border border-border"
                >
                  <item.icon className="w-4 h-4 md:w-5 md:h-5 text-accent flex-shrink-0" />
                  <span className="text-sm md:text-base text-foreground font-medium">{item.label}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Dashboard screenshot */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="order-1 lg:order-2"
          >
            <div className="relative rounded-xl md:rounded-2xl overflow-hidden shadow-2xl border border-border bg-card">
              {/* Mock browser bar */}
              <div className="flex items-center gap-1.5 md:gap-2 px-3 md:px-4 py-2 md:py-3 bg-muted border-b border-border">
                <div className="flex gap-1 md:gap-1.5">
                  <div className="w-2 h-2 md:w-3 md:h-3 rounded-full bg-red-500" />
                  <div className="w-2 h-2 md:w-3 md:h-3 rounded-full bg-yellow-500" />
                  <div className="w-2 h-2 md:w-3 md:h-3 rounded-full bg-green-500" />
                </div>
                <div className="flex-1 text-center text-xs md:text-sm text-muted-foreground truncate px-2">
                  suamarca.com.br/dashboard
                </div>
              </div>

              {/* Screenshot */}
              <div className="relative overflow-hidden">
                <motion.img
                  src={dashboardImg}
                  alt="Dashboard do sistema Gateflow"
                  className="w-full h-auto object-cover"
                  whileHover={{ scale: 1.02 }}
                  transition={{ duration: 0.4 }}
                />
                
                {/* Gradient overlay at bottom */}
                <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-card to-transparent pointer-events-none" />
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
