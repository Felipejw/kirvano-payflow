import { 
  Package, 
  Users, 
  Shield, 
  Zap,
  Wallet,
  ShoppingCart,
  BarChart3,
  Lock,
  Ban,
  Clock
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const features = [
  {
    icon: Ban,
    title: "0 Estorno",
    description: "Pagamentos PIX não têm chargeback. Receba com segurança e sem preocupações.",
    color: "text-destructive",
  },
  {
    icon: Wallet,
    title: "Sem Taxa de Saque",
    description: "Saque 100% do seu dinheiro. Não cobramos nenhuma taxa para você receber.",
    color: "text-accent",
  },
  {
    icon: Clock,
    title: "Saque a Qualquer Hora",
    description: "Disponível 24/7. Saque quando quiser, sem horário comercial ou dias úteis.",
    color: "text-primary",
  },
  {
    icon: ShoppingCart,
    title: "Checkout Otimizado",
    description: "Checkout responsivo com PIX, order bump, upsell, downsell e cupons de desconto.",
    color: "text-purple-400",
  },
  {
    icon: Users,
    title: "Sistema de Afiliados",
    description: "Gestão completa de afiliados com links automáticos e comissões configuráveis.",
    color: "text-yellow-400",
  },
  {
    icon: Package,
    title: "Produtos & Marketplace",
    description: "Cadastre produtos digitais, físicos e serviços. Painel completo para vendedores.",
    color: "text-pink-400",
  },
  {
    icon: Lock,
    title: "Área de Membros",
    description: "Proteção de conteúdos digitais com acesso exclusivo para compradores.",
    color: "text-orange-400",
  },
  {
    icon: BarChart3,
    title: "Dashboard Analítico",
    description: "Métricas em tempo real, funis de conversão e relatórios de performance.",
    color: "text-cyan-400",
  },
];

export function Features() {
  return (
    <section id="features" className="py-24 relative">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent" />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold mb-4">
            Tudo que você precisa para
            <br />
            <span className="gradient-text">vender mais</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Uma plataforma completa com os melhores recursos do mercado e diferenciais únicos
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <Card 
              key={feature.title} 
              variant="glass"
              className="group hover:border-primary/30 transition-all duration-300 cursor-pointer"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <CardContent className="p-6">
                <div className={`p-3 rounded-xl bg-secondary/50 w-fit mb-4 group-hover:scale-110 transition-transform duration-300 ${feature.color}`}>
                  <feature.icon className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
