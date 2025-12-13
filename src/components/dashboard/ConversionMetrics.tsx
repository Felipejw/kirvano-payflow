import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
} from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { format, subDays, startOfDay, endOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";

interface FunnelItem {
  name: string;
  value: number;
  fill: string;
}

interface ConversionDataItem {
  date: string;
  rate: number;
  total: number;
  paid: number;
}

export function ConversionFunnel() {
  const [funnelData, setFunnelData] = useState<FunnelItem[]>([
    { name: "PIX Gerado", value: 0, fill: "hsl(var(--primary))" },
    { name: "Pagos", value: 0, fill: "hsl(var(--accent))" },
  ]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFunnelData();
  }, []);

  const fetchFunnelData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Get all transactions for this seller
    const { data: allTransactions } = await supabase
      .from('transactions')
      .select('status')
      .eq('seller_id', user.id);

    // Get all pix_charges for products owned by this seller
    const { data: products } = await supabase
      .from('products')
      .select('id')
      .eq('seller_id', user.id);

    const productIds = products?.map(p => p.id) || [];

    let pixCharges: any[] = [];
    if (productIds.length > 0) {
      const { data: charges } = await supabase
        .from('pix_charges')
        .select('status')
        .in('product_id', productIds);
      pixCharges = charges || [];
    }

    const pixGenerated = pixCharges.length || allTransactions?.length || 0;
    const paidCount = allTransactions?.filter(t => t.status === 'paid').length || 0;

    setFunnelData([
      { name: "PIX Gerado", value: pixGenerated, fill: "hsl(var(--primary))" },
      { name: "Pagos", value: paidCount, fill: "hsl(var(--accent))" },
    ]);
    setLoading(false);
  };

  const maxValue = funnelData[0].value || 1;
  
  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle>Funil de Conversão</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="h-[200px] flex items-center justify-center">
            <div className="text-muted-foreground">Carregando...</div>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {funnelData.map((item, index) => {
                const percentage = maxValue > 0 ? (item.value / maxValue) * 100 : 0;
                const conversionRate = index > 0 && funnelData[index - 1].value > 0
                  ? ((item.value / funnelData[index - 1].value) * 100).toFixed(1) 
                  : "100";
                
                return (
                  <div key={item.name} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{item.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">{item.value.toLocaleString()}</span>
                        {index > 0 && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                            {conversionRate}%
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="h-8 bg-secondary/50 rounded-lg overflow-hidden relative">
                      <div 
                        className="h-full rounded-lg transition-all duration-500"
                        style={{ 
                          width: `${Math.max(percentage, 2)}%`,
                          background: item.fill
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
            
            <div className="mt-6 pt-4 border-t border-border">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Taxa de Conversão Total</span>
                <span className="text-2xl font-bold gradient-success-text">
                  {funnelData[0].value > 0 
                    ? ((funnelData[1].value / funnelData[0].value) * 100).toFixed(1)
                    : "0.0"}%
                </span>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

export function ConversionChart() {
  const [conversionData, setConversionData] = useState<ConversionDataItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchConversionData();
  }, []);

  const fetchConversionData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const now = new Date();
    const sevenDaysAgo = startOfDay(subDays(now, 6));

    // Get all PIX charges (generated) for the last 7 days
    const { data: pixCharges } = await supabase
      .from('pix_charges')
      .select('id, created_at, status')
      .eq('seller_id', user.id)
      .gte('created_at', sevenDaysAgo.toISOString())
      .lte('created_at', endOfDay(now).toISOString());

    // Get paid transactions for the last 7 days
    const { data: paidTransactions } = await supabase
      .from('transactions')
      .select('id, created_at')
      .eq('seller_id', user.id)
      .eq('status', 'paid')
      .gte('created_at', sevenDaysAgo.toISOString())
      .lte('created_at', endOfDay(now).toISOString());

    // Initialize last 7 days
    const dailyData: Map<string, { total: number; paid: number }> = new Map();
    
    for (let i = 6; i >= 0; i--) {
      const date = subDays(now, i);
      const key = format(date, 'yyyy-MM-dd');
      dailyData.set(key, { total: 0, paid: 0 });
    }

    // Fill with PIX charges (total generated)
    if (pixCharges) {
      pixCharges.forEach(charge => {
        const date = new Date(charge.created_at);
        const key = format(date, 'yyyy-MM-dd');
        if (dailyData.has(key)) {
          const current = dailyData.get(key)!;
          current.total += 1;
          dailyData.set(key, current);
        }
      });
    }

    // Fill with paid transactions
    if (paidTransactions) {
      paidTransactions.forEach(tx => {
        const date = new Date(tx.created_at);
        const key = format(date, 'yyyy-MM-dd');
        if (dailyData.has(key)) {
          const current = dailyData.get(key)!;
          current.paid += 1;
          dailyData.set(key, current);
        }
      });
    }

    // Convert to array format
    const chartData: ConversionDataItem[] = [];
    for (let i = 6; i >= 0; i--) {
      const date = subDays(now, i);
      const key = format(date, 'yyyy-MM-dd');
      const dayData = dailyData.get(key)!;
      const rate = dayData.total > 0 ? (dayData.paid / dayData.total) * 100 : 0;
      
      chartData.push({
        date: format(date, 'dd/MM', { locale: ptBR }),
        rate: parseFloat(rate.toFixed(1)),
        total: dayData.total,
        paid: dayData.paid,
      });
    }

    setConversionData(chartData);
    setLoading(false);
  };

  return (
    <Card className="glass-card lg:col-span-2">
      <CardHeader>
        <CardTitle>Taxa de Conversão (7 dias)</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="h-[300px] flex items-center justify-center">
            <div className="text-muted-foreground">Carregando...</div>
          </div>
        ) : (
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={conversionData}>
                <defs>
                  <linearGradient id="colorRate" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="date" 
                  stroke="hsl(var(--muted-foreground))" 
                  fontSize={12}
                />
                <YAxis 
                  stroke="hsl(var(--muted-foreground))" 
                  fontSize={12}
                  tickFormatter={(value) => `${value}%`}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                  labelStyle={{ color: "hsl(var(--foreground))" }}
                  formatter={(value: number, name: string) => {
                    if (name === "rate") return [`${value}%`, "Taxa de Conversão"];
                    return [value, name];
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="rate"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorRate)"
                  name="rate"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
