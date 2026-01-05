import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, QrCode, Inbox } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Transaction {
  id: string;
  amount: number;
  status: string;
  created_at: string;
  charge?: {
    buyer_name: string;
    buyer_email: string;
  };
  product?: {
    name: string;
  };
}

const statusConfig = {
  paid: { label: "Aprovado", variant: "success" as const },
  pending: { label: "Pendente", variant: "warning" as const },
  expired: { label: "Expirado", variant: "destructive" as const },
  cancelled: { label: "Cancelado", variant: "destructive" as const },
};

interface RecentTransactionsProps {
  selectedProductIds?: string[];
}

export function RecentTransactions({ selectedProductIds = [] }: RecentTransactionsProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTransactions();
  }, [selectedProductIds]);

  const fetchTransactions = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    let query = supabase
      .from('transactions')
      .select(`
        id,
        amount,
        status,
        created_at,
        pix_charges (
          buyer_name,
          buyer_email
        ),
        products (
          name
        )
      `)
      .eq('seller_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5);

    if (selectedProductIds.length > 0) {
      query = query.in('product_id', selectedProductIds);
    }

    const { data, error } = await query;

    if (!error && data) {
      const formattedData = data.map((tx: any) => ({
        id: tx.id,
        amount: tx.amount,
        status: tx.status,
        created_at: tx.created_at,
        charge: tx.pix_charges,
        product: tx.products,
      }));
      setTransactions(formattedData);
    }
    
    setLoading(false);
  };

  if (loading) {
    return (
      <Card variant="glass" className="col-span-full lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Transações Recentes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-secondary/30 rounded-lg animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (transactions.length === 0) {
    return (
      <Card variant="glass" className="col-span-full lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Transações Recentes</CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8">
          <Inbox className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground">Nenhuma transação ainda</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card variant="glass" className="col-span-full lg:col-span-2">
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
                <th className="hidden sm:table-cell">ID</th>
                <th>Cliente</th>
                <th className="hidden md:table-cell">Produto</th>
                <th>Valor</th>
                <th>Status</th>
                <th className="hidden sm:table-cell">Método</th>
                <th className="hidden lg:table-cell">Data</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx) => (
                <tr key={tx.id} className="group">
                  <td className="font-mono text-sm text-muted-foreground hidden sm:table-cell">
                    {tx.id.slice(0, 8)}
                  </td>
                  <td className="font-medium">
                    <div>
                      <p className="truncate max-w-[120px] sm:max-w-none">
                        {tx.charge?.buyer_name || 'N/A'}
                      </p>
                      <p className="text-xs text-muted-foreground truncate max-w-[120px] sm:hidden">
                        {tx.product?.name || 'Produto'}
                      </p>
                    </div>
                  </td>
                  <td className="text-muted-foreground max-w-[200px] truncate hidden md:table-cell">
                    {tx.product?.name || 'Produto removido'}
                  </td>
                  <td className="font-semibold whitespace-nowrap">
                    R$ {Number(tx.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </td>
                  <td>
                    <Badge variant={statusConfig[tx.status as keyof typeof statusConfig]?.variant || "secondary"}>
                      {statusConfig[tx.status as keyof typeof statusConfig]?.label || tx.status}
                    </Badge>
                  </td>
                  <td className="hidden sm:table-cell">
                    <div className="flex items-center gap-2">
                      <QrCode className="h-4 w-4 text-primary" />
                      <span className="text-sm">PIX</span>
                    </div>
                  </td>
                  <td className="text-sm text-muted-foreground hidden lg:table-cell whitespace-nowrap">
                    {formatDistanceToNow(new Date(tx.created_at), { addSuffix: true, locale: ptBR })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}