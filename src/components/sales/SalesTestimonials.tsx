import { useState, useEffect } from "react";
import { Star, Quote, ChevronLeft, ChevronRight, BadgeCheck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";

const testimonials = [
  {
    name: "Lucas Mendes",
    role: "Revendedor White Label",
    avatar: "LM",
    content: "Comprei o sistema e já recuperei o investimento na primeira semana. Agora tenho minha própria plataforma de pagamentos e ganho em cima de cada venda dos meus clientes.",
    result: "ROI em 7 dias",
    rating: 5,
    verified: true,
  },
  {
    name: "Ana Carolina",
    role: "Infoprodutora",
    avatar: "AC",
    content: "Finalmente tenho controle total sobre minhas vendas. Sem depender de plataformas que cobram taxas absurdas. O sistema é muito completo e fácil de usar.",
    result: "Economia de R$ 8.000/mês",
    rating: 5,
    verified: true,
  },
  {
    name: "Rafael Silva",
    role: "Dono de Agência",
    avatar: "RS",
    content: "Criei minha própria marca de checkout e ofereço como serviço para meus clientes. É uma nova fonte de receita recorrente para minha agência.",
    result: "Nova receita recorrente",
    rating: 5,
    verified: true,
  },
  {
    name: "Juliana Costa",
    role: "Mentora Digital",
    avatar: "JC",
    content: "A área de membros integrada é sensacional. Meus alunos têm acesso imediato após o pagamento e eu não preciso de nenhuma ferramenta externa.",
    result: "100% automatizado",
    rating: 5,
    verified: true,
  },
  {
    name: "Pedro Almeida",
    role: "Afiliado Profissional",
    avatar: "PA",
    content: "Uso o sistema para receber minhas comissões diretamente no meu PIX. Sem intermediários, sem taxas escondidas. Simplesmente funciona.",
    result: "Saque instantâneo",
    rating: 5,
    verified: true,
  },
];

export const SalesTestimonials = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  useEffect(() => {
    if (!isAutoPlaying) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [isAutoPlaying]);

  const next = () => {
    setIsAutoPlaying(false);
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
  };

  const prev = () => {
    setIsAutoPlaying(false);
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  return (
    <section ref={ref} className="py-10 md:py-14 px-4 bg-muted/30 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <div className="container max-w-5xl mx-auto relative">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <span className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium mb-4">
            <Star className="h-4 w-4 fill-primary" />
            Quem Comprou, Aprovou
          </span>
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground mb-4">
            Veja o que nossos <span className="text-primary">clientes dizem</span>
          </h2>
          <p className="text-muted-foreground text-base md:text-lg max-w-2xl mx-auto">
            Pessoas reais que já estão lucrando com o sistema
          </p>
        </motion.div>

        {/* Testimonials carousel */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="relative"
        >
          <div className="overflow-hidden">
            <div 
              className="flex transition-transform duration-500 ease-out"
              style={{ transform: `translateX(-${currentIndex * 100}%)` }}
            >
              {testimonials.map((testimonial, index) => (
                <div key={index} className="w-full flex-shrink-0 px-2 md:px-4">
                  <Card className="bg-background/80 backdrop-blur-sm border-border/50 hover:border-primary/30 transition-all duration-300">
                    <CardContent className="p-6 md:p-8">
                      <Quote className="h-8 w-8 text-primary/20 mb-4" />
                      
                      <p className="text-base md:text-lg text-foreground mb-6 leading-relaxed">
                        "{testimonial.content}"
                      </p>
                      
                      <div className="flex items-center justify-between flex-wrap gap-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-primary-foreground font-bold text-sm">
                            {testimonial.avatar}
                          </div>
                          <div>
                            <div className="font-semibold text-foreground flex items-center gap-2 text-sm md:text-base">
                              {testimonial.name}
                              {testimonial.verified && (
                                <BadgeCheck className="h-4 w-4 text-primary fill-primary/20" />
                              )}
                            </div>
                            <div className="text-xs md:text-sm text-muted-foreground">{testimonial.role}</div>
                          </div>
                        </div>
                        
                        <div className="flex flex-col items-end">
                          <div className="flex gap-1 mb-1">
                            {[...Array(testimonial.rating)].map((_, i) => (
                              <Star key={i} className="h-3 w-3 md:h-4 md:w-4 fill-yellow-400 text-yellow-400" />
                            ))}
                          </div>
                          <div className="text-xs md:text-sm font-medium text-primary">{testimonial.result}</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-center gap-4 mt-6">
            <Button
              variant="outline"
              size="icon"
              onClick={prev}
              className="rounded-full hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all h-9 w-9"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <div className="flex gap-2">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setIsAutoPlaying(false);
                    setCurrentIndex(index);
                  }}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    index === currentIndex 
                      ? 'w-6 bg-primary' 
                      : 'w-2 bg-muted-foreground/30 hover:bg-muted-foreground/50'
                  }`}
                />
              ))}
            </div>
            
            <Button
              variant="outline"
              size="icon"
              onClick={next}
              className="rounded-full hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all h-9 w-9"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
