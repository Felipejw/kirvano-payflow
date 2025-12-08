import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Search, 
  Filter,
  Download,
  QrCode,
  ArrowUpRight,
  ArrowDownLeft,
  Clock,
  CheckCircle,
  XCircle,
  RefreshCw
} from "lucide-react";

const transactions = [
  {
    id: "TXN-2024-001234",
    type: "sale",
    customer: "Maria Santos",
    email: "maria@email.com",
    product: "Curso de Marketing Digital Pro",
    amount: "R$ 497,00",
    fee: "R$ 7,45",
    net: "R$ 489,55",
    status: "completed",
    method: "PIX",
    date: "15 Jan 2024, 14:32",
  },
  {
    id: "TXN-2024-001235",
    type: "sale",
    customer: "Carlos Oliveira",
    email: "carlos@email.com",
    product: "E-book Vendas Automatizadas",
    amount: "R$ 47,00",
    fee: "R$ 0,70",
    net: "R$ 46,30",
    status: "completed",
    method: "PIX",
    date: "15 Jan 2024, 14:18",
  },
  {
    id: "TXN-2024-001236",
    type: "sale",
    customer: "Ana Paula Silva",
    email: "ana@email.com",
    product: "Mentoria Business Elite",
    amount: "R$ 1.997,00",
    fee: "R$ 29,95",
    net: "R$ 1.967,05",
    status: "pending",
    method: "PIX",
    date: "15 Jan 2024, 13:45",
  },
  {
    id: "TXN-2024-001237",
    type: "refund",
    customer: "Roberto Lima",
    email: "roberto@email.com",
    product: "Pack Templates Premium",
    amount: "R$ 127,00",
    fee: "R$ 0,00",
    net: "-R$ 127,00",
    status: "completed",
    method: "PIX",
    date: "15 Jan 2024, 12:30",
  },
  {
    id: "TXN-2024-001238",
    type: "sale",
    customer: "Fernanda Costa",
    email: "fernanda@email.com",
    product: "Curso de Marketing Digital Pro",
    amount: "R$ 497,00",
    fee: "R$ 7,45",
    net: "R$ 489,55",
    status: "failed",
    method: "PIX",
    date: "15 Jan 2024, 11:15",
  },
];

const statusConfig = {
  completed: { 
    label: "Aprovado", 
    variant: "success" as const,
    icon: CheckCircle 
  },
  pending: { 
    label: "Pendente", 
    variant: "warning" as const,
    icon: Clock 
  },
  failed: { 
    label: "Falhou", 
    variant: "destructive" as const,
    icon: XCircle 
  },
  refunded: { 
    label: "Reembolsado", 
    variant: "secondary" as const,
    icon: RefreshCw 
  },
};

const Transactions = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Transações</h1>
            <p className="text-muted-foreground">Histórico completo de pagamentos</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" className="gap-2">
              <Download className="h-4 w-4" />
              Exportar
            </Button>
            <Button variant="gradient" className="gap-2">
              <QrCode className="h-4 w-4" />
              Nova Cobrança
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card variant="glass">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-accent/10">
                  <ArrowDownLeft className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Recebido Hoje</p>
                  <p className="text-xl font-bold">R$ 3.456,00</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card variant="glass">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Clock className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Pendente</p>
                  <p className="text-xl font-bold">R$ 1.997,00</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card variant="glass">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-destructive/10">
                  <ArrowUpRight className="h-5 w-5 text-destructive" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Reembolsos</p>
                  <p className="text-xl font-bold">R$ 127,00</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card variant="glass">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-yellow-500/10">
                  <QrCode className="h-5 w-5 text-yellow-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Transações PIX</p>
                  <p className="text-xl font-bold">1.234</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card variant="glass">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Buscar por ID, cliente, email..." 
                  className="pl-10"
                />
              </div>
              <Button variant="outline" className="gap-2">
                <Filter className="h-4 w-4" />
                Filtros
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Transactions Table */}
        <Card variant="glass">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Cliente</th>
                    <th>Produto</th>
                    <th>Valor</th>
                    <th>Taxa</th>
                    <th>Líquido</th>
                    <th>Status</th>
                    <th>Data</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((tx) => {
                    const StatusIcon = statusConfig[tx.status as keyof typeof statusConfig].icon;
                    return (
                      <tr key={tx.id} className="group cursor-pointer">
                        <td className="font-mono text-sm text-primary">{tx.id}</td>
                        <td>
                          <div>
                            <p className="font-medium">{tx.customer}</p>
                            <p className="text-xs text-muted-foreground">{tx.email}</p>
                          </div>
                        </td>
                        <td className="max-w-[200px]">
                          <p className="truncate">{tx.product}</p>
                        </td>
                        <td className="font-semibold">{tx.amount}</td>
                        <td className="text-muted-foreground">{tx.fee}</td>
                        <td className={tx.type === "refund" ? "text-destructive" : "text-accent"}>
                          {tx.net}
                        </td>
                        <td>
                          <Badge 
                            variant={statusConfig[tx.status as keyof typeof statusConfig].variant}
                            className="gap-1"
                          >
                            <StatusIcon className="h-3 w-3" />
                            {statusConfig[tx.status as keyof typeof statusConfig].label}
                          </Badge>
                        </td>
                        <td className="text-sm text-muted-foreground whitespace-nowrap">
                          {tx.date}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Transactions;
