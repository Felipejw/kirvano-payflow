import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { DollarSign, TrendingUp, Receipt, Calendar, Loader2, Copy, Check, QrCode, AlertCircle, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { QRCodeSVG } from "qrcode.react";
import { Badge } from "@/components/ui/badge";

interface CurrentPeriodFeeCardProps {
  feePercentage: number;
  feeFixed: number;
}

interface PendingFeeData {
  totalSales: number;
  totalAmount: number;
  feeTotal: number;
  periodStart: string | null;
}

export function CurrentPeriodFeeCard({ feePercentage, feeFixed }: CurrentPeriodFeeCardProps) {
  const [pendingFee, setPendingFee] = useState<PendingFeeData>({
    totalSales: 0,
    totalAmount: 0,
    feeTotal: 0,
    periodStart: null,
  });
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [pixDialogOpen, setPixDialogOpen] = useState(false);
  const [pixData, setPixData] = useState<{ copyPaste: string; invoiceId: string } | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchPendingFees();
  }, []);

  const fetchPendingFees = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: transactions, error } = await supabase
      .from("transactions")
      .select("amount, created_at")
      .eq("seller_id", user.id)
      .eq("status", "paid")
      .is("fee_paid_at", null);

    if (error) {
      console.error("Error fetching pending fees:", error);
      setLoading(false);
      return;
    }

    if (!transactions || transactions.length === 0) {
      setPendingFee({
        totalSales: 0,
        totalAmount: 0,
        feeTotal: 0,
        periodStart: null,
      });
      setLoading(false);
      return;
    }

    const totalSales = transactions.length;
    const totalAmount = transactions.reduce((sum, t) => sum + Number(t.amount), 0);
    const feeFromPercentage = totalAmount * (feePercentage / 100);
    const feeFromFixed = totalSales * feeFixed;
    const feeTotal = feeFromPercentage + feeFromFixed;

    const dates = transactions.map((t) => new Date(t.created_at));
    const periodStart = new Date(Math.min(...dates.map((d) => d.getTime())));

    setPendingFee({
      totalSales,
      totalAmount,
      feeTotal,
      periodStart: periodStart.toISOString(),
    });
    setLoading(false);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const handleGeneratePix = async () => {
    if (pendingFee.feeTotal <= 0) {
      toast.info("Não há taxa pendente para pagamento");
      return;
    }

    setGenerating(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const response = await supabase.functions.invoke("generate-fee-pix", {
        body: {
          userId: user.id,
          amount: pendingFee.feeTotal,
          totalSales: pendingFee.totalSales,
          totalAmount: pendingFee.totalAmount,
          periodStart: pendingFee.periodStart,
        },
      });

      if (response.error) throw response.error;

      const { copyPaste, invoiceId } = response.data;
      setPixData({ copyPaste, invoiceId });
      setPixDialogOpen(true);
    } catch (error: any) {
      console.error("Error generating fee PIX:", error);
      toast.error("Erro ao gerar PIX: " + (error.message || "Tente novamente"));
    } finally {
      setGenerating(false);
    }
  };

  const handleCopyPix = () => {
    if (pixData?.copyPaste) {
      navigator.clipboard.writeText(pixData.copyPaste);
      setCopied(true);
      toast.success("Código PIX copiado!");
      setTimeout(() => setCopied(false), 3000);
    }
  };

  if (loading) {
    return (
      <Card className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
        <CardContent className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  const hasPendingFee = pendingFee.feeTotal > 0;

  return (
    <>
      <Card className="relative overflow-hidden border-0 shadow-xl">
        {/* Gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-accent/10" />
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-32 translate-x-32" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-accent/5 rounded-full blur-3xl translate-y-24 -translate-x-24" />
        
        <CardHeader className="relative pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-primary/10 ring-1 ring-primary/20">
                <Receipt className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg font-semibold">
                  Resumo do Período
                </CardTitle>
                <CardDescription className="text-sm">
                  Taxa pendente de pagamento
                </CardDescription>
              </div>
            </div>
            {hasPendingFee && (
              <Badge variant="outline" className="bg-orange-500/10 text-orange-500 border-orange-500/30 animate-pulse">
                <AlertCircle className="h-3 w-3 mr-1" />
                Pendente
              </Badge>
            )}
          </div>
        </CardHeader>
        
        <CardContent className="relative space-y-6 pt-4">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Vendas */}
            <div className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-blue-500/10 to-blue-600/5 p-4 ring-1 ring-blue-500/20 transition-all hover:ring-blue-500/40 hover:shadow-lg hover:shadow-blue-500/10">
              <div className="absolute top-0 right-0 w-16 h-16 bg-blue-500/10 rounded-full blur-2xl group-hover:bg-blue-500/20 transition-colors" />
              <TrendingUp className="h-5 w-5 text-blue-500 mb-2" />
              <p className="text-2xl font-bold text-foreground">{pendingFee.totalSales}</p>
              <p className="text-xs text-muted-foreground font-medium">vendas</p>
            </div>

            {/* Faturado */}
            <div className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 p-4 ring-1 ring-emerald-500/20 transition-all hover:ring-emerald-500/40 hover:shadow-lg hover:shadow-emerald-500/10">
              <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-colors" />
              <DollarSign className="h-5 w-5 text-emerald-500 mb-2" />
              <p className="text-2xl font-bold text-foreground">{formatCurrency(pendingFee.totalAmount)}</p>
              <p className="text-xs text-muted-foreground font-medium">faturado</p>
            </div>

            {/* Taxa Devida */}
            <div className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-orange-500/10 to-orange-600/5 p-4 ring-1 ring-orange-500/20 transition-all hover:ring-orange-500/40 hover:shadow-lg hover:shadow-orange-500/10">
              <div className="absolute top-0 right-0 w-16 h-16 bg-orange-500/10 rounded-full blur-2xl group-hover:bg-orange-500/20 transition-colors" />
              <Receipt className="h-5 w-5 text-orange-500 mb-2" />
              <p className="text-2xl font-bold text-foreground">{formatCurrency(pendingFee.feeTotal)}</p>
              <p className="text-xs text-muted-foreground font-medium">taxa devida</p>
            </div>

            {/* Desde */}
            <div className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-purple-500/10 to-purple-600/5 p-4 ring-1 ring-purple-500/20 transition-all hover:ring-purple-500/40 hover:shadow-lg hover:shadow-purple-500/10">
              <div className="absolute top-0 right-0 w-16 h-16 bg-purple-500/10 rounded-full blur-2xl group-hover:bg-purple-500/20 transition-colors" />
              <Calendar className="h-5 w-5 text-purple-500 mb-2" />
              <p className="text-2xl font-bold text-foreground">
                {pendingFee.periodStart
                  ? format(new Date(pendingFee.periodStart), "dd/MM", { locale: ptBR })
                  : "-"}
              </p>
              <p className="text-xs text-muted-foreground font-medium">desde</p>
            </div>
          </div>

          {/* Payment Section */}
          <div className="relative rounded-xl bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 p-5 ring-1 ring-primary/20">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-center sm:text-left">
                <p className="text-sm text-muted-foreground mb-1">Valor a pagar</p>
                <p className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  {formatCurrency(pendingFee.feeTotal)}
                </p>
              </div>
              
              <Button
                size="lg"
                onClick={handleGeneratePix}
                disabled={generating || !hasPendingFee}
                className="relative overflow-hidden bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all duration-300 min-w-[200px]"
              >
                {generating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Gerando PIX...
                  </>
                ) : (
                  <>
                    <QrCode className="h-4 w-4 mr-2" />
                    Pagar via PIX
                    <Sparkles className="h-3.5 w-3.5 ml-2 opacity-70" />
                  </>
                )}
              </Button>
            </div>
            
            <p className="text-xs text-muted-foreground text-center mt-4 flex items-center justify-center gap-1.5">
              <AlertCircle className="h-3.5 w-3.5" />
              O pagamento antecipado evita bloqueios automáticos após o vencimento.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* PIX Dialog - Modernized */}
      <Dialog open={pixDialogOpen} onOpenChange={setPixDialogOpen}>
        <DialogContent className="sm:max-w-md border-0 shadow-2xl">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/5 rounded-lg" />
          
          <DialogHeader className="relative">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-xl bg-primary/10 ring-1 ring-primary/20">
                <QrCode className="h-5 w-5 text-primary" />
              </div>
              <DialogTitle className="text-xl">Pague via PIX</DialogTitle>
            </div>
          </DialogHeader>
          
          <div className="relative space-y-6">
            {/* QR Code */}
            {pixData?.copyPaste && (
              <div className="flex justify-center">
                <div className="relative p-1 rounded-2xl bg-gradient-to-br from-primary/20 via-primary/10 to-accent/20 shadow-lg">
                  <div className="bg-white p-4 rounded-xl">
                    <QRCodeSVG 
                      value={pixData.copyPaste} 
                      size={180}
                      level="M"
                      className="rounded"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Copy Paste Code */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-foreground">Código PIX Copia e Cola</p>
                <Badge variant="outline" className="text-xs">
                  Clique para copiar
                </Badge>
              </div>
              
              <div 
                onClick={handleCopyPix}
                className="group cursor-pointer relative overflow-hidden rounded-xl bg-muted/50 p-4 ring-1 ring-border hover:ring-primary/50 transition-all duration-300"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/5 to-primary/0 opacity-0 group-hover:opacity-100 transition-opacity" />
                <p className="text-xs font-mono break-all text-muted-foreground max-h-16 overflow-y-auto relative z-10">
                  {pixData?.copyPaste}
                </p>
                
                <div className="absolute top-2 right-2 p-2 rounded-lg bg-background/80 backdrop-blur-sm ring-1 ring-border group-hover:ring-primary/50 transition-all">
                  {copied ? (
                    <Check className="h-4 w-4 text-emerald-500" />
                  ) : (
                    <Copy className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-500/10 ring-1 ring-emerald-500/20">
              <Check className="h-4 w-4 text-emerald-500 flex-shrink-0" />
              <p className="text-xs text-muted-foreground">
                Após o pagamento, sua taxa será registrada automaticamente.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
