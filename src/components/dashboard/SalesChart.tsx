import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const data = [
  { name: "Jan", vendas: 4000, pix: 2400 },
  { name: "Fev", vendas: 3000, pix: 1398 },
  { name: "Mar", vendas: 2000, pix: 9800 },
  { name: "Abr", vendas: 2780, pix: 3908 },
  { name: "Mai", vendas: 1890, pix: 4800 },
  { name: "Jun", vendas: 2390, pix: 3800 },
  { name: "Jul", vendas: 3490, pix: 4300 },
  { name: "Ago", vendas: 4000, pix: 2400 },
  { name: "Set", vendas: 3000, pix: 1398 },
  { name: "Out", vendas: 5200, pix: 8800 },
  { name: "Nov", vendas: 6780, pix: 9908 },
  { name: "Dez", vendas: 8890, pix: 12800 },
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass-card p-3 border border-border/50">
        <p className="text-sm font-medium mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {entry.name === "vendas" ? "Vendas" : "PIX API"}: R$ {entry.value.toLocaleString('pt-BR')}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export function SalesChart() {
  return (
    <Card variant="glass">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Receita Mensal</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id="colorVendas" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(192 91% 55%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(192 91% 55%)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorPix" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(142 71% 45%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(142 71% 45%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(217 33% 17%)" />
              <XAxis 
                dataKey="name" 
                stroke="hsl(215 20% 55%)" 
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                stroke="hsl(215 20% 55%)" 
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `${value / 1000}k`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="vendas"
                stroke="hsl(192 91% 55%)"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorVendas)"
              />
              <Area
                type="monotone"
                dataKey="pix"
                stroke="hsl(142 71% 45%)"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorPix)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="flex items-center justify-center gap-6 mt-4">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-primary" />
            <span className="text-sm text-muted-foreground">Vendas Diretas</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-accent" />
            <span className="text-sm text-muted-foreground">API PIX</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
