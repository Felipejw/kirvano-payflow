import { MessageCircle } from "lucide-react";

export function WhatsAppButton() {
  const whatsappNumber = "5511969315095";
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=Ol%C3%A1!%20Vim%20pelo%20site%20e%20gostaria%20de%20saber%20mais%20sobre%20a%20Gatteflow.`;

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 left-6 z-50 flex items-center gap-3 px-4 py-3 bg-[#25D366] hover:bg-[#20BD5A] text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 group"
      aria-label="Contato via WhatsApp"
    >
      <div className="relative">
        <MessageCircle className="h-6 w-6 fill-white" />
        <span className="absolute -top-1 -right-1 w-3 h-3 bg-white rounded-full animate-ping" />
        <span className="absolute -top-1 -right-1 w-3 h-3 bg-white rounded-full" />
      </div>
      <span className="font-medium text-sm hidden sm:block group-hover:block">
        Suporte
      </span>
    </a>
  );
}
