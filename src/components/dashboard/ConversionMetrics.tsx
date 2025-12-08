import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts";

const funnelData = [
  { name: "Visitantes", value: 10000, fill: "hsl(var(--muted-foreground))" },
  { name: "Checkout", value: 3200, fill: "hsl(var(--primary))" },
  { name: "PIX Gerado", value: 1800, fill: "hsl(var(--chart-3))" },
  { name: "Pagos", value: 1234, fill: "hsl(var(--accent))" },
];

const conversionData = [
  { date: "01/12", rate: 3.2, visitors: 320, sales: 10 },
  { date: "02/12", rate: 4.1, visitors: 410, sales: 17 },
  { date: "03/12", rate: 3.8, visitors: 380, sales: 14 },
  { date: "04/12", rate: 4.5, visitors: 450, sales: 20 },
  { date: "05/12", rate: 5.2, visitors: 520, sales: 27 },
  { date: "06/12", rate: 4.8, visitors: 480, sales: 23 },
  { date: "07/12", rate: 5.5, visitors: 550, sales: 30 },
];

export function ConversionFunnel() {
  const maxValue = funnelData[0].value;
  
  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle>Funil de Conversão</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {funnelData.map((item, index) => {
            const percentage = (item.value / maxValue) * 100;
            const conversionRate = index > 0 
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
                      width: `${percentage}%`,
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
              {((funnelData[3].value / funnelData[0].value) * 100).toFixed(1)}%
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function ConversionChart() {
  return (
    <Card className="glass-card lg:col-span-2">
      <CardHeader>
        <CardTitle>Taxa de Conversão (7 dias)</CardTitle>
      </CardHeader>
      <CardContent>
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
              />
              <Area
                type="monotone"
                dataKey="rate"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorRate)"
                name="Taxa de Conversão"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
