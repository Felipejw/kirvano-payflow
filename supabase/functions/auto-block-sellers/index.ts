import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log("Starting automatic blocking check...");

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Find overdue invoices that haven't been blocked yet
    const { data: overdueInvoices, error: invoicesError } = await supabase
      .from("platform_invoices")
      .select(`
        *,
        profiles:user_id (
          email,
          full_name
        )
      `)
      .eq("status", "pending")
      .lt("due_date", today.toISOString().split("T")[0]);

    if (invoicesError) {
      console.error("Error fetching overdue invoices:", invoicesError);
      throw new Error("Failed to fetch overdue invoices");
    }

    if (!overdueInvoices || overdueInvoices.length === 0) {
      console.log("No overdue invoices found");
      return new Response(
        JSON.stringify({ success: true, message: "No overdue invoices", blocked: 0 }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Found ${overdueInvoices.length} overdue invoices to process`);

    let blockedCount = 0;
    const errors: string[] = [];

    for (const invoice of overdueInvoices) {
      try {
        // Check if seller is already blocked for this invoice
        const { data: existingBlock } = await supabase
          .from("seller_blocks")
          .select("id")
          .eq("invoice_id", invoice.id)
          .eq("is_active", true)
          .maybeSingle();

        if (existingBlock) {
          console.log(`Seller already blocked for invoice ${invoice.id}`);
          continue;
        }

        console.log(`Blocking seller ${invoice.user_id} for invoice ${invoice.id}`);

        // Update invoice status to blocked
        const { error: updateError } = await supabase
          .from("platform_invoices")
          .update({ status: "blocked" })
          .eq("id", invoice.id);

        if (updateError) {
          console.error("Error updating invoice:", updateError);
          errors.push(`Invoice ${invoice.id}: ${updateError.message}`);
          continue;
        }

        // Create seller block record
        const { error: blockError } = await supabase
          .from("seller_blocks")
          .insert({
            user_id: invoice.user_id,
            invoice_id: invoice.id,
            reason: "unpaid_invoice",
            is_active: true,
          });

        if (blockError) {
          console.error("Error creating block:", blockError);
          errors.push(`Block ${invoice.user_id}: ${blockError.message}`);
          continue;
        }

        blockedCount++;

        // Send notification email
        const profile = invoice.profiles as { email: string; full_name: string } | null;
        if (profile?.email && RESEND_API_KEY) {
          try {
            const formatCurrency = (value: number) => {
              return new Intl.NumberFormat("pt-BR", {
                style: "currency",
                currency: "BRL",
              }).format(value);
            };

            const emailHtml = `
              <!DOCTYPE html>
              <html>
              <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
              </head>
              <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
                  <h1 style="color: #ffffff; margin: 0; font-size: 24px;">⚠️ Conta Bloqueada</h1>
                </div>
                
                <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e5e5; border-top: none;">
                  <p>Olá${profile.full_name ? `, ${profile.full_name}` : ""},</p>
                  
                  <p style="color: #dc2626; font-weight: 600;">
                    Sua conta foi bloqueada por não pagamento de fatura vencida.
                  </p>
                  
                  <div style="background: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc2626;">
                    <p style="margin: 0; font-size: 14px;">
                      <strong>Fatura em atraso:</strong> ${formatCurrency(invoice.fee_total)}<br>
                      <strong>Vencimento original:</strong> ${new Date(invoice.due_date).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                  
                  <p>Enquanto sua conta estiver bloqueada:</p>
                  <ul style="color: #666;">
                    <li>Você não poderá receber novos pagamentos</li>
                    <li>Seus produtos ficarão inativos</li>
                    <li>O checkout não funcionará para seus clientes</li>
                  </ul>
                  
                  <div style="text-align: center; margin: 25px 0;">
                    <a href="https://gateflow.app/dashboard/finance" 
                       style="display: inline-block; background: linear-gradient(135deg, #00b4d8 0%, #0077b6 100%); color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
                      Regularizar Agora
                    </a>
                  </div>
                  
                  <p style="font-size: 14px; color: #666;">
                    Após o pagamento, sua conta será desbloqueada automaticamente.
                  </p>
                </div>
                
                <div style="background: #f8f9fa; padding: 20px; border-radius: 0 0 12px 12px; text-align: center; font-size: 12px; color: #666;">
                  <p style="margin: 0;">Precisa de ajuda? Entre em contato com nosso suporte.</p>
                  <p style="margin: 5px 0 0;">© ${new Date().getFullYear()} GateFlow. Todos os direitos reservados.</p>
                </div>
              </body>
              </html>
            `;

            await fetch("https://api.resend.com/emails", {
              method: "POST",
              headers: {
                "Authorization": `Bearer ${RESEND_API_KEY}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                from: "GateFlow <noreply@resend.dev>",
                to: [profile.email],
                subject: `⚠️ URGENTE: Sua conta GateFlow foi bloqueada`,
                html: emailHtml,
              }),
            });

            console.log(`Block notification sent to ${profile.email}`);
          } catch (emailError) {
            console.error("Error sending block email:", emailError);
          }
        }

        console.log(`Successfully blocked seller ${invoice.user_id}`);
      } catch (error) {
        console.error(`Error processing invoice ${invoice.id}:`, error);
        errors.push(`Invoice ${invoice.id}: ${error instanceof Error ? error.message : "Unknown error"}`);
      }
    }

    console.log(`Automatic blocking completed. Blocked ${blockedCount} sellers.`);

    return new Response(
      JSON.stringify({
        success: true,
        blocked: blockedCount,
        total: overdueInvoices.length,
        errors: errors.length > 0 ? errors : undefined,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error in auto-block-sellers:", error);
    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
