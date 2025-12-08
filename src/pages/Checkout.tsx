import { useState, useEffect } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
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
  ArrowRight
} from "lucide-react";

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  cover_url: string;
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

interface OrderBump {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice: number;
  icon: typeof Gift;
}

const orderBumps: OrderBump[] = [
  {
    id: "bump-1",
    name: "Suporte VIP 30 dias",
    description: "Acesso direto ao suporte prioritário via WhatsApp",
    price: 47,
    originalPrice: 97,
    icon: Shield,
  },
  {
    id: "bump-2",
    name: "Bônus Exclusivos",
    description: "Pack de templates e materiais complementares",
    price: 27,
    originalPrice: 67,
    icon: Gift,
  },
];

interface Upsell {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice: number;
  features: string[];
}

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
  const { productId: routeProductId } = useParams();
  const [searchParams] = useSearchParams();
  const productId = routeProductId || searchParams.get("product");
  const affiliateCode = searchParams.get("ref");
  
  const [product, setProduct] = useState<Product | null>(null);
  const [charge, setCharge] = useState<Charge | null>(null);
  const [buyerEmail, setBuyerEmail] = useState("");
  const [buyerName, setBuyerName] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);
  const [selectedBumps, setSelectedBumps] = useState<string[]>([]);
  const [showUpsell, setShowUpsell] = useState(false);
  const [upsellAccepted, setUpsellAccepted] = useState(false);
  
  const { toast } = useToast();

  const basePrice = product?.price || 100;
  const bumpsTotal = selectedBumps.reduce((sum, id) => {
    const bump = orderBumps.find(b => b.id === id);
    return sum + (bump?.price || 0);
  }, 0);
  const totalPrice = basePrice + bumpsTotal + (upsellAccepted ? upsellOffer.price : 0);

  useEffect(() => {
    if (productId) {
      fetchProduct();
    }
  }, [productId]);

  useEffect(() => {
    if (charge && charge.status === 'pending') {
      const expiresAt = new Date(charge.expires_at).getTime();
      
      const interval = setInterval(() => {
        const now = Date.now();
        const diff = Math.max(0, Math.floor((expiresAt - now) / 1000));
        setTimeLeft(diff);
        
        if (diff === 0) {
          clearInterval(interval);
        }
      }, 1000);

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
              clearInterval(interval);
            }
          }
        )
        .subscribe();

      return () => {
        clearInterval(interval);
        supabase.removeChannel(channel);
      };
    }
  }, [charge]);

  const fetchProduct = async () => {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', productId)
      .eq('status', 'active')
      .single();

    if (error) {
      toast({
        title: "Produto não encontrado",
        description: "O produto solicitado não está disponível.",
        variant: "destructive",
      });
      return;
    }

    setProduct(data);
  };

  const handleCreateCharge = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('pix-api', {
        body: {
          amount: totalPrice,
          buyer_email: buyerEmail,
          buyer_name: buyerName,
          product_id: productId,
          affiliate_code: affiliateCode,
          expires_in_minutes: 30,
        },
      });

      if (error) throw error;

      setCharge(data);
      toast({
        title: "Cobrança PIX criada!",
        description: "Escaneie o QR Code ou copie o código para pagar.",
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
                De R$ {upsellOffer.originalPrice.toFixed(2)}
              </p>
              <p className="text-4xl font-bold gradient-text">
                Por R$ {upsellOffer.price.toFixed(2)}
              </p>
              <p className="text-sm text-accent mt-1">
                Economize R$ {(upsellOffer.originalPrice - upsellOffer.price).toFixed(2)}
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
            <p className="text-muted-foreground mb-6">
              Seu pagamento de R$ {totalPrice.toFixed(2)} foi processado com sucesso.
            </p>
            {upsellAccepted && (
              <div className="mb-6 p-3 bg-accent/10 rounded-lg">
                <p className="text-sm text-accent">
                  🎉 Mentoria Individual incluída no seu pedido!
                </p>
              </div>
            )}
            <Button className="btn-success-gradient" onClick={() => window.location.href = '/members'}>
              Acessar Conteúdo
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold gradient-text mb-2">Checkout Seguro</h1>
          <p className="text-muted-foreground">Pagamento instantâneo via PIX</p>
        </div>

        <div className="grid lg:grid-cols-5 gap-8">
          {/* Left Column - Product + Order Bumps */}
          <div className="lg:col-span-3 space-y-6">
            {/* Product Info */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Resumo do Pedido</CardTitle>
              </CardHeader>
              <CardContent>
                {product ? (
                  <div className="flex gap-4">
                    {product.cover_url && (
                      <img 
                        src={product.cover_url} 
                        alt={product.name}
                        className="w-24 h-24 object-cover rounded-lg shrink-0"
                      />
                    )}
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold">{product.name}</h3>
                      <p className="text-muted-foreground text-sm line-clamp-2">{product.description}</p>
                      <p className="text-xl font-bold gradient-text mt-2">
                        R$ {product.price.toFixed(2)}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-4 items-center">
                    <div className="w-24 h-24 bg-secondary rounded-lg flex items-center justify-center shrink-0">
                      <QrCode className="h-10 w-10 text-muted-foreground" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold">Produto de Demonstração</h3>
                      <p className="text-muted-foreground text-sm">Pagamento via PIX</p>
                      <p className="text-xl font-bold gradient-text mt-2">R$ 100,00</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Order Bumps */}
            {!charge && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Gift className="h-5 w-5 text-accent" />
                  Adicione ao seu pedido
                </h3>
                {orderBumps.map((bump) => (
                  <Card 
                    key={bump.id}
                    className={`cursor-pointer transition-all ${
                      selectedBumps.includes(bump.id) 
                        ? 'border-accent bg-accent/5' 
                        : 'glass-card-hover'
                    }`}
                    onClick={() => toggleBump(bump.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <Checkbox 
                          checked={selectedBumps.includes(bump.id)}
                          onCheckedChange={() => toggleBump(bump.id)}
                          className="mt-1"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <bump.icon className="h-4 w-4 text-accent" />
                            <span className="font-medium">{bump.name}</span>
                            <span className="text-xs px-2 py-0.5 bg-destructive/20 text-destructive rounded-full">
                              -{Math.round((1 - bump.price / bump.originalPrice) * 100)}%
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground">{bump.description}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground line-through">
                            R$ {bump.originalPrice.toFixed(2)}
                          </p>
                          <p className="font-bold text-accent">
                            R$ {bump.price.toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {affiliateCode && (
              <div className="p-3 bg-accent/10 rounded-lg">
                <p className="text-sm text-accent">
                  🎁 Indicado por afiliado: {affiliateCode}
                </p>
              </div>
            )}
          </div>

          {/* Right Column - Payment */}
          <div className="lg:col-span-2">
            <Card className="glass-card sticky top-4">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <QrCode className="h-5 w-5 text-primary" />
                  {charge ? 'Pague com PIX' : 'Finalizar Compra'}
                </CardTitle>
                <CardDescription>
                  {charge 
                    ? 'Escaneie o QR Code ou copie o código'
                    : 'Preencha seus dados para pagar'
                  }
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!charge ? (
                  <form onSubmit={handleCreateCharge} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Nome completo</Label>
                      <Input
                        id="name"
                        placeholder="Seu nome"
                        value={buyerName}
                        onChange={(e) => setBuyerName(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="seu@email.com"
                        value={buyerEmail}
                        onChange={(e) => setBuyerEmail(e.target.value)}
                        required
                      />
                    </div>

                    {/* Order Summary */}
                    <div className="pt-4 border-t border-border space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Produto</span>
                        <span>R$ {basePrice.toFixed(2)}</span>
                      </div>
                      {selectedBumps.map(bumpId => {
                        const bump = orderBumps.find(b => b.id === bumpId);
                        return bump && (
                          <div key={bumpId} className="flex justify-between text-sm">
                            <span className="text-muted-foreground">{bump.name}</span>
                            <span className="text-accent">R$ {bump.price.toFixed(2)}</span>
                          </div>
                        );
                      })}
                      <div className="flex justify-between font-bold pt-2 border-t border-border">
                        <span>Total</span>
                        <span className="gradient-text text-xl">R$ {totalPrice.toFixed(2)}</span>
                      </div>
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full btn-success-gradient py-6 text-lg" 
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          Gerando PIX...
                        </>
                      ) : (
                        <>
                          Pagar R$ {totalPrice.toFixed(2)}
                          <ArrowRight className="ml-2 h-5 w-5" />
                        </>
                      )}
                    </Button>

                    <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                      <Shield className="h-4 w-4" />
                      Pagamento 100% seguro
                    </div>
                  </form>
                ) : (
                  <div className="space-y-6">
                    {timeLeft !== null && timeLeft > 0 && (
                      <div className="flex items-center justify-center gap-2 text-lg">
                        <Timer className="h-5 w-5 text-primary" />
                        <span className="font-mono font-bold">{formatTime(timeLeft)}</span>
                        <span className="text-muted-foreground text-sm">para expirar</span>
                      </div>
                    )}

                    <div className="bg-white p-4 rounded-lg mx-auto w-fit">
                      <div className="w-40 h-40 bg-secondary flex items-center justify-center">
                        <QrCode className="h-28 w-28 text-primary" />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Código PIX Copia e Cola</Label>
                      <div className="flex gap-2">
                        <Input
                          value={charge.copy_paste}
                          readOnly
                          className="font-mono text-xs"
                        />
                        <Button
                          variant="outline"
                          onClick={handleCopyCode}
                          className="shrink-0"
                        >
                          {copied ? (
                            <Check className="h-4 w-4 text-accent" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>

                    <div className="flex items-center justify-center gap-2 text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Aguardando pagamento...
                    </div>

                    <Button
                      variant="outline"
                      onClick={handleSimulatePayment}
                      className="w-full"
                      disabled={loading}
                    >
                      {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Simular Pagamento (Teste)
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
