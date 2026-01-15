import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef, useState } from "react";
import { Paintbrush, Globe, Palette, Building } from "lucide-react";

const customizations = [
  { icon: Building, label: "Nome da sua marca" },
  { icon: Paintbrush, label: "Logotipo personalizado" },
  { icon: Palette, label: "Cores da sua identidade" },
  { icon: Globe, label: "Domínio próprio" },
];

export const WhiteLabelSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [isDark, setIsDark] = useState(true);

  return (
    <section ref={ref} className="py-20 px-4 bg-muted/30">
      <div className="container max-w-5xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              O sistema é seu. <span className="text-accent">A marca também.</span>
            </h2>
            <p className="text-lg text-muted-foreground mb-6">
              Use, personalize e venda como se tivesse criado do zero.
            </p>
            <p className="text-muted-foreground mb-5">
              O Gatteflow é 100% White Label. Você escolhe nome, logotipo, cores, domínio e modelo de uso.
            </p>

            <div className="grid grid-cols-2 gap-3">
              {customizations.map((item, index) => (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={isInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.4, delay: 0.3 + index * 0.1 }}
                  className="flex items-center gap-3"
                >
                  <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                    <item.icon className="w-5 h-5 text-accent" />
                  </div>
                  <span className="text-sm font-medium text-foreground">{item.label}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Dashboard Mockup */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative"
          >
            <div 
              className={`
                rounded-xl border overflow-hidden transition-all duration-500
                shadow-[0_20px_60px_-15px_rgba(16,185,129,0.3)]
                ${isDark ? 'bg-zinc-900 border-emerald-500/30' : 'bg-white border-emerald-500/30'}
              `}
            >
              {/* Header */}
              <div className={`p-4 border-b ${isDark ? 'border-zinc-800' : 'border-zinc-200'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
                      <span className="text-accent-foreground font-bold text-sm">S</span>
                    </div>
                    <span className={`font-semibold ${isDark ? 'text-white' : 'text-zinc-900'}`}>
                      Sua Marca
                    </span>
                  </div>
                  <button
                    onClick={() => setIsDark(!isDark)}
                    className={`text-xs px-3 py-1 rounded-full transition-colors ${
                      isDark 
                        ? 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700' 
                        : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                    }`}
                  >
                    {isDark ? '☀️ Light' : '🌙 Dark'}
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-4 space-y-4">
                {/* Stats */}
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: "Vendas", value: "R$ 12.450" },
                    { label: "Clientes", value: "847" },
                    { label: "Conversão", value: "4.2%" },
                  ].map((stat) => (
                    <div 
                      key={stat.label}
                      className={`p-3 rounded-lg ${isDark ? 'bg-zinc-800' : 'bg-zinc-50'}`}
                    >
                      <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
                        {stat.label}
                      </p>
                      <p className={`text-lg font-bold ${isDark ? 'text-white' : 'text-zinc-900'}`}>
                        {stat.value}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Chart placeholder */}
                <div className={`h-32 rounded-lg ${isDark ? 'bg-zinc-800' : 'bg-zinc-50'} flex items-end justify-around p-4`}>
                  {[40, 65, 45, 80, 55, 70, 90].map((height, i) => (
                    <div
                      key={i}
                      className="w-6 rounded-t bg-accent/80"
                      style={{ height: `${height}%` }}
                    />
                  ))}
                </div>
              </div>
              
              {/* Caption */}
              <div className={`px-4 py-2 border-t text-center ${isDark ? 'border-zinc-800 bg-zinc-900/50' : 'border-zinc-100 bg-zinc-50/50'}`}>
                <p className={`text-xs ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>
                  📸 Exemplo real do painel do sistema
                </p>
              </div>
            </div>

            {/* Decorative elements */}
            <div className="absolute -z-10 top-4 -right-4 w-full h-full rounded-xl bg-emerald-500/20 blur-xl" />
          </motion.div>
        </div>
      </div>
    </section>
  );
};
