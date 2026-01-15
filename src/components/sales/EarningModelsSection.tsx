import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import { Wallet, Users, CreditCard, Laptop, Briefcase, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EarningModelsSectionProps {
  onBuyClick: () => void;
}

const models = [
  {
    icon: Wallet,
    title: "Economize em cada venda que fizer",
    description: "Pare de entregar parte do seu faturamento para gateways e aumente sua margem usando sua própria estrutura."
  },
  {
    icon: Users,
    title: "Ganhe em cada venda dos seus usuários",
    description: "Cobre uma porcentagem sobre cada venda feita dentro da sua plataforma."
  },
  {
    icon: CreditCard,
    title: "Venda acesso em diferentes níveis",
    description: "Crie planos com valores e recursos diferentes para cada tipo de cliente."
  },
  {
    icon: Laptop,
    title: "Crie sua própria renda recorrente",
    description: "Transforme o sistema em um produto mensal e construa faturamento previsível."
  },
  {
    icon: Briefcase,
    title: "Venda implementação e suporte",
    description: "Cobre para configurar, personalizar e dar suporte para outros empreendedores."
  },
];

export const EarningModelsSection = ({ onBuyClick }: EarningModelsSectionProps) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section ref={ref} className="py-16 md:py-24 px-4 bg-background">
      <div className="container max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-10 md:mb-14"
        >
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-3 md:mb-4 px-2">
            Você decide como <span className="text-accent">ganhar dinheiro</span> com ele
          </h2>
          <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto px-2">
            Use internamente ou transforme em um negócio.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {models.map((model, index) => (
            <motion.div
              key={model.title}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.2 + index * 0.1 }}
              whileHover={{ y: -5 }}
              className="bg-card p-5 md:p-6 rounded-xl border border-border hover:border-accent transition-all duration-300 hover:shadow-xl hover:shadow-accent/10 group min-h-[180px] flex flex-col"
            >
              <motion.div 
                className="w-12 h-12 md:w-14 md:h-14 rounded-xl bg-gradient-to-br from-accent/20 to-accent/5 flex items-center justify-center mb-3 md:mb-4 group-hover:from-accent/30 group-hover:to-accent/10 transition-all flex-shrink-0"
                whileHover={{ rotate: [0, -10, 10, 0] }}
                transition={{ duration: 0.5 }}
              >
                <model.icon className="w-6 h-6 md:w-7 md:h-7 text-accent" />
              </motion.div>
              <h3 className="text-base md:text-lg font-semibold text-foreground mb-2">{model.title}</h3>
              <p className="text-sm text-muted-foreground flex-grow">{model.description}</p>
            </motion.div>
          ))}
        </div>

        {/* Financial Anchor + CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="mt-10 md:mt-12 text-center"
        >
          <div className="flex flex-wrap items-center justify-center gap-2 bg-accent/10 px-4 py-3 rounded-full mb-2 mx-auto max-w-fit">
            <CheckCircle className="w-4 h-4 md:w-5 md:h-5 text-accent flex-shrink-0" />
            <span className="text-sm md:text-base text-foreground font-medium text-center">
              Com apenas alguns clientes ou poucas vendas, o Gatteflow já se paga.
            </span>
          </div>
          <p className="text-xs md:text-sm text-muted-foreground/70 mb-6 px-4">
            Exemplo: cobrando 5% de taxa, 20 vendas de R$100 já cobrem o valor do sistema.
          </p>
          
          <div>
            <Button 
              onClick={onBuyClick}
              variant="gradient"
              size="lg"
              className="text-base md:text-lg px-6 md:px-8"
            >
              Comprar Agora por R$97
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
