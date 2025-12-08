import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { QrCode, Copy, Check, Timer, CheckCircle2, Loader2 } from "lucide-react";

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

const Checkout = () => {
  const [searchParams] = useSearchParams();
  const productId = searchParams.get("product");
  const affiliateCode = searchParams.get("ref");
  
  const [product, setProduct] = useState<Product | null>(null);
  const [charge, setCharge] = useState<Charge | null>(null);
  const [buyerEmail, setBuyerEmail] = useState("");
  const [buyerName, setBuyerName] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);
  
  const { toast } = useToast();

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

      // Subscribe to realtime updates
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
          amount: product?.price || 100,
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
      const { data, error } = await supabase.functions.invoke('pix-api', {
        body: {},
        method: 'POST',
      });

      // Call confirm endpoint directly
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

      setPaymentConfirmed(true);
      toast({
        title: "Pagamento confirmado!",
        description: "Seu acesso foi liberado.",
      });
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

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

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
              Seu pagamento foi processado com sucesso. Verifique seu email para acessar o conteúdo.
            </p>
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
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold gradient-text mb-2">Checkout Seguro</h1>
          <p className="text-muted-foreground">Pagamento instantâneo via PIX</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Product Info */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Resumo do Pedido</CardTitle>
            </CardHeader>
            <CardContent>
              {product ? (
                <div className="space-y-4">
                  {product.cover_url && (
                    <img 
                      src={product.cover_url} 
                      alt={product.name}
                      className="w-full h-48 object-cover rounded-lg"
                    />
                  )}
                  <div>
                    <h3 className="text-xl font-semibold">{product.name}</h3>
                    <p className="text-muted-foreground text-sm mt-1">{product.description}</p>
                  </div>
                  <div className="flex items-center justify-between pt-4 border-t border-border">
                    <span className="text-muted-foreground">Total</span>
                    <span className="text-2xl font-bold gradient-text">
                      R$ {product.price.toFixed(2)}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="h-48 bg-secondary rounded-lg flex items-center justify-center">
                    <QrCode className="h-16 w-16 text-muted-foreground" />
                  </div>
                  <p className="text-center text-muted-foreground">
                    Produto de demonstração
                  </p>
                  <div className="flex items-center justify-between pt-4 border-t border-border">
                    <span className="text-muted-foreground">Total</span>
                    <span className="text-2xl font-bold gradient-text">R$ 100,00</span>
                  </div>
                </div>
              )}
              
              {affiliateCode && (
                <div className="mt-4 p-3 bg-accent/10 rounded-lg">
                  <p className="text-sm text-accent">
                    🎁 Indicado por afiliado: {affiliateCode}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Payment Form / QR Code */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <QrCode className="h-5 w-5 text-primary" />
                {charge ? 'Pague com PIX' : 'Dados do Pagamento'}
              </CardTitle>
              <CardDescription>
                {charge 
                  ? 'Escaneie o QR Code ou copie o código PIX'
                  : 'Preencha seus dados para gerar o PIX'
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
                  <Button 
                    type="submit" 
                    className="w-full btn-success-gradient" 
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Gerando PIX...
                      </>
                    ) : (
                      'Gerar QR Code PIX'
                    )}
                  </Button>
                </form>
              ) : (
                <div className="space-y-6">
                  {/* Timer */}
                  {timeLeft !== null && timeLeft > 0 && (
                    <div className="flex items-center justify-center gap-2 text-lg">
                      <Timer className="h-5 w-5 text-primary" />
                      <span className="font-mono font-bold">{formatTime(timeLeft)}</span>
                      <span className="text-muted-foreground text-sm">para expirar</span>
                    </div>
                  )}

                  {/* QR Code */}
                  <div className="bg-white p-4 rounded-lg mx-auto w-fit">
                    <div className="w-48 h-48 bg-secondary flex items-center justify-center">
                      <QrCode className="h-32 w-32 text-primary" />
                    </div>
                  </div>

                  {/* Copy Code */}
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

                  {/* Status */}
                  <div className="flex items-center justify-center gap-2 text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Aguardando pagamento...
                  </div>

                  {/* Simulate Payment (Dev only) */}
                  <Button
                    variant="outline"
                    onClick={handleSimulatePayment}
                    className="w-full"
                    disabled={loading}
                  >
                    {loading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : null}
                    Simular Pagamento (Teste)
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
