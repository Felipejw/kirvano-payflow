import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { DollarSign, TrendingUp, Receipt, Calendar, Loader2, Copy, Check, QrCode } from "lucide-react";
import { toast } from "sonner";
import { QRCodeSVG } from "qrcode.react";

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

    // Get transactions that haven't had their fee paid yet
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

    // Find earliest transaction date
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
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5 text-primary" />
            Resumo do Período Atual
          </CardTitle>
          <CardDescription>
            Acompanhe suas vendas e taxa pendente. Pague a qualquer momento para evitar bloqueios.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-muted/50 rounded-lg p-4 text-center">
              <TrendingUp className="h-6 w-6 mx-auto mb-2 text-blue-500" />
              <p className="text-2xl font-bold">{pendingFee.totalSales}</p>
              <p className="text-sm text-muted-foreground">vendas</p>
            </div>

            <div className="bg-muted/50 rounded-lg p-4 text-center">
              <DollarSign className="h-6 w-6 mx-auto mb-2 text-green-500" />
              <p className="text-2xl font-bold">{formatCurrency(pendingFee.totalAmount)}</p>
              <p className="text-sm text-muted-foreground">faturado</p>
            </div>

            <div className="bg-muted/50 rounded-lg p-4 text-center">
              <Receipt className="h-6 w-6 mx-auto mb-2 text-orange-500" />
              <p className="text-2xl font-bold">{formatCurrency(pendingFee.feeTotal)}</p>
              <p className="text-sm text-muted-foreground">taxa devida</p>
            </div>

            <div className="bg-muted/50 rounded-lg p-4 text-center">
              <Calendar className="h-6 w-6 mx-auto mb-2 text-purple-500" />
              <p className="text-2xl font-bold">
                {pendingFee.periodStart
                  ? format(new Date(pendingFee.periodStart), "dd/MM", { locale: ptBR })
                  : "-"}
              </p>
              <p className="text-sm text-muted-foreground">desde</p>
            </div>
          </div>

          {/* Payment Button */}
          <div className="flex flex-col items-center gap-3 pt-4 border-t">
            <Button
              size="lg"
              onClick={handleGeneratePix}
              disabled={generating || pendingFee.feeTotal <= 0}
              className="w-full md:w-auto"
            >
              {generating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Gerando PIX...
                </>
              ) : (
                <>
                  <QrCode className="h-4 w-4 mr-2" />
                  Pagar Taxa Agora - {formatCurrency(pendingFee.feeTotal)}
                </>
              )}
            </Button>
            <p className="text-sm text-muted-foreground text-center">
              O pagamento antecipado evita bloqueios automáticos após o vencimento.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* PIX Dialog */}
      <Dialog open={pixDialogOpen} onOpenChange={setPixDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Pague a Taxa via PIX</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            {/* QR Code - Generated locally from PIX code */}
            {pixData?.copyPaste && (
              <div className="flex justify-center">
                <div className="bg-white p-4 rounded-lg">
                  <QRCodeSVG 
                    value={pixData.copyPaste} 
                    size={192}
                    level="M"
                  />
                </div>
              </div>
            )}

            {/* Copy Paste */}
            <div className="space-y-2">
              <p className="text-sm font-medium">Código PIX Copia e Cola:</p>
              <div className="flex gap-2">
                <div className="flex-1 bg-muted p-3 rounded-lg text-xs break-all font-mono max-h-20 overflow-y-auto">
                  {pixData?.copyPaste}
                </div>
                <Button variant="outline" size="icon" onClick={handleCopyPix}>
                  {copied ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <p className="text-sm text-muted-foreground text-center">
              Após o pagamento, sua taxa será automaticamente registrada como paga.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
