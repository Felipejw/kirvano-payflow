import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";

const faqs = [
  {
    question: "Preciso ter conhecimento técnico para usar?",
    answer: "Não. O sistema foi desenvolvido para ser simples e intuitivo. Você configura tudo pelo painel, sem precisar mexer em código. E se tiver dúvidas, nosso suporte está disponível para ajudar."
  },
  {
    question: "Como funciona o pagamento?",
    answer: "É um pagamento único de R$97. Você paga uma vez e tem acesso vitalício ao sistema, incluindo todas as atualizações futuras."
  },
  {
    question: "Posso usar meu próprio domínio?",
    answer: "Sim! O sistema suporta domínio próprio. Você pode ter seu checkout e área de membros funcionando no seu domínio, com sua marca."
  },
  {
    question: "O sistema é seguro?",
    answer: "Absolutamente. Usamos as melhores práticas de segurança, incluindo criptografia de ponta a ponta, proteção contra fraudes e backups automáticos."
  },
  {
    question: "E se eu não gostar?",
    answer: "Oferecemos garantia de 7 dias. Se não ficar satisfeito por qualquer motivo, devolvemos 100% do seu investimento, sem perguntas."
  },
  {
    question: "Posso revender o sistema?",
    answer: "Sim! Com o white-label, você pode colocar sua marca e revender para outros empreendedores. É uma ótima forma de criar uma renda extra."
  },
];

interface SalesFAQProps {
  onBuyClick?: () => void;
}

export const SalesFAQ = ({ onBuyClick }: SalesFAQProps) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section ref={ref} className="py-16 md:py-24 px-4 bg-muted/30 pb-32 md:pb-40">
      <div className="container max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-10 md:mb-12"
        >
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-3 md:mb-4 px-2">
            Perguntas <span className="text-accent">Frequentes</span>
          </h2>
          <p className="text-base md:text-lg text-muted-foreground px-2">
            Tire suas dúvidas antes de garantir seu acesso.
          </p>
        </motion.div>

        <div className="space-y-3 md:space-y-4">
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
                className="w-full p-4 md:p-5 flex items-center justify-between text-left hover:bg-muted/50 transition-colors"
              >
                <span className="font-medium text-sm md:text-base text-foreground pr-4">{faq.question}</span>
                <ChevronDown 
                  className={`w-4 h-4 md:w-5 md:h-5 text-muted-foreground transition-transform duration-300 flex-shrink-0 ${
                    openIndex === index ? 'rotate-180' : ''
                  }`}
                />
              </button>
              
              <motion.div
                initial={false}
                animate={{ 
                  height: openIndex === index ? 'auto' : 0,
                  opacity: openIndex === index ? 1 : 0
                }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <p className="px-4 md:px-5 pb-4 md:pb-5 text-sm md:text-base text-muted-foreground">
                  {faq.answer}
                </p>
              </motion.div>
            </motion.div>
          ))}
        </div>

        {/* Final CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="text-center mt-10 md:mt-12"
        >
          <p className="text-base md:text-lg text-muted-foreground mb-4 md:mb-6 px-2">
            Ainda tem dúvidas? Entre em contato conosco ou garanta seu acesso com garantia de 7 dias.
          </p>
          <Button 
            onClick={onBuyClick}
            variant="gradient"
            size="lg"
            className="text-base md:text-lg px-6 md:px-8 w-full sm:w-auto"
          >
            Comprar Agora por R$97
          </Button>
        </motion.div>
      </div>
    </section>
  );
};
