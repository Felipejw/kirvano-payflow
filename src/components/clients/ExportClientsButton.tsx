import { useState } from "react";
import { Download, FileSpreadsheet, Users } from "lucide-react";
import * as XLSX from "xlsx";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import type { ClientData } from "@/pages/Clients";

interface ExportClientsButtonProps {
  clients: ClientData[];
}

export function ExportClientsButton({ clients }: ExportClientsButtonProps) {
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  const exportClientsOnly = () => {
    setIsExporting(true);
    try {
      const data = clients.map((client) => ({
        Nome: client.buyer_name || "Não informado",
        Email: client.buyer_email,
        CPF: client.buyer_cpf || "Não informado",
        "Total de Pedidos": client.total_orders,
        "Pedidos Pagos": client.paid_orders,
        "Total Gasto (R$)": client.total_spent.toFixed(2),
        "Ticket Médio (R$)":
          client.paid_orders > 0
            ? (client.total_spent / client.paid_orders).toFixed(2)
            : "0.00",
        Status: client.paid_orders > 0 ? "Comprou" : "Abandonou",
        "Primeiro Contato": format(new Date(client.first_order), "dd/MM/yyyy", {
          locale: ptBR,
        }),
        "Último Pedido": format(new Date(client.last_order), "dd/MM/yyyy", {
          locale: ptBR,
        }),
      }));

      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Clientes");

      // Auto-size columns
      const colWidths = Object.keys(data[0] || {}).map((key) => ({
        wch: Math.max(key.length, 15),
      }));
      ws["!cols"] = colWidths;

      const fileName = `clientes_${format(new Date(), "yyyy-MM-dd_HH-mm")}.xlsx`;
      XLSX.writeFile(wb, fileName);

      toast({
        title: "Exportação concluída",
        description: `${clients.length} clientes exportados com sucesso.`,
      });
    } catch (error) {
      toast({
        title: "Erro na exportação",
        description: "Não foi possível exportar os dados.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const exportWithHistory = () => {
    setIsExporting(true);
    try {
      // Sheet 1: Client Summary
      const clientsData = clients.map((client) => ({
        Nome: client.buyer_name || "Não informado",
        Email: client.buyer_email,
        CPF: client.buyer_cpf || "Não informado",
        "Total de Pedidos": client.total_orders,
        "Pedidos Pagos": client.paid_orders,
        "Total Gasto (R$)": client.total_spent.toFixed(2),
        "Ticket Médio (R$)":
          client.paid_orders > 0
            ? (client.total_spent / client.paid_orders).toFixed(2)
            : "0.00",
        Status: client.paid_orders > 0 ? "Comprou" : "Abandonou",
        "Primeiro Contato": format(new Date(client.first_order), "dd/MM/yyyy", {
          locale: ptBR,
        }),
        "Último Pedido": format(new Date(client.last_order), "dd/MM/yyyy", {
          locale: ptBR,
        }),
      }));

      // Sheet 2: All Orders
      const ordersData: any[] = [];
      clients.forEach((client) => {
        client.orders.forEach((order) => {
          ordersData.push({
            "Email do Cliente": client.buyer_email,
            "Nome do Cliente": client.buyer_name || "Não informado",
            CPF: client.buyer_cpf || "Não informado",
            Produto: order.product_name,
            "Valor (R$)": order.amount.toFixed(2),
            Status:
              order.status === "paid"
                ? "Pago"
                : order.status === "pending"
                ? "Pendente"
                : order.status === "expired"
                ? "Expirado"
                : order.status,
            "Data do Pedido": format(new Date(order.created_at), "dd/MM/yyyy HH:mm", {
              locale: ptBR,
            }),
            "Data do Pagamento": order.paid_at
              ? format(new Date(order.paid_at), "dd/MM/yyyy HH:mm", { locale: ptBR })
              : "-",
          });
        });
      });

      const wb = XLSX.utils.book_new();

      // Add clients sheet
      const wsClients = XLSX.utils.json_to_sheet(clientsData);
      wsClients["!cols"] = Object.keys(clientsData[0] || {}).map((key) => ({
        wch: Math.max(key.length, 15),
      }));
      XLSX.utils.book_append_sheet(wb, wsClients, "Clientes");

      // Add orders sheet
      if (ordersData.length > 0) {
        const wsOrders = XLSX.utils.json_to_sheet(ordersData);
        wsOrders["!cols"] = Object.keys(ordersData[0] || {}).map((key) => ({
          wch: Math.max(key.length, 15),
        }));
        XLSX.utils.book_append_sheet(wb, wsOrders, "Histórico de Pedidos");
      }

      const fileName = `clientes_completo_${format(new Date(), "yyyy-MM-dd_HH-mm")}.xlsx`;
      XLSX.writeFile(wb, fileName);

      toast({
        title: "Exportação concluída",
        description: `${clients.length} clientes e ${ordersData.length} pedidos exportados.`,
      });
    } catch (error) {
      toast({
        title: "Erro na exportação",
        description: "Não foi possível exportar os dados.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button disabled={isExporting || clients.length === 0}>
          <Download className="h-4 w-4 mr-2" />
          {isExporting ? "Exportando..." : "Exportar"}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={exportClientsOnly}>
          <Users className="h-4 w-4 mr-2" />
          Exportar Clientes
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportWithHistory}>
          <FileSpreadsheet className="h-4 w-4 mr-2" />
          Exportar com Histórico Completo
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
