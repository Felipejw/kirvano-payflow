import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

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

    console.log("Starting fee reminder check...");

    // Get platform settings
    const { data: settings } = await supabase
      .from("platform_settings")
      .select("invoice_due_days, support_email")
      .single();

    const dueDays = settings?.invoice_due_days || 3;

    // Calculate dates for reminders
    const today = new Date();
    const twoDaysFromNow = new Date(today);
    twoDaysFromNow.setDate(twoDaysFromNow.getDate() + 2);

    const oneDayFromNow = new Date(today);
    oneDayFromNow.setDate(oneDayFromNow.getDate() + 1);

    // Find invoices that are due in 2 days or 1 day
    const { data: invoices, error: invoicesError } = await supabase
      .from("platform_invoices")
      .select(`
        *,
        profiles:user_id (
          email,
          full_name
        )
      `)
      .eq("status", "pending")
      .gte("due_date", today.toISOString().split("T")[0])
      .lte("due_date", twoDaysFromNow.toISOString().split("T")[0]);

    if (invoicesError) {
      console.error("Error fetching invoices:", invoicesError);
      throw new Error("Failed to fetch invoices");
    }

    if (!invoices || invoices.length === 0) {
      console.log("No invoices due soon");
      return new Response(
        JSON.stringify({ success: true, message: "No invoices due soon", sent: 0 }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Found ${invoices.length} invoices due soon`);

    let emailsSent = 0;
    const errors: string[] = [];

    for (const invoice of invoices) {
      try {
        const profile = invoice.profiles as { email: string; full_name: string } | null;
        if (!profile?.email) {
          console.log(`Skipping invoice ${invoice.id} - no email found`);
          continue;
        }

        const dueDate = new Date(invoice.due_date);
        const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

        // Determine urgency
        let urgencyText = "";
        let subjectPrefix = "";
        if (daysUntilDue <= 1) {
          urgencyText = "⚠️ URGENTE: Sua fatura vence AMANHÃ!";
          subjectPrefix = "⚠️ URGENTE: ";
        } else if (daysUntilDue <= 2) {
          urgencyText = "Sua fatura vence em 2 dias";
          subjectPrefix = "Lembrete: ";
        }

        const formatCurrency = (value: number) => {
          return new Intl.NumberFormat("pt-BR", {
            style: "currency",
            currency: "BRL",
          }).format(value);
        };

        const formatDate = (date: Date) => {
          return date.toLocaleDateString("pt-BR");
        };

        const emailHtml = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 24px;">GateFlow</h1>
            </div>
            
            <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e5e5; border-top: none;">
              <p style="font-size: 18px; font-weight: 600; color: #e74c3c; margin-top: 0;">
                ${urgencyText}
              </p>
              
              <p>Olá${profile.full_name ? `, ${profile.full_name}` : ""},</p>
              
              <p>Este é um lembrete sobre sua fatura de taxas da plataforma GateFlow:</p>
              
              <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; color: #666;">Período:</td>
                    <td style="padding: 8px 0; text-align: right; font-weight: 600;">
                      ${formatDate(new Date(invoice.period_start))} - ${formatDate(new Date(invoice.period_end))}
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #666;">Total de Vendas:</td>
                    <td style="padding: 8px 0; text-align: right; font-weight: 600;">
                      ${invoice.total_sales} vendas (${formatCurrency(invoice.total_amount || 0)})
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #666;">Taxa da Plataforma:</td>
                    <td style="padding: 8px 0; text-align: right; font-weight: 600; color: #e74c3c; font-size: 18px;">
                      ${formatCurrency(invoice.fee_total)}
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #666;">Vencimento:</td>
                    <td style="padding: 8px 0; text-align: right; font-weight: 600; color: ${daysUntilDue <= 1 ? '#e74c3c' : '#333'};">
                      ${formatDate(dueDate)}
                    </td>
                  </tr>
                </table>
              </div>
              
              <div style="text-align: center; margin: 25px 0;">
                <a href="https://gateflow.app/dashboard/finance" 
                   style="display: inline-block; background: linear-gradient(135deg, #00b4d8 0%, #0077b6 100%); color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
                  Pagar Agora
                </a>
              </div>
              
              <div style="background: #fff3cd; padding: 15px; border-radius: 8px; border-left: 4px solid #ffc107; margin-top: 20px;">
                <p style="margin: 0; font-size: 14px; color: #856404;">
                  <strong>⚠️ Importante:</strong> O não pagamento até a data de vencimento resultará no bloqueio automático da sua conta e impossibilidade de receber novos pagamentos.
                </p>
              </div>
            </div>
            
            <div style="background: #f8f9fa; padding: 20px; border-radius: 0 0 12px 12px; text-align: center; font-size: 12px; color: #666;">
              <p style="margin: 0;">Precisa de ajuda? Entre em contato com nosso suporte.</p>
              <p style="margin: 5px 0 0;">© ${new Date().getFullYear()} GateFlow. Todos os direitos reservados.</p>
            </div>
          </body>
          </html>
        `;

        const emailResponse = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${RESEND_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "GateFlow <noreply@resend.dev>",
            to: [profile.email],
            subject: `${subjectPrefix}Fatura GateFlow vence em ${formatDate(dueDate)} - ${formatCurrency(invoice.fee_total)}`,
            html: emailHtml,
          }),
        });

        if (!emailResponse.ok) {
          const errorText = await emailResponse.text();
          throw new Error(`Resend API error: ${errorText}`);
        }

        const emailResult = await emailResponse.json();

        console.log(`Reminder email sent to ${profile.email}:`, emailResult);
        emailsSent++;
      } catch (emailError) {
        console.error(`Error sending email for invoice ${invoice.id}:`, emailError);
        errors.push(`Invoice ${invoice.id}: ${emailError instanceof Error ? emailError.message : "Unknown error"}`);
      }
    }

    console.log(`Fee reminder job completed. Sent ${emailsSent} emails.`);

    return new Response(
      JSON.stringify({
        success: true,
        sent: emailsSent,
        total: invoices.length,
        errors: errors.length > 0 ? errors : undefined,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error in send-fee-reminder:", error);
    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
