import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ClientStats } from "@/components/clients/ClientStats";
import { ClientsTable } from "@/components/clients/ClientsTable";
import { ClientDetailDialog } from "@/components/clients/ClientDetailDialog";
import { ExportClientsButton } from "@/components/clients/ExportClientsButton";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search } from "lucide-react";

export interface ClientData {
  buyer_email: string;
  buyer_name: string | null;
  buyer_cpf: string | null;
  buyer_phone: string | null;
  total_orders: number;
  paid_orders: number;
  total_spent: number;
  last_order: string;
  first_order: string;
  orders: OrderData[];
  products_purchased: string[];
}

export interface OrderData {
  id: string;
  amount: number;
  status: string;
  created_at: string;
  paid_at: string | null;
  product_name: string;
  product_id: string;
}

export default function Clients() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [productFilter, setProductFilter] = useState<string>("all");
  const [selectedClient, setSelectedClient] = useState<ClientData | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);

  // Fetch all charges for seller by seller_id
  const { data: chargesData, isLoading } = useQuery({
    queryKey: ["seller-clients", user?.id],
    queryFn: async () => {
      if (!user?.id) return { charges: [], products: [] };

      // Fetch products for name mapping
      const { data: products } = await supabase
        .from("products")
        .select("id, name")
        .eq("seller_id", user.id);

      const productMap = Object.fromEntries((products || []).map((p) => [p.id, p.name]));

      // Fetch charges by seller_id (includes all charges)
      const { data: charges, error } = await supabase
        .from("pix_charges")
        .select("*")
        .eq("seller_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      return {
        charges: (charges || []).map((charge) => ({
          ...charge,
          product_name: charge.product_id ? (productMap[charge.product_id] || "Produto não especificado") : "Produto não especificado",
        })),
        products: products || []
      };
    },
    enabled: !!user?.id,
  });

  const chargesList = chargesData?.charges || [];
  const productsList = chargesData?.products || [];

  // Aggregate clients from charges
  const clients = useMemo(() => {
    if (!chargesList || chargesList.length === 0) return [];

    const clientMap = new Map<string, ClientData>();

    chargesList.forEach((charge: any) => {
      const email = charge.buyer_email;
      if (!email) return;

      const existing = clientMap.get(email);
      const order: OrderData = {
        id: charge.id,
        amount: Number(charge.amount),
        status: charge.status,
        created_at: charge.created_at,
        paid_at: charge.paid_at,
        product_name: charge.product_name,
        product_id: charge.product_id || "",
      };

      if (existing) {
        existing.total_orders += 1;
        existing.paid_orders += charge.status === "paid" ? 1 : 0;
        existing.total_spent += charge.status === "paid" ? Number(charge.amount) : 0;
        if (new Date(charge.created_at) > new Date(existing.last_order)) {
          existing.last_order = charge.created_at;
        }
        if (new Date(charge.created_at) < new Date(existing.first_order)) {
          existing.first_order = charge.created_at;
        }
        existing.orders.push(order);
        if (charge.status === "paid" && charge.product_id && !existing.products_purchased.includes(charge.product_id)) {
          existing.products_purchased.push(charge.product_id);
        }
        // Update phone if not set
        if (!existing.buyer_phone && charge.buyer_phone) {
          existing.buyer_phone = charge.buyer_phone;
        }
      } else {
        clientMap.set(email, {
          buyer_email: email,
          buyer_name: charge.buyer_name,
          buyer_cpf: charge.buyer_cpf,
          buyer_phone: charge.buyer_phone,
          total_orders: 1,
          paid_orders: charge.status === "paid" ? 1 : 0,
          total_spent: charge.status === "paid" ? Number(charge.amount) : 0,
          last_order: charge.created_at,
          first_order: charge.created_at,
          orders: [order],
          products_purchased: charge.status === "paid" && charge.product_id ? [charge.product_id] : [],
        });
      }
    });

    return Array.from(clientMap.values()).sort(
      (a, b) => new Date(b.last_order).getTime() - new Date(a.last_order).getTime()
    );
  }, [chargesList]);

  // Filter clients
  const filteredClients = useMemo(() => {
    return clients.filter((client) => {
      const matchesSearch =
        searchTerm === "" ||
        client.buyer_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.buyer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.buyer_cpf?.includes(searchTerm) ||
        client.buyer_phone?.includes(searchTerm);

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "paid" && client.paid_orders > 0) ||
        (statusFilter === "abandoned" && client.paid_orders === 0);

      const matchesProduct =
        productFilter === "all" ||
        client.products_purchased.includes(productFilter);

      return matchesSearch && matchesStatus && matchesProduct;
    });
  }, [clients, searchTerm, statusFilter, productFilter]);

  const handleViewClient = (client: ClientData) => {
    setSelectedClient(client);
    setDetailDialogOpen(true);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Clientes</h1>
            <p className="text-muted-foreground">
              Gerencie e acompanhe todos os seus clientes
            </p>
          </div>
          <ExportClientsButton clients={filteredClients} />
        </div>

        {/* Stats */}
        <ClientStats clients={clients} />

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, email ou CPF..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Filtrar por status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os clientes</SelectItem>
              <SelectItem value="paid">Compraram</SelectItem>
              <SelectItem value="abandoned">Abandonaram</SelectItem>
            </SelectContent>
          </Select>
          <Select value={productFilter} onValueChange={setProductFilter}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Filtrar por produto" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os produtos</SelectItem>
              {productsList.map((product: any) => (
                <SelectItem key={product.id} value={product.id}>
                  {product.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <ClientsTable
          clients={filteredClients}
          isLoading={isLoading}
          onViewClient={handleViewClient}
        />

        {/* Detail Dialog */}
        <ClientDetailDialog
          client={selectedClient}
          open={detailDialogOpen}
          onOpenChange={setDetailDialogOpen}
        />
      </div>
    </DashboardLayout>
  );
}
