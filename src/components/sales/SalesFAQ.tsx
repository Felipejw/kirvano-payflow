import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef, useState } from "react";
import { ChevronDown } from "lucide-react";

const faqs = [
  {
    question: "O pagamento é mensal?",
    answer: "Não. O pagamento é único, no valor de R$97. Você paga uma vez e tem acesso vitalício ao sistema."
  },
  {
    question: "Posso usar apenas para mim?",
    answer: "Sim. Você pode usar para economizar taxas e não vender acesso para ninguém. Muitos clientes usam apenas para gerenciar suas próprias vendas."
  },
  {
    question: "Posso cobrar taxas de outros usuários?",
    answer: "Sim. O sistema permite que você monetize sua própria plataforma cobrando uma porcentagem de cada venda realizada pelos seus usuários."
  },
  {
    question: "Preciso saber programar?",
    answer: "Não. O sistema é pronto para uso. Basta configurar suas informações e começar a vender."
  },
  {
    question: "O sistema é White Label?",
    answer: "Sim. Você pode personalizar totalmente: nome, logotipo, cores, domínio e muito mais. Seus clientes nunca saberão que você usa o Gatteflow."
  },
  {
    question: "Tem suporte?",
    answer: "Sim. Suporte direto via WhatsApp para tirar dúvidas e ajudar na configuração."
  },
  {
    question: "Tem atualizações?",
    answer: "Sim. Atualizações gratuitas e contínuas. O sistema é constantemente melhorado com novas funcionalidades."
  },
];

export const SalesFAQ = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section ref={ref} className="py-20 px-4 bg-muted/30">
      <div className="container max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Dúvidas <span className="text-accent">Frequentes</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Veja as respostas antes de comprar.
          </p>
        </motion.div>

        <div className="space-y-3">
          {faqs.map((faq, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.4, delay: 0.1 + index * 0.05 }}
              className="bg-card rounded-xl border border-border overflow-hidden"
            >
              <button
                onClick={() => toggleFAQ(index)}
                className="w-full p-5 flex items-center justify-between text-left hover:bg-muted/50 transition-colors"
              >
                <span className="font-medium text-foreground pr-4">{faq.question}</span>
                <motion.div
                  animate={{ rotate: openIndex === index ? 180 : 0 }}
                  transition={{ duration: 0.3 }}
                  className="flex-shrink-0"
                >
                  <ChevronDown className="w-5 h-5 text-muted-foreground" />
                </motion.div>
              </button>
              
              <motion.div
                initial={false}
                animate={{
                  height: openIndex === index ? "auto" : 0,
                  opacity: openIndex === index ? 1 : 0
                }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="overflow-hidden"
              >
                <p className="px-5 pb-5 text-muted-foreground">
                  {faq.answer}
                </p>
              </motion.div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
