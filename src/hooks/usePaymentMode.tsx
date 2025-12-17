import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export type PaymentMode = "platform_gateway" | "own_gateway";

interface PaymentModeData {
  paymentMode: PaymentMode;
  termsAcceptedAt: string | null;
  loading: boolean;
  hasPendingBalance: boolean;
  pendingAmount: number;
  refetch: () => Promise<void>;
}

interface PlatformFees {
  platformGatewayFeePercentage: number;
  platformGatewayFeeFixed: number;
  platformGatewayWithdrawalFee: number;
  ownGatewayFeePercentage: number;
  ownGatewayFeeFixed: number;
}

export function usePaymentMode(): PaymentModeData & { fees: PlatformFees } {
  const [paymentMode, setPaymentMode] = useState<PaymentMode>("own_gateway");
  const [termsAcceptedAt, setTermsAcceptedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasPendingBalance, setHasPendingBalance] = useState(false);
  const [pendingAmount, setPendingAmount] = useState(0);
  const [fees, setFees] = useState<PlatformFees>({
    platformGatewayFeePercentage: 5.99,
    platformGatewayFeeFixed: 1,
    platformGatewayWithdrawalFee: 5,
    ownGatewayFeePercentage: 3.99,
    ownGatewayFeeFixed: 1,
  });

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      // Fetch profile with payment_mode
      const { data: profile } = await supabase
        .from("profiles")
        .select("payment_mode, terms_accepted_at")
        .eq("user_id", user.id)
        .maybeSingle();

      if (profile) {
        setPaymentMode((profile.payment_mode as PaymentMode) || "own_gateway");
        setTermsAcceptedAt(profile.terms_accepted_at);
      }

      // Fetch platform fees
      const { data: settings } = await supabase
        .from("platform_settings")
        .select("platform_gateway_fee_percentage, platform_gateway_fee_fixed, platform_gateway_withdrawal_fee, own_gateway_fee_percentage, own_gateway_fee_fixed")
        .single();

      if (settings) {
        setFees({
          platformGatewayFeePercentage: settings.platform_gateway_fee_percentage || 5.99,
          platformGatewayFeeFixed: settings.platform_gateway_fee_fixed || 1,
          platformGatewayWithdrawalFee: settings.platform_gateway_withdrawal_fee || 5,
          ownGatewayFeePercentage: settings.own_gateway_fee_percentage || 3.99,
          ownGatewayFeeFixed: settings.own_gateway_fee_fixed || 1,
        });
      }

      // Check for pending balance
      // For platform_gateway: check pending withdrawals
      // For own_gateway: check pending invoices
      if (profile?.payment_mode === "platform_gateway") {
        const { data: withdrawals } = await supabase
          .from("withdrawals")
          .select("amount")
          .eq("user_id", user.id)
          .eq("status", "pending");

        const total = withdrawals?.reduce((sum, w) => sum + Number(w.amount || 0), 0) || 0;
        setPendingAmount(total);
        setHasPendingBalance(total > 0);
      } else {
        const { data: invoices } = await supabase
          .from("platform_invoices")
          .select("fee_total")
          .eq("user_id", user.id)
          .in("status", ["pending", "overdue"]);

        const total = invoices?.reduce((sum, i) => sum + Number(i.fee_total || 0), 0) || 0;
        setPendingAmount(total);
        setHasPendingBalance(total > 0);
      }
    } catch (error) {
      console.error("Error fetching payment mode:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return {
    paymentMode,
    termsAcceptedAt,
    loading,
    hasPendingBalance,
    pendingAmount,
    fees,
    refetch: fetchData,
  };
}

export async function updatePaymentMode(mode: PaymentMode): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Usuário não encontrado" };

    const { error } = await supabase
      .from("profiles")
      .update({ 
        payment_mode: mode,
        terms_accepted_at: new Date().toISOString()
      })
      .eq("user_id", user.id);

    if (error) throw error;
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
