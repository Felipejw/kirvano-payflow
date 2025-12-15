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
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body = await req.json();
    console.log("Received fee payment webhook:", JSON.stringify(body));

    const requestBody = body.requestBody || body;

    // Check if it's a successful payment
    if (requestBody.transactionType === "RECEIVEPIX" && requestBody.status === "PAID") {
      const transactionId = requestBody.transactionId || requestBody.external_id;

      console.log("Processing fee payment for transaction:", transactionId);

      // Find invoice by PIX code or by matching the external_id pattern (fee_invoiceId_timestamp)
      let invoice = null;

      // First try to match by external_id pattern
      if (transactionId && transactionId.startsWith("fee_")) {
        const parts = transactionId.split("_");
        if (parts.length >= 2) {
          const invoiceId = parts[1];
          const { data } = await supabase
            .from("platform_invoices")
            .select("*")
            .eq("id", invoiceId)
            .eq("status", "pending")
            .maybeSingle();
          invoice = data;
        }
      }

      // If not found, try matching by pix_code
      if (!invoice) {
        const { data } = await supabase
          .from("platform_invoices")
          .select("*")
          .eq("status", "pending")
          .or(`pix_code.ilike.%${transactionId}%`)
          .maybeSingle();
        invoice = data;
      }

      if (!invoice) {
        console.log("No pending invoice found for transaction:", transactionId);
        return new Response(JSON.stringify({ success: true, message: "No matching invoice" }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      console.log("Found invoice to mark as paid:", invoice.id);

      // Update invoice status to paid
      const { error: updateError } = await supabase
        .from("platform_invoices")
        .update({
          status: "paid",
          paid_at: new Date().toISOString(),
        })
        .eq("id", invoice.id);

      if (updateError) {
        console.error("Error updating invoice:", updateError);
        throw new Error("Failed to update invoice status");
      }

      // Mark all transactions in the period as fee_paid
      const { error: txError } = await supabase
        .from("transactions")
        .update({
          fee_paid_at: new Date().toISOString(),
          fee_invoice_id: invoice.id,
        })
        .eq("seller_id", invoice.user_id)
        .eq("status", "paid")
        .is("fee_paid_at", null)
        .gte("created_at", invoice.period_start)
        .lte("created_at", invoice.period_end);

      if (txError) {
        console.error("Error updating transactions:", txError);
      }

      // Unblock seller if they were blocked for this invoice
      const { error: unblockError } = await supabase
        .from("seller_blocks")
        .update({
          is_active: false,
          unblocked_at: new Date().toISOString(),
        })
        .eq("invoice_id", invoice.id)
        .eq("is_active", true);

      if (unblockError) {
        console.error("Error unblocking seller:", unblockError);
      }

      console.log("Fee payment processed successfully for invoice:", invoice.id);

      return new Response(
        JSON.stringify({
          success: true,
          invoiceId: invoice.id,
          status: "paid",
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // If not a paid transaction, just acknowledge
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Error in fee-webhook:", error);
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
