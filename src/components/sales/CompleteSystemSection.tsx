import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef, useState } from "react";
import { 
  CreditCard, 
  LayoutDashboard, 
  BarChart3, 
  Users, 
  ShoppingCart,
  Mail,
  Bell,
  Shield,
  Smartphone,
  Globe,
  Palette,
  Zap,
  FileText,
  Settings,
  Link,
  BookOpen,
  Video,
  MessageSquare,
  TrendingUp,
  Wallet,
  Clock,
  LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface Feature {
  icon: LucideIcon;
  label: string;
}

interface FeatureCategory {
  title: string;
  icon: LucideIcon;
  color: string;
  features: Feature[];
}

const featureCategories: FeatureCategory[] = [
  {
    title: "Pagamentos",
    icon: CreditCard,
    color: "from-green-500/20 to-emerald-500/10",
    features: [
      { icon: CreditCard, label: "Checkout PIX" },
      { icon: Wallet, label: "Múltiplos gateways" },
      { icon: Clock, label: "Aprovação instantânea" },
      { icon: Shield, label: "Anti-fraude" },
    ]
  },
  {
    title: "Gestão",
    icon: LayoutDashboard,
    color: "from-blue-500/20 to-indigo-500/10",
    features: [
      { icon: LayoutDashboard, label: "Dashboard completo" },
      { icon: BarChart3, label: "Relatórios detalhados" },
      { icon: Users, label: "Gestão de clientes" },
      { icon: ShoppingCart, label: "Produtos ilimitados" },
    ]
  },
  {
    title: "Marketing",
    icon: TrendingUp,
    color: "from-purple-500/20 to-pink-500/10",
    features: [
      { icon: Mail, label: "E-mail automático" },
      { icon: Bell, label: "Notificações" },
      { icon: MessageSquare, label: "Recuperação de vendas" },
      { icon: Link, label: "Pixels e tracking" },
    ]
  },
  {
    title: "Personalização",
    icon: Palette,
    color: "from-orange-500/20 to-amber-500/10",
    features: [
      { icon: Globe, label: "Domínio próprio" },
      { icon: Palette, label: "White-label completo" },
      { icon: Smartphone, label: "100% responsivo" },
      { icon: Zap, label: "Carregamento rápido" },
    ]
  },
  {
    title: "Conteúdo",
    icon: BookOpen,
    color: "from-cyan-500/20 to-teal-500/10",
    features: [
      { icon: BookOpen, label: "Área de membros" },
      { icon: Video, label: "Player de vídeo" },
      { icon: FileText, label: "Entrega automática" },
      { icon: Settings, label: "Configurações avançadas" },
    ]
  },
];

interface FeatureCardProps {
  feature: Feature;
  index: number;
  isInView: boolean;
}

const FeatureCard = ({ feature, index, isInView }: FeatureCardProps) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.4, delay: 0.1 + index * 0.05 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="flex items-center gap-2 md:gap-3 p-2.5 md:p-3 bg-card/50 rounded-lg border border-border/50 hover:border-accent/50 hover:bg-card transition-all duration-300 cursor-default group relative"
    >
      <feature.icon className="w-4 h-4 md:w-5 md:h-5 text-accent flex-shrink-0" />
      <span className="text-xs md:text-sm text-foreground">{feature.label}</span>
    </motion.div>
  );
};

interface CompleteSystemSectionProps {
  onBuyClick?: () => void;
}

export const CompleteSystemSection = ({ onBuyClick }: CompleteSystemSectionProps) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section ref={ref} className="py-12 md:py-16 px-4 bg-background">
      <div className="container max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-8 md:mb-12"
        >
          <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-foreground mb-3 md:mb-4 px-2 leading-snug">
            Tudo que você precisa <span className="text-accent">em um só lugar</span>
          </h2>
          <p className="text-sm sm:text-base md:text-lg text-muted-foreground max-w-2xl mx-auto px-2">
            Sistema completo para vender online, sem precisar de dezenas de ferramentas.
          </p>
        </motion.div>

        {/* Feature categories */}
        <div className="space-y-6 md:space-y-8">
          {featureCategories.map((category, catIndex) => (
            <motion.div
              key={category.title}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.2 + catIndex * 0.1 }}
            >
              {/* Category header */}
              <div className="flex items-center gap-2 md:gap-3 mb-3 md:mb-4">
                <div className={`w-8 h-8 md:w-10 md:h-10 rounded-lg bg-gradient-to-br ${category.color} flex items-center justify-center flex-shrink-0`}>
                  <category.icon className="w-4 h-4 md:w-5 md:h-5 text-foreground" />
                </div>
                <h3 className="text-base md:text-lg font-semibold text-foreground">{category.title}</h3>
              </div>

              {/* Features grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
                {category.features.map((feature, featIndex) => (
                  <FeatureCard 
                    key={feature.label} 
                    feature={feature} 
                    index={catIndex * 4 + featIndex}
                    isInView={isInView}
                  />
                ))}
              </div>
            </motion.div>
          ))}
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="text-center mt-8 md:mt-12"
        >
          <Button 
            onClick={onBuyClick}
            size="lg"
            className="bg-accent hover:bg-accent/90 text-accent-foreground font-semibold text-base md:text-lg px-6 md:px-8 py-4 md:py-5 h-auto hover:scale-105 transition-all"
          >
            <ShoppingCart className="w-5 h-5 mr-2" />
            Comprar Agora por R$97
          </Button>
        </motion.div>
      </div>
    </section>
  );
};
