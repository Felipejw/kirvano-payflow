import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Eye, Mail, User } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { ClientData } from "@/pages/Clients";

interface ClientsTableProps {
  clients: ClientData[];
  isLoading: boolean;
  onViewClient: (client: ClientData) => void;
}

export function ClientsTable({ clients, isLoading, onViewClient }: ClientsTableProps) {
  if (isLoading) {
    return (
      <div className="rounded-lg border border-border/50 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30">
              <TableHead>Cliente</TableHead>
              <TableHead>CPF</TableHead>
              <TableHead className="text-center">Pedidos</TableHead>
              <TableHead className="text-right">Total Gasto</TableHead>
              <TableHead>Último Pedido</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[...Array(5)].map((_, i) => (
              <TableRow key={i}>
                <TableCell><Skeleton className="h-10 w-48" /></TableCell>
                <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                <TableCell><Skeleton className="h-4 w-12 mx-auto" /></TableCell>
                <TableCell><Skeleton className="h-4 w-20 ml-auto" /></TableCell>
                <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                <TableCell><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  if (clients.length === 0) {
    return (
      <div className="rounded-lg border border-border/50 p-12 text-center">
        <User className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
        <h3 className="text-lg font-medium mb-2">Nenhum cliente encontrado</h3>
        <p className="text-muted-foreground">
          Os clientes que interagirem com seus produtos aparecerão aqui.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border/50 overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/30">
            <TableHead>Cliente</TableHead>
            <TableHead>CPF</TableHead>
            <TableHead className="text-center">Pedidos</TableHead>
            <TableHead className="text-right">Total Gasto</TableHead>
            <TableHead>Último Pedido</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {clients.map((client) => (
            <TableRow key={client.buyer_email} className="hover:bg-muted/20">
              <TableCell>
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">
                      {client.buyer_name || "Nome não informado"}
                    </p>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Mail className="h-3 w-3" />
                      {client.buyer_email}
                    </div>
                  </div>
                </div>
              </TableCell>
              <TableCell className="font-mono text-sm">
                {client.buyer_cpf || "-"}
              </TableCell>
              <TableCell className="text-center">
                <span className="font-medium">{client.paid_orders}</span>
                <span className="text-muted-foreground">/{client.total_orders}</span>
              </TableCell>
              <TableCell className="text-right font-medium">
                {client.total_spent.toLocaleString("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                })}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {format(new Date(client.last_order), "dd/MM/yyyy", { locale: ptBR })}
              </TableCell>
              <TableCell>
                {client.paid_orders > 0 ? (
                  <Badge className="bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20">
                    Comprou
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="bg-amber-500/10 text-amber-500">
                    Abandonou
                  </Badge>
                )}
              </TableCell>
              <TableCell className="text-right">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onViewClient(client)}
                >
                  <Eye className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
