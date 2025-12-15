import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const bspayClientId = Deno.env.get("BSPAY_CLIENT_ID");
    const bspayClientSecret = Deno.env.get("BSPAY_CLIENT_SECRET");

    if (!bspayClientId || !bspayClientSecret) {
      throw new Error("BSPAY credentials not configured");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { userId, amount, totalSales, totalAmount, periodStart } = await req.json();

    if (!userId || !amount || amount <= 0) {
      throw new Error("Invalid parameters: userId and amount are required");
    }

    console.log(`Generating fee PIX for user ${userId}, amount: ${amount}`);

    // Get platform settings for fee calculation
    const { data: settings } = await supabase
      .from("platform_settings")
      .select("fee_percentage, fee_fixed_per_sale, invoice_due_days")
      .single();

    const feePercentage = settings?.fee_percentage || 4;
    const feeFixed = settings?.fee_fixed_per_sale || 1;
    const dueDays = settings?.invoice_due_days || 3;

    // Create the invoice record first
    const periodEnd = new Date();
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + dueDays);

    const { data: invoice, error: invoiceError } = await supabase
      .from("platform_invoices")
      .insert({
        user_id: userId,
        period_start: periodStart || new Date().toISOString(),
        period_end: periodEnd.toISOString(),
        total_sales: totalSales || 0,
        total_amount: totalAmount || 0,
        fee_percentage: feePercentage,
        fee_fixed: feeFixed,
        fee_total: amount,
        due_date: dueDate.toISOString().split("T")[0],
        status: "pending",
      })
      .select()
      .single();

    if (invoiceError) {
      console.error("Error creating invoice:", invoiceError);
      throw new Error("Failed to create invoice record");
    }

    console.log(`Invoice created: ${invoice.id}`);

    // Get BSPAY OAuth token
    const tokenResponse = await fetch("https://api.bfrpagamentos.com.br/api/v2/oauth/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        client_id: bspayClientId,
        client_secret: bspayClientSecret,
        grant_type: "client_credentials",
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error("BSPAY token error:", errorText);
      throw new Error("Failed to authenticate with payment gateway");
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    // Generate unique external ID
    const externalId = `fee_${invoice.id}_${Date.now()}`;

    // Calculate expiration (30 minutes from now)
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 30);

    // Create PIX charge via BSPAY
    const pixResponse = await fetch("https://api.bfrpagamentos.com.br/api/v2/pix/qrcode", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        external_id: externalId,
        amount: Math.round(amount * 100), // Convert to cents
        description: `Taxa GateFlow - Período ${new Date(periodStart || new Date()).toLocaleDateString("pt-BR")} a ${periodEnd.toLocaleDateString("pt-BR")}`,
        expiration_seconds: 1800, // 30 minutes
      }),
    });

    if (!pixResponse.ok) {
      const errorText = await pixResponse.text();
      console.error("BSPAY PIX error:", errorText);
      throw new Error("Failed to generate PIX code");
    }

    const pixData = await pixResponse.json();
    console.log("PIX generated:", pixData);

    // Update invoice with PIX data
    const { error: updateError } = await supabase
      .from("platform_invoices")
      .update({
        pix_code: pixData.copy_paste || pixData.qr_code_text,
        pix_qr_code: pixData.qr_code_base64 || pixData.qr_code,
      })
      .eq("id", invoice.id);

    if (updateError) {
      console.error("Error updating invoice with PIX data:", updateError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        invoiceId: invoice.id,
        qrCode: pixData.qr_code_base64 || pixData.qr_code,
        copyPaste: pixData.copy_paste || pixData.qr_code_text,
        expiresAt: expiresAt.toISOString(),
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: unknown) {
    console.error("Error in generate-fee-pix:", error);
    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
