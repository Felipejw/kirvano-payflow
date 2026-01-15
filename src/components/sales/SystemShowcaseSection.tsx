import { motion, AnimatePresence } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef, useState } from "react";
import { 
  LayoutDashboard, 
  CreditCard, 
  Palette, 
  RefreshCw, 
  HelpCircle,
  Bell,
  ChevronLeft,
  ChevronRight,
  Mail,
  MessageCircle,
  Code,
  BarChart3,
  Trophy,
  DollarSign,
  User,
  Shield
} from "lucide-react";

// Import seller screenshots
import dashboardImg from "@/assets/screenshots/dashboard.png";
import checkoutImg from "@/assets/screenshots/checkout.png";
import checkoutConfigImg from "@/assets/screenshots/checkout-config.png";
import recoveryImg from "@/assets/screenshots/recovery.png";
import quizBuilderImg from "@/assets/screenshots/quiz-builder.png";
import notificationsImg from "@/assets/screenshots/notifications.png";

// Import admin screenshots
import adminPanelImg from "@/assets/screenshots/admin/admin-panel.png";
import salesMetricsImg from "@/assets/screenshots/admin/sales-metrics.png";
import rankingsImg from "@/assets/screenshots/admin/rankings.png";
import revenueImg from "@/assets/screenshots/admin/revenue.png";
import emailBroadcastImg from "@/assets/screenshots/admin/email-broadcast.png";
import whatsappBroadcastImg from "@/assets/screenshots/admin/whatsapp-broadcast.png";
import apiDocsImg from "@/assets/screenshots/admin/api-docs.png";

interface ShowcaseItem {
  id: string;
  icon: React.ElementType;
  title: string;
  description: string;
  image: string;
}

const sellerItems: ShowcaseItem[] = [
  {
    id: "dashboard",
    icon: LayoutDashboard,
    title: "Dashboard Completo",
    description: "Acompanhe vendas, conversão, ticket médio e todas as métricas importantes em tempo real.",
    image: dashboardImg,
  },
  {
    id: "checkout",
    icon: CreditCard,
    title: "Checkout de Alta Conversão",
    description: "PIX com QR Code, Order Bumps e timer de urgência para maximizar suas vendas.",
    image: checkoutImg,
  },
  {
    id: "customization",
    icon: Palette,
    title: "Personalização Total",
    description: "Configure cores, logo, domínio próprio e transforme em um produto 100% seu.",
    image: checkoutConfigImg,
  },
  {
    id: "recovery",
    icon: RefreshCw,
    title: "Recuperação de Vendas",
    description: "Automatize mensagens e recupere PIX não pagos. Aumente sua conversão em até 30%.",
    image: recoveryImg,
  },
  {
    id: "quiz",
    icon: HelpCircle,
    title: "Construtor de Quiz",
    description: "Capture leads qualificados com quizzes interativos e aumente seu engajamento.",
    image: quizBuilderImg,
  },
  {
    id: "notifications",
    icon: Bell,
    title: "Sistema de Alertas",
    description: "Receba notificações de vendas em tempo real direto no navegador ou WhatsApp.",
    image: notificationsImg,
  },
];

const adminItems: ShowcaseItem[] = [
  {
    id: "admin-panel",
    icon: Shield,
    title: "Painel Administrativo",
    description: "Visão geral completa da plataforma com lucro, vendas, vendedores e métricas em tempo real.",
    image: adminPanelImg,
  },
  {
    id: "revenue",
    icon: DollarSign,
    title: "Receita & Lucro",
    description: "Acompanhe suas taxas recebidas, custódia, faturas e fluxo de caixa da plataforma.",
    image: revenueImg,
  },
  {
    id: "sales-metrics",
    icon: BarChart3,
    title: "Métricas de Vendas",
    description: "Análise detalhada de vendas, conversões, ticket médio e order bumps de toda plataforma.",
    image: salesMetricsImg,
  },
  {
    id: "rankings",
    icon: Trophy,
    title: "Rankings",
    description: "Veja os produtos mais vendidos e top vendedores da sua plataforma.",
    image: rankingsImg,
  },
  {
    id: "whatsapp-broadcast",
    icon: MessageCircle,
    title: "Disparo WhatsApp",
    description: "Envie mensagens em massa para seus contatos com templates e variações anti-ban.",
    image: whatsappBroadcastImg,
  },
  {
    id: "email-broadcast",
    icon: Mail,
    title: "Disparo de Emails",
    description: "Campanhas de email em massa com templates HTML e personalização por nome.",
    image: emailBroadcastImg,
  },
  {
    id: "api-docs",
    icon: Code,
    title: "API Completa",
    description: "Documentação REST API para integrar cobranças PIX em qualquer projeto externo.",
    image: apiDocsImg,
  },
];

type ModeType = "seller" | "admin";

export const SystemShowcaseSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [mode, setMode] = useState<ModeType>("seller");
  const [activeIndex, setActiveIndex] = useState(0);

  const currentItems = mode === "seller" ? sellerItems : adminItems;
  const activeItem = currentItems[activeIndex];

  const handleModeChange = (newMode: ModeType) => {
    setMode(newMode);
    setActiveIndex(0);
  };

  const goToPrevious = () => {
    setActiveIndex((prev) => (prev === 0 ? currentItems.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setActiveIndex((prev) => (prev === currentItems.length - 1 ? 0 : prev + 1));
  };

  return (
    <section ref={ref} className="py-16 md:py-24 px-4 bg-background">
      <div className="container max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="text-center mb-8 md:mb-10"
        >
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-4">
            Conheça o <span className="text-accent">Sistema</span> por Dentro
          </h2>
          <p className="text-muted-foreground text-base md:text-lg max-w-2xl mx-auto">
            Interface profissional e intuitiva. Tudo que você precisa para vender online em um só lugar.
          </p>
        </motion.div>

        {/* Mode Toggle */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.05 }}
          className="flex justify-center mb-6 md:mb-8"
        >
          <div className="inline-flex p-1 bg-muted rounded-xl">
            <button
              onClick={() => handleModeChange("seller")}
              className={`flex items-center gap-2 px-4 md:px-6 py-2.5 md:py-3 rounded-lg font-medium transition-all duration-300 ${
                mode === "seller"
                  ? "bg-background text-foreground shadow-md"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <User className="w-4 h-4" />
              <span className="text-sm md:text-base">Modo Vendedor</span>
            </button>
            <button
              onClick={() => handleModeChange("admin")}
              className={`flex items-center gap-2 px-4 md:px-6 py-2.5 md:py-3 rounded-lg font-medium transition-all duration-300 ${
                mode === "admin"
                  ? "bg-background text-foreground shadow-md"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Shield className="w-4 h-4" />
              <span className="text-sm md:text-base">Modo Admin</span>
            </button>
          </div>
        </motion.div>

        {/* Feature Tabs - Desktop */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="hidden md:flex justify-center gap-2 mb-8 flex-wrap"
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={mode}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="flex justify-center gap-2 flex-wrap"
            >
              {currentItems.map((item, index) => (
                <button
                  key={item.id}
                  onClick={() => setActiveIndex(index)}
                  className={`flex items-center gap-2 px-4 py-3 rounded-xl font-medium transition-all duration-300 ${
                    activeIndex === index
                      ? "bg-accent text-accent-foreground shadow-lg shadow-accent/25"
                      : "bg-card border border-border text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                  <span className="text-sm">{item.title.split(" ")[0]}</span>
                </button>
              ))}
            </motion.div>
          </AnimatePresence>
        </motion.div>

        {/* Mobile tabs - scrollable */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="md:hidden flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4"
        >
          {currentItems.map((item, index) => (
            <button
              key={item.id}
              onClick={() => setActiveIndex(index)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg font-medium transition-all duration-300 whitespace-nowrap flex-shrink-0 ${
                activeIndex === index
                  ? "bg-accent text-accent-foreground"
                  : "bg-card border border-border text-muted-foreground"
              }`}
            >
              <item.icon className="w-4 h-4" />
              <span className="text-xs">{item.title.split(" ")[0]}</span>
            </button>
          ))}
        </motion.div>

        {/* Screenshot display */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="relative"
        >
          {/* Browser frame */}
          <div className="bg-card rounded-xl md:rounded-2xl overflow-hidden shadow-2xl border border-border">
            {/* Browser bar */}
            <div className="flex items-center gap-2 px-3 md:px-4 py-2 md:py-3 bg-muted border-b border-border">
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-red-500" />
                <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-yellow-500" />
                <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-green-500" />
              </div>
              <div className="flex-1 text-center">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-background/50 text-xs md:text-sm text-muted-foreground">
                  <span className="hidden sm:inline">🔒</span>
                  seudominio.com/slug
                </div>
              </div>
              {/* Mode indicator badge */}
              <div className={`px-2 py-1 rounded-md text-xs font-medium ${
                mode === "admin" 
                  ? "bg-amber-500/20 text-amber-500" 
                  : "bg-accent/20 text-accent"
              }`}>
                {mode === "admin" ? "Admin" : "Vendedor"}
              </div>
            </div>

            {/* Screenshot */}
            <div className="relative aspect-[16/9] md:aspect-[16/8] overflow-hidden bg-background">
              <AnimatePresence mode="wait">
                <motion.img
                  key={`${mode}-${activeItem.id}`}
                  src={activeItem.image}
                  alt={activeItem.title}
                  initial={{ opacity: 0, scale: 1.02 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.3 }}
                  className="w-full h-full object-cover object-top"
                />
              </AnimatePresence>

              {/* Navigation arrows */}
              <button
                onClick={goToPrevious}
                className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 p-2 md:p-3 rounded-full bg-background/80 backdrop-blur-sm border border-border text-foreground hover:bg-background transition-colors"
              >
                <ChevronLeft className="w-4 h-4 md:w-5 md:h-5" />
              </button>
              <button
                onClick={goToNext}
                className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 p-2 md:p-3 rounded-full bg-background/80 backdrop-blur-sm border border-border text-foreground hover:bg-background transition-colors"
              >
                <ChevronRight className="w-4 h-4 md:w-5 md:h-5" />
              </button>
            </div>
          </div>

          {/* Description card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="mt-6 md:mt-8 text-center"
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={`${mode}-${activeItem.id}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <h3 className="text-lg md:text-xl font-semibold text-foreground mb-2 flex items-center justify-center gap-2">
                  <activeItem.icon className="w-5 h-5 text-accent" />
                  {activeItem.title}
                </h3>
                <p className="text-muted-foreground text-sm md:text-base max-w-xl mx-auto">
                  {activeItem.description}
                </p>
              </motion.div>
            </AnimatePresence>
          </motion.div>

          {/* Dots indicator */}
          <div className="flex justify-center gap-2 mt-6">
            {currentItems.map((_, index) => (
              <button
                key={index}
                onClick={() => setActiveIndex(index)}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  activeIndex === index
                    ? "bg-accent w-6"
                    : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
                }`}
              />
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};
