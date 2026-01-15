import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef, useState } from "react";
import { Palette, Type, Globe, ImageIcon, Sun, Moon } from "lucide-react";

const customizations = [
  { icon: Type, label: "Nome da marca" },
  { icon: ImageIcon, label: "Logotipo" },
  { icon: Palette, label: "Cores" },
  { icon: Globe, label: "Domínio próprio" },
];

export const WhiteLabelSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [isDarkPreview, setIsDarkPreview] = useState(true);

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

          {/* Dashboard mockup */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="order-1 lg:order-2"
          >
            <div className={`relative rounded-xl md:rounded-2xl overflow-hidden shadow-2xl border border-border ${isDarkPreview ? 'bg-zinc-900' : 'bg-white'} max-h-[350px] md:max-h-[400px]`}>
              {/* Mock browser bar */}
              <div className={`flex items-center gap-1.5 md:gap-2 px-3 md:px-4 py-2 md:py-3 ${isDarkPreview ? 'bg-zinc-800' : 'bg-gray-100'} border-b ${isDarkPreview ? 'border-zinc-700' : 'border-gray-200'}`}>
                <div className="flex gap-1 md:gap-1.5">
                  <div className="w-2 h-2 md:w-3 md:h-3 rounded-full bg-red-500" />
                  <div className="w-2 h-2 md:w-3 md:h-3 rounded-full bg-yellow-500" />
                  <div className="w-2 h-2 md:w-3 md:h-3 rounded-full bg-green-500" />
                </div>
                <div className={`flex-1 text-center text-xs md:text-sm ${isDarkPreview ? 'text-zinc-400' : 'text-gray-500'} truncate px-2`}>
                  suamarca.com.br/dashboard
                </div>
                <button 
                  onClick={() => setIsDarkPreview(!isDarkPreview)}
                  className={`p-1 rounded ${isDarkPreview ? 'hover:bg-zinc-700' : 'hover:bg-gray-200'}`}
                >
                  {isDarkPreview ? (
                    <Sun className="w-3 h-3 md:w-4 md:h-4 text-zinc-400" />
                  ) : (
                    <Moon className="w-3 h-3 md:w-4 md:h-4 text-gray-500" />
                  )}
                </button>
              </div>

              {/* Mock dashboard content */}
              <div className="p-4 md:p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-4 md:mb-6">
                  <div className="flex items-center gap-2 md:gap-3">
                    <div className="w-6 h-6 md:w-8 md:h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500" />
                    <span className={`text-sm md:text-lg font-bold ${isDarkPreview ? 'text-white' : 'text-gray-900'}`}>Sua Marca</span>
                  </div>
                  <div className={`w-6 h-6 md:w-8 md:h-8 rounded-full ${isDarkPreview ? 'bg-zinc-700' : 'bg-gray-200'}`} />
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-2 md:gap-4 mb-4 md:mb-6">
                  {[
                    { label: "Vendas", value: "R$ 12.450" },
                    { label: "Conversão", value: "4,2%" },
                    { label: "Clientes", value: "342" },
                  ].map((stat) => (
                    <div 
                      key={stat.label}
                      className={`p-2 md:p-4 rounded-lg ${isDarkPreview ? 'bg-zinc-800' : 'bg-gray-50'}`}
                    >
                      <p className={`text-xs ${isDarkPreview ? 'text-zinc-400' : 'text-gray-500'}`}>{stat.label}</p>
                      <p className={`text-sm md:text-xl font-bold ${isDarkPreview ? 'text-white' : 'text-gray-900'}`}>{stat.value}</p>
                    </div>
                  ))}
                </div>

                {/* Chart placeholder */}
                <div className={`h-16 md:h-24 rounded-lg ${isDarkPreview ? 'bg-zinc-800' : 'bg-gray-50'} flex items-end justify-around p-2 md:p-3`}>
                  {[40, 65, 45, 80, 55, 70, 90].map((height, i) => (
                    <div
                      key={i}
                      className="w-3 md:w-6 rounded-t bg-gradient-to-t from-blue-500 to-purple-500"
                      style={{ height: `${height}%` }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
