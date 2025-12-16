import { useState, useEffect } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/utils";
import { QRCodeSVG } from "qrcode.react";
import { 
  QrCode, 
  Copy, 
  Check, 
  Timer, 
  CheckCircle2, 
  Loader2, 
  Gift, 
  Zap,
  Star,
  Shield,
  ArrowRight,
  AlertTriangle,
  Clock,
  ChevronDown,
  CreditCard,
  Lock,
  MessageCircle,
  Receipt,
  Banknote
} from "lucide-react";

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  cover_url: string;
  order_bumps: string[] | null;
  checkout_template_id: string | null;
  facebook_pixel: string | null;
  tiktok_pixel: string | null;
  google_analytics: string | null;
  checkout_theme: string | null;
  seller_id: string;
}

interface CheckoutTemplate {
  id: string;
  name: string;
  primary_color: string | null;
  background_color: string | null;
  text_color: string | null;
  button_color: string | null;
  button_text_color: string | null;
  border_radius: string | null;
  logo_url: string | null;
  favicon_url: string | null;
  page_title: string | null;
  layout: string | null;
  show_product_image: boolean | null;
  show_product_description: boolean | null;
  show_order_summary: boolean | null;
  show_order_bump_after_button: boolean | null;
  require_cpf: boolean | null;
  require_phone: boolean | null;
  require_address: boolean | null;
  enable_timer: boolean | null;
  timer_minutes: number | null;
  timer_text: string | null;
  show_stock: boolean | null;
  stock_count: number | null;
  stock_text: string | null;
  show_security_badge: boolean | null;
  show_guarantee: boolean | null;
  guarantee_text: string | null;
  guarantee_days: number | null;
  enable_email_notification: boolean | null;
  enable_sms_notification: boolean | null;
  facebook_pixel: string | null;
  tiktok_pixel: string | null;
  google_analytics: string | null;
  theme: string | null;
}

interface OrderBumpProduct {
  id: string;
  name: string;
  description: string | null;
  price: number;
  cover_url: string | null;
}

interface Charge {
  id: string;
  external_id: string;
  amount: number;
  status: string;
  qr_code: string;
  qr_code_base64: string;
  copy_paste: string;
  expires_at: string;
}

interface Upsell {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice: number;
  features: string[];
}

type PaymentMethod = 'pix' | 'card' | 'boleto';

const upsellOffer: Upsell = {
  id: "upsell-1",
  name: "Mentoria Individual",
  description: "Acompanhamento personalizado por 3 meses",
  price: 497,
  originalPrice: 997,
  features: [
    "3 sessões de mentoria 1:1",
    "Análise completa do seu negócio",
    "Plano de ação personalizado",
    "Acesso ao grupo VIP",
  ],
};

const Checkout = () => {
  const { productId: routeProductId, slug: routeSlug } = useParams();
  const [searchParams] = useSearchParams();
  const productId = routeProductId || searchParams.get("product");
  
  // Detect if this is a direct slug route (e.g., /:slug from custom domain)
  const isDirectSlugRoute = !routeProductId && routeSlug && !window.location.pathname.includes('/checkout/');
  const slug = routeSlug;
  const affiliateCode = searchParams.get("ref");
  
  const [product, setProduct] = useState<Product | null>(null);
  const [template, setTemplate] = useState<CheckoutTemplate | null>(null);
  const [orderBumps, setOrderBumps] = useState<OrderBumpProduct[]>([]);
  const [charge, setCharge] = useState<Charge | null>(null);
  const [buyerEmail, setBuyerEmail] = useState("");
  const [buyerName, setBuyerName] = useState("");
  const [buyerCpf, setBuyerCpf] = useState("");
  const [buyerPhone, setBuyerPhone] = useState("");
  const [buyerAddress, setBuyerAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [offerTimeLeft, setOfferTimeLeft] = useState<number | null>(null);
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);
  const [selectedBumps, setSelectedBumps] = useState<string[]>([]);
  const [showUpsell, setShowUpsell] = useState(false);
  const [upsellAccepted, setUpsellAccepted] = useState(false);
  const [isOrderSummaryOpen, setIsOrderSummaryOpen] = useState(false);
  
  // Payment method states
  const [availablePaymentMethods, setAvailablePaymentMethods] = useState<PaymentMethod[]>([]);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod | null>(null);
  const [loadingPaymentMethods, setLoadingPaymentMethods] = useState(false);
  
  const { toast } = useToast();

  const basePrice = product?.price || 100;
  const bumpsTotal = selectedBumps.reduce((sum, id) => {
    const bump = orderBumps.find(b => b.id === id);
    return sum + (bump?.price || 0);
  }, 0);
  const totalPrice = basePrice + bumpsTotal + (upsellAccepted ? upsellOffer.price : 0);

  // Helper function to track events on all pixels (Facebook, TikTok, Google Analytics)
  const trackAllPixels = (eventName: string, params: Record<string, any>) => {
    // Facebook Pixel
    if (product?.facebook_pixel && typeof window !== 'undefined' && (window as any).fbq) {
      (window as any).fbq('track', eventName, params);
    }

    // TikTok Pixel
    if (product?.tiktok_pixel && typeof window !== 'undefined' && (window as any).ttq) {
      (window as any).ttq.track(eventName, params);
    }

    // Google Analytics (com mapeamento de nomes de eventos)
    if (product?.google_analytics && typeof window !== 'undefined' && (window as any).gtag) {
      const gaEventMap: Record<string, string> = {
        'InitiateCheckout': 'begin_checkout',
        'AddToCart': 'add_to_cart',
        'Purchase': 'purchase',
        'AddPaymentInfo': 'add_payment_info'
      };
      const gaEventName = gaEventMap[eventName] || eventName.toLowerCase();
      (window as any).gtag('event', gaEventName, {
        ...params,
        items: params.content_ids?.map((id: string) => ({ item_id: id }))
      });
    }
  };

  // Track AddToCart when product is loaded
  useEffect(() => {
    if (product) {
      const eventParams = {
        value: product.price,
        currency: 'BRL',
        content_ids: [product.id],
        content_type: 'product',
        num_items: 1
      };

      // Dispara AddToCart
      trackAllPixels('AddToCart', eventParams);
    }
  }, [product?.id]);

  // Track Purchase when payment is confirmed (com transaction_id)
  useEffect(() => {
    if (paymentConfirmed && charge && product) {
      const allContentIds = [product.id, ...selectedBumps];
      if (upsellAccepted) {
        allContentIds.push(upsellOffer.id);
      }
      trackAllPixels('Purchase', {
        value: totalPrice,
        currency: 'BRL',
        content_ids: allContentIds,
        content_type: 'product',
        num_items: allContentIds.length,
        transaction_id: charge.external_id
      });
    }
  }, [paymentConfirmed]);

  // Offer timer effect
  useEffect(() => {
    if (template?.enable_timer && template?.timer_minutes && !charge) {
      const timerSeconds = template.timer_minutes * 60;
      setOfferTimeLeft(timerSeconds);
      
      const interval = setInterval(() => {
        setOfferTimeLeft(prev => {
          if (prev === null || prev <= 0) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [template, charge]);

  // Inject tracking pixels from product
  useEffect(() => {
    if (product) {
      // Facebook Pixel
      if (product.facebook_pixel) {
        // Check if fbq already exists
        if (!(window as any).fbq) {
          // Create and execute the Facebook Pixel base code
          const fbPixelCode = function(f: any, b: any, e: any, v: any, n?: any, t?: any, s?: any) {
            if (f.fbq) return;
            n = f.fbq = function() {
              n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
            };
            if (!f._fbq) f._fbq = n;
            n.push = n;
            n.loaded = true;
            n.version = '2.0';
            n.queue = [];
            t = b.createElement(e);
            t.async = true;
            t.src = v;
            s = b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t, s);
          };
          
          fbPixelCode(
            window,
            document,
            'script',
            'https://connect.facebook.net/en_US/fbevents.js'
          );
        }
        
        // Initialize and track PageView + InitiateCheckout together
        (window as any).fbq('init', product.facebook_pixel);
        (window as any).fbq('track', 'PageView');
        (window as any).fbq('track', 'InitiateCheckout', {
          value: product.price,
          currency: 'BRL',
          content_ids: [product.id],
          content_type: 'product',
          num_items: 1
        });
      }

      // Google Analytics
      if (product.google_analytics) {
        const gaScript = document.createElement('script');
        gaScript.async = true;
        gaScript.src = `https://www.googletagmanager.com/gtag/js?id=${product.google_analytics}`;
        document.head.appendChild(gaScript);

        const gaConfig = document.createElement('script');
        gaConfig.innerHTML = `
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${product.google_analytics}');
          gtag('event', 'begin_checkout', {
            value: ${product.price},
            currency: 'BRL',
            items: [{ item_id: '${product.id}' }]
          });
        `;
        document.head.appendChild(gaConfig);
      }

      // TikTok Pixel
      if (product.tiktok_pixel) {
        const ttScript = document.createElement('script');
        ttScript.innerHTML = `
          !function (w, d, t) {
            w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];
            ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie"];
            ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};
            for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);
            ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e};
            ttq.load=function(e,n){var i="https://analytics.tiktok.com/i18n/pixel/events.js";
            ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=i,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};
            var o=document.createElement("script");o.type="text/javascript",o.async=!0,o.src=i+"?sdkid="+e+"&lib="+t;
            var a=document.getElementsByTagName("script")[0];a.parentNode.insertBefore(o,a)};
            ttq.load('${product.tiktok_pixel}');
            ttq.page();
            ttq.track('InitiateCheckout', {
              value: ${product.price},
              currency: 'BRL',
              content_id: '${product.id}',
              content_type: 'product'
            });
          }(window, document, 'ttq');
        `;
        document.head.appendChild(ttScript);
      }
    }

    // Template-specific settings (title, favicon)
    if (template) {
      if (template.page_title) {
        document.title = template.page_title;
      }

      if (template.favicon_url) {
        const existingFavicon = document.querySelector('link[rel="icon"]');
        if (existingFavicon) {
          existingFavicon.setAttribute('href', template.favicon_url);
        } else {
          const favicon = document.createElement('link');
          favicon.rel = 'icon';
          favicon.href = template.favicon_url;
          document.head.appendChild(favicon);
        }
      }
    }
  }, [product, template]);

  useEffect(() => {
    if (productId || slug) {
      fetchProduct();
    }
  }, [productId, slug]);

  // Fetch payment methods when product is loaded
  useEffect(() => {
    if (product?.seller_id) {
      fetchPaymentMethods(product.seller_id);
    }
  }, [product?.seller_id]);

  useEffect(() => {
    if (charge && charge.status === 'pending' && !paymentConfirmed) {
      const expiresAt = new Date(charge.expires_at).getTime();
      
      // Timer de expiração
      const timerInterval = setInterval(() => {
        const now = Date.now();
        const diff = Math.max(0, Math.floor((expiresAt - now) / 1000));
        setTimeLeft(diff);
        
        if (diff === 0) {
          clearInterval(timerInterval);
        }
      }, 1000);

      // Polling para verificar status a cada 5 segundos (fallback)
      const pollPaymentStatus = async () => {
        try {
          const { data, error } = await supabase
            .from('pix_charges')
            .select('status')
            .eq('id', charge.id)
            .single();
          
          if (!error && data?.status === 'paid') {
            setPaymentConfirmed(true);
            toast({
              title: "Pagamento confirmado!",
              description: "Seu pagamento foi recebido com sucesso.",
            });
          }
        } catch (error) {
          console.error('Error polling payment status:', error);
        }
      };
      
      const pollInterval = setInterval(pollPaymentStatus, 5000);

      // Realtime como canal principal (mais rápido)
      const channel = supabase
        .channel(`charge-${charge.id}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'pix_charges',
            filter: `id=eq.${charge.id}`,
          },
          (payload) => {
            if (payload.new.status === 'paid') {
              setPaymentConfirmed(true);
              toast({
                title: "Pagamento confirmado!",
                description: "Seu pagamento foi recebido com sucesso.",
              });
            }
          }
        )
        .subscribe();

      return () => {
        clearInterval(timerInterval);
        clearInterval(pollInterval);
        supabase.removeChannel(channel);
      };
    }
  }, [charge, paymentConfirmed, toast]);

  const fetchPaymentMethods = async (sellerId: string) => {
    setLoadingPaymentMethods(true);
    try {
      const { data, error } = await supabase.functions.invoke('pix-api', {
        body: {},
        method: 'GET',
      });
      
      // Fallback: fetch directly via GET request
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/pix-api/payment-methods/${sellerId}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      
      if (response.ok) {
        const result = await response.json();
        const methods = result.methods as PaymentMethod[];
        setAvailablePaymentMethods(methods);
        
        // Auto-select first available method
        if (methods.length > 0 && !selectedPaymentMethod) {
          setSelectedPaymentMethod(methods[0]);
        }
      } else {
        console.error('Error fetching payment methods:', await response.text());
        setAvailablePaymentMethods([]);
      }
    } catch (error) {
      console.error('Error fetching payment methods:', error);
      setAvailablePaymentMethods([]);
    } finally {
      setLoadingPaymentMethods(false);
    }
  };

  const fetchProduct = async () => {
    let query = supabase
      .from('products')
      .select('*')
      .eq('status', 'active');

    // Fetch by slug or productId
    if (slug) {
      query = query.eq('custom_slug', slug);
    } else if (productId) {
      query = query.eq('id', productId);
    }

    const { data, error } = await query.maybeSingle();

    if (error || !data) {
      toast({
        title: "Produto não encontrado",
        description: "O produto solicitado não está disponível.",
        variant: "destructive",
      });
      return;
    }

    setProduct(data);

    // Fetch checkout template if assigned
    if (data.checkout_template_id) {
      const { data: templateData } = await supabase
        .from('checkout_templates')
        .select('*')
        .eq('id', data.checkout_template_id)
        .single();

      if (templateData) {
        setTemplate(templateData);
      }
    }

    // Fetch order bumps if they exist
    if (data.order_bumps && data.order_bumps.length > 0) {
      const { data: bumpsData } = await supabase
        .from('products')
        .select('id, name, description, price, cover_url')
        .in('id', data.order_bumps)
        .eq('status', 'active');

      if (bumpsData) {
        setOrderBumps(bumpsData);
      }
    }
  };

  const handleCreateCharge = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!buyerName.trim()) {
      toast({
        title: "Nome obrigatório",
        description: "Por favor, informe seu nome completo.",
        variant: "destructive",
      });
      return;
    }
    
    if (!buyerEmail.trim()) {
      toast({
        title: "Email obrigatório",
        description: "Por favor, informe seu email.",
        variant: "destructive",
      });
      return;
    }

    // Validate payment method selection
    if (!selectedPaymentMethod) {
      toast({
        title: "Forma de pagamento obrigatória",
        description: "Por favor, selecione uma forma de pagamento.",
        variant: "destructive",
      });
      return;
    }

    // WhatsApp obrigatório e validação de formato brasileiro
    const phoneDigits = buyerPhone.replace(/\D/g, '');
    if (!phoneDigits) {
      toast({
        title: "WhatsApp obrigatório",
        description: "Por favor, informe seu número de WhatsApp.",
        variant: "destructive",
      });
      return;
    }

    // Validar formato brasileiro: 10 ou 11 dígitos (DDD + 8 ou 9 dígitos do telefone)
    const validDDDs = [
      '11', '12', '13', '14', '15', '16', '17', '18', '19', // SP
      '21', '22', '24', // RJ
      '27', '28', // ES
      '31', '32', '33', '34', '35', '37', '38', // MG
      '41', '42', '43', '44', '45', '46', // PR
      '47', '48', '49', // SC
      '51', '53', '54', '55', // RS
      '61', // DF
      '62', '64', // GO
      '63', // TO
      '65', '66', // MT
      '67', // MS
      '68', // AC
      '69', // RO
      '71', '73', '74', '75', '77', // BA
      '79', // SE
      '81', '87', // PE
      '82', // AL
      '83', // PB
      '84', // RN
      '85', '88', // CE
      '86', '89', // PI
      '91', '93', '94', // PA
      '92', '97', // AM
      '95', // RR
      '96', // AP
      '98', '99' // MA
    ];

    const ddd = phoneDigits.substring(0, 2);
    const phoneNumber = phoneDigits.substring(2);

    // Aceitar 10 ou 11 dígitos (DDD + 8 ou 9 dígitos)
    if (phoneDigits.length < 10 || phoneDigits.length > 11) {
      toast({
        title: "WhatsApp inválido",
        description: "O número deve ter 10 ou 11 dígitos (DDD + telefone).",
        variant: "destructive",
      });
      return;
    }

    if (!validDDDs.includes(ddd)) {
      toast({
        title: "DDD inválido",
        description: "Por favor, informe um DDD válido.",
        variant: "destructive",
      });
      return;
    }

    if (!phoneNumber.startsWith('9')) {
      toast({
        title: "WhatsApp inválido",
        description: "Números de celular devem começar com 9.",
        variant: "destructive",
      });
      return;
    }
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(buyerEmail)) {
      toast({
        title: "Email inválido",
        description: "Por favor, informe um email válido.",
        variant: "destructive",
      });
      return;
    }

    // Dispara evento de Purchase (intenção de compra) ao clicar no botão
    const allContentIds = [product?.id, ...selectedBumps].filter(Boolean) as string[];
    trackAllPixels('Purchase', {
      value: totalPrice,
      currency: 'BRL',
      content_ids: allContentIds,
      content_type: 'product',
      num_items: allContentIds.length
    });
    
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('pix-api', {
        body: {
          amount: totalPrice,
          buyer_email: buyerEmail,
          buyer_name: buyerName,
          buyer_document: buyerCpf || undefined,
          buyer_phone: buyerPhone,
          product_id: product?.id,
          affiliate_code: affiliateCode,
          expires_in_minutes: 30,
          order_bumps: selectedBumps.length > 0 ? selectedBumps : undefined,
          payment_method: selectedPaymentMethod,
        },
      });

      if (error) throw error;

      setCharge(data);
      
      // Track AddPaymentInfo event (PIX criado)
      trackAllPixels('AddPaymentInfo', {
        value: totalPrice,
        currency: 'BRL',
        content_ids: allContentIds,
        content_type: 'product',
        num_items: allContentIds.length
      });
      
      const methodLabel = selectedPaymentMethod === 'pix' ? 'PIX' : selectedPaymentMethod === 'card' ? 'cartão' : 'boleto';
      toast({
        title: `Cobrança ${methodLabel.toUpperCase()} criada!`,
        description: selectedPaymentMethod === 'pix' 
          ? "Escaneie o QR Code ou copie o código para pagar."
          : `Siga as instruções para pagar via ${methodLabel}.`,
      });
    } catch (error: any) {
      toast({
        title: "Erro ao criar cobrança",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCode = async () => {
    if (charge?.copy_paste) {
      await navigator.clipboard.writeText(charge.copy_paste);
      setCopied(true);
      toast({
        title: "Código copiado!",
        description: "Cole no app do seu banco para pagar.",
      });
      setTimeout(() => setCopied(false), 3000);
    }
  };

  const handleSimulatePayment = async () => {
    if (!charge) return;
    
    setLoading(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/pix-api/charges/${charge.external_id}/confirm`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
        }
      );

      if (!response.ok) throw new Error('Failed to confirm payment');

      setShowUpsell(true);
    } catch (error: any) {
      toast({
        title: "Erro ao confirmar pagamento",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpsellDecision = (accepted: boolean) => {
    setUpsellAccepted(accepted);
    setShowUpsell(false);
    setPaymentConfirmed(true);
    
    if (accepted) {
      toast({
        title: "Upsell adicionado!",
        description: "A mentoria foi incluída no seu pedido.",
      });
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleBump = (bumpId: string) => {
    setSelectedBumps(prev => 
      prev.includes(bumpId) 
        ? prev.filter(id => id !== bumpId)
        : [...prev, bumpId]
    );
  };

  const formatCpf = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})/, '$1-$2')
      .replace(/(-\d{2})\d+?$/, '$1');
  };

  const formatPhone = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{5})(\d)/, '$1-$2')
      .replace(/(-\d{4})\d+?$/, '$1');
  };

  const getPaymentMethodIcon = (method: PaymentMethod) => {
    switch (method) {
      case 'pix':
        return <QrCode className="h-5 w-5" />;
      case 'card':
        return <CreditCard className="h-5 w-5" />;
      case 'boleto':
        return <Banknote className="h-5 w-5" />;
    }
  };

  const getPaymentMethodLabel = (method: PaymentMethod) => {
    switch (method) {
      case 'pix':
        return 'PIX';
      case 'card':
        return 'Cartão';
      case 'boleto':
        return 'Boleto';
    }
  };

  // Upsell Screen
  if (showUpsell) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="glass-card w-full max-w-lg">
          <CardHeader className="text-center pb-2">
            <div className="h-16 w-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
              <Zap className="h-8 w-8 text-primary" />
            </div>
            <div className="inline-flex items-center gap-2 bg-accent/20 text-accent px-3 py-1 rounded-full text-sm font-medium mb-2">
              <Star className="h-4 w-4" />
              Oferta Especial - Apenas Agora!
            </div>
            <CardTitle className="text-2xl">{upsellOffer.name}</CardTitle>
            <CardDescription className="text-base">{upsellOffer.description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              {upsellOffer.features.map((feature, index) => (
                <div key={index} className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-accent shrink-0" />
                  <span>{feature}</span>
                </div>
              ))}
            </div>

            <div className="text-center py-4 border-y border-border">
              <p className="text-muted-foreground line-through text-lg">
                De {formatCurrency(upsellOffer.originalPrice)}
              </p>
              <p className="text-4xl font-bold gradient-text">
                Por {formatCurrency(upsellOffer.price)}
              </p>
              <p className="text-sm text-accent mt-1">
                Economize {formatCurrency(upsellOffer.originalPrice - upsellOffer.price)}
              </p>
            </div>

            <div className="space-y-3">
              <Button 
                className="w-full btn-success-gradient text-lg py-6"
                onClick={() => handleUpsellDecision(true)}
              >
                <Zap className="mr-2 h-5 w-5" />
                SIM! Quero a Mentoria
              </Button>
              <Button 
                variant="ghost" 
                className="w-full text-muted-foreground"
                onClick={() => handleUpsellDecision(false)}
              >
                Não, obrigado. Continuar sem mentoria.
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Success Screen
  if (paymentConfirmed) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="glass-card w-full max-w-md text-center">
          <CardContent className="pt-8 pb-8">
            <div className="h-20 w-20 rounded-full bg-accent/20 flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="h-10 w-10 text-accent" />
            </div>
            <h2 className="text-2xl font-bold gradient-success-text mb-2">Pagamento Confirmado!</h2>
            <p className="text-muted-foreground mb-4">
              Seu pagamento de {formatCurrency(totalPrice)} foi processado com sucesso.
            </p>
            {upsellAccepted && (
              <div className="mb-4 p-3 bg-accent/10 rounded-lg">
                <p className="text-sm text-accent">
                  🎉 Mentoria Individual incluída no seu pedido!
                </p>
              </div>
            )}
            <p className="text-sm text-muted-foreground mb-6">
              📧 Enviamos um email com instruções de acesso para <strong>{buyerEmail}</strong>
            </p>
            <div className="space-y-3">
              <Button className="w-full btn-success-gradient" onClick={() => window.location.href = '/members/login'}>
                Acessar Área de Membros
              </Button>
              <p className="text-xs text-muted-foreground">
                Use o mesmo email da compra para fazer login
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Template styling with theme support - use product theme if available
  const isLightTheme = product?.checkout_theme === 'light';
  const styles = {
    backgroundColor: isLightTheme ? '#ffffff' : 'hsl(var(--background))',
    textColor: isLightTheme ? '#1a1a2e' : 'hsl(var(--foreground))',
    primaryColor: isLightTheme ? '#03c753' : 'hsl(var(--primary))',
    accentColor: '#03c753',
    buttonColor: '#03c753',
    buttonTextColor: '#ffffff',
    borderRadius: '12',
    cardBg: isLightTheme ? '#ffffff' : 'hsl(var(--card))',
    cardBorder: isLightTheme ? '#e5e7eb' : 'hsl(var(--primary) / 0.3)',
    cardShadow: isLightTheme ? '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)' : 'none',
  };

  // Order Bump Component - Responsive with full description
  const OrderBumpCard = ({ bump }: { bump: OrderBumpProduct }) => (
    <Card 
      key={bump.id}
      className="cursor-pointer transition-all"
      onClick={() => toggleBump(bump.id)}
      style={{
        backgroundColor: styles.cardBg,
        borderColor: selectedBumps.includes(bump.id) ? styles.accentColor : styles.cardBorder,
        borderWidth: selectedBumps.includes(bump.id) ? '2px' : '1px',
        boxShadow: styles.cardShadow,
      }}
    >
      <CardContent className="p-3 sm:p-4">
        <div className="flex flex-col sm:flex-row items-start gap-3">
          <div className="flex items-start gap-3 w-full sm:flex-1">
            <Checkbox 
              checked={selectedBumps.includes(bump.id)}
              onCheckedChange={() => toggleBump(bump.id)}
              className="mt-1 shrink-0"
              style={{ borderColor: styles.accentColor }}
            />
            {bump.cover_url && (
              <img 
                src={bump.cover_url} 
                alt={bump.name}
                className="w-14 h-14 sm:w-16 sm:h-16 object-cover rounded-lg shrink-0"
              />
            )}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-1 sm:gap-2 mb-1">
                <Gift className="h-4 w-4 shrink-0 hidden sm:block" style={{ color: styles.accentColor }} />
                <span className="font-medium text-sm sm:text-base" style={{ color: styles.textColor }}>
                  {bump.name}
                </span>
                <span 
                  className="text-xs px-2 py-0.5 rounded-full whitespace-nowrap"
                  style={{ 
                    backgroundColor: styles.accentColor + '20',
                    color: styles.accentColor,
                  }}
                >
                  Oferta especial
                </span>
              </div>
              {bump.description && (
                <p className="text-xs sm:text-sm" style={{ color: styles.textColor, opacity: 0.7 }}>
                  {bump.description}
                </p>
              )}
              {/* Mobile price - shown inline */}
              <p className="font-bold text-sm mt-1 sm:hidden" style={{ color: styles.accentColor }}>
                + {formatCurrency(bump.price)}
              </p>
            </div>
          </div>
          {/* Desktop price - shown on right */}
          <div className="hidden sm:block text-right shrink-0">
            <p className="font-bold" style={{ color: styles.accentColor }}>
              + {formatCurrency(bump.price)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  // Payment Method Selector Component
  const PaymentMethodSelector = () => {
    if (loadingPaymentMethods) {
      return (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="h-5 w-5 animate-spin" style={{ color: styles.accentColor }} />
          <span className="ml-2 text-sm" style={{ color: styles.textColor }}>Carregando formas de pagamento...</span>
        </div>
      );
    }

    if (availablePaymentMethods.length === 0) {
      return (
        <div 
          className="p-4 rounded-lg text-center"
          style={{ backgroundColor: '#ef444420' }}
        >
          <AlertTriangle className="h-6 w-6 text-red-500 mx-auto mb-2" />
          <p className="text-red-500 font-medium text-sm">
            Este produto não está disponível para venda no momento.
          </p>
          <p className="text-red-400 text-xs mt-1">
            O vendedor ainda não configurou uma forma de pagamento.
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        <h3 className="font-semibold text-sm sm:text-base flex items-center gap-2" style={{ color: styles.textColor }}>
          <CreditCard className="h-5 w-5" style={{ color: styles.accentColor }} />
          Forma de Pagamento
        </h3>
        <div className={`grid gap-2 ${availablePaymentMethods.length === 1 ? 'grid-cols-1' : availablePaymentMethods.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
          {availablePaymentMethods.map((method) => (
            <button
              key={method}
              type="button"
              onClick={() => setSelectedPaymentMethod(method)}
              className="flex flex-col items-center justify-center gap-2 p-3 sm:p-4 rounded-lg border-2 transition-all"
              style={{
                backgroundColor: selectedPaymentMethod === method 
                  ? styles.accentColor + '15' 
                  : styles.cardBg,
                borderColor: selectedPaymentMethod === method 
                  ? styles.accentColor 
                  : styles.cardBorder,
                color: styles.textColor,
              }}
            >
              <div style={{ color: selectedPaymentMethod === method ? styles.accentColor : styles.textColor }}>
                {getPaymentMethodIcon(method)}
              </div>
              <span 
                className="text-sm font-medium"
                style={{ color: selectedPaymentMethod === method ? styles.accentColor : styles.textColor }}
              >
                {getPaymentMethodLabel(method)}
              </span>
            </button>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div 
      className="min-h-screen py-4 px-3 sm:py-8 sm:px-4"
      style={{ 
        backgroundColor: styles.backgroundColor,
        color: styles.textColor,
      }}
    >
      <div className="max-w-xl mx-auto space-y-4 sm:space-y-6">
        {/* Logo */}
        {template?.logo_url && (
          <div className="text-center">
            <img 
              src={template.logo_url} 
              alt="Logo" 
              className="h-8 sm:h-10 mx-auto object-contain"
            />
          </div>
        )}

        {/* Offer Timer Banner */}
        {template?.enable_timer && offerTimeLeft !== null && offerTimeLeft > 0 && !charge && (
          <div 
            className="p-3 sm:p-4 rounded-lg flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3"
            style={{ 
              backgroundColor: styles.accentColor + '20',
              borderRadius: styles.borderRadius + 'px',
            }}
          >
            <Clock className="h-5 w-5" style={{ color: styles.accentColor }} />
            <span className="text-sm sm:text-base" style={{ color: styles.textColor }}>
              {template.timer_text || 'Oferta expira em'}
            </span>
            <span 
              className="font-mono font-bold text-lg"
              style={{ color: styles.accentColor }}
            >
              {formatTime(offerTimeLeft)}
            </span>
          </div>
        )}

        {/* Stock Warning */}
        {template?.show_stock && template?.stock_count && !charge && (
          <div 
            className="p-3 rounded-lg flex items-center justify-center gap-2"
            style={{ 
              backgroundColor: '#ef444420',
              borderRadius: styles.borderRadius + 'px',
            }}
          >
            <AlertTriangle className="h-5 w-5 text-red-500" />
            <span className="text-red-500 font-medium text-sm sm:text-base">
              {(template.stock_text || 'Apenas {count} unidades restantes!').replace('{count}', String(template.stock_count))}
            </span>
          </div>
        )}

        {/* 1. Order Summary - Collapsible */}
        {(template?.show_order_summary !== false) && (
          <Collapsible open={isOrderSummaryOpen} onOpenChange={setIsOrderSummaryOpen}>
            <Card 
              style={{ 
                borderRadius: styles.borderRadius + 'px',
                backgroundColor: styles.cardBg,
                borderColor: styles.cardBorder,
                boxShadow: styles.cardShadow,
              }}
            >
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer py-3 sm:py-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base sm:text-lg flex items-center gap-2" style={{ color: styles.textColor }}>
                      <QrCode className="h-5 w-5" style={{ color: styles.accentColor }} />
                      Resumo do Pedido
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <span className="font-bold" style={{ color: styles.accentColor }}>
                        {formatCurrency(totalPrice)}
                      </span>
                      <ChevronDown 
                        className={`h-5 w-5 transition-transform duration-200 ${isOrderSummaryOpen ? 'rotate-180' : ''}`}
                        style={{ color: styles.textColor, opacity: 0.7 }}
                      />
                    </div>
                  </div>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="pt-0 pb-3 sm:pb-4">
                  {product ? (
                    <div className="flex gap-3 sm:gap-4">
                      {(template?.show_product_image !== false) && product.cover_url && (
                        <img 
                          src={product.cover_url} 
                          alt={product.name}
                          className="w-20 h-20 sm:w-24 sm:h-24 object-cover shrink-0"
                          style={{ borderRadius: styles.borderRadius + 'px' }}
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base sm:text-lg font-semibold" style={{ color: styles.textColor }}>{product.name}</h3>
                        {(template?.show_product_description !== false) && (
                          <p className="text-xs sm:text-sm line-clamp-2" style={{ color: styles.textColor, opacity: 0.7 }}>{product.description}</p>
                        )}
                        <p className="text-lg sm:text-xl font-bold mt-2" style={{ color: styles.accentColor }}>
                          {formatCurrency(product.price)}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-3 sm:gap-4 items-center">
                      <div 
                        className="w-20 h-20 sm:w-24 sm:h-24 flex items-center justify-center shrink-0"
                        style={{ backgroundColor: styles.accentColor + '20', borderRadius: styles.borderRadius + 'px' }}
                      >
                        <QrCode className="h-8 w-8 sm:h-10 sm:w-10" style={{ color: styles.accentColor }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base sm:text-lg font-semibold" style={{ color: styles.textColor }}>Produto de Demonstração</h3>
                        <p className="text-xs sm:text-sm" style={{ color: styles.textColor, opacity: 0.7 }}>Pagamento via PIX</p>
                        <p className="text-lg sm:text-xl font-bold mt-2" style={{ color: styles.accentColor }}>R$ 100,00</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        )}

        {/* 2. Checkout Form */}
        <Card 
          style={{ 
            borderRadius: styles.borderRadius + 'px',
            backgroundColor: styles.cardBg,
            borderColor: styles.cardBorder,
            boxShadow: styles.cardShadow,
          }}
        >
          <CardHeader className="py-3 sm:py-4">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg" style={{ color: styles.textColor }}>
              <CreditCard className="h-5 w-5" style={{ color: styles.accentColor }} />
              {charge ? 'Pague com PIX' : 'Finalizar Compra'}
            </CardTitle>
            <CardDescription className="text-sm" style={{ color: styles.textColor, opacity: 0.7 }}>
              {charge 
                ? 'Escaneie o QR Code ou copie o código'
                : 'Preencha seus dados para pagar'
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            {!charge ? (
              <div className="space-y-3 sm:space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm" style={{ color: styles.textColor }}>Nome completo</Label>
                  <Input
                    id="name"
                    placeholder="Seu nome"
                    value={buyerName}
                    onChange={(e) => setBuyerName(e.target.value)}
                    required
                    className="text-sm sm:text-base"
                    style={{ 
                      borderRadius: styles.borderRadius + 'px',
                      backgroundColor: isLightTheme ? '#f9fafb' : 'transparent',
                      borderColor: styles.cardBorder,
                      color: styles.textColor,
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm" style={{ color: styles.textColor }}>Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={buyerEmail}
                    onChange={(e) => setBuyerEmail(e.target.value)}
                    required
                    className="text-sm sm:text-base"
                    style={{ 
                      borderRadius: styles.borderRadius + 'px',
                      backgroundColor: isLightTheme ? '#f9fafb' : 'transparent',
                      borderColor: styles.cardBorder,
                      color: styles.textColor,
                    }}
                  />
                </div>

                {/* CPF Field */}
                {template?.require_cpf && (
                  <div className="space-y-2">
                    <Label htmlFor="cpf" className="text-sm" style={{ color: styles.textColor }}>CPF</Label>
                    <Input
                      id="cpf"
                      placeholder="000.000.000-00"
                      value={buyerCpf}
                      onChange={(e) => setBuyerCpf(formatCpf(e.target.value))}
                      required
                      maxLength={14}
                      className="text-sm sm:text-base"
                      style={{ 
                        borderRadius: styles.borderRadius + 'px',
                        backgroundColor: isLightTheme ? '#f9fafb' : 'transparent',
                        borderColor: styles.cardBorder,
                        color: styles.textColor,
                      }}
                    />
                  </div>
                )}

                {/* WhatsApp Field - Sempre obrigatório */}
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-sm flex items-center gap-1.5" style={{ color: styles.textColor }}>
                    <MessageCircle className="h-4 w-4 text-green-500" />
                    WhatsApp
                  </Label>
                  <Input
                    id="phone"
                    placeholder="(00) 00000-0000"
                    value={buyerPhone}
                    onChange={(e) => setBuyerPhone(formatPhone(e.target.value))}
                    required
                    maxLength={15}
                    className="text-sm sm:text-base"
                    style={{ 
                      borderRadius: styles.borderRadius + 'px',
                      backgroundColor: isLightTheme ? '#f9fafb' : 'transparent',
                      borderColor: styles.cardBorder,
                      color: styles.textColor,
                    }}
                  />
                </div>

                {/* Address Field */}
                {template?.require_address && (
                  <div className="space-y-2">
                    <Label htmlFor="address" className="text-sm" style={{ color: styles.textColor }}>Endereço</Label>
                    <Input
                      id="address"
                      placeholder="Rua, número, bairro, cidade - UF"
                      value={buyerAddress}
                      onChange={(e) => setBuyerAddress(e.target.value)}
                      required
                      className="text-sm sm:text-base"
                      style={{ 
                        borderRadius: styles.borderRadius + 'px',
                        backgroundColor: isLightTheme ? '#f9fafb' : 'transparent',
                        borderColor: styles.cardBorder,
                        color: styles.textColor,
                      }}
                    />
                  </div>
                )}

                {/* Payment Method Selector */}
                <div className="pt-2">
                  <PaymentMethodSelector />
                </div>
              </div>
            ) : (
              <div className="space-y-4 sm:space-y-6">
                {/* Timer - with visible styling */}
                {timeLeft !== null && timeLeft > 0 && (
                  <div 
                    className="flex items-center justify-center gap-2 text-lg p-3 rounded-lg"
                    style={{ 
                      backgroundColor: isLightTheme ? '#fef3cd' : 'hsl(var(--secondary))',
                      border: isLightTheme ? '1px solid #ffc107' : 'none',
                    }}
                  >
                    <Timer className="h-5 w-5" style={{ color: isLightTheme ? '#856404' : styles.accentColor }} />
                    <span className="font-mono font-bold" style={{ color: isLightTheme ? '#856404' : styles.accentColor }}>
                      {formatTime(timeLeft)}
                    </span>
                    <span className="text-sm font-medium" style={{ color: isLightTheme ? '#856404' : styles.textColor }}>
                      para expirar
                    </span>
                  </div>
                )}

                {/* QR Code - Generated dynamically from copy_paste code */}
                <div 
                  className="p-4 sm:p-6 rounded-lg mx-auto w-fit"
                  style={{ 
                    backgroundColor: '#ffffff',
                    border: '2px solid ' + styles.accentColor,
                  }}
                >
                  {charge.copy_paste ? (
                    <QRCodeSVG 
                      value={charge.copy_paste}
                      size={200}
                      bgColor="#ffffff"
                      fgColor="#1a1f2e"
                      level="M"
                      includeMargin={false}
                    />
                  ) : (
                    <div 
                      className="w-44 h-44 sm:w-52 sm:h-52 flex items-center justify-center"
                      style={{ backgroundColor: '#f9fafb' }}
                    >
                      <QrCode className="h-28 w-28 sm:h-32 sm:w-32" style={{ color: styles.accentColor }} />
                    </div>
                  )}
                </div>

                {/* Copy PIX Code - More visible button */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium" style={{ color: styles.textColor }}>Código PIX Copia e Cola</Label>
                  <div className="flex gap-2">
                    <Input
                      value={charge.copy_paste || ''}
                      readOnly
                      className="font-mono text-xs"
                      style={{ 
                        backgroundColor: isLightTheme ? '#f9fafb' : 'transparent',
                        borderColor: styles.cardBorder,
                        color: styles.textColor,
                      }}
                    />
                    <Button
                      onClick={handleCopyCode}
                      className="shrink-0 px-4 font-medium"
                      style={{ 
                        backgroundColor: styles.accentColor,
                        color: '#ffffff',
                      }}
                    >
                      {copied ? (
                        <>
                          <Check className="h-4 w-4 mr-1" />
                          Copiado
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4 mr-1" />
                          Copiar
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                {/* Total Price */}
                <div className="text-center py-3" style={{ borderTopColor: styles.cardBorder, borderTopWidth: '1px' }}>
                  <p className="text-xl font-bold" style={{ color: styles.accentColor }}>
                    {formatCurrency(totalPrice)}
                  </p>
                </div>

                {/* Waiting for payment */}
                <div 
                  className="flex items-center justify-center gap-2 p-3 rounded-lg"
                  style={{ 
                    backgroundColor: styles.accentColor + '15',
                    color: styles.textColor,
                  }}
                >
                  <Loader2 className="h-4 w-4 animate-spin" style={{ color: styles.accentColor }} />
                  <span className="font-medium">Aguardando pagamento...</span>
                </div>

                {/* Security Badges for Payment Page */}
                <div className="pt-4 space-y-3" style={{ borderTopColor: styles.cardBorder, borderTopWidth: '1px' }}>
                  <div className="flex items-center justify-center gap-4 flex-wrap">
                    <div className="flex items-center gap-2 text-xs px-3 py-2 rounded-lg" style={{ 
                      backgroundColor: isLightTheme ? '#f0fdf4' : 'hsl(var(--secondary))',
                      border: isLightTheme ? '1px solid #86efac' : 'none',
                      color: isLightTheme ? '#166534' : styles.textColor,
                    }}>
                      <Shield className="h-4 w-4" style={{ color: styles.accentColor }} />
                      <span className="font-medium">Pagamento Seguro</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs px-3 py-2 rounded-lg" style={{ 
                      backgroundColor: isLightTheme ? '#f0fdf4' : 'hsl(var(--secondary))',
                      border: isLightTheme ? '1px solid #86efac' : 'none',
                      color: isLightTheme ? '#166534' : styles.textColor,
                    }}>
                      <Lock className="h-4 w-4" style={{ color: styles.accentColor }} />
                      <span className="font-medium">Dados Protegidos</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-center gap-3">
                    <img src="https://logospng.org/download/pix/logo-pix-icone-256.png" alt="PIX" className="h-8 w-8 object-contain" />
                    <span className="text-xs font-medium" style={{ color: styles.textColor }}>Pagamento instantâneo via PIX</span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 3. Order Bumps */}
        {!charge && orderBumps.length > 0 && (
          <div className="space-y-3 sm:space-y-4">
            <h3 className="text-base sm:text-lg font-semibold flex items-center gap-2" style={{ color: styles.textColor }}>
              <Gift className="h-5 w-5" style={{ color: styles.accentColor }} />
              Adicione ao seu pedido
            </h3>
            {orderBumps.map((bump) => (
              <OrderBumpCard key={bump.id} bump={bump} />
            ))}
          </div>
        )}

        {affiliateCode && (
          <div className="p-3 rounded-lg" style={{ backgroundColor: styles.accentColor + '10' }}>
            <p className="text-sm" style={{ color: styles.accentColor }}>
              🎁 Indicado por afiliado: {affiliateCode}
            </p>
          </div>
        )}

        {/* 4. Purchase Button and Badges */}
        {!charge && (
          <div className="space-y-4">
            {/* Order Summary before button */}
            <div className="space-y-2 p-4 rounded-lg" style={{ backgroundColor: isLightTheme ? '#f9fafb' : 'hsl(var(--secondary))' }}>
              <div className="flex justify-between text-sm">
                <span style={{ color: styles.textColor, opacity: 0.7 }}>Produto</span>
                <span style={{ color: styles.textColor }}>{formatCurrency(basePrice)}</span>
              </div>
              {selectedBumps.map(bumpId => {
                const bump = orderBumps.find(b => b.id === bumpId);
                return bump && (
                  <div key={bumpId} className="flex justify-between text-sm">
                    <span className="truncate pr-2" style={{ color: styles.textColor, opacity: 0.7 }}>{bump.name}</span>
                    <span className="shrink-0" style={{ color: styles.accentColor }}>{formatCurrency(bump.price)}</span>
                  </div>
                );
              })}
              <div className="flex justify-between font-bold pt-2" style={{ borderTopColor: styles.cardBorder, borderTopWidth: '1px' }}>
                <span style={{ color: styles.textColor }}>Total</span>
                <span className="text-lg sm:text-xl" style={{ color: styles.accentColor }}>{formatCurrency(totalPrice)}</span>
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full py-5 sm:py-6 text-base sm:text-lg font-semibold" 
              disabled={loading || availablePaymentMethods.length === 0 || !selectedPaymentMethod}
              onClick={handleCreateCharge}
              style={{ 
                backgroundColor: styles.buttonColor,
                color: styles.buttonTextColor,
                borderRadius: styles.borderRadius + 'px',
                opacity: (availablePaymentMethods.length === 0 || !selectedPaymentMethod) ? 0.5 : 1,
              }}
            >
            {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Gerando {selectedPaymentMethod === 'pix' ? 'PIX' : selectedPaymentMethod === 'card' ? 'Cartão' : 'Boleto'}...
                </>
              ) : (
                <>
                  Comprar Agora {formatCurrency(totalPrice)}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </>
              )}
            </Button>

            {/* Payment and Security Badges */}
            <div className="space-y-3">
              {/* Payment Methods - Show selected */}
              <div className="flex items-center justify-center gap-4">
                {selectedPaymentMethod && (
                  <div className="flex items-center gap-2 text-xs" style={{ color: styles.textColor, opacity: 0.6 }}>
                    {getPaymentMethodIcon(selectedPaymentMethod)}
                    <span>{getPaymentMethodLabel(selectedPaymentMethod)}</span>
                  </div>
                )}
              </div>

              {/* Security Badge */}
              {(template?.show_security_badge !== false) && (
                <div className="flex items-center justify-center gap-4">
                  <div className="flex items-center gap-2 text-xs" style={{ color: styles.textColor, opacity: 0.6 }}>
                    <Shield className="h-4 w-4" style={{ color: styles.accentColor }} />
                    Pagamento 100% seguro
                  </div>
                  <div className="flex items-center gap-2 text-xs" style={{ color: styles.textColor, opacity: 0.6 }}>
                    <Lock className="h-4 w-4" style={{ color: styles.accentColor }} />
                    Dados protegidos
                  </div>
                </div>
              )}

              {/* Guarantee */}
              {template?.show_guarantee && (
                <div className="text-center text-xs" style={{ color: styles.textColor, opacity: 0.6 }}>
                  ✓ {template.guarantee_text || `Garantia incondicional de ${template.guarantee_days || 7} dias`}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Checkout;
