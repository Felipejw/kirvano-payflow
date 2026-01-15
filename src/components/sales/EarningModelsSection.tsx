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
    title: "Economize em cada venda",
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
    <section ref={ref} className="py-24 px-4 bg-background">
      <div className="container max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Você decide como <span className="text-accent">ganhar dinheiro</span> com ele
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Use internamente ou transforme em um negócio.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {models.map((model, index) => (
            <motion.div
              key={model.title}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.2 + index * 0.1 }}
              whileHover={{ y: -5 }}
              className="bg-card p-6 rounded-xl border border-border hover:border-accent/50 transition-all duration-300 hover:shadow-lg group"
            >
              <motion.div 
                className="w-14 h-14 rounded-xl bg-gradient-to-br from-accent/20 to-accent/5 flex items-center justify-center mb-4 group-hover:from-accent/30 group-hover:to-accent/10 transition-all"
                whileHover={{ rotate: [0, -10, 10, 0] }}
                transition={{ duration: 0.5 }}
              >
                <model.icon className="w-7 h-7 text-accent" />
              </motion.div>
              <h3 className="text-lg font-semibold text-foreground mb-2">{model.title}</h3>
              <p className="text-sm text-muted-foreground">{model.description}</p>
            </motion.div>
          ))}
        </div>

        {/* Financial Anchor + CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="mt-12 text-center"
        >
          <div className="inline-flex items-center gap-2 bg-accent/10 px-5 py-3 rounded-full mb-6">
            <CheckCircle className="w-5 h-5 text-accent" />
            <span className="text-foreground font-medium">
              Com apenas alguns clientes ou poucas vendas, o Gatteflow já se paga.
            </span>
          </div>
          
          <div>
            <Button 
              onClick={onBuyClick}
              variant="gradient"
              size="lg"
              className="text-lg px-8"
            >
              Comprar Agora por R$97
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
