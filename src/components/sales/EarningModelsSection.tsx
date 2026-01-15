import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import { Wallet, Users, CreditCard, Laptop, Briefcase } from "lucide-react";

const models = [
  {
    icon: Wallet,
    title: "Use para economizar taxas",
    description: "Reduza seus custos usando sua própria estrutura de pagamentos."
  },
  {
    icon: Users,
    title: "Cobre taxas de clientes",
    description: "Monetize cobrando uma porcentagem de cada venda dos seus usuários."
  },
  {
    icon: CreditCard,
    title: "Crie planos",
    description: "Ofereça diferentes níveis de acesso com preços variados."
  },
  {
    icon: Laptop,
    title: "Venda como SaaS",
    description: "Transforme em um produto recorrente com mensalidades."
  },
  {
    icon: Briefcase,
    title: "Ofereça como serviço",
    description: "Venda a implementação e suporte para outros empreendedores."
  },
];

export const EarningModelsSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section ref={ref} className="py-20 px-4 bg-background">
      <div className="container max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
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
      </div>
    </section>
  );
};
