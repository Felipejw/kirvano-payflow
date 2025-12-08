import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Wallet,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  CheckCircle,
  XCircle,
  DollarSign,
  Percent,
  History,
  AlertCircle
} from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface FinanceData {
  availableBalance: number;
  pendingBalance: number;
  totalWithdrawn: number;
  platformFees: number;
  affiliateFees: number;
}

interface Withdrawal {
  id: string;
  amount: number;
  status: 'pending' | 'completed' | 'failed';
  pix_key: string;
  requested_at: string;
  completed_at: string | null;
}

const Finance = () => {
  const [financeData, setFinanceData] = useState<FinanceData>({
    availableBalance: 0,
    pendingBalance: 0,
    totalWithdrawn: 0,
    platformFees: 0,
    affiliateFees: 0,
  });
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [withdrawDialogOpen, setWithdrawDialogOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [pixKeyType, setPixKeyType] = useState("cpf");
  const [pixKey, setPixKey] = useState("");

  useEffect(() => {
    fetchFinanceData();
  }, []);

  const fetchFinanceData = async () => {
    setLoading(true);
    
    // Fetch transactions to calculate balances
    const { data: transactions } = await supabase
      .from('transactions')
      .select('*')
      .eq('status', 'paid');

    if (transactions) {
      const sellerAmount = transactions.reduce((acc, t) => acc + Number(t.seller_amount), 0);
      const platformFees = transactions.reduce((acc, t) => acc + Number(t.platform_fee), 0);
      const affiliateFees = transactions.reduce((acc, t) => acc + Number(t.affiliate_amount), 0);
      
      setFinanceData({
        availableBalance: sellerAmount,
        pendingBalance: 0, // Would need pending transactions
        totalWithdrawn: 0, // Would need withdrawals table
        platformFees,
        affiliateFees,
      });
    }

    // Mock withdrawals for now (would need a withdrawals table)
    setWithdrawals([
      {
        id: '1',
        amount: 1500,
        status: 'completed',
        pix_key: '***.456.789-**',
        requested_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        completed_at: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: '2',
        amount: 2350,
        status: 'pending',
        pix_key: '***.456.789-**',
        requested_at: new Date().toISOString(),
        completed_at: null,
      },
    ]);

    setLoading(false);
  };

  const handleWithdraw = async () => {
    const amount = parseFloat(withdrawAmount);
    
    if (!amount || amount <= 0) {
      toast.error("Informe um valor válido");
      return;
    }
    
    if (amount > financeData.availableBalance) {
      toast.error("Saldo insuficiente");
      return;
    }
    
    if (!pixKey) {
      toast.error("Informe sua chave PIX");
      return;
    }
    
    // Would call API to create withdrawal
    toast.success(`Saque de R$ ${amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} solicitado!`);
    setWithdrawDialogOpen(false);
    setWithdrawAmount("");
    setPixKey("");
    fetchFinanceData();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="success" className="gap-1"><CheckCircle className="h-3 w-3" />Concluído</Badge>;
      case 'pending':
        return <Badge variant="warning" className="gap-1"><Clock className="h-3 w-3" />Pendente</Badge>;
      case 'failed':
        return <Badge variant="destructive" className="gap-1"><XCircle className="h-3 w-3" />Falhou</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Financeiro</h1>
            <p className="text-muted-foreground">Gerencie seus ganhos e saques</p>
          </div>
          <Dialog open={withdrawDialogOpen} onOpenChange={setWithdrawDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="gradient" className="gap-2">
                <ArrowUpRight className="h-4 w-4" />
                Solicitar Saque
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Solicitar Saque</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="p-4 rounded-lg bg-secondary/50 border border-border">
                  <p className="text-sm text-muted-foreground">Saldo disponível</p>
                  <p className="text-2xl font-bold text-primary">
                    R$ {financeData.availableBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label>Valor do saque</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">R$</span>
                    <Input
                      type="number"
                      placeholder="0,00"
                      className="pl-10"
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                    />
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-xs"
                    onClick={() => setWithdrawAmount(financeData.availableBalance.toString())}
                  >
                    Sacar tudo
                  </Button>
                </div>
                
                <div className="space-y-2">
                  <Label>Tipo de chave PIX</Label>
                  <Select value={pixKeyType} onValueChange={setPixKeyType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cpf">CPF</SelectItem>
                      <SelectItem value="cnpj">CNPJ</SelectItem>
                      <SelectItem value="email">E-mail</SelectItem>
                      <SelectItem value="phone">Telefone</SelectItem>
                      <SelectItem value="random">Chave aleatória</SelectItem>
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
                
                <Button variant="gradient" className="w-full" onClick={handleWithdraw}>
                  Confirmar Saque
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Balance Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card variant="gradient" className="bg-gradient-to-br from-primary/20 to-primary/5">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Saldo Disponível</p>
                  <p className="text-3xl font-bold text-primary mt-1">
                    R$ {financeData.availableBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">Disponível para saque</p>
                </div>
                <div className="p-4 rounded-full bg-primary/10">
                  <Wallet className="h-8 w-8 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card variant="glass">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Saldo Pendente</p>
                  <p className="text-3xl font-bold mt-1">
                    R$ {financeData.pendingBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">Aguardando confirmação</p>
                </div>
                <div className="p-4 rounded-full bg-yellow-500/10">
                  <Clock className="h-8 w-8 text-yellow-500" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card variant="glass">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Sacado</p>
                  <p className="text-3xl font-bold mt-1">
                    R$ {financeData.totalWithdrawn.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">Histórico total</p>
                </div>
                <div className="p-4 rounded-full bg-green-500/10">
                  <TrendingUp className="h-8 w-8 text-green-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Fees Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card variant="glass">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Percent className="h-5 w-5 text-primary" />
                Taxas da Plataforma
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/50">
                  <div>
                    <p className="font-medium">Taxa por transação</p>
                    <p className="text-sm text-muted-foreground">Cobrada em cada venda</p>
                  </div>
                  <Badge variant="secondary">5%</Badge>
                </div>
                <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/50">
                  <div>
                    <p className="font-medium">Total em taxas</p>
                    <p className="text-sm text-muted-foreground">Valor acumulado</p>
                  </div>
                  <p className="font-bold text-destructive">
                    R$ {financeData.platformFees.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card variant="glass">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-primary" />
                Comissões de Afiliados
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/50">
                  <div>
                    <p className="font-medium">Taxa padrão de afiliado</p>
                    <p className="text-sm text-muted-foreground">Configurável por produto</p>
                  </div>
                  <Badge variant="secondary">10-50%</Badge>
                </div>
                <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/50">
                  <div>
                    <p className="font-medium">Total pago a afiliados</p>
                    <p className="text-sm text-muted-foreground">Valor acumulado</p>
                  </div>
                  <p className="font-bold text-primary">
                    R$ {financeData.affiliateFees.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Withdrawal History */}
        <Card variant="glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5 text-primary" />
              Histórico de Saques
            </CardTitle>
          </CardHeader>
          <CardContent>
            {withdrawals.length === 0 ? (
              <div className="py-8 text-center">
                <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Nenhum saque realizado</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left p-4 font-medium text-muted-foreground">Valor</th>
                      <th className="text-left p-4 font-medium text-muted-foreground">Chave PIX</th>
                      <th className="text-left p-4 font-medium text-muted-foreground">Status</th>
                      <th className="text-left p-4 font-medium text-muted-foreground">Solicitado</th>
                      <th className="text-left p-4 font-medium text-muted-foreground">Concluído</th>
                    </tr>
                  </thead>
                  <tbody>
                    {withdrawals.map((withdrawal) => (
                      <tr key={withdrawal.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                        <td className="p-4">
                          <p className="font-semibold">
                            R$ {withdrawal.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </p>
                        </td>
                        <td className="p-4">
                          <p className="text-sm font-mono">{withdrawal.pix_key}</p>
                        </td>
                        <td className="p-4">
                          {getStatusBadge(withdrawal.status)}
                        </td>
                        <td className="p-4">
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(withdrawal.requested_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                          </p>
                        </td>
                        <td className="p-4">
                          <p className="text-sm text-muted-foreground">
                            {withdrawal.completed_at 
                              ? format(new Date(withdrawal.completed_at), "dd/MM/yyyy HH:mm", { locale: ptBR })
                              : "-"
                            }
                          </p>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Finance;
