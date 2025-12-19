import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface MessageInterval {
  type: "minutes" | "hours" | "days";
  value: number;
  channel: "whatsapp" | "email" | "both";
}

interface RecoveryCampaign {
  id: string;
  seller_id: string;
  is_active: boolean;
  message_intervals: MessageInterval[];
}

interface ExpiredCharge {
  id: string;
  product_id: string;
  seller_id: string;
  buyer_email: string;
  buyer_name: string;
  buyer_phone: string;
  amount: number;
  expires_at: string;
  created_at: string;
  product_name?: string;
}

function createServiceClient() {
  return createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );
}

function intervalToMinutes(interval: MessageInterval): number {
  switch (interval.type) {
    case "minutes":
      return interval.value;
    case "hours":
      return interval.value * 60;
    case "days":
      return interval.value * 60 * 24;
    default:
      return interval.value;
  }
}

async function sendRecoveryWhatsApp(
  phone: string,
  buyerName: string,
  productName: string,
  amount: number,
  checkoutUrl: string
): Promise<{ success: boolean; error: string }> {
  const instanceId = Deno.env.get("ZAPI_INSTANCE_ID");
  const token = Deno.env.get("ZAPI_TOKEN");
  const clientToken = Deno.env.get("ZAPI_CLIENT_TOKEN");

  if (!instanceId || !token) {
    return { success: false, error: "Z-API credentials not configured" };
  }

  const formattedPhone = phone.replace(/\D/g, "").startsWith("55")
    ? phone.replace(/\D/g, "")
    : `55${phone.replace(/\D/g, "")}`;

  const message = `🔔 *Olá, ${buyerName || "Cliente"}!*

Notamos que seu pagamento para *${productName}* ainda está pendente.

💰 Valor: R$ ${amount.toFixed(2).replace(".", ",")}

Clique no link abaixo para finalizar sua compra:
${checkoutUrl}

Se tiver alguma dúvida, estamos à disposição! 😊`;

  try {
    const response = await fetch(
      `https://api.z-api.io/instances/${instanceId}/token/${token}/send-text`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Client-Token": clientToken || "",
        },
        body: JSON.stringify({
          phone: formattedPhone,
          message: message,
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      return { success: false, error: `Z-API error: ${errorText}` };
    }

    return { success: true, error: "" };
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    return { success: false, error: `WhatsApp send error: ${errorMessage}` };
  }
}

async function sendRecoveryEmail(
  email: string,
  buyerName: string,
  productName: string,
  amount: number,
  checkoutUrl: string
): Promise<{ success: boolean; error: string }> {
  const resendApiKey = Deno.env.get("RESEND_API_KEY");
  const fromEmail = Deno.env.get("RESEND_FROM_EMAIL") || "onboarding@resend.dev";

  if (!resendApiKey) {
    return { success: false, error: "Resend API key not configured" };
  }

  const GATEFLOW_LOGO_URL = "https://via.placeholder.com/180x50/0a1628/00b4d8?text=GateFlow";

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Complete sua compra</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0a1628; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #0a1628;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="100%" style="max-width: 600px; background-color: #111d32; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 30px rgba(0, 180, 216, 0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 30px 40px; text-align: center; background: linear-gradient(135deg, #0a1628 0%, #1a2d4a 100%); border-bottom: 1px solid rgba(0, 180, 216, 0.2);">
              <img src="${GATEFLOW_LOGO_URL}" alt="GateFlow" style="height: 40px; width: auto;">
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <div style="text-align: center; margin-bottom: 30px;">
                <div style="width: 70px; height: 70px; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
                  <span style="font-size: 32px;">⏰</span>
                </div>
                <h1 style="color: #ffffff; font-size: 24px; margin: 0 0 10px;">Você esqueceu algo!</h1>
                <p style="color: #94a3b8; font-size: 16px; margin: 0;">Sua compra está quase completa</p>
              </div>
              
              <p style="color: #e2e8f0; font-size: 16px; line-height: 1.6; margin-bottom: 25px;">
                Olá${buyerName ? `, <strong>${buyerName}</strong>` : ""}!
              </p>
              
              <p style="color: #94a3b8; font-size: 15px; line-height: 1.6; margin-bottom: 25px;">
                Notamos que você iniciou a compra de <strong style="color: #00b4d8;">${productName}</strong>, mas o pagamento ainda não foi finalizado.
              </p>

              <!-- Product Box -->
              <div style="background: rgba(0, 180, 216, 0.1); border: 1px solid rgba(0, 180, 216, 0.2); border-radius: 12px; padding: 20px; margin-bottom: 30px;">
                <p style="color: #94a3b8; font-size: 14px; margin: 0 0 5px;">Produto:</p>
                <p style="color: #ffffff; font-size: 18px; font-weight: 600; margin: 0 0 15px;">${productName}</p>
                <p style="color: #94a3b8; font-size: 14px; margin: 0 0 5px;">Valor:</p>
                <p style="color: #22c55e; font-size: 24px; font-weight: 700; margin: 0;">R$ ${amount.toFixed(2).replace(".", ",")}</p>
              </div>

              <!-- CTA Button -->
              <div style="text-align: center; margin: 30px 0;">
                <a href="${checkoutUrl}" style="display: inline-block; background: linear-gradient(135deg, #00b4d8 0%, #0090b0 100%); color: #0a1628; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-weight: 700; font-size: 16px; box-shadow: 0 4px 15px rgba(0, 180, 216, 0.3);">
                  FINALIZAR COMPRA
                </a>
              </div>

              <p style="color: #64748b; font-size: 13px; text-align: center; margin-top: 30px;">
                Se você já realizou o pagamento, por favor desconsidere este e-mail.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 20px 40px; background-color: rgba(0, 0, 0, 0.2); border-top: 1px solid rgba(255, 255, 255, 0.05);">
              <p style="color: #64748b; font-size: 12px; text-align: center; margin: 0;">
                Powered by <strong style="color: #00b4d8;">GateFlow</strong>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: `GateFlow <${fromEmail}>`,
        to: [email],
        subject: `⏰ Finalize sua compra: ${productName}`,
        html: htmlContent,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return { success: false, error: `Resend error: ${errorText}` };
    }

    return { success: true, error: "" };
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    return { success: false, error: `Email send error: ${errorMessage}` };
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createServiceClient();

    // Check for manual send request
    let body: { manual?: boolean; charge_id?: string; channel?: string; campaign_id?: string } = {};
    try {
      body = await req.json();
    } catch {
      // No body or invalid JSON - proceed with automatic processing
    }

    // Handle manual send
    if (body.manual && body.charge_id && body.channel && body.campaign_id) {
      console.log(`Manual send requested for charge ${body.charge_id} via ${body.channel}`);

      // Get the charge details
      const { data: charge, error: chargeError } = await supabase
        .from("pix_charges")
        .select(`
          id,
          product_id,
          seller_id,
          buyer_email,
          buyer_name,
          buyer_phone,
          amount,
          expires_at,
          status,
          products!inner(name)
        `)
        .eq("id", body.charge_id)
        .single();

      if (chargeError || !charge) {
        return new Response(
          JSON.stringify({ success: false, error: "Charge not found" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Get message count for this charge
      const { data: existingMessages } = await supabase
        .from("recovery_messages")
        .select("*")
        .eq("original_charge_id", charge.id);

      const sentCount = existingMessages?.length || 0;
      const productName = (charge as any).products?.name || "Produto";
      const baseUrl = Deno.env.get("SUPABASE_URL")?.replace(".supabase.co", ".lovable.app") || "";
      const checkoutUrl = `${baseUrl}/checkout/${charge.product_id}?recovery=${charge.id}`;

      let result = { success: false, error: "" };

      if (body.channel === "whatsapp" && charge.buyer_phone) {
        result = await sendRecoveryWhatsApp(
          charge.buyer_phone,
          charge.buyer_name || "",
          productName,
          charge.amount,
          checkoutUrl
        );
      } else if (body.channel === "email" && charge.buyer_email) {
        result = await sendRecoveryEmail(
          charge.buyer_email,
          charge.buyer_name || "",
          productName,
          charge.amount,
          checkoutUrl
        );
      } else {
        return new Response(
          JSON.stringify({ success: false, error: "Invalid channel or missing contact info" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Log the manual message
      await supabase.from("recovery_messages").insert({
        original_charge_id: charge.id,
        campaign_id: body.campaign_id,
        seller_id: charge.seller_id,
        channel: body.channel,
        status: result.success ? "sent" : "failed",
        message_number: sentCount + 1,
        sent_at: new Date().toISOString(),
        error_message: result.error || null,
      });

      return new Response(
        JSON.stringify({ success: result.success, error: result.error }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Automatic processing (original logic)
    // Check if recovery is enabled globally
    const { data: settings } = await supabase
      .from("recovery_settings")
      .select("*")
      .single();

    if (!settings?.is_enabled) {
      console.log("Recovery service is disabled globally");
      return new Response(
        JSON.stringify({ message: "Recovery service is disabled" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Recovery settings:", settings);

    // Get all active recovery campaigns
    const { data: campaigns, error: campaignsError } = await supabase
      .from("recovery_campaigns")
      .select("*")
      .eq("is_active", true);

    if (campaignsError) {
      throw new Error(`Error fetching campaigns: ${campaignsError.message}`);
    }

    if (!campaigns || campaigns.length === 0) {
      console.log("No active recovery campaigns found");
      return new Response(
        JSON.stringify({ message: "No active campaigns" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Found ${campaigns.length} active campaigns`);

    let totalProcessed = 0;
    let totalSent = 0;

    for (const campaign of campaigns as RecoveryCampaign[]) {
      // First, update any pending charges that have expired to 'expired' status
      const { error: updateError } = await supabase
        .from("pix_charges")
        .update({ status: "expired" })
        .eq("seller_id", campaign.seller_id)
        .eq("status", "pending")
        .lt("expires_at", new Date().toISOString());

      if (updateError) {
        console.error(`Error updating expired charges for seller ${campaign.seller_id}:`, updateError);
      }

      // Get expired charges for this seller that haven't been recovered yet
      const { data: expiredCharges, error: chargesError } = await supabase
        .from("pix_charges")
        .select(`
          id,
          product_id,
          seller_id,
          buyer_email,
          buyer_name,
          buyer_phone,
          amount,
          expires_at,
          created_at,
          products!inner(name)
        `)
        .eq("seller_id", campaign.seller_id)
        .eq("status", "expired")
        .eq("is_recovery", false)
        .is("original_charge_id", null);

      if (chargesError) {
        console.error(`Error fetching charges for seller ${campaign.seller_id}:`, chargesError);
        continue;
      }

      if (!expiredCharges || expiredCharges.length === 0) {
        console.log(`No expired charges for seller ${campaign.seller_id}`);
        continue;
      }

      console.log(`Found ${expiredCharges.length} expired charges for seller ${campaign.seller_id}`);

      for (const charge of expiredCharges) {
        totalProcessed++;

        // Check how many recovery messages have been sent for this charge
        const { data: existingMessages, error: messagesError } = await supabase
          .from("recovery_messages")
          .select("*")
          .eq("original_charge_id", charge.id)
          .order("message_number", { ascending: false });

        if (messagesError) {
          console.error(`Error fetching messages for charge ${charge.id}:`, messagesError);
          continue;
        }

        const sentCount = existingMessages?.length || 0;

        // Check if we've reached the max messages limit
        if (sentCount >= settings.max_messages_per_charge) {
          console.log(`Max messages reached for charge ${charge.id}`);
          continue;
        }

        // Determine which message to send based on intervals
        const intervals = campaign.message_intervals as MessageInterval[];
        if (sentCount >= intervals.length) {
          console.log(`No more intervals configured for charge ${charge.id}`);
          continue;
        }

        const currentInterval = intervals[sentCount];
        const intervalMinutes = intervalToMinutes(currentInterval);

        // Calculate when this message should be sent
        let referenceTime: Date;
        if (sentCount === 0) {
          // First message: use charge expiry time
          referenceTime = new Date(charge.expires_at);
        } else {
          // Subsequent messages: use last message sent time
          referenceTime = new Date(existingMessages[0].sent_at);
        }

        const sendAfter = new Date(referenceTime.getTime() + intervalMinutes * 60 * 1000);
        const now = new Date();

        // Check minimum interval from settings
        if (existingMessages && existingMessages.length > 0) {
          const lastSent = new Date(existingMessages[0].sent_at);
          const minIntervalMs = settings.min_interval_minutes * 60 * 1000;
          if (now.getTime() - lastSent.getTime() < minIntervalMs) {
            console.log(`Min interval not reached for charge ${charge.id}`);
            continue;
          }
        }

        if (now < sendAfter) {
          console.log(`Not time yet to send message ${sentCount + 1} for charge ${charge.id}`);
          continue;
        }

        // Get product name
        const productName = (charge as any).products?.name || "Produto";

        // Generate checkout URL for recovery
        const baseUrl = Deno.env.get("SUPABASE_URL")?.replace(".supabase.co", ".lovable.app") || "";
        const checkoutUrl = `${baseUrl}/checkout/${charge.product_id}?recovery=${charge.id}`;

        // Send message based on channel
        let whatsappResult = { success: false, error: "" };
        let emailResult = { success: false, error: "" };

        if (
          (currentInterval.channel === "whatsapp" || currentInterval.channel === "both") &&
          charge.buyer_phone
        ) {
          whatsappResult = await sendRecoveryWhatsApp(
            charge.buyer_phone,
            charge.buyer_name || "",
            productName,
            charge.amount,
            checkoutUrl
          );
        }

        if (
          (currentInterval.channel === "email" || currentInterval.channel === "both") &&
          charge.buyer_email
        ) {
          emailResult = await sendRecoveryEmail(
            charge.buyer_email,
            charge.buyer_name || "",
            productName,
            charge.amount,
            checkoutUrl
          );
        }

        const overallSuccess = whatsappResult.success || emailResult.success;
        const errorMessage = [
          whatsappResult.error,
          emailResult.error,
        ].filter(Boolean).join("; ");

        // Log the message
        const { error: insertError } = await supabase.from("recovery_messages").insert({
          original_charge_id: charge.id,
          campaign_id: campaign.id,
          seller_id: campaign.seller_id,
          channel: currentInterval.channel,
          status: overallSuccess ? "sent" : "failed",
          message_number: sentCount + 1,
          sent_at: new Date().toISOString(),
          error_message: errorMessage || null,
        });

        if (insertError) {
          console.error(`Error logging recovery message:`, insertError);
        }

        if (overallSuccess) {
          totalSent++;
          console.log(`Sent recovery message ${sentCount + 1} for charge ${charge.id}`);
        } else {
          console.error(`Failed to send recovery message for charge ${charge.id}:`, errorMessage);
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        processed: totalProcessed,
        sent: totalSent,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error("Recovery processing error:", errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
