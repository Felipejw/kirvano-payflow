import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const RESEND_FROM_EMAIL = Deno.env.get("RESEND_FROM_EMAIL") || "Gateflow <noreply@notificacao.gatteflow.store>";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface WithdrawalNotificationRequest {
  to_email: string;
  seller_name: string;
  amount: number;
  net_amount: number;
  fee: number;
  pix_key: string;
  status: "approved" | "rejected";
  notes?: string;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL"
  }).format(value);
};

const handler = async (req: Request): Promise<Response> => {
  console.log("send-withdrawal-notification: Request received");

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      to_email, 
      seller_name, 
      amount, 
      net_amount, 
      fee, 
      pix_key, 
      status, 
      notes 
    }: WithdrawalNotificationRequest = await req.json();

    console.log(`Sending withdrawal ${status} notification to: ${to_email}`);

    const isApproved = status === "approved";
    const subject = isApproved 
      ? `✅ Saque de ${formatCurrency(net_amount)} aprovado!`
      : `❌ Saque de ${formatCurrency(net_amount)} não aprovado`;

    const approvedHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f5;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); border-radius: 12px 12px 0 0; padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">✅ Saque Aprovado!</h1>
          </div>
          
          <div style="background-color: white; padding: 30px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            <p style="color: #374151; font-size: 16px; margin-bottom: 20px;">
              Olá <strong>${seller_name}</strong>,
            </p>
            
            <p style="color: #374151; font-size: 16px; margin-bottom: 20px;">
              Sua solicitação de saque foi aprovada e o pagamento será processado em até 24 horas úteis.
            </p>
            
            <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <h3 style="color: #166534; margin: 0 0 15px 0; font-size: 16px;">Detalhes do Saque</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Valor solicitado:</td>
                  <td style="padding: 8px 0; color: #374151; font-size: 14px; text-align: right; font-weight: 600;">${formatCurrency(amount)}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Taxa de saque:</td>
                  <td style="padding: 8px 0; color: #374151; font-size: 14px; text-align: right;">- ${formatCurrency(fee)}</td>
                </tr>
                <tr style="border-top: 1px solid #d1fae5;">
                  <td style="padding: 12px 0 8px 0; color: #166534; font-size: 16px; font-weight: 600;">Valor a receber:</td>
                  <td style="padding: 12px 0 8px 0; color: #166534; font-size: 18px; text-align: right; font-weight: 700;">${formatCurrency(net_amount)}</td>
                </tr>
              </table>
            </div>
            
            <div style="background-color: #f9fafb; border-radius: 8px; padding: 15px; margin: 20px 0;">
              <p style="color: #6b7280; font-size: 14px; margin: 0;">
                <strong>Chave PIX:</strong> ${pix_key}
              </p>
            </div>
            
            ${notes ? `
            <div style="background-color: #fef3c7; border-radius: 8px; padding: 15px; margin: 20px 0;">
              <p style="color: #92400e; font-size: 14px; margin: 0;">
                <strong>Observação:</strong> ${notes}
              </p>
            </div>
            ` : ''}
            
            <p style="color: #9ca3af; font-size: 12px; margin-top: 30px; text-align: center;">
              Este é um email automático. Em caso de dúvidas, entre em contato com nosso suporte.
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    const rejectedHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f5;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); border-radius: 12px 12px 0 0; padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">❌ Saque Não Aprovado</h1>
          </div>
          
          <div style="background-color: white; padding: 30px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            <p style="color: #374151; font-size: 16px; margin-bottom: 20px;">
              Olá <strong>${seller_name}</strong>,
            </p>
            
            <p style="color: #374151; font-size: 16px; margin-bottom: 20px;">
              Infelizmente sua solicitação de saque não foi aprovada.
            </p>
            
            <div style="background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <h3 style="color: #991b1b; margin: 0 0 15px 0; font-size: 16px;">Detalhes da Solicitação</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Valor solicitado:</td>
                  <td style="padding: 8px 0; color: #374151; font-size: 14px; text-align: right; font-weight: 600;">${formatCurrency(amount)}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Valor líquido:</td>
                  <td style="padding: 8px 0; color: #374151; font-size: 14px; text-align: right;">${formatCurrency(net_amount)}</td>
                </tr>
              </table>
            </div>
            
            ${notes ? `
            <div style="background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 15px; margin: 20px 0;">
              <p style="color: #991b1b; font-size: 14px; margin: 0;">
                <strong>Motivo:</strong> ${notes}
              </p>
            </div>
            ` : ''}
            
            <p style="color: #374151; font-size: 14px; margin-top: 20px;">
              O valor permanece disponível em sua conta. Você pode solicitar um novo saque a qualquer momento após corrigir os problemas indicados.
            </p>
            
            <p style="color: #9ca3af; font-size: 12px; margin-top: 30px; text-align: center;">
              Este é um email automático. Em caso de dúvidas, entre em contato com nosso suporte.
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: RESEND_FROM_EMAIL,
        to: [to_email],
        subject: subject,
        html: isApproved ? approvedHtml : rejectedHtml,
      }),
    });

    const result = await emailResponse.json();

    if (!emailResponse.ok) {
      console.error("Resend API error:", result);
      throw new Error(result.message || "Failed to send email");
    }

    console.log("Email sent successfully:", result);

    return new Response(JSON.stringify({ success: true, data: result }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error sending withdrawal notification:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
