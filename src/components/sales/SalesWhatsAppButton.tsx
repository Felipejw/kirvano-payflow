import { motion } from "framer-motion";
import { MessageCircle } from "lucide-react";

const WHATSAPP_URL = "https://wa.me/5511940777885?text=Ol%C3%A1%2C%20gostaria%20de%20comprar%20o%20sistema%20para%20vendas!%20";

export const SalesWhatsAppButton = () => {
  return (
    <motion.a
      href={WHATSAPP_URL}
      target="_blank"
      rel="noopener noreferrer"
      initial={{ opacity: 0, scale: 0, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ delay: 1, duration: 0.4, type: "spring", stiffness: 200 }}
      className="fixed bottom-24 right-4 z-40 flex items-center gap-2 bg-[#25D366] hover:bg-[#20BA5C] text-white font-semibold px-4 py-3 rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-105 group"
    >
      <MessageCircle className="w-5 h-5 fill-white" />
      <span className="hidden sm:inline text-sm">Comprar via WhatsApp</span>
      
      {/* Pulse animation */}
      <span className="absolute -top-1 -right-1 flex h-3 w-3">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
        <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
      </span>
    </motion.a>
  );
};
