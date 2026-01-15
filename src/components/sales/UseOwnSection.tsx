import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import { Wallet, Ban, TrendingDown, Shield } from "lucide-react";

const benefits = [
  {
    icon: Wallet,
    title: "Você no controle do dinheiro",
    description: "Gerencie seus pagamentos diretamente, sem depender de regras ou bloqueios de gateways."
  },
  {
    icon: Ban,
    title: "Chega de perder dinheiro em taxas",
    description: "Elimine taxas exorbitantes e aumente sua margem em cada venda realizada."
  },
  {
    icon: TrendingDown,
    title: "Mais lucro em cada venda",
    description: "O dinheiro que antes ficava com gateways agora fica com você."
  },
  {
    icon: Shield,
    title: "Estrutura própria, sem intermediários",
    description: "Conecte seus próprios bancos e tenha autonomia total sobre seus recebimentos."
  }
];

export const UseOwnSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section ref={ref} className="py-20 px-4 bg-muted/30">
      <div className="container max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Use para você e <span className="text-accent">pare de pagar taxas abusivas</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Crie sua própria estrutura e tenha controle total sobre seus pagamentos.
          </p>
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-center text-muted-foreground mb-12 max-w-3xl mx-auto"
        >
          Se você vende produtos digitais ou serviços, já percebeu que boa parte do seu lucro fica com gateways de pagamento. Com o Gatteflow, você deixa de ser refém dessas taxas, cria sua própria estrutura de cobrança, conecta seus bancos e passa a controlar 100% dos seus recebimentos.
        </motion.p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {benefits.map((benefit, index) => (
            <motion.div
              key={benefit.title}
              initial={{ opacity: 0, y: 30, x: index % 2 === 0 ? -20 : 20 }}
              animate={isInView ? { opacity: 1, y: 0, x: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
              className="bg-card p-6 rounded-xl border border-border hover:border-accent/50 transition-all duration-300 hover:shadow-lg group"
            >
              <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center mb-4 group-hover:bg-accent/20 transition-colors">
                <benefit.icon className="w-6 h-6 text-accent" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">{benefit.title}</h3>
              <p className="text-sm text-muted-foreground">{benefit.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
