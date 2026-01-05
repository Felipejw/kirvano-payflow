import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { format, subDays, startOfDay, endOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";

interface DailyTicketData {
  date: string;
  ticketMedio: number;
  vendas: number;
}

interface DateRange {
  from: Date;
  to: Date;
}

interface AverageTicketChartProps {
  dateRange?: DateRange;
  selectedProductIds?: string[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card border border-border p-3 rounded-lg shadow-lg">
        <p className="text-sm font-medium mb-1">{label}</p>
        <p className="text-sm text-accent">
          Ticket Médio: R$ {payload[0].value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
        </p>
        <p className="text-xs text-muted-foreground">
          {payload[0].payload.vendas} venda{payload[0].payload.vendas !== 1 ? 's' : ''}
        </p>
      </div>
    );
  }
  return null;
};

export function AverageTicketChart({ dateRange, selectedProductIds = [] }: AverageTicketChartProps) {
  const [data, setData] = useState<DailyTicketData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTicketData();
  }, [dateRange, selectedProductIds]);

  const fetchTicketData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const now = dateRange?.to || new Date();
    const startDate = dateRange?.from || startOfDay(subDays(new Date(), 6));

    let query = supabase
      .from('transactions')
      .select('amount, created_at')
      .eq('seller_id', user.id)
      .eq('status', 'paid')
      .gte('created_at', startOfDay(startDate).toISOString())
      .lte('created_at', endOfDay(now).toISOString());

    if (selectedProductIds.length > 0) {
      query = query.in('product_id', selectedProductIds);
    }

    const { data: transactions } = await query;

    // Calculate days in range
    const daysDiff = Math.ceil((endOfDay(now).getTime() - startOfDay(startDate).getTime()) / (1000 * 60 * 60 * 24));

    // Initialize all days with zero
    const dailyData: Map<string, { total: number; count: number }> = new Map();
    
    for (let i = daysDiff - 1; i >= 0; i--) {
      const date = subDays(now, i);
      const key = format(date, 'yyyy-MM-dd');
      dailyData.set(key, { total: 0, count: 0 });
    }

    // Fill with actual data
    if (transactions) {
      transactions.forEach(tx => {
        const date = new Date(tx.created_at);
        const key = format(date, 'yyyy-MM-dd');
        if (dailyData.has(key)) {
          const current = dailyData.get(key)!;
          dailyData.set(key, { 
            total: current.total + Number(tx.amount), 
            count: current.count + 1 
          });
        }
      });
    }

    // Convert to array format with average calculation
    const chartData: DailyTicketData[] = [];
    for (let i = daysDiff - 1; i >= 0; i--) {
      const date = subDays(now, i);
      const key = format(date, 'yyyy-MM-dd');
      const dayData = dailyData.get(key) || { total: 0, count: 0 };
      chartData.push({
        date: format(date, 'dd/MM', { locale: ptBR }),
        ticketMedio: dayData.count > 0 ? dayData.total / dayData.count : 0,
        vendas: dayData.count,
      });
    }

    setData(chartData);
    setLoading(false);
  };

  return (
    <Card variant="glass">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Ticket Médio (Últimos 7 dias)</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="h-[250px] flex items-center justify-center">
            <div className="text-muted-foreground">Carregando...</div>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={data}>
              <defs>
                <linearGradient id="colorTicket" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--accent))" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="hsl(var(--accent))" stopOpacity={0.3}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
              <XAxis 
                dataKey="date" 
                stroke="hsl(var(--muted-foreground))" 
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                stroke="hsl(var(--muted-foreground))" 
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => value >= 1000 ? `R$ ${(value / 1000).toFixed(0)}k` : `R$ ${value}`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar 
                dataKey="ticketMedio" 
                fill="url(#colorTicket)"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
        <div className="flex items-center justify-center gap-6 mt-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-accent" />
            <span className="text-muted-foreground">Ticket Médio</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}