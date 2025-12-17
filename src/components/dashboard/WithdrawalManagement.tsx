import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  Wallet, 
  DollarSign, 
  Clock, 
  ArrowUpRight, 
  Building2,
  TrendingUp,
  Calendar,
  AlertCircle
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface WithdrawalRequest {
  id: string;
  amount: number;
  net_amount: number;
  fee: number;
  status: string;
  pix_key: string;
  pix_key_type: string;
  requested_at: string;
  completed_at?: string;
}

interface FinanceData {
  availableBalance: number;
  pendingBalance: number;
  withdrawnTotal: number;
  withdrawalFee: number;
  minWithdrawal: number;
}

export function WithdrawalManagement() {
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [pixKeyType, setPixKeyType] = useState("");
  const [pixKey, setPixKey] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [financeData, setFinanceData] = useState<FinanceData>({
    availableBalance: 0,
    pendingBalance: 0,
    withdrawnTotal: 0,
    withdrawalFee: 5,
    minWithdrawal: 50,
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchFinanceData();
  }, []);

  const fetchFinanceData = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Fetch platform settings
    const { data: platformSettings } = await supabase
      .from('platform_settings')
      .select('platform_gateway_withdrawal_fee, min_withdrawal')
      .maybeSingle();

    // Fetch paid transactions (seller_amount)
    const { data: paidTransactions } = await supabase
      .from('transactions')
      .select('seller_amount, created_at')
      .eq('seller_id', user.id)
      .eq('status', 'paid');

    // Calculate pending balance (transactions from last 14 days)
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

    const pendingTransactions = paidTransactions?.filter(t => 
      new Date(t.created_at) > fourteenDaysAgo
    ) || [];

    const availableTransactions = paidTransactions?.filter(t => 
      new Date(t.created_at) <= fourteenDaysAgo
    ) || [];

    const totalSellerAmount = paidTransactions?.reduce((acc, t) => acc + Number(t.seller_amount), 0) || 0;
    const pendingAmount = pendingTransactions.reduce((acc, t) => acc + Number(t.seller_amount), 0);

    // Fetch completed withdrawals
    const { data: completedWithdrawals } = await supabase
      .from('withdrawals')
      .select('net_amount')
      .eq('user_id', user.id)
      .eq('status', 'completed');

    const withdrawnTotal = completedWithdrawals?.reduce((acc, w) => acc + Number(w.net_amount), 0) || 0;

    // Fetch pending withdrawals
    const { data: pendingWithdrawals } = await supabase
      .from('withdrawals')
      .select('net_amount')
      .eq('user_id', user.id)
      .in('status', ['pending', 'processing']);

    const pendingWithdrawalAmount = pendingWithdrawals?.reduce((acc, w) => acc + Number(w.net_amount), 0) || 0;

    // Fetch all withdrawals for history
    const { data: allWithdrawals } = await supabase
      .from('withdrawals')
      .select('*')
      .eq('user_id', user.id)
      .order('requested_at', { ascending: false })
      .limit(10);

    setWithdrawals(allWithdrawals || []);
    setFinanceData({
      availableBalance: totalSellerAmount - withdrawnTotal - pendingWithdrawalAmount,
      pendingBalance: pendingAmount,
      withdrawnTotal,
      withdrawalFee: platformSettings?.platform_gateway_withdrawal_fee ?? 5,
      minWithdrawal: platformSettings?.min_withdrawal ?? 50,
    });
    setLoading(false);
  };

  const handleWithdraw = async () => {
    const amount = parseFloat(withdrawAmount);
    if (!amount || amount <= 0) {
      toast({
        title: "Valor inválido",
        description: "Informe um valor válido para saque.",
        variant: "destructive",
      });
      return;
    }

    if (amount < financeData.minWithdrawal) {
      toast({
        title: "Valor mínimo",
        description: `O valor mínimo para saque é R$ ${financeData.minWithdrawal.toFixed(2)}.`,
        variant: "destructive",
      });
      return;
    }

    if (amount > financeData.availableBalance) {
      toast({
        title: "Saldo insuficiente",
        description: "O valor solicitado excede seu saldo disponível.",
        variant: "destructive",
      });
      return;
    }

    if (!pixKeyType || !pixKey) {
      toast({
        title: "Chave PIX obrigatória",
        description: "Informe o tipo e a chave PIX para receber o saque.",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setSubmitting(false);
      return;
    }

    // Calculate fee (fixed fee from platform settings)
    const fee = financeData.withdrawalFee;
    const netAmount = amount - fee;

    const { error } = await supabase
      .from('withdrawals')
      .insert({
        user_id: user.id,
        amount,
        fee,
        net_amount: netAmount,
        pix_key: pixKey,
        pix_key_type: pixKeyType,
        status: 'pending',
      });

    setSubmitting(false);

    if (error) {
      toast({
        title: "Erro ao solicitar saque",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Solicitação enviada!",
      description: `Saque de R$ ${netAmount.toFixed(2)} (líquido) solicitado. Prazo: 1-2 dias úteis.`,
    });
    setDialogOpen(false);
    setWithdrawAmount("");
    setPixKey("");
    setPixKeyType("");
    fetchFinanceData();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-accent/20 text-accent">Concluído</Badge>;
      case "processing":
        return <Badge className="bg-primary/20 text-primary">Processando</Badge>;
      case "pending":
        return <Badge className="bg-yellow-500/20 text-yellow-500">Pendente</Badge>;
      case "rejected":
        return <Badge className="bg-destructive/20 text-destructive">Rejeitado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="stat-card">
              <CardContent className="pt-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-muted rounded w-24 mb-2"></div>
                  <div className="h-8 bg-muted rounded w-32"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Balance Cards */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card className="stat-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Saldo Disponível</p>
                <h3 className="text-2xl font-bold gradient-success-text">
                  R$ {financeData.availableBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </h3>
                <p className="text-xs text-muted-foreground mt-1">Disponível para saque</p>
              </div>
              <div className="h-12 w-12 rounded-lg bg-accent/10 flex items-center justify-center">
                <Wallet className="h-6 w-6 text-accent" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="stat-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Saldo Pendente</p>
                <h3 className="text-2xl font-bold text-yellow-500">
                  R$ {financeData.pendingBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </h3>
                <p className="text-xs text-muted-foreground mt-1">Liberado em até 14 dias</p>
              </div>
              <div className="h-12 w-12 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                <Clock className="h-6 w-6 text-yellow-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="stat-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Sacado</p>
                <h3 className="text-2xl font-bold">
                  R$ {financeData.withdrawnTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </h3>
                <p className="text-xs text-muted-foreground mt-1">Desde o início</p>
              </div>
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Withdrawal Button */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogTrigger asChild>
          <Button className="btn-success-gradient w-full md:w-auto" size="lg">
            <ArrowUpRight className="mr-2 h-5 w-5" />
            Solicitar Saque
          </Button>
        </DialogTrigger>
        <DialogContent className="glass-card">
          <DialogHeader>
            <DialogTitle>Solicitar Saque</DialogTitle>
            <DialogDescription>
              Saldo disponível: R$ {financeData.availableBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Valor do Saque</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">R$</span>
                <Input
                  type="number"
                  placeholder="0,00"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  className="pl-10"
                  step="0.01"
                  min={financeData.minWithdrawal}
                  max={financeData.availableBalance}
                />
              </div>
              <div className="flex gap-2">
                {[100, 500, 1000].map((value) => (
                  <Button
                    key={value}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setWithdrawAmount(value.toString())}
                    disabled={value > financeData.availableBalance}
                  >
                    R$ {value}
                  </Button>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setWithdrawAmount(financeData.availableBalance.toString())}
                  disabled={financeData.availableBalance <= 0}
                >
                  Tudo
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Tipo de Chave PIX</Label>
              <Select value={pixKeyType} onValueChange={setPixKeyType}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="cpf">CPF</SelectItem>
                  <SelectItem value="cnpj">CNPJ</SelectItem>
                  <SelectItem value="phone">Telefone</SelectItem>
                  <SelectItem value="random">Chave Aleatória</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Chave PIX</Label>
              <Input
                placeholder="Digite sua chave PIX"
                value={pixKey}
                onChange={(e) => setPixKey(e.target.value)}
              />
            </div>

            <div className="flex items-start gap-2 p-3 bg-yellow-500/10 rounded-lg">
              <AlertCircle className="h-4 w-4 text-yellow-500 mt-0.5 shrink-0" />
              <p className="text-xs text-yellow-500">
                Saques são processados em até 2 dias úteis. Taxa fixa de R$ {financeData.withdrawalFee.toFixed(2)} por saque. Mínimo: R$ {financeData.minWithdrawal.toFixed(2)}.
              </p>
            </div>

            <Button 
              onClick={handleWithdraw} 
              className="w-full btn-success-gradient"
              disabled={submitting}
            >
              {submitting ? "Processando..." : "Confirmar Saque"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Withdrawal History */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Histórico de Saques
          </CardTitle>
          <CardDescription>Suas solicitações de saque recentes</CardDescription>
        </CardHeader>
        <CardContent>
          {withdrawals.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum saque realizado ainda.
            </div>
          ) : (
            <div className="space-y-4">
              {withdrawals.map((withdrawal) => (
                <div
                  key={withdrawal.id}
                  className="flex items-center justify-between p-4 bg-secondary/30 rounded-lg"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <DollarSign className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">
                        R$ {Number(withdrawal.net_amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {new Date(withdrawal.requested_at).toLocaleDateString('pt-BR')}
                        {withdrawal.fee > 0 && (
                          <span className="text-muted-foreground">
                            (Taxa: R$ {Number(withdrawal.fee).toFixed(2)})
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    {getStatusBadge(withdrawal.status)}
                    {withdrawal.completed_at && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Concluído em {new Date(withdrawal.completed_at).toLocaleDateString('pt-BR')}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
