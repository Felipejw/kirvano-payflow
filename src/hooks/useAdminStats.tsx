import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useUserRole } from "@/hooks/useUserRole";
import { useAppNavigate } from "@/lib/routes";
import { format, subDays, startOfMonth, endOfMonth, addDays, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useTenant } from "@/hooks/useTenant";

export interface SellerData {
  user_id: string;
  email: string;
  full_name: string;
  created_at: string;
  total_sales: number;
  total_revenue: number;
  products_count: number;
  payment_mode: string;
}

export interface TopProduct {
  id: string;
  name: string;
  totalSales: number;
  totalRevenue: number;
}

export interface TopSeller {
  user_id: string;
  full_name: string;
  email: string;
  totalSales: number;
  totalRevenue: number;
}

export interface AdminStats {
  totalSellers: number;
  totalRevenue: number;
  totalTransactions: number;
  platformFees: number;
  pendingWithdrawals: number;
  activeProducts: number;
  platformGatewaySellers: number;
  ownGatewaySellers: number;
  platformGatewayRevenue: number;
  ownGatewayRevenue: number;
  averageTicket: number;
  conversionRate: number;
  recoveredSales: number;
  recoveredAmount: number;
  pendingInvoices: number;
  pendingInvoicesAmount: number;
  overdueInvoices: number;
  overdueInvoicesAmount: number;
  custodyBalance: number;
  monthlyGrowth: number;
  totalOrders: number;
  paidOrders: number;
  averageSalesPerDay: number;
  orderBumpConversionRate: number;
  nextWeekPending: number;
}

export interface ChartData {
  date: string;
  revenue: number;
  transactions: number;
}

export interface FeesChartData {
  date: string;
  fees: number;
}

const initialStats: AdminStats = {
  totalSellers: 0,
  totalRevenue: 0,
  totalTransactions: 0,
  platformFees: 0,
  pendingWithdrawals: 0,
  activeProducts: 0,
  platformGatewaySellers: 0,
  ownGatewaySellers: 0,
  platformGatewayRevenue: 0,
  ownGatewayRevenue: 0,
  averageTicket: 0,
  conversionRate: 0,
  recoveredSales: 0,
  recoveredAmount: 0,
  pendingInvoices: 0,
  pendingInvoicesAmount: 0,
  overdueInvoices: 0,
  overdueInvoicesAmount: 0,
  custodyBalance: 0,
  monthlyGrowth: 0,
  totalOrders: 0,
  paidOrders: 0,
  averageSalesPerDay: 0,
  orderBumpConversionRate: 0,
  nextWeekPending: 0
};

export function useAdminStats() {
  const [stats, setStats] = useState<AdminStats>(initialStats);
  const [sellers, setSellers] = useState<SellerData[]>([]);
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [feesChartData, setFeesChartData] = useState<FeesChartData[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [topSellers, setTopSellers] = useState<TopSeller[]>([]);
  const [paymentModeData, setPaymentModeData] = useState<{name: string, value: number}[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [isLive, setIsLive] = useState(true);
  const { toast } = useToast();
  const navigate = useAppNavigate();
  const { isAdmin, isSuperAdmin, loading: roleLoading } = useUserRole();
  const { tenant, loading: tenantLoading } = useTenant();

  useEffect(() => {
    if (!roleLoading && !isAdmin) {
      toast({
        title: "Acesso negado",
        description: "Você não tem permissão para acessar esta página",
        variant: "destructive"
      });
      navigate("dashboard");
    }
  }, [isAdmin, roleLoading, navigate, toast]);

  const fetchAdminData = useCallback(async () => {
    try {
      setLoading(true);

      const isTenantAdmin = isAdmin && !isSuperAdmin;
      if (isTenantAdmin && tenantLoading) return;

      if (isTenantAdmin && !tenant?.id) {
        toast({
          title: "Tenant não configurado",
          description:
            "Seu painel admin ainda não foi configurado (tenant não encontrado). Fale com o suporte para vincular seu usuário a um tenant.",
          variant: "destructive",
        });
        setStats(initialStats);
        setSellers([]);
        setChartData([]);
        setFeesChartData([]);
        setTopProducts([]);
        setTopSellers([]);
        setPaymentModeData([]);
        return;
      }

      let sellerUserIds: string[] = [];
      let profiles: any[] = [];

      if (isTenantAdmin) {
        const { data: tenantProfiles, error: profilesError } = await supabase
          .from("profiles")
          .select("*")
          .eq("tenant_id", tenant!.id);

        if (profilesError) throw profilesError;
        profiles = tenantProfiles || [];
        sellerUserIds = profiles.map((p) => p.user_id).filter(Boolean);
      } else {
        const { data: sellerRoles, error: rolesError } = await supabase
          .from("user_roles")
          .select("user_id")
          .eq("role", "seller");

        if (rolesError) throw rolesError;
        sellerUserIds = sellerRoles?.map((r) => r.user_id) || [];

        const { data: allProfiles, error: profilesError } = await supabase
          .from("profiles")
          .select("*")
          .in("user_id", sellerUserIds);

        if (profilesError) throw profilesError;
        profiles = allProfiles || [];
      }

      if (!sellerUserIds.length) {
        setStats({ ...initialStats, totalSellers: profiles.length });
        setSellers([]);
        setChartData([]);
        setFeesChartData([]);
        setTopProducts([]);
        setTopSellers([]);
        setPaymentModeData([]);
        setLastUpdate(new Date());
        return;
      }

      const { data: transactions, error: transactionsError } = await supabase
        .from("transactions")
        .select("*")
        .in("seller_id", sellerUserIds);

      if (transactionsError) throw transactionsError;

      const { data: products, error: productsError } = await supabase
        .from("products")
        .select("*")
        .in("seller_id", sellerUserIds);

      if (productsError) throw productsError;

      const { data: withdrawals, error: withdrawalsError } = await supabase
        .from("withdrawals")
        .select("*")
        .eq("status", "pending")
        .in("user_id", sellerUserIds);

      if (withdrawalsError) throw withdrawalsError;

      const { data: pixCharges, error: pixChargesError } = await supabase
        .from("pix_charges")
        .select("status, created_at, order_bumps, seller_id")
        .in("seller_id", sellerUserIds);

      if (pixChargesError) throw pixChargesError;

      const { data: invoices, error: invoicesError } = await supabase
        .from("platform_invoices")
        .select("*")
        .in("user_id", sellerUserIds);

      if (invoicesError) throw invoicesError;

      const today = new Date();
      const paidTransactions = transactions?.filter((t) => t.status === "paid") || [];
      const totalRevenue = paidTransactions.reduce((sum, t) => sum + Number(t.amount || 0), 0);
      const platformFees = paidTransactions.reduce((sum, t) => sum + Number(t.platform_fee || 0), 0);
      const pendingWithdrawalsAmount = withdrawals?.reduce((sum, w) => sum + Number(w.amount || 0), 0) || 0;

      const platformGatewaySellers = profiles?.filter((p) => p.payment_mode === "platform_gateway").length || 0;
      const ownGatewaySellers = profiles?.filter((p) => p.payment_mode !== "platform_gateway").length || 0;

      const platformGatewayUserIds = profiles
        ?.filter((p) => p.payment_mode === "platform_gateway")
        .map((p) => p.user_id) || [];

      const platformGatewayRevenue = paidTransactions
        .filter((t) => platformGatewayUserIds.includes(t.seller_id))
        .reduce((sum, t) => sum + Number(t.amount || 0), 0);
      const ownGatewayRevenue = totalRevenue - platformGatewayRevenue;

      const averageTicket = paidTransactions.length > 0 ? totalRevenue / paidTransactions.length : 0;

      const totalOrders = pixCharges?.length || 0;
      const paidOrders = pixCharges?.filter((c) => c.status === "paid").length || 0;
      const conversionRate = totalOrders > 0 ? (paidOrders / totalOrders) * 100 : 0;

      const paidWithBumps =
        pixCharges?.filter((c) => c.status === "paid" && c.order_bumps && c.order_bumps.length > 0).length || 0;
      const orderBumpConversionRate = paidOrders > 0 ? (paidWithBumps / paidOrders) * 100 : 0;

      const firstSaleDate =
        paidTransactions.length > 0
          ? new Date(Math.min(...paidTransactions.map((t) => new Date(t.created_at).getTime())))
          : today;
      const daysActive = Math.max(1, differenceInDays(today, firstSaleDate) + 1);
      const averageSalesPerDay = totalRevenue / daysActive;

      const recoveredTransactions = paidTransactions.filter((t) => t.is_recovered);
      const recoveredSales = recoveredTransactions.length;
      const recoveredAmount = recoveredTransactions.reduce((sum, t) => sum + Number(t.amount || 0), 0);

      const pendingInvoices = invoices?.filter((i) => i.status === "pending") || [];
      const pendingInvoicesAmount = pendingInvoices.reduce((sum, i) => sum + Number(i.fee_total || 0), 0);

      const overdueInvoices =
        invoices?.filter((i) => i.status === "pending" && new Date(i.due_date) < today) || [];
      const overdueInvoicesAmount = overdueInvoices.reduce((sum, i) => sum + Number(i.fee_total || 0), 0);

      const nextWeek = addDays(today, 7);
      const nextWeekInvoices =
        invoices?.filter((i) => {
          const dueDate = new Date(i.due_date);
          return i.status === "pending" && dueDate >= today && dueDate <= nextWeek;
        }) || [];
      const nextWeekPending = nextWeekInvoices.reduce((sum, i) => sum + Number(i.fee_total || 0), 0);

      const custodyBalance =
        paidTransactions
          .filter((t) => platformGatewayUserIds.includes(t.seller_id))
          .reduce((sum, t) => sum + Number(t.seller_amount || 0), 0) - pendingWithdrawalsAmount;

      const thisMonthStart = startOfMonth(today);
      const lastMonthStart = startOfMonth(subDays(thisMonthStart, 1));
      const lastMonthEnd = endOfMonth(subDays(thisMonthStart, 1));

      const thisMonthRevenue = paidTransactions
        .filter((t) => new Date(t.created_at) >= thisMonthStart)
        .reduce((sum, t) => sum + Number(t.amount || 0), 0);

      const lastMonthRevenue = paidTransactions
        .filter((t) => {
          const date = new Date(t.created_at);
          return date >= lastMonthStart && date <= lastMonthEnd;
        })
        .reduce((sum, t) => sum + Number(t.amount || 0), 0);

      const monthlyGrowth = lastMonthRevenue > 0 ? ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 : 0;

      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = subDays(today, 6 - i);
        const dayTransactions = paidTransactions.filter((t) => {
          const tDate = new Date(t.created_at);
          return tDate.toDateString() === date.toDateString();
        });
        return {
          date: format(date, "dd/MM", { locale: ptBR }),
          revenue: dayTransactions.reduce((sum, t) => sum + Number(t.amount || 0), 0),
          transactions: dayTransactions.length,
        };
      });

      const last30Days = Array.from({ length: 30 }, (_, i) => {
        const date = subDays(today, 29 - i);
        const dayTransactions = paidTransactions.filter((t) => {
          const tDate = new Date(t.created_at);
          return tDate.toDateString() === date.toDateString();
        });
        return {
          date: format(date, "dd/MM", { locale: ptBR }),
          fees: dayTransactions.reduce((sum, t) => sum + Number(t.platform_fee || 0), 0),
        };
      });

      const paymentModeChartData = [
        { name: "Gateway Plataforma", value: platformGatewayRevenue },
        { name: "Gateway Próprio", value: ownGatewayRevenue },
      ].filter((d) => d.value > 0);

      const productSalesMap = new Map<string, { name: string; sales: number; revenue: number }>();
      paidTransactions.forEach((t) => {
        if (t.product_id) {
          const product = products?.find((p) => p.id === t.product_id);
          const existing = productSalesMap.get(t.product_id);
          if (existing) {
            existing.sales += 1;
            existing.revenue += Number(t.amount || 0);
          } else {
            productSalesMap.set(t.product_id, {
              name: product?.name || "Produto desconhecido",
              sales: 1,
              revenue: Number(t.amount || 0),
            });
          }
        }
      });
      const topProductsList: TopProduct[] = Array.from(productSalesMap.entries())
        .map(([id, data]) => ({
          id,
          name: data.name,
          totalSales: data.sales,
          totalRevenue: data.revenue,
        }))
        .sort((a, b) => b.totalSales - a.totalSales)
        .slice(0, 5);

      const sellerRevenueMap = new Map<string, { name: string; email: string; sales: number; revenue: number }>();
      paidTransactions.forEach((t) => {
        if (t.seller_id) {
          const profile = profiles?.find((p) => p.user_id === t.seller_id);
          const existing = sellerRevenueMap.get(t.seller_id);
          if (existing) {
            existing.sales += 1;
            existing.revenue += Number(t.seller_amount || 0);
          } else {
            sellerRevenueMap.set(t.seller_id, {
              name: profile?.full_name || "Vendedor",
              email: profile?.email || "",
              sales: 1,
              revenue: Number(t.seller_amount || 0),
            });
          }
        }
      });
      const topSellersList: TopSeller[] = Array.from(sellerRevenueMap.entries())
        .map(([user_id, data]) => ({
          user_id,
          full_name: data.name,
          email: data.email,
          totalSales: data.sales,
          totalRevenue: data.revenue,
        }))
        .sort((a, b) => b.totalRevenue - a.totalRevenue)
        .slice(0, 5);

      setStats({
        totalSellers: profiles?.length || 0,
        totalRevenue,
        totalTransactions: paidTransactions.length,
        platformFees,
        pendingWithdrawals: pendingWithdrawalsAmount,
        activeProducts: products?.filter((p) => p.status === "active").length || 0,
        platformGatewaySellers,
        ownGatewaySellers,
        platformGatewayRevenue,
        ownGatewayRevenue,
        averageTicket,
        conversionRate,
        recoveredSales,
        recoveredAmount,
        pendingInvoices: pendingInvoices.length,
        pendingInvoicesAmount,
        overdueInvoices: overdueInvoices.length,
        overdueInvoicesAmount,
        custodyBalance,
        monthlyGrowth,
        totalOrders,
        paidOrders,
        averageSalesPerDay,
        orderBumpConversionRate,
        nextWeekPending,
      });

      setChartData(last7Days);
      setFeesChartData(last30Days);
      setPaymentModeData(paymentModeChartData);
      setTopProducts(topProductsList);
      setTopSellers(topSellersList);

      const sellerMap = new Map<string, SellerData>();

      profiles?.forEach((profile) => {
        sellerMap.set(profile.user_id, {
          user_id: profile.user_id,
          email: profile.email || "",
          full_name: profile.full_name || "Sem nome",
          created_at: profile.created_at,
          total_sales: 0,
          total_revenue: 0,
          products_count: 0,
          payment_mode: profile.payment_mode || "own_gateway",
        });
      });

      transactions?.forEach((t) => {
        if (t.seller_id && sellerMap.has(t.seller_id)) {
          const seller = sellerMap.get(t.seller_id)!;
          seller.total_sales += 1;
          seller.total_revenue += Number(t.seller_amount || 0);
        }
      });

      products?.forEach((p) => {
        if (sellerMap.has(p.seller_id)) {
          const seller = sellerMap.get(p.seller_id)!;
          seller.products_count += 1;
        }
      });

      setSellers(Array.from(sellerMap.values()));
      setLastUpdate(new Date());
    } catch (error) {
      console.error("Error fetching admin data:", error);
      toast({
        title: "Erro",
        description: "Falha ao carregar dados do admin",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [isAdmin, isSuperAdmin, tenant, tenantLoading, toast]);

  useEffect(() => {
    if (isAdmin) {
      fetchAdminData();
    }
  }, [isAdmin, fetchAdminData]);

  // Real-time subscriptions
  useEffect(() => {
    // Evita subscription global para admin de tenant (pode disparar refetch por mudanças de outros tenants)
    if (!isAdmin || !isLive || !isSuperAdmin) return;

    const transactionsChannel = supabase
      .channel('admin-transactions-hook')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'transactions' },
        () => {
          fetchAdminData();
          toast({
            title: "Nova transação!",
            description: "Os dados foram atualizados automaticamente",
          });
        }
      )
      .subscribe();

    const withdrawalsChannel = supabase
      .channel('admin-withdrawals-hook')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'withdrawals' },
        () => {
          fetchAdminData();
          toast({
            title: "Atualização de saque!",
            description: "Os dados foram atualizados automaticamente",
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(transactionsChannel);
      supabase.removeChannel(withdrawalsChannel);
    };
  }, [isAdmin, isSuperAdmin, isLive, fetchAdminData, toast]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL"
    }).format(value);
  };

  return {
    stats,
    sellers,
    chartData,
    feesChartData,
    topProducts,
    topSellers,
    paymentModeData,
    loading,
    lastUpdate,
    isLive,
    setIsLive,
    isAdmin,
    roleLoading,
    fetchAdminData,
    formatCurrency
  };
}
