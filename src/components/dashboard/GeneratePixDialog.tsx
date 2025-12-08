import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Copy, QrCode, CheckCircle, Loader2 } from "lucide-react";

interface Product {
  id: string;
  name: string;
  price: number;
}

interface GeneratePixDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface PixResponse {
  id: string;
  external_id: string;
  amount: number;
  status: string;
  qr_code: string;
  qr_code_base64: string;
  copy_paste: string;
  expires_at: string;
}

export function GeneratePixDialog({ open, onOpenChange }: GeneratePixDialogProps) {
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<string>("");
  const [customAmount, setCustomAmount] = useState("");
  const [buyerEmail, setBuyerEmail] = useState("");
  const [buyerName, setBuyerName] = useState("");
  const [pixData, setPixData] = useState<PixResponse | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (open) {
      fetchProducts();
      setPixData(null);
      setSelectedProduct("");
      setCustomAmount("");
      setBuyerEmail("");
      setBuyerName("");
    }
  }, [open]);

  const fetchProducts = async () => {
    const { data } = await supabase
      .from('products')
      .select('id, name, price')
      .eq('status', 'active')
      .order('name');
    
    if (data) setProducts(data);
  };

  const getAmount = () => {
    if (customAmount) return parseFloat(customAmount);
    const product = products.find(p => p.id === selectedProduct);
    return product?.price || 0;
  };

  const handleGeneratePix = async () => {
    const amount = getAmount();
    
    if (!amount || amount <= 0) {
      toast.error("Informe um valor válido");
      return;
    }
    
    if (!buyerEmail) {
      toast.error("Informe o email do comprador");
      return;
    }

    setLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('pix-api', {
        body: {
          amount,
          buyer_email: buyerEmail,
          buyer_name: buyerName || undefined,
          product_id: selectedProduct || undefined,
          description: selectedProduct 
            ? `Pagamento: ${products.find(p => p.id === selectedProduct)?.name}` 
            : `Pagamento PIX R$ ${amount.toFixed(2)}`,
        },
      });

      if (error) throw error;
      
      setPixData(data);
      toast.success("PIX gerado com sucesso!");
    } catch (error: any) {
      console.error('Error generating PIX:', error);
      toast.error(error.message || "Erro ao gerar PIX");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async () => {
    if (pixData?.copy_paste) {
      await navigator.clipboard.writeText(pixData.copy_paste);
      setCopied(true);
      toast.success("Código PIX copiado!");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5 text-primary" />
            Gerar PIX
          </DialogTitle>
        </DialogHeader>
        
        {!pixData ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Produto (opcional)</Label>
              <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um produto" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Valor personalizado</SelectItem>
                  {products.map((product) => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.name} - R$ {product.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {!selectedProduct && (
              <div className="space-y-2">
                <Label htmlFor="amount">Valor (R$) *</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                  placeholder="0,00"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email do comprador *</Label>
              <Input
                id="email"
                type="email"
                value={buyerEmail}
                onChange={(e) => setBuyerEmail(e.target.value)}
                placeholder="cliente@email.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Nome do comprador</Label>
              <Input
                id="name"
                value={buyerName}
                onChange={(e) => setBuyerName(e.target.value)}
                placeholder="Nome completo"
              />
            </div>

            <div className="p-4 rounded-lg bg-secondary/50 border border-border">
              <p className="text-sm text-muted-foreground">Valor a cobrar</p>
              <p className="text-2xl font-bold text-primary">
                R$ {getAmount().toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>

            <Button 
              variant="gradient" 
              className="w-full gap-2" 
              onClick={handleGeneratePix}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Gerando...
                </>
              ) : (
                <>
                  <QrCode className="h-4 w-4" />
                  Gerar QR Code PIX
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* QR Code Display */}
            <div className="flex flex-col items-center p-6 bg-white rounded-lg">
              {pixData.qr_code_base64 ? (
                <img 
                  src={pixData.qr_code_base64} 
                  alt="QR Code PIX" 
                  className="w-48 h-48 object-contain"
                />
              ) : (
                <div className="w-48 h-48 flex items-center justify-center bg-secondary rounded-lg">
                  <QrCode className="h-24 w-24 text-muted-foreground" />
                </div>
              )}
            </div>

            {/* Amount */}
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Valor</p>
              <p className="text-2xl font-bold text-primary">
                R$ {Number(pixData.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>

            {/* Copy Paste Code */}
            <div className="space-y-2">
              <Label>PIX Copia e Cola</Label>
              <div className="flex gap-2">
                <Input 
                  value={pixData.copy_paste} 
                  readOnly 
                  className="font-mono text-xs"
                />
                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={copyToClipboard}
                  className={copied ? "text-green-500" : ""}
                >
                  {copied ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            {/* Status */}
            <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
              <p className="text-sm text-yellow-600 dark:text-yellow-400 text-center">
                ⏳ Aguardando pagamento...
              </p>
              <p className="text-xs text-muted-foreground text-center mt-1">
                Expira em: {new Date(pixData.expires_at).toLocaleString('pt-BR')}
              </p>
            </div>

            <Button 
              variant="outline" 
              className="w-full" 
              onClick={() => {
                setPixData(null);
                onOpenChange(false);
              }}
            >
              Fechar
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
