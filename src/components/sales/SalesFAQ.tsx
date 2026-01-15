import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef, useState } from "react";
import { ChevronDown, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const faqs = [
  {
    question: "O pagamento é mensal?",
    answer: "Não. O pagamento é único, no valor de R$97. Você compra uma vez e pode usar o sistema sem mensalidades."
  },
  {
    question: "Posso usar apenas para mim?",
    answer: "Sim. Você pode usar o Gatteflow apenas para uso próprio, economizando taxas de gateways e tendo controle total sobre seus pagamentos."
  },
  {
    question: "Posso cobrar taxas de outros usuários?",
    answer: "Sim. O sistema permite que você crie sua própria plataforma e cobre taxas sobre cada venda feita pelos seus usuários."
  },
  {
    question: "Preciso saber programar?",
    answer: "Não. O sistema é pronto para uso e não exige conhecimento técnico. Se quiser algo mais avançado, também há opções de integração via API."
  },
  {
    question: "O sistema é White Label?",
    answer: "Sim. O Gatteflow é 100% White Label. Você pode usar sua própria marca, logotipo, cores e domínio."
  },
  {
    question: "Tem suporte?",
    answer: "Sim. Você conta com suporte via WhatsApp para tirar dúvidas e receber ajuda quando precisar."
  },
  {
    question: "Tem atualizações?",
    answer: "Sim. O sistema recebe atualizações constantes, sem custo adicional."
  },
];

interface SalesFAQProps {
  onBuyClick?: () => void;
}

export const SalesFAQ = ({ onBuyClick }: SalesFAQProps) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [openIndex, setOpenIndex] = useState<number | null>(0);

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
                <div className="px-5 pb-5 flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-accent mt-1 flex-shrink-0" />
                  <span className="text-muted-foreground">{faq.answer}</span>
                </div>
              </motion.div>
            </motion.div>
          ))}
        </div>

        {/* CTA após FAQ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="mt-12 text-center"
        >
          <p className="text-lg text-muted-foreground mb-4">
            Tudo esclarecido? Então é só começar.
          </p>
          <Button 
            onClick={onBuyClick}
            size="lg"
            className="bg-accent hover:bg-accent/90 text-accent-foreground font-semibold px-8 py-6 text-lg"
          >
            Comprar Agora por R$97
          </Button>
        </motion.div>
      </div>
    </section>
  );
};
