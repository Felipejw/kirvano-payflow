import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import { Check } from "lucide-react";

const features = [
  "Player de vídeo HD",
  "Organização por módulos",
  "Progresso automático",
  "Design responsivo",
  "Gestor de Alunos completo",
];

export const MembersAreaSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section ref={ref} className="py-16 sm:py-24 px-5 sm:px-6 lg:px-8 relative">
      <div className="container mx-auto max-w-7xl">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* Text content */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="text-center lg:text-left"
          >
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-4 sm:mb-6">
              Área de Membros{" "}
              <span className="text-accent">Estilo Netflix</span>
            </h2>
            <p className="text-base sm:text-lg text-muted-foreground mb-6 sm:mb-8">
              Entregue conteúdo de forma profissional com uma área de membros
              moderna, responsiva e com experiência premium para seus alunos.
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

          {/* Image */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative"
          >
            <div className="absolute -inset-4 bg-primary/10 rounded-3xl blur-2xl" />
            <div className="relative overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
              <img
                src="/assets/members-area.png"
                alt="Área de Membros"
                className="w-full h-auto"
              />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
