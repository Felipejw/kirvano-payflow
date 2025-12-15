import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotificationRequest {
  buyer_name: string;
  buyer_email: string;
  buyer_phone?: string;
  product_name: string;
  amount: number;
  pix_code: string;
  expires_at: string;
  send_email?: boolean;
  send_whatsapp?: boolean;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

const formatPhone = (phone: string): string => {
  // Remove all non-numeric characters
  const cleaned = phone.replace(/\D/g, '');
  
  // Add country code if not present
  if (cleaned.startsWith('55')) {
    return cleaned;
  }
  return `55${cleaned}`;
};

const sendEmail = async (data: NotificationRequest) => {
  console.log('Sending email to:', data.buyer_email);
  
  if (!RESEND_API_KEY) {
    console.error("RESEND_API_KEY not configured");
    return { success: false, error: "Email service not configured" };
  }
  
  const expiresDate = new Date(data.expires_at);
  const expiresFormatted = expiresDate.toLocaleTimeString('pt-BR', { 
    hour: '2-digit', 
    minute: '2-digit',
    timeZone: 'America/Sao_Paulo'
  });

  const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Pagamento PIX</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
    
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #00b4d8 0%, #0077b6 100%); padding: 30px; text-align: center;">
      <h1 style="color: #ffffff; margin: 0; font-size: 24px;">💳 Pagamento PIX Aguardando</h1>
    </div>
    
    <!-- Content -->
    <div style="padding: 30px;">
      <p style="color: #333; font-size: 16px; margin-bottom: 20px;">
        Olá, <strong>${data.buyer_name || 'Cliente'}</strong>!
      </p>
      
      <p style="color: #666; font-size: 14px; line-height: 1.6;">
        Seu pedido de <strong>${data.product_name}</strong> está quase finalizado! 
        Complete o pagamento via PIX para garantir sua compra.
      </p>
      
      <!-- Amount Box -->
      <div style="background: linear-gradient(135deg, #00b4d8 0%, #0077b6 100%); border-radius: 12px; padding: 20px; text-align: center; margin: 25px 0;">
        <p style="color: rgba(255,255,255,0.9); margin: 0 0 5px 0; font-size: 14px;">Valor a pagar:</p>
        <p style="color: #ffffff; margin: 0; font-size: 32px; font-weight: bold;">${formatCurrency(data.amount)}</p>
      </div>
      
      <!-- PIX Code -->
      <div style="background-color: #f8f9fa; border: 2px dashed #00b4d8; border-radius: 8px; padding: 20px; margin: 25px 0;">
        <p style="color: #333; font-size: 14px; margin: 0 0 10px 0; font-weight: bold;">
          📋 Código PIX Copia e Cola:
        </p>
        <div style="background-color: #ffffff; border: 1px solid #e0e0e0; border-radius: 6px; padding: 12px; word-break: break-all;">
          <code style="color: #333; font-size: 12px; font-family: 'Courier New', monospace;">${data.pix_code}</code>
        </div>
        <p style="color: #666; font-size: 12px; margin: 10px 0 0 0;">
          Copie o código acima e cole no app do seu banco para pagar.
        </p>
      </div>
      
      <!-- Timer Warning -->
      <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 25px 0; border-radius: 4px;">
        <p style="color: #856404; margin: 0; font-size: 14px;">
          ⏰ <strong>Atenção:</strong> Este código expira às <strong>${expiresFormatted}</strong>. 
          Pague agora para garantir sua compra!
        </p>
      </div>
      
      <!-- Instructions -->
      <div style="margin: 25px 0;">
        <p style="color: #333; font-size: 14px; font-weight: bold; margin-bottom: 15px;">Como pagar:</p>
        <ol style="color: #666; font-size: 14px; line-height: 1.8; padding-left: 20px; margin: 0;">
          <li>Abra o app do seu banco</li>
          <li>Escolha pagar com PIX "Copia e Cola"</li>
          <li>Cole o código acima</li>
          <li>Confirme o pagamento</li>
        </ol>
      </div>
      
      <p style="color: #00b4d8; font-size: 14px; text-align: center; margin-top: 30px;">
        ✅ Após o pagamento, você receberá a confirmação automaticamente!
      </p>
    </div>
    
    <!-- Footer -->
    <div style="background-color: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #e0e0e0;">
      <p style="color: #999; font-size: 12px; margin: 0;">
        Se você não fez essa compra, ignore este email.
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
        from: "Pagamento PIX <onboarding@resend.dev>",
        to: [data.buyer_email],
        subject: `💳 Seu PIX de ${formatCurrency(data.amount)} está aguardando pagamento!`,
        html: emailHtml,
      }),
    });

    const result = await response.json();
    
    if (!response.ok) {
      console.error("Resend API error:", result);
      return { success: false, error: result.message || "Email failed" };
    }

    console.log("Email sent successfully:", result);
    return { success: true, response: result };
  } catch (error: any) {
    console.error("Error sending email:", error);
    return { success: false, error: error.message };
  }
};

const sendWhatsApp = async (data: NotificationRequest) => {
  const instanceId = Deno.env.get("ZAPI_INSTANCE_ID");
  const token = Deno.env.get("ZAPI_TOKEN");
  
  if (!instanceId || !token) {
    console.log("Z-API credentials not configured, skipping WhatsApp");
    return { success: false, error: "Z-API not configured" };
  }

  if (!data.buyer_phone) {
    console.log("No phone number provided, skipping WhatsApp");
    return { success: false, error: "No phone number" };
  }

  const phone = formatPhone(data.buyer_phone);
  console.log('Sending WhatsApp to:', phone);

  const expiresDate = new Date(data.expires_at);
  const expiresFormatted = expiresDate.toLocaleTimeString('pt-BR', { 
    hour: '2-digit', 
    minute: '2-digit',
    timeZone: 'America/Sao_Paulo'
  });

  const message = `💳 *Pagamento PIX Aguardando*

Olá, ${data.buyer_name || 'Cliente'}!

Seu pedido de *${data.product_name}* está quase finalizado!

💰 *Valor:* ${formatCurrency(data.amount)}

📋 *Código PIX Copia e Cola:*
\`\`\`
${data.pix_code}
\`\`\`

⏰ *Expira às ${expiresFormatted}*

_Copie o código e cole no app do seu banco para pagar._

✅ Após o pagamento, você receberá a confirmação automaticamente!`;

  try {
    const response = await fetch(
      `https://api.z-api.io/instances/${instanceId}/token/${token}/send-text`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phone: phone,
          message: message,
        }),
      }
    );

    const result = await response.json();
    console.log("WhatsApp sent:", result);
    
    if (!response.ok) {
      throw new Error(result.message || "Failed to send WhatsApp");
    }

    return { success: true, response: result };
  } catch (error: any) {
    console.error("Error sending WhatsApp:", error);
    return { success: false, error: error.message };
  }
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const data: NotificationRequest = await req.json();
    console.log("Received notification request:", { 
      buyer_name: data.buyer_name,
      buyer_email: data.buyer_email,
      buyer_phone: data.buyer_phone ? '***' : undefined,
      product_name: data.product_name,
      amount: data.amount,
      expires_at: data.expires_at
    });

    const results: { email?: any; whatsapp?: any } = {};

    // Send email by default if buyer_email exists
    if (data.buyer_email && (data.send_email !== false)) {
      results.email = await sendEmail(data);
    }

    // Send WhatsApp if enabled and phone exists
    if (data.buyer_phone && data.send_whatsapp !== false) {
      results.whatsapp = await sendWhatsApp(data);
    }

    console.log("Notification results:", results);

    return new Response(
      JSON.stringify({ success: true, results }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-pix-notification:", error);
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
