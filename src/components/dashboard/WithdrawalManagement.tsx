import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
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
  status: "pending" | "processing" | "completed" | "rejected";
  pixKey: string;
  requestedAt: string;
  completedAt?: string;
}

const mockWithdrawals: WithdrawalRequest[] = [
  { id: "1", amount: 5000, status: "completed", pixKey: "email@example.com", requestedAt: "2024-12-01", completedAt: "2024-12-02" },
  { id: "2", amount: 3500, status: "processing", pixKey: "email@example.com", requestedAt: "2024-12-05" },
  { id: "3", amount: 2000, status: "pending", pixKey: "email@example.com", requestedAt: "2024-12-07" },
];

export function WithdrawalManagement() {
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [pixKeyType, setPixKeyType] = useState("");
  const [pixKey, setPixKey] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();

  const availableBalance = 15680.50;
  const pendingBalance = 5500.00;
  const withdrawnTotal = 45000.00;

  const handleWithdraw = () => {
    const amount = parseFloat(withdrawAmount);
    if (!amount || amount <= 0) {
      toast({
        title: "Valor inválido",
        description: "Informe um valor válido para saque.",
        variant: "destructive",
      });
      return;
    }

    if (amount > availableBalance) {
      toast({
        title: "Saldo insuficiente",
        description: "O valor solicitado excede seu saldo disponível.",
        variant: "destructive",
      });
      return;
    }

    if (!pixKey) {
      toast({
        title: "Chave PIX obrigatória",
        description: "Informe sua chave PIX para receber o saque.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Solicitação enviada!",
      description: `Saque de R$ ${amount.toFixed(2)} solicitado. Prazo: 1-2 dias úteis.`,
    });
    setDialogOpen(false);
    setWithdrawAmount("");
    setPixKey("");
  };

  const getStatusBadge = (status: WithdrawalRequest["status"]) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-accent/20 text-accent">Concluído</Badge>;
      case "processing":
        return <Badge className="bg-primary/20 text-primary">Processando</Badge>;
      case "pending":
        return <Badge className="bg-yellow-500/20 text-yellow-500">Pendente</Badge>;
      case "rejected":
        return <Badge className="bg-destructive/20 text-destructive">Rejeitado</Badge>;
    }
  };

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
                  R$ {availableBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
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
                  R$ {pendingBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
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
                  R$ {withdrawnTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
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
              Saldo disponível: R$ {availableBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
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
                  min="10"
                  max={availableBalance}
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
                  >
                    R$ {value}
                  </Button>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setWithdrawAmount(availableBalance.toString())}
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
                Saques são processados em até 2 dias úteis. Taxa de 2% será aplicada sobre o valor.
              </p>
            </div>

            <Button onClick={handleWithdraw} className="w-full btn-success-gradient">
              Confirmar Saque
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
          <div className="space-y-4">
            {mockWithdrawals.map((withdrawal) => (
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
                      R$ {withdrawal.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      {new Date(withdrawal.requestedAt).toLocaleDateString('pt-BR')}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  {getStatusBadge(withdrawal.status)}
                  {withdrawal.completedAt && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Concluído em {new Date(withdrawal.completedAt).toLocaleDateString('pt-BR')}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
