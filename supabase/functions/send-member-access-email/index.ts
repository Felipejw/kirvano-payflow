import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface SendAccessEmailRequest {
  memberEmail: string;
  memberName?: string;
  productName: string;
  productId: string;
  memberId?: string;
  expiresAt?: string;
  sellerName?: string;
  autoSend?: boolean;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      memberEmail, 
      memberName, 
      productName, 
      productId,
      memberId,
      expiresAt,
      sellerName,
      autoSend = false,
    }: SendAccessEmailRequest = await req.json();

    console.log("Sending member access email to:", memberEmail);

    // Build the access URL
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    // Extract the project ref from supabase URL
    const projectRef = supabaseUrl.replace("https://", "").replace(".supabase.co", "");
    
    // Use a generic app URL format - the user should configure this
    const appUrl = `https://${projectRef}.lovable.app`;
    const membersLoginUrl = `${appUrl}/members/login`;
    const productAccessUrl = `${appUrl}/members/product/${productId}`;

    const expirationText = expiresAt 
      ? `Seu acesso é válido até: ${new Date(expiresAt).toLocaleDateString("pt-BR", {
          day: "2-digit",
          month: "long",
          year: "numeric"
        })}`
      : "Você tem acesso vitalício a este produto.";

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Acesso Liberado</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #0a1628;">
        <table role="presentation" style="width: 100%; border-collapse: collapse;">
          <tr>
            <td align="center" style="padding: 40px 20px;">
              <table role="presentation" style="max-width: 600px; width: 100%; background-color: #1a2744; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);">
                
                <!-- Header -->
                <tr>
                  <td style="background: linear-gradient(135deg, #00b4d8 0%, #0096c7 100%); padding: 40px 30px; text-align: center;">
                    <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">
                      🎉 Acesso Liberado!
                    </h1>
                  </td>
                </tr>
                
                <!-- Content -->
                <tr>
                  <td style="padding: 40px 30px;">
                    <p style="margin: 0 0 20px; color: #e0e0e0; font-size: 16px; line-height: 1.6;">
                      Olá${memberName ? ` <strong>${memberName}</strong>` : ""}!
                    </p>
                    
                    <p style="margin: 0 0 25px; color: #e0e0e0; font-size: 16px; line-height: 1.6;">
                      Sua compra foi confirmada e seu acesso ao produto está liberado:
                    </p>
                    
                    <!-- Product Card -->
                    <table role="presentation" style="width: 100%; background-color: #243352; border-radius: 12px; margin-bottom: 25px;">
                      <tr>
                        <td style="padding: 20px;">
                          <h2 style="margin: 0 0 10px; color: #00b4d8; font-size: 20px;">
                            ${productName}
                          </h2>
                          <p style="margin: 0; color: #a0a0a0; font-size: 14px;">
                            ${expirationText}
                          </p>
                        </td>
                      </tr>
                    </table>
                    
                    <!-- CTA Button -->
                    <table role="presentation" style="width: 100%; margin-bottom: 30px;">
                      <tr>
                        <td align="center">
                          <a href="${membersLoginUrl}" style="display: inline-block; background: linear-gradient(135deg, #00b4d8 0%, #0096c7 100%); color: #0a1628; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-weight: bold; font-size: 16px;">
                            Acessar Área de Membros
                          </a>
                        </td>
                      </tr>
                    </table>
                    
                    <!-- Instructions -->
                    <div style="background-color: #243352; border-radius: 12px; padding: 20px; margin-bottom: 25px;">
                      <h3 style="margin: 0 0 15px; color: #ffffff; font-size: 16px;">
                        📌 Como acessar:
                      </h3>
                      <ol style="margin: 0; padding-left: 20px; color: #a0a0a0; font-size: 14px; line-height: 1.8;">
                        <li>Clique no botão acima ou acesse o link abaixo</li>
                        <li>Faça login com o email: <strong style="color: #00b4d8;">${memberEmail}</strong></li>
                        <li>Se for seu primeiro acesso, cadastre uma senha</li>
                        <li>Aproveite todo o conteúdo!</li>
                      </ol>
                    </div>
                    
                    <p style="margin: 0; color: #a0a0a0; font-size: 14px; line-height: 1.6;">
                      Link direto: <a href="${membersLoginUrl}" style="color: #00b4d8; text-decoration: underline;">${membersLoginUrl}</a>
                    </p>
                  </td>
                </tr>
                
                <!-- Footer -->
                <tr>
                  <td style="background-color: #0f1d32; padding: 25px 30px; text-align: center; border-top: 1px solid #2a3a54;">
                    <p style="margin: 0 0 10px; color: #a0a0a0; font-size: 14px;">
                      ${sellerName ? `Vendido por: ${sellerName}` : "Gateflow - Plataforma de Pagamentos"}
                    </p>
                    <p style="margin: 0; color: #666666; font-size: 12px;">
                      Este email foi enviado porque você realizou uma compra.
                    </p>
                  </td>
                </tr>
                
              </table>
            </td>
          </tr>
        </table>
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
        from: "Gateflow <onboarding@resend.dev>",
        to: [memberEmail],
        subject: `Seu acesso ao ${productName} está liberado! 🎉`,
        html: emailHtml,
      }),
    });

    const result = await emailResponse.json();
    
    if (!emailResponse.ok) {
      console.error("Resend API error:", result);
      
      // Log failed email if memberId is provided
      if (memberId) {
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        const supabase = createClient(supabaseUrl, supabaseServiceKey);
        
        await supabase.from("member_email_logs").insert({
          member_id: memberId,
          email_type: autoSend ? "auto_access" : "access",
          recipient_email: memberEmail,
          subject: `Seu acesso ao ${productName} está liberado! 🎉`,
          status: "failed",
          error_message: result.message || "Failed to send email",
        });
      }
      
      throw new Error(result.message || "Failed to send email");
    }

    console.log("Email sent successfully:", result);

    // Log successful email if memberId is provided
    if (memberId) {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      
      await supabase.from("member_email_logs").insert({
        member_id: memberId,
        email_type: autoSend ? "auto_access" : "access",
        recipient_email: memberEmail,
        subject: `Seu acesso ao ${productName} está liberado! 🎉`,
        status: "sent",
      });
      
      console.log("Email log saved for member:", memberId);
    }

    return new Response(JSON.stringify({ success: true, data: result }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-member-access-email function:", error);
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
