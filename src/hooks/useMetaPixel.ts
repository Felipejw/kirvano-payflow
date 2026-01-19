import { useEffect, useCallback } from 'react';

export const useMetaPixel = (pixelId: string) => {
  useEffect(() => {
    // Evita duplicação do script
    if (document.getElementById('facebook-pixel-script')) {
      return;
    }

    // Inicializa o fbq
    const initPixel = () => {
      (function(f: Window, b: Document, e: string, v: string) {
        const n = f.fbq = function(...args: unknown[]) {
          if (n.callMethod) {
            n.callMethod.apply(n, args);
          } else {
            n.queue.push(args);
          }
        } as typeof f.fbq & { 
          callMethod?: (...args: unknown[]) => void; 
          queue: unknown[][]; 
          loaded: boolean; 
          version: string;
          push: (args: unknown[]) => void;
        };
        
        if (!f._fbq) f._fbq = n;
        n.push = n;
        n.loaded = true;
        n.version = '2.0';
        n.queue = [];
        
        const t = b.createElement(e) as HTMLScriptElement;
        t.async = true;
        t.src = v;
        t.id = 'facebook-pixel-script';
        
        const s = b.getElementsByTagName(e)[0];
        s.parentNode?.insertBefore(t, s);
      })(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');

      window.fbq('init', pixelId);
      window.fbq('track', 'PageView');
    };

    initPixel();

    // Cleanup quando o componente desmontar
    return () => {
      const script = document.getElementById('facebook-pixel-script');
      if (script) {
        script.remove();
      }
    };
  }, [pixelId]);

  const trackAddToCart = useCallback(() => {
    if (window.fbq) {
      window.fbq('track', 'AddToCart');
    }
  }, []);

  return { trackAddToCart };
};

// Adiciona a declaração para _fbq
declare global {
  interface Window {
    _fbq?: typeof window.fbq;
  }
}
