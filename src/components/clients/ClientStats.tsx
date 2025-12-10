import { Users, ShoppingBag, UserX, DollarSign } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { ClientData } from "@/pages/Clients";

interface ClientStatsProps {
  clients: ClientData[];
}

export function ClientStats({ clients }: ClientStatsProps) {
  const totalClients = clients.length;
  const buyingClients = clients.filter((c) => c.paid_orders > 0).length;
  const abandonedClients = clients.filter((c) => c.paid_orders === 0).length;
  const totalRevenue = clients.reduce((sum, c) => sum + c.total_spent, 0);

  const stats = [
    {
      title: "Total de Clientes",
      value: totalClients,
      icon: Users,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      title: "Compraram",
      value: buyingClients,
      icon: ShoppingBag,
      color: "text-emerald-500",
      bgColor: "bg-emerald-500/10",
    },
    {
      title: "Abandonaram",
      value: abandonedClients,
      icon: UserX,
      color: "text-amber-500",
      bgColor: "bg-amber-500/10",
    },
    {
      title: "Total Gasto",
      value: totalRevenue.toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
      }),
      icon: DollarSign,
      color: "text-cyan-500",
      bgColor: "bg-cyan-500/10",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <Card key={stat.title} className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-xl ${stat.bgColor}`}>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{stat.title}</p>
                <p className="text-xl font-bold">{stat.value}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
