import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { format, subDays, startOfDay, endOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";

interface DailyData {
  date: string;
  vendas: number;
}

interface DateRange {
  from: Date;
  to: Date;
}

interface SalesChartProps {
  dateRange?: DateRange;
  selectedProductIds?: string[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card border border-border p-3 rounded-lg shadow-lg">
        <p className="text-sm font-medium mb-1">{label}</p>
        <p className="text-sm text-primary">
          Vendas: R$ {payload[0].value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
        </p>
      </div>
    );
  }
  return null;
};

export function SalesChart({ dateRange, selectedProductIds = [] }: SalesChartProps) {
  const [data, setData] = useState<DailyData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSalesData();
  }, [dateRange, selectedProductIds]);

  const fetchSalesData = async () => {
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
    const dailyData: Map<string, number> = new Map();
    
    for (let i = daysDiff - 1; i >= 0; i--) {
      const date = subDays(now, i);
      const key = format(date, 'yyyy-MM-dd');
      dailyData.set(key, 0);
    }

    // Fill with actual data
    if (transactions) {
      transactions.forEach(tx => {
        const date = new Date(tx.created_at);
        const key = format(date, 'yyyy-MM-dd');
        if (dailyData.has(key)) {
          dailyData.set(key, (dailyData.get(key) || 0) + Number(tx.amount));
        }
      });
    }

    // Convert to array format
    const chartData: DailyData[] = [];
    for (let i = daysDiff - 1; i >= 0; i--) {
      const date = subDays(now, i);
      const key = format(date, 'yyyy-MM-dd');
      chartData.push({
        date: format(date, 'dd/MM', { locale: ptBR }),
        vendas: dailyData.get(key) || 0,
      });
    }

    setData(chartData);
    setLoading(false);
  };

  return (
    <Card variant="glass" className="col-span-full lg:col-span-2">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Receita (Últimos 7 dias)</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="h-[300px] flex items-center justify-center">
            <div className="text-muted-foreground">Carregando...</div>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={data}>
              <defs>
                <linearGradient id="colorVendas" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
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
              <Area 
                type="monotone" 
                dataKey="vendas" 
                stroke="hsl(var(--primary))" 
                strokeWidth={2}
                fillOpacity={1} 
                fill="url(#colorVendas)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
        <div className="flex items-center justify-center gap-6 mt-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-primary" />
            <span className="text-muted-foreground">Vendas</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
