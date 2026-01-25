import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";

const gateways = [
  { name: "Mercado Pago", logo: "https://logopng.com.br/logos/mercado-pago-icone-1024.png" },
  { name: "PagBank", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/80/PagBank.svg/512px-PagBank.svg.png" },
  { name: "Asaas", logo: "https://logopng.com.br/logos/asaas-130.png" },
  { name: "PicPay", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/PicPay_logo.svg/512px-PicPay_logo.svg.png" },
  { name: "Getnet", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/Getnet_logo.svg/512px-Getnet_logo.svg.png" },
  { name: "BSPAY", logo: "https://bfrpay.com.br/assets/images/logo-light.png" },
  { name: "Ghostpay", logo: "https://ghostpay.com.br/wp-content/uploads/2024/01/logo-ghostpay-branco.png" },
];

export const IntegratedGatewaysSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  // Duplicate the array for seamless infinite scroll
  const duplicatedGateways = [...gateways, ...gateways];

  return (
    <section ref={ref} className="py-12 md:py-16 bg-muted/30 overflow-hidden">
      <div className="container max-w-6xl mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-8 md:mb-12"
        >
        <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-foreground mb-3 md:mb-4 px-2 leading-snug">
            Integrado com os <span className="text-accent">Bancos e Subadquirentes</span>
          </h2>
          <p className="text-sm sm:text-base md:text-lg text-muted-foreground max-w-2xl mx-auto px-2">
            Receba pagamentos através dos maiores processadores do Brasil
          </p>
        </motion.div>
      </div>

      {/* Infinite Marquee */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={isInView ? { opacity: 1 } : {}}
        transition={{ duration: 0.6, delay: 0.3 }}
        className="relative w-full"
      >
        {/* Gradient overlays for fade effect */}
        <div className="absolute left-0 top-0 bottom-0 w-16 md:w-32 bg-gradient-to-r from-muted/30 to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-16 md:w-32 bg-gradient-to-l from-muted/30 to-transparent z-10 pointer-events-none" />
        
        {/* Scrolling container */}
        <div className="flex animate-marquee hover:[animation-play-state:paused]">
          {duplicatedGateways.map((gateway, index) => (
            <div
              key={`${gateway.name}-${index}`}
              className="flex-shrink-0 mx-4 md:mx-6"
            >
              <div className="w-20 h-20 md:w-24 md:h-24 bg-card rounded-xl border border-border/50 flex items-center justify-center p-3 md:p-4 transition-all duration-300 hover:border-accent/50 hover:shadow-lg group">
                <img
                  src={gateway.logo}
                  alt={gateway.name}
                  className="w-full h-full object-contain grayscale opacity-70 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-300"
                  loading="lazy"
                />
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* CTA Message */}
      <div className="container max-w-6xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="text-center mt-8 md:mt-12"
        >
          <p className="text-base md:text-lg font-medium text-foreground mb-2">
            Precisa integrar outro banco ou adquirente?
          </p>
          <p className="text-accent font-semibold text-lg md:text-xl">
            Fazemos a integração sem nenhum custo adicional! 🚀
          </p>
        </motion.div>
      </div>
    </section>
  );
};
