import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  CreditCard,
  Percent,
  AlertCircle
} from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { GatewayCard } from "@/components/finance/GatewayCard";
import { GatewayConfigDialog } from "@/components/finance/GatewayConfigDialog";
import { InvoicesList } from "@/components/finance/InvoicesList";
import { PlatformFeeInfo } from "@/components/finance/PlatformFeeInfo";
import { BlockedBanner } from "@/components/shared/BlockedBanner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Gateway {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  is_active: boolean;
  instructions: string | null;
  required_fields: string[];
}

interface SellerCredential {
  id: string;
  gateway_id: string;
  credentials: Record<string, string>;
  is_active: boolean;
  is_default: boolean;
}

interface Invoice {
  id: string;
  period_start: string;
  period_end: string;
  total_sales: number;
  total_amount: number;
  fee_percentage: number;
  fee_fixed: number;
  fee_total: number;
  status: string;
  due_date: string;
  pix_code: string | null;
  pix_qr_code: string | null;
  paid_at: string | null;
}

interface PlatformSettings {
  fee_percentage: number;
  fee_fixed_per_sale: number;
}

interface SellerBlock {
  id: string;
  is_active: boolean;
  invoice_id: string | null;
}

const Finance = () => {
  const [gateways, setGateways] = useState<Gateway[]>([]);
  const [credentials, setCredentials] = useState<SellerCredential[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [platformSettings, setPlatformSettings] = useState<PlatformSettings>({ 
    fee_percentage: 4, 
    fee_fixed_per_sale: 1 
  });
  const [sellerBlock, setSellerBlock] = useState<SellerBlock | null>(null);
  const [loading, setLoading] = useState(true);
  const [invoicesLoading, setInvoicesLoading] = useState(true);
  
  const [configDialogOpen, setConfigDialogOpen] = useState(false);
  const [selectedGateway, setSelectedGateway] = useState<Gateway | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Fetch platform settings
    const { data: settingsData } = await supabase
      .from('platform_settings')
      .select('fee_percentage, fee_fixed_per_sale')
      .single();
    
    if (settingsData) {
      setPlatformSettings({
        fee_percentage: settingsData.fee_percentage || 4,
        fee_fixed_per_sale: settingsData.fee_fixed_per_sale || 1,
      });
    }

    // Fetch available gateways
    const { data: gatewaysData } = await supabase
      .from('payment_gateways')
      .select('*')
      .eq('is_active', true)
      .order('name');
    
    if (gatewaysData) {
      const mapped = gatewaysData.map((g) => ({
        ...g,
        instructions: g.instructions || null,
        logo_url: g.logo_url || null,
        required_fields: Array.isArray(g.required_fields) ? g.required_fields as string[] : [],
      }));
      setGateways(mapped);
    }

    // Fetch seller's credentials
    const { data: credentialsData } = await supabase
      .from('seller_gateway_credentials')
      .select('*')
      .eq('user_id', user.id);
    
    if (credentialsData) {
      const mapped = credentialsData.map((c) => ({
        ...c,
        credentials: (c.credentials as Record<string, string>) || {},
      }));
      setCredentials(mapped);
    }

    // Fetch seller's block status
    const { data: blockData } = await supabase
      .from('seller_blocks')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .maybeSingle();
    
    setSellerBlock(blockData);

    // Fetch invoices
    setInvoicesLoading(true);
    const { data: invoicesData } = await supabase
      .from('platform_invoices')
      .select('*')
      .eq('user_id', user.id)
      .order('period_end', { ascending: false });
    
    if (invoicesData) {
      setInvoices(invoicesData as Invoice[]);
    }
    setInvoicesLoading(false);

    setLoading(false);
  };

  const handleConfigure = (gateway: Gateway) => {
    setSelectedGateway(gateway);
    setConfigDialogOpen(true);
  };

  const handleSetDefault = async (gatewayId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Remove default from all
    await supabase
      .from('seller_gateway_credentials')
      .update({ is_default: false })
      .eq('user_id', user.id);

    // Set new default
    const { error } = await supabase
      .from('seller_gateway_credentials')
      .update({ is_default: true })
      .eq('user_id', user.id)
      .eq('gateway_id', gatewayId);

    if (error) {
      toast.error("Erro ao definir gateway padrão");
    } else {
      toast.success("Gateway padrão atualizado!");
      fetchData();
    }
  };

  const getCredentialForGateway = (gatewayId: string) => {
    return credentials.find((c) => c.gateway_id === gatewayId);
  };

  const getExistingCredentials = () => {
    if (!selectedGateway) return undefined;
    const cred = getCredentialForGateway(selectedGateway.id);
    return cred?.credentials;
  };

  // Get invoice info for blocked banner
  const getBlockedInvoiceInfo = () => {
    if (!sellerBlock?.invoice_id) return {};
    const invoice = invoices.find((i) => i.id === sellerBlock.invoice_id);
    if (!invoice) return {};
    return {
      invoiceAmount: invoice.fee_total,
      invoicePeriod: `${format(new Date(invoice.period_start), "dd/MM", { locale: ptBR })} - ${format(new Date(invoice.period_end), "dd/MM", { locale: ptBR })}`,
      dueDate: format(new Date(invoice.due_date), "dd/MM/yyyy", { locale: ptBR }),
    };
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Blocked Banner */}
        {sellerBlock && (
          <BlockedBanner {...getBlockedInvoiceInfo()} />
        )}

        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-bold">Financeiro</h1>
          <p className="text-muted-foreground">Configure suas formas de pagamento e acompanhe faturas</p>
        </div>

        {/* Gateways Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-primary" />
              Formas de Pagamento
            </CardTitle>
            <CardDescription>
              Configure sua forma de recebimento. O dinheiro das vendas vai diretamente para sua conta!
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="py-8 text-center text-muted-foreground">Carregando...</div>
            ) : gateways.length === 0 ? (
              <div className="py-8 text-center">
                <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Nenhum gateway disponível</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {gateways.map((gateway) => (
                  <GatewayCard
                    key={gateway.id}
                    gateway={gateway}
                    credential={getCredentialForGateway(gateway.id)}
                    onConfigure={handleConfigure}
                    onSetDefault={handleSetDefault}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Platform Fee Info */}
        <PlatformFeeInfo 
          feePercentage={platformSettings.fee_percentage} 
          feeFixed={platformSettings.fee_fixed_per_sale} 
        />

        {/* Invoices List */}
        <InvoicesList invoices={invoices} loading={invoicesLoading} />

        {/* Gateway Config Dialog */}
        <GatewayConfigDialog
          gateway={selectedGateway}
          open={configDialogOpen}
          onOpenChange={setConfigDialogOpen}
          existingCredentials={getExistingCredentials()}
          onSaved={fetchData}
        />
      </div>
    </DashboardLayout>
  );
};

export default Finance;
