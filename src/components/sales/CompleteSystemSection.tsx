import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
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
  Check
} from "lucide-react";

const features = [
  { icon: ShoppingCart, label: "Checkout personalizável" },
  { icon: Building2, label: "Integração com qualquer banco" },
  { icon: BarChart3, label: "Dashboard de vendas" },
  { icon: Users, label: "Sistema de afiliados" },
  { icon: GraduationCap, label: "Área de membros automática" },
  { icon: HelpCircle, label: "Quiz integrado" },
  { icon: RefreshCw, label: "Recuperação de vendas por Email e WhatsApp" },
  { icon: Send, label: "Disparo em massa (WhatsApp e Email)" },
  { icon: Sparkles, label: "Gerador de posts com IA" },
  { icon: Gift, label: "Order bumps" },
  { icon: Target, label: "Pixel de rastreamento" },
  { icon: Link, label: "UTMs" },
  { icon: Bell, label: "Notificações de venda" },
  { icon: Moon, label: "Modo claro e noturno" },
  { icon: Code, label: "API para integrações" },
  { icon: Mail, label: "Emails automáticos" },
];

export const CompleteSystemSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section ref={ref} className="py-20 px-4 bg-background">
      <div className="container max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Tudo o que você precisa para vender online{" "}
            <span className="text-accent">em um único sistema</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Sem depender de várias ferramentas e sem mensalidades.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {features.map((feature, index) => (
            <motion.div
              key={feature.label}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ 
                duration: 0.4, 
                delay: 0.1 + index * 0.05,
                ease: "easeOut"
              }}
              className="flex items-center gap-3 p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors group cursor-default"
            >
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center group-hover:bg-accent/20 transition-colors">
                <feature.icon className="w-4 h-4 text-accent" />
              </div>
              <span className="text-sm font-medium text-foreground">{feature.label}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
