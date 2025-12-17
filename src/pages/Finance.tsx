import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { InvoicesList } from "@/components/finance/InvoicesList";
import { PlatformFeeInfo } from "@/components/finance/PlatformFeeInfo";
import { CurrentPeriodFeeCard } from "@/components/finance/CurrentPeriodFeeCard";
import { BlockedBanner } from "@/components/shared/BlockedBanner";
import { format, startOfWeek, endOfWeek, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

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
  created_at: string;
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
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [platformSettings, setPlatformSettings] = useState<PlatformSettings>({ 
    fee_percentage: 4, 
    fee_fixed_per_sale: 1 
  });
  const [sellerBlock, setSellerBlock] = useState<SellerBlock | null>(null);
  const [loading, setLoading] = useState(true);
  const [invoicesLoading, setInvoicesLoading] = useState(true);

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
      // Remove duplicates by keeping only one invoice per week (period_start to period_end)
      // Priority: paid > pending > overdue > others
      // If same status, keep the most recent (by created_at)
      const statusPriority: Record<string, number> = {
        'paid': 1,
        'pending': 2,
        'overdue': 3,
        'blocked': 4,
      };

      const uniqueInvoices = invoicesData.reduce((acc: Invoice[], invoice) => {
        // Create a unique key for the week period
        const weekKey = `${invoice.period_start}-${invoice.period_end}`;
        
        const existingIndex = acc.findIndex(
          (i) => `${i.period_start}-${i.period_end}` === weekKey
        );

        if (existingIndex === -1) {
          // No existing invoice for this period, add it
          acc.push(invoice as Invoice);
        } else {
          // Compare and keep the better one
          const existing = acc[existingIndex];
          const existingPriority = statusPriority[existing.status] || 5;
          const newPriority = statusPriority[invoice.status] || 5;

          // Keep the one with higher priority (lower number)
          // If same priority, keep the more recent one
          if (newPriority < existingPriority || 
              (newPriority === existingPriority && 
               new Date(invoice.created_at || 0) > new Date(existing.created_at || 0))) {
            acc[existingIndex] = invoice as Invoice;
          }
        }
        return acc;
      }, []);

      // Sort by period_end descending
      uniqueInvoices.sort((a, b) => 
        new Date(b.period_end).getTime() - new Date(a.period_end).getTime()
      );

      setInvoices(uniqueInvoices);
    }
    setInvoicesLoading(false);

    setLoading(false);
  };

  // Get invoice info for blocked banner
  const getBlockedInvoiceInfo = () => {
    if (!sellerBlock?.invoice_id) return {};
    const invoice = invoices.find((i) => i.id === sellerBlock.invoice_id);
    if (!invoice) return {};
    return {
      invoiceAmount: invoice.fee_total,
      invoicePeriod: `${format(new Date(invoice.period_start), "dd/MM", { locale: ptBR })} a ${format(new Date(invoice.period_end), "dd/MM", { locale: ptBR })}`,
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
          <p className="text-muted-foreground">Acompanhe suas faturas e taxas da plataforma</p>
        </div>

        {/* Current Period Fee Dashboard */}
        <CurrentPeriodFeeCard 
          feePercentage={platformSettings.fee_percentage} 
          feeFixed={platformSettings.fee_fixed_per_sale} 
        />

        {/* Platform Fee Info */}
        <PlatformFeeInfo 
          feePercentage={platformSettings.fee_percentage} 
          feeFixed={platformSettings.fee_fixed_per_sale} 
        />

        {/* Invoices List */}
        <InvoicesList invoices={invoices} loading={invoicesLoading} />
      </div>
    </DashboardLayout>
  );
};

export default Finance;
