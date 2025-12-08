import { 
  Package, 
  CreditCard, 
  Users, 
  TrendingUp, 
  Shield, 
  Code,
  Zap,
  Wallet,
  ShoppingCart,
  Settings,
  BarChart3,
  Lock
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const features = [
  {
    icon: Package,
    title: "Produtos & Marketplace",
    description: "Cadastre produtos digitais, físicos e serviços. Painel completo para vendedores e afiliados.",
    color: "text-primary",
  },
  {
    icon: ShoppingCart,
    title: "Checkout Otimizado",
    description: "Checkout responsivo com PIX, order bump, upsell, downsell e cupons de desconto.",
    color: "text-accent",
  },
  {
    icon: Users,
    title: "Sistema de Afiliados",
    description: "Gestão completa de afiliados com links automáticos e comissões configuráveis.",
    color: "text-purple-400",
  },
  {
    icon: Wallet,
    title: "Gestão Financeira",
    description: "Repasses, saques, agendamentos e taxas configuráveis com registro de auditoria.",
    color: "text-yellow-400",
  },
  {
    icon: BarChart3,
    title: "Dashboard Analítico",
    description: "Métricas em tempo real, funis de conversão e relatórios de performance.",
    color: "text-pink-400",
  },
  {
    icon: Lock,
    title: "Área de Membros",
    description: "Proteção de conteúdos digitais com acesso exclusivo para compradores.",
    color: "text-orange-400",
  },
  {
    icon: Code,
    title: "API PIX Completa",
    description: "Crie cobranças, emita QR Codes, receba webhooks e integre com qualquer plataforma.",
    color: "text-cyan-400",
  },
  {
    icon: Shield,
    title: "Segurança Avançada",
    description: "Autenticação OAuth2/JWT, criptografia de ponta e prevenção de fraudes.",
    color: "text-emerald-400",
  },
];

export function Features() {
  return (
    <section className="py-24 relative">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent" />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold mb-4">
            Tudo que você precisa para
            <br />
            <span className="gradient-text">escalar seu negócio</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Uma plataforma completa de pagamentos inspirada nas melhores soluções do mercado
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
