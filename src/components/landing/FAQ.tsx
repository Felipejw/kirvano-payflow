import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { getPageUrl } from "@/lib/routes";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { ChevronDown, HelpCircle, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

const faqs = [
  {
    question: "Qual é a taxa da Gatteflow?",
    answer: "Nossa taxa é de apenas 4,99% + R$1 por venda aprovada. É a menor taxa do mercado para infoprodutores. Não cobramos taxa de saque, taxa de antecipação ou mensalidade.",
  },
  {
    question: "Como funciona o saque?",
    answer: "O saque é instantâneo e gratuito, disponível 24 horas por dia, 7 dias por semana. O dinheiro cai na sua conta em segundos via PIX. Não há valor mínimo para saque.",
  },
  {
    question: "Preciso de cartão de crédito para começar?",
    answer: "Não! Você pode criar sua conta e começar a vender sem precisar cadastrar nenhum cartão de crédito. Só cobramos nossa taxa quando você fizer uma venda.",
  },
  {
    question: "O que é a recuperação de carrinho?",
    answer: "É uma ferramenta automática que envia mensagens via WhatsApp e Email para clientes que abandonaram o checkout. Isso pode recuperar até 30% das vendas perdidas.",
  },
  {
    question: "Como funciona a área de membros?",
    answer: "Nossa área de membros é inclusa gratuitamente. Você pode hospedar seus cursos, criar módulos e aulas, e seus alunos terão acesso a uma plataforma moderna e intuitiva.",
  },
  {
    question: "Posso integrar com pixels de conversão?",
    answer: "Sim! Oferecemos integração nativa com Meta Pixel (Facebook/Instagram), Google Analytics e TikTok Pixel. A configuração é feita em poucos cliques.",
  },
  {
    question: "Como é o suporte?",
    answer: "Nosso suporte é feito via WhatsApp, com atendimento humanizado. Você fala direto com nossa equipe, sem robôs ou filas intermináveis. Tempo médio de resposta: minutos.",
  },
  {
    question: "Existe estorno ou chargeback?",
    answer: "Com PIX, não existe chargeback! Diferente do cartão de crédito, o PIX não permite estorno, o que significa que você recebe e o dinheiro é seu. Zero risco de perder vendas por disputas.",
  },
];

function FAQItem({ question, answer, isOpen, onClick }: { 
  question: string; 
  answer: string; 
  isOpen: boolean; 
  onClick: () => void;
}) {
  return (
    <div 
      className={cn(
        "border border-border/50 rounded-2xl overflow-hidden transition-all duration-300",
        isOpen ? "bg-primary/5 border-primary/30" : "bg-background/50 hover:border-primary/20"
      )}
    >
      <button
        onClick={onClick}
        className="w-full px-6 py-5 flex items-center justify-between text-left"
      >
        <span className={cn(
          "font-medium transition-colors",
          isOpen ? "text-primary" : "text-foreground"
        )}>
          {question}
        </span>
        <ChevronDown className={cn(
          "h-5 w-5 transition-transform duration-300 flex-shrink-0 ml-4",
          isOpen ? "rotate-180 text-primary" : "text-muted-foreground"
        )} />
      </button>
      <div className={cn(
        "overflow-hidden transition-all duration-300",
        isOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
      )}>
        <p className="px-6 pb-5 text-muted-foreground leading-relaxed">
          {answer}
        </p>
      </div>
    </div>
  );
}

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const { ref, isVisible } = useScrollReveal<HTMLElement>({ threshold: 0.1 });

  return (
    <section ref={ref} className="py-24 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-muted/30 via-background to-background" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl" />
      
      <div className="container mx-auto px-4 relative z-10">
        {/* Header */}
        <div className={`text-center mb-16 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
            <HelpCircle className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-primary">Perguntas Frequentes</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-bold mb-4">
            Dúvidas? A gente{" "}
            <span className="gradient-text">responde</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Tudo que você precisa saber sobre a Gatteflow
          </p>
        </div>

        {/* FAQ Grid */}
        <div className={`max-w-3xl mx-auto space-y-4 transition-all duration-700 delay-200 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          {faqs.map((faq, index) => (
            <div
              key={index}
              className={`transition-all duration-500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`}
              style={{ transitionDelay: `${200 + index * 50}ms` }}
            >
              <FAQItem
                question={faq.question}
                answer={faq.answer}
                isOpen={openIndex === index}
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
              />
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className={`text-center mt-12 transition-all duration-700 delay-500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <p className="text-muted-foreground mb-4">Ainda tem dúvidas?</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a 
              href="https://wa.me/5511969315095?text=Ol%C3%A1!%20Tenho%20uma%20d%C3%BAvida%20sobre%20a%20Gatteflow."
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="outline" size="lg">
                Falar com Suporte
              </Button>
            </a>
            <Link to={getPageUrl("auth")}>
              <Button variant="gradient" size="lg" className="group">
                Criar Conta Grátis
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
