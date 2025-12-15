import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const RESEND_FROM_EMAIL = Deno.env.get("RESEND_FROM_EMAIL");

const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PaymentConfirmedRequest {
  buyer_name: string;
  buyer_email: string;
  buyer_phone?: string;
  product_name: string;
  amount: number;
  paid_at: string;
  send_email?: boolean;
  send_whatsapp?: boolean;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

const formatPhone = (phone: string): string => {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('55')) {
    return cleaned;
  }
  return `55${cleaned}`;
};

const sendConfirmationEmail = async (data: PaymentConfirmedRequest) => {
  console.log('Sending confirmation email to:', data.buyer_email);
  
  if (!RESEND_API_KEY) {
    console.error("RESEND_API_KEY not configured");
    return { success: false, error: "Email service not configured" };
  }
  
  if (!RESEND_FROM_EMAIL || !isValidEmail(RESEND_FROM_EMAIL)) {
    console.error("RESEND_FROM_EMAIL invalid or not configured:", RESEND_FROM_EMAIL);
    return { success: false, error: "Email sender not properly configured" };
  }
  
  const paidDate = new Date(data.paid_at);
  const paidFormatted = paidDate.toLocaleString('pt-BR', { 
    timeZone: 'America/Sao_Paulo',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Pagamento Confirmado</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
    
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center;">
      <h1 style="color: #ffffff; margin: 0; font-size: 24px;">✅ Pagamento Confirmado!</h1>
    </div>
    
    <!-- Content -->
    <div style="padding: 30px;">
      <p style="color: #333; font-size: 16px; margin-bottom: 20px;">
        Olá, <strong>${data.buyer_name || 'Cliente'}</strong>!
      </p>
      
      <p style="color: #666; font-size: 14px; line-height: 1.6;">
        Ótima notícia! Seu pagamento foi <strong style="color: #10b981;">confirmado com sucesso</strong>! 🎉
      </p>
      
      <!-- Order Details -->
      <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 20px; margin: 25px 0;">
        <h3 style="color: #166534; margin: 0 0 15px 0; font-size: 16px;">📦 Detalhes do Pedido</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="color: #666; padding: 8px 0; font-size: 14px;">Produto:</td>
            <td style="color: #333; padding: 8px 0; font-size: 14px; font-weight: bold; text-align: right;">${data.product_name}</td>
          </tr>
          <tr>
            <td style="color: #666; padding: 8px 0; font-size: 14px;">Valor:</td>
            <td style="color: #10b981; padding: 8px 0; font-size: 14px; font-weight: bold; text-align: right;">${formatCurrency(data.amount)}</td>
          </tr>
          <tr>
            <td style="color: #666; padding: 8px 0; font-size: 14px;">Data:</td>
            <td style="color: #333; padding: 8px 0; font-size: 14px; text-align: right;">${paidFormatted}</td>
          </tr>
        </table>
      </div>
      
      <!-- Success Message -->
      <div style="background-color: #ecfdf5; border-left: 4px solid #10b981; padding: 15px; margin: 25px 0; border-radius: 4px;">
        <p style="color: #166534; margin: 0; font-size: 14px;">
          🚀 <strong>Próximos passos:</strong> Você receberá em breve mais informações sobre como acessar seu produto.
        </p>
      </div>
      
      <p style="color: #10b981; font-size: 14px; text-align: center; margin-top: 30px;">
        Obrigado pela sua compra! 💚
      </p>
    </div>
    
    <!-- Footer -->
    <div style="background-color: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #e0e0e0;">
      <p style="color: #999; font-size: 12px; margin: 0;">
        Este é um email automático de confirmação de pagamento.
      </p>
    </div>
  </div>
</body>
</html>
  `;

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: `Pagamento Confirmado <${RESEND_FROM_EMAIL}>`,
        to: [data.buyer_email],
        subject: `✅ Pagamento de ${formatCurrency(data.amount)} confirmado!`,
        html: emailHtml,
      }),
    });

    const result = await response.json();
    
    if (!response.ok) {
      console.error("Resend API error:", result);
      return { success: false, error: result.message || "Email failed" };
    }

    console.log("Confirmation email sent successfully:", result);
    return { success: true, response: result };
  } catch (error: any) {
    console.error("Error sending confirmation email:", error);
    return { success: false, error: error.message };
  }
};

// Helper function to send a single WhatsApp message
const sendSingleWhatsApp = async (
  phone: string,
  message: string,
  instanceId: string,
  token: string,
  clientToken: string
): Promise<{ success: boolean; error?: string; response?: any }> => {
  try {
    const zapiUrl = `https://api.z-api.io/instances/${instanceId}/token/${token}/send-text`;
    
    const response = await fetch(zapiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Client-Token": clientToken,
      },
      body: JSON.stringify({
        phone: phone,
        message: message,
      }),
    });

    const result = await response.json();
    
    if (result.error || result.zapiError) {
      console.error("Z-API returned error:", result);
      return { success: false, error: result.message || result.error };
    }
    
    if (!response.ok) {
      throw new Error(result.message || "Failed to send WhatsApp");
    }

    return { success: true, response: result };
  } catch (error: any) {
    console.error("Error sending WhatsApp message:", error);
    return { success: false, error: error.message };
  }
};

const sendConfirmationWhatsApp = async (data: PaymentConfirmedRequest) => {
  const instanceId = Deno.env.get("ZAPI_INSTANCE_ID");
  const token = Deno.env.get("ZAPI_TOKEN");
  const clientToken = Deno.env.get("ZAPI_CLIENT_TOKEN");
  
  console.log("Z-API Instance ID:", instanceId ? `"${instanceId}"` : "NOT SET");
  
  if (!instanceId || !token) {
    console.log("Z-API credentials not configured, skipping WhatsApp");
    return { success: false, error: "Z-API not configured" };
  }
  
  if (instanceId.includes('http') || token.includes('http')) {
    console.error("ERROR: ZAPI_INSTANCE_ID or ZAPI_TOKEN contains URL instead of just ID/token");
    return { success: false, error: "Z-API credentials misconfigured" };
  }

  if (!clientToken) {
    console.log("Z-API Client-Token not configured, skipping WhatsApp");
    return { success: false, error: "Z-API Client-Token not configured" };
  }

  if (!data.buyer_phone) {
    console.log("No phone number provided, skipping WhatsApp");
    return { success: false, error: "No phone number" };
  }

  const phone = formatPhone(data.buyer_phone);
  console.log('Sending confirmation WhatsApp to:', phone);

  const paidDate = new Date(data.paid_at);
  const paidFormatted = paidDate.toLocaleString('pt-BR', { 
    timeZone: 'America/Sao_Paulo',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const message = `✅ *Pagamento Confirmado!*

Olá, ${data.buyer_name || 'Cliente'}! 🎉

Seu pagamento foi confirmado com sucesso!

📦 *Produto:* ${data.product_name}
💰 *Valor:* ${formatCurrency(data.amount)}
📅 *Data:* ${paidFormatted}

Obrigado pela sua compra! 💚

Em breve você receberá mais informações sobre como acessar seu produto.`;

  try {
    console.log("Sending confirmation WhatsApp message...");
    const result = await sendSingleWhatsApp(phone, message, instanceId, token, clientToken);
    
    if (result.success) {
      console.log("Confirmation WhatsApp sent successfully!");
    }
    
    return result;
  } catch (error: any) {
    console.error("Error sending confirmation WhatsApp:", error);
    return { success: false, error: error.message };
  }
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const data: PaymentConfirmedRequest = await req.json();
    console.log("Received payment confirmed notification request:", { 
      buyer_name: data.buyer_name,
      buyer_email: data.buyer_email,
      buyer_phone: data.buyer_phone ? '***' : undefined,
      product_name: data.product_name,
      amount: data.amount,
      paid_at: data.paid_at
    });

    const results: { email?: any; whatsapp?: any } = {};

    // Send email by default if buyer_email exists
    if (data.buyer_email && (data.send_email !== false)) {
      results.email = await sendConfirmationEmail(data);
    }

    // Send WhatsApp if enabled and phone exists
    if (data.buyer_phone && data.send_whatsapp !== false) {
      results.whatsapp = await sendConfirmationWhatsApp(data);
    }

    console.log("Payment confirmed notification results:", results);

    return new Response(
      JSON.stringify({ success: true, results }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-payment-confirmed:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
