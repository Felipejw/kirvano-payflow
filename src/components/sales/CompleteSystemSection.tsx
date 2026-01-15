import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef, useState } from "react";
import { 
  ShoppingCart, 
  Building2, 
  BarChart3, 
  Users, 
  GraduationCap, 
  HelpCircle,
  RefreshCw,
  Send,
  Mail,
  Sparkles,
  Gift,
  Target,
  Link,
  Bell,
  Moon,
  Code,
  CreditCard,
  Zap,
  Layout,
  Cpu,
  LucideIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface Feature {
  icon: LucideIcon;
  label: string;
  hasPreview?: boolean;
}

interface FeatureCategory {
  title: string;
  icon: LucideIcon;
  features: Feature[];
}

const featureCategories: FeatureCategory[] = [
  {
    title: "Vendas & Pagamentos",
    icon: CreditCard,
    features: [
      { icon: ShoppingCart, label: "Checkout com sua marca", hasPreview: true },
      { icon: Building2, label: "Conecte seus próprios bancos" },
      { icon: Gift, label: "Order bumps integrados" },
      { icon: Target, label: "Rastreie cada venda" },
      { icon: Link, label: "Saiba de onde vem cada venda" },
    ]
  },
  {
    title: "Automação & Escala",
    icon: Zap,
    features: [
      { icon: RefreshCw, label: "Recupere vendas perdidas", hasPreview: true },
      { icon: Send, label: "Fale com clientes em escala" },
      { icon: Mail, label: "Emails automáticos" },
      { icon: Bell, label: "Notificações em tempo real" },
    ]
  },
  {
    title: "Gestão & Experiência",
    icon: Layout,
    features: [
      { icon: BarChart3, label: "Veja tudo em tempo real", hasPreview: true },
      { icon: GraduationCap, label: "Acesso liberado automaticamente", hasPreview: true },
      { icon: Users, label: "Afiliados vendendo pra você" },
      { icon: HelpCircle, label: "Quiz integrado" },
      { icon: Moon, label: "Modo claro e noturno" },
    ]
  },
  {
    title: "Tecnologia & IA",
    icon: Cpu,
    features: [
      { icon: Sparkles, label: "Crie conteúdo com IA" },
      { icon: Code, label: "API para integrações" },
    ]
  }
];

interface FeatureCardProps {
  feature: Feature;
  index: number;
  isInView: boolean;
  categoryIndex: number;
}

const FeatureCard = ({ feature, index, isInView, categoryIndex }: FeatureCardProps) => {
  const [showPreview, setShowPreview] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ 
        duration: 0.4, 
        delay: 0.1 + (categoryIndex * 0.1) + (index * 0.05),
        ease: "easeOut"
      }}
      className="relative"
      onMouseEnter={() => feature.hasPreview && setShowPreview(true)}
      onMouseLeave={() => setShowPreview(false)}
    >
      <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50 hover:bg-muted transition-all group cursor-default hover:scale-[1.02]">
        <div className="flex-shrink-0 w-9 h-9 rounded-full bg-accent/10 flex items-center justify-center group-hover:bg-accent/20 transition-colors">
          <feature.icon className="w-4 h-4 text-accent" />
        </div>
        <span className="text-sm font-medium text-foreground">{feature.label}</span>
        {feature.hasPreview && (
          <span className="ml-auto text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
            Preview
          </span>
        )}
      </div>

      {/* Hover Preview */}
      {showPreview && feature.hasPreview && (
        <motion.div
          initial={{ opacity: 0, y: 10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.95 }}
          className="absolute z-50 left-0 top-full mt-2 w-64 bg-card border border-border rounded-lg shadow-xl overflow-hidden"
        >
          <div className="aspect-video bg-muted flex items-center justify-center">
            <span className="text-xs text-muted-foreground">Preview em breve</span>
          </div>
          <div className="p-3 bg-card">
            <p className="text-xs text-muted-foreground">Veja na prática</p>
          </div>
        </motion.div>
      )}
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
    <section ref={ref} className="py-24 px-4 bg-background">
      <div className="container max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
            Tudo o que você precisa para vender online{" "}
            <span className="text-accent">em um único sistema</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Sem depender de várias ferramentas e sem mensalidades.
          </p>
        </motion.div>

        {/* Categories */}
        <div className="space-y-12">
          {featureCategories.map((category, categoryIndex) => (
            <motion.div
              key={category.title}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: categoryIndex * 0.1 }}
            >
              {/* Category Header */}
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                  <category.icon className="w-5 h-5 text-accent" />
                </div>
                <h3 className="text-xl font-semibold text-foreground">{category.title}</h3>
                <div className="flex-1 h-px bg-border/50 ml-4" />
              </div>

              {/* Features Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {category.features.map((feature, index) => (
                  <FeatureCard
                    key={feature.label}
                    feature={feature}
                    index={index}
                    isInView={isInView}
                    categoryIndex={categoryIndex}
                  />
                ))}
              </div>
            </motion.div>
          ))}
        </div>

        {/* CTA Intermediário */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="text-center mt-16 pt-12 border-t border-border/30"
        >
          <p className="text-xl md:text-2xl font-semibold text-foreground mb-6">
            Tudo isso por apenas{" "}
            <span className="text-accent">R$97</span>{" "}
            em pagamento único
          </p>
          <Button 
            size="lg" 
            onClick={onBuyClick}
            className="bg-accent hover:bg-accent/90 text-accent-foreground px-8"
          >
            Comprar Agora por R$97
          </Button>
        </motion.div>
      </div>
    </section>
  );
};
