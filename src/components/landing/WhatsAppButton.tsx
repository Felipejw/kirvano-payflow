import { MessageCircle } from "lucide-react";
import { useState, useEffect } from "react";

export function WhatsAppButton() {
  const [isVisible, setIsVisible] = useState(false);
  const [showPulse, setShowPulse] = useState(false);

  const whatsappNumber = "5511969315095";
  const message = encodeURIComponent("Olá, gostaria de saber um pouco mais sobre a Gatteflow");
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${message}`;

  useEffect(() => {
    // Delay entrance animation
    const showTimer = setTimeout(() => setIsVisible(true), 1500);
    // Start pulse after entrance
    const pulseTimer = setTimeout(() => setShowPulse(true), 2500);
    
    return () => {
      clearTimeout(showTimer);
      clearTimeout(pulseTimer);
    };
  }, []);

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 bg-[#25D366] hover:bg-[#20BD5A] text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-500 hover:scale-105 group ${
        isVisible 
          ? 'translate-x-0 opacity-100' 
          : 'translate-x-20 opacity-0'
      } ${showPulse ? 'animate-bounce-subtle' : ''}`}
      aria-label="Contato via WhatsApp"
    >
      <div className="relative">
        <MessageCircle className="h-6 w-6 fill-white" />
        {showPulse && (
          <>
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-white rounded-full animate-ping" />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-white rounded-full" />
          </>
        )}
      </div>
      <span className="font-medium text-sm hidden sm:block group-hover:block">
        Suporte
      </span>
    </a>
  );
}
