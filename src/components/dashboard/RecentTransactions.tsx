import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, QrCode } from "lucide-react";

const transactions = [
  {
    id: "TXN001",
    customer: "Maria Santos",
    product: "Curso de Marketing Digital",
    amount: "R$ 497,00",
    status: "completed",
    method: "PIX",
    date: "Há 5 min",
  },
  {
    id: "TXN002",
    customer: "Carlos Oliveira",
    product: "E-book Vendas Online",
    amount: "R$ 47,00",
    status: "completed",
    method: "PIX",
    date: "Há 12 min",
  },
  {
    id: "TXN003",
    customer: "Ana Paula",
    product: "Mentoria Premium",
    amount: "R$ 1.997,00",
    status: "pending",
    method: "PIX",
    date: "Há 18 min",
  },
  {
    id: "TXN004",
    customer: "Roberto Lima",
    product: "Acesso Vitalício",
    amount: "R$ 997,00",
    status: "completed",
    method: "PIX",
    date: "Há 25 min",
  },
  {
    id: "TXN005",
    customer: "Fernanda Costa",
    product: "Pack Templates",
    amount: "R$ 127,00",
    status: "failed",
    method: "PIX",
    date: "Há 32 min",
  },
];

const statusConfig = {
  completed: { label: "Aprovado", variant: "success" as const },
  pending: { label: "Pendente", variant: "warning" as const },
  failed: { label: "Falhou", variant: "destructive" as const },
};

export function RecentTransactions() {
  return (
    <Card variant="glass" className="col-span-2">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-semibold">Transações Recentes</CardTitle>
        <Button variant="ghost" size="sm" className="gap-2">
          Ver todas <ArrowRight className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Cliente</th>
                <th>Produto</th>
                <th>Valor</th>
                <th>Status</th>
                <th>Método</th>
                <th>Data</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx) => (
                <tr key={tx.id} className="group">
                  <td className="font-mono text-sm text-muted-foreground">{tx.id}</td>
                  <td className="font-medium">{tx.customer}</td>
                  <td className="text-muted-foreground max-w-[200px] truncate">{tx.product}</td>
                  <td className="font-semibold">{tx.amount}</td>
                  <td>
                    <Badge variant={statusConfig[tx.status as keyof typeof statusConfig].variant}>
                      {statusConfig[tx.status as keyof typeof statusConfig].label}
                    </Badge>
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <QrCode className="h-4 w-4 text-primary" />
                      <span className="text-sm">{tx.method}</span>
                    </div>
                  </td>
                  <td className="text-sm text-muted-foreground">{tx.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
