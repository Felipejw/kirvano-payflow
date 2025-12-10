import { useState, useEffect } from "react";
import { Star, Quote, ChevronLeft, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useScrollReveal } from "@/hooks/useScrollReveal";

const testimonials = [
  {
    name: "Lucas Mendes",
    role: "Infoprodutor",
    avatar: "LM",
    content: "Migrei da Hotmart e minha margem de lucro aumentou 40%. A taxa de 4,99% é imbatível e o saque instantâneo mudou meu fluxo de caixa.",
    revenue: "R$ 127.000/mês",
    rating: 5,
  },
  {
    name: "Ana Carolina",
    role: "Criadora de Cursos",
    avatar: "AC",
    content: "Zero chargebacks em 6 meses! Antes eu perdia cerca de 8% com estornos. Agora esse dinheiro fica comigo.",
    revenue: "R$ 89.000/mês",
    rating: 5,
  },
  {
    name: "Rafael Silva",
    role: "Mentor Digital",
    avatar: "RS",
    content: "O melhor é poder sacar a qualquer hora sem pagar taxa. Já economizei mais de R$ 15.000 só em taxas de saque.",
    revenue: "R$ 210.000/mês",
    rating: 5,
  },
  {
    name: "Juliana Costa",
    role: "Coach de Negócios",
    avatar: "JC",
    content: "A simplicidade do checkout aumentou minha conversão em 23%. Menos fricção = mais vendas.",
    revenue: "R$ 156.000/mês",
    rating: 5,
  },
];

const stats = [
  { value: "R$ 12M+", label: "Processados" },
  { value: "2.500+", label: "Produtores" },
  { value: "99.9%", label: "Uptime" },
  { value: "0", label: "Chargebacks" },
];

export const Testimonials = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  
  const { ref: headerRef, isVisible: headerVisible } = useScrollReveal<HTMLDivElement>({ threshold: 0.2 });
  const { ref: statsRef, isVisible: statsVisible } = useScrollReveal<HTMLDivElement>({ threshold: 0.2 });
  const { ref: carouselRef, isVisible: carouselVisible } = useScrollReveal<HTMLDivElement>({ threshold: 0.2 });

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
    <section className="py-24 bg-muted/30 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <div className="container mx-auto px-4 relative">
        {/* Section header */}
        <div 
          ref={headerRef}
          className={`text-center mb-16 transition-all duration-700 ${
            headerVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`}
        >
          <span className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium mb-4">
            <Star className="h-4 w-4 fill-primary" />
            Cases de Sucesso
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">
            Quem usa, <span className="text-primary">recomenda</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Milhares de infoprodutores já aumentaram seus lucros com a Gateflow
          </p>
        </div>

        {/* Stats bar */}
        <div ref={statsRef} className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16">
          {stats.map((stat, index) => (
            <div 
              key={stat.label}
              className={`text-center p-6 bg-background/50 backdrop-blur-sm rounded-2xl border border-border/50 hover:border-primary/50 transition-all duration-500 hover:scale-105 hover:shadow-lg group ${
                statsVisible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-8 scale-95'
              }`}
              style={{ transitionDelay: `${index * 100}ms` }}
            >
              <div className="text-2xl md:text-3xl font-bold text-primary mb-1 group-hover:scale-110 transition-transform">
                {stat.value}
              </div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Testimonials carousel */}
        <div 
          ref={carouselRef}
          className={`relative max-w-4xl mx-auto transition-all duration-700 ${
            carouselVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
          }`}
        >
          <div className="overflow-hidden">
            <div 
              className="flex transition-transform duration-500 ease-out"
              style={{ transform: `translateX(-${currentIndex * 100}%)` }}
            >
              {testimonials.map((testimonial, index) => (
                <div key={index} className="w-full flex-shrink-0 px-4">
                  <Card className="bg-background/80 backdrop-blur-sm border-border/50 hover:border-primary/30 transition-all duration-300">
                    <CardContent className="p-8 md:p-10">
                      <Quote className="h-10 w-10 text-primary/20 mb-6" />
                      
                      <p className="text-lg md:text-xl text-foreground mb-8 leading-relaxed">
                        "{testimonial.content}"
                      </p>
                      
                      <div className="flex items-center justify-between flex-wrap gap-4">
                        <div className="flex items-center gap-4">
                          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-primary-foreground font-bold text-lg">
                            {testimonial.avatar}
                          </div>
                          <div>
                            <div className="font-semibold text-foreground">{testimonial.name}</div>
                            <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                          </div>
                        </div>
                        
                        <div className="flex flex-col items-end">
                          <div className="flex gap-1 mb-1">
                            {[...Array(testimonial.rating)].map((_, i) => (
                              <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            ))}
                          </div>
                          <div className="text-sm font-medium text-primary">{testimonial.revenue}</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-center gap-4 mt-8">
            <Button
              variant="outline"
              size="icon"
              onClick={prev}
              className="rounded-full hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            
            <div className="flex gap-2">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setIsAutoPlaying(false);
                    setCurrentIndex(index);
                  }}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    index === currentIndex 
                      ? 'w-8 bg-primary' 
                      : 'bg-muted-foreground/30 hover:bg-muted-foreground/50'
                  }`}
                />
              ))}
            </div>
            
            <Button
              variant="outline"
              size="icon"
              onClick={next}
              className="rounded-full hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all"
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};