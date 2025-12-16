import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { getPageUrl } from "@/lib/routes";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { 
  ShoppingCart, 
  MessageSquare, 
  GraduationCap, 
  BarChart3, 
  Headphones, 
  CreditCard,
  ArrowRight,
  Sparkles
} from "lucide-react";

const features = [
  {
    icon: ShoppingCart,
    title: "Order Bump",
    description: "Aumente o ticket médio com ofertas irresistíveis no checkout. Clientes compram mais sem sair da página.",
    highlight: "+35% ticket médio",
    color: "from-orange-500 to-amber-500",
  },
  {
    icon: MessageSquare,
    title: "Recuperação de Carrinho",
    description: "WhatsApp + Email automático para carrinhos abandonados. Recupere até 30% das vendas perdidas.",
    highlight: "+30% vendas recuperadas",
    color: "from-green-500 to-emerald-500",
  },
  {
    icon: GraduationCap,
    title: "Área de Membros",
    description: "Entregue seus cursos e conteúdos protegidos. Área moderna e fácil de usar para seus alunos.",
    highlight: "Incluso grátis",
    color: "from-blue-500 to-cyan-500",
  },
  {
    icon: BarChart3,
    title: "Pixel Integrado",
    description: "Meta, Google e TikTok configurados em 1 clique. Rastreie conversões e otimize seus anúncios.",
    highlight: "3 plataformas",
    color: "from-purple-500 to-violet-500",
  },
  {
    icon: Headphones,
    title: "Suporte WhatsApp",
    description: "Atendimento direto e humanizado com nossa equipe. Resolva suas dúvidas em minutos, não dias.",
    highlight: "Resposta rápida",
    color: "from-pink-500 to-rose-500",
  },
  {
    icon: CreditCard,
    title: "Sem Cartão de Crédito",
    description: "Comece a usar sem cadastrar dados de pagamento. Só paga quando vender, simples assim.",
    highlight: "Zero risco",
    color: "from-teal-500 to-cyan-500",
  },
];

export function FeaturesDetailed() {
  const { ref, isVisible } = useScrollReveal<HTMLElement>({ threshold: 0.1 });

  return (
    <section ref={ref} id="features" className="py-24 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-muted/30 to-background" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary/5 rounded-full blur-3xl" />
      
      <div className="container mx-auto px-4 relative z-10">
        {/* Header */}
        <div className={`text-center mb-16 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-primary">Tudo que você precisa</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-bold mb-4">
            Funcionalidades que{" "}
            <span className="gradient-text">impulsionam vendas</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Ferramentas profissionais para vender mais, sem complicação
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {features.map((feature, index) => (
            <Card 
              key={feature.title}
              className={`group bg-background/80 backdrop-blur-sm border-border/50 hover:border-primary/50 hover:shadow-xl transition-all duration-500 ${
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
              }`}
              style={{ transitionDelay: `${index * 100}ms` }}
            >
              <CardContent className="p-6">
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <feature.icon className="h-7 w-7 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-2 group-hover:text-primary transition-colors">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground mb-4 leading-relaxed">
                  {feature.description}
                </p>
                <span className="inline-flex px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
                  {feature.highlight}
                </span>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* CTA */}
        <div className={`text-center transition-all duration-700 delay-500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <Link to={getPageUrl("auth")}>
            <Button variant="gradient" size="lg" className="group">
              Começar Agora - É Grátis
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
