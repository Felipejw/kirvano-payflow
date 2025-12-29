import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const RESEND_FROM_EMAIL = Deno.env.get("RESEND_FROM_EMAIL") || "noreply@resend.dev";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailBroadcastRequest {
  action: "start" | "pause" | "resume" | "cancel";
  broadcastId: string;
}

interface SendEmailResult {
  success: boolean;
  error?: string;
}

// Send a single email via Resend
async function sendEmail(
  to: string,
  subject: string,
  html: string,
  recipientName?: string
): Promise<SendEmailResult> {
  if (!RESEND_API_KEY) {
    return { success: false, error: "RESEND_API_KEY not configured" };
  }

  try {
    // Replace placeholders
    let personalizedHtml = html;
    if (recipientName) {
      personalizedHtml = html.replace(/\{\{nome\}\}/gi, recipientName);
      personalizedHtml = personalizedHtml.replace(/\{\{name\}\}/gi, recipientName);
    }

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: RESEND_FROM_EMAIL,
        to: [to],
        subject,
        html: personalizedHtml,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("[EmailBroadcast] Resend error:", data);
      return { success: false, error: data.message || "Failed to send email" };
    }

    console.log(`[EmailBroadcast] Email sent successfully to ${to}`);
    return { success: true };
  } catch (error: unknown) {
    console.error("[EmailBroadcast] Error sending email:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return { success: false, error: errorMessage };
  }
}

// Sleep helper
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Get random interval between min and max seconds
function getRandomInterval(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { action, broadcastId }: EmailBroadcastRequest = await req.json();

    console.log(`[EmailBroadcast] Action: ${action}, Broadcast ID: ${broadcastId}`);

    if (!broadcastId) {
      throw new Error("broadcastId is required");
    }

    // Get broadcast details
    const { data: broadcast, error: broadcastError } = await supabase
      .from("email_broadcasts")
      .select("*")
      .eq("id", broadcastId)
      .single();

    if (broadcastError || !broadcast) {
      throw new Error(`Broadcast not found: ${broadcastError?.message}`);
    }

    switch (action) {
      case "start": {
        if (broadcast.status !== "draft" && broadcast.status !== "scheduled") {
          throw new Error(`Cannot start broadcast with status: ${broadcast.status}`);
        }

        // Update status to running
        await supabase
          .from("email_broadcasts")
          .update({ 
            status: "running", 
            started_at: new Date().toISOString(),
            last_processing_at: new Date().toISOString()
          })
          .eq("id", broadcastId);

        console.log(`[EmailBroadcast] Broadcast ${broadcastId} started`);

        // Start processing in background
        const processEmails = async () => {
          const minInterval = broadcast.interval_min_seconds || 3;
          const maxInterval = broadcast.interval_max_seconds || 8;

          while (true) {
            // Check current status
            const { data: currentBroadcast } = await supabase
              .from("email_broadcasts")
              .select("status")
              .eq("id", broadcastId)
              .single();

            if (!currentBroadcast || currentBroadcast.status !== "running") {
              console.log(`[EmailBroadcast] Broadcast ${broadcastId} is no longer running, stopping`);
              break;
            }

            // Get next pending recipient
            const { data: recipient, error: recipientError } = await supabase
              .from("email_broadcast_recipients")
              .select("*")
              .eq("broadcast_id", broadcastId)
              .eq("status", "pending")
              .order("created_at", { ascending: true })
              .limit(1)
              .single();

            if (recipientError || !recipient) {
              // No more pending recipients
              console.log(`[EmailBroadcast] All emails sent for broadcast ${broadcastId}`);
              
              await supabase
                .from("email_broadcasts")
                .update({ 
                  status: "completed", 
                  completed_at: new Date().toISOString() 
                })
                .eq("id", broadcastId);
              
              break;
            }

            // Send email
            const result = await sendEmail(
              recipient.email,
              broadcast.subject,
              broadcast.html_content,
              recipient.name
            );

            // Update recipient status
            await supabase
              .from("email_broadcast_recipients")
              .update({
                status: result.success ? "sent" : "failed",
                error_message: result.error || null,
                sent_at: result.success ? new Date().toISOString() : null,
              })
              .eq("id", recipient.id);

            // Update broadcast counters
            if (result.success) {
              await supabase.rpc("increment_email_broadcast_sent", { broadcast_id: broadcastId });
            } else {
              await supabase.rpc("increment_email_broadcast_failed", { broadcast_id: broadcastId });
            }

            // Update last processing time
            await supabase
              .from("email_broadcasts")
              .update({ last_processing_at: new Date().toISOString() })
              .eq("id", broadcastId);

            // Wait for random interval before next email
            const interval = getRandomInterval(minInterval, maxInterval);
            console.log(`[EmailBroadcast] Waiting ${interval}s before next email`);
            await sleep(interval * 1000);
          }
        };

        // Start processing in background (fire and forget)
        // The cron job will continue processing if this times out
        processEmails().catch(err => {
          console.error("[EmailBroadcast] Background processing error:", err);
        });

        return new Response(
          JSON.stringify({ success: true, message: "Broadcast started" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "pause": {
        if (broadcast.status !== "running") {
          throw new Error(`Cannot pause broadcast with status: ${broadcast.status}`);
        }

        await supabase
          .from("email_broadcasts")
          .update({ status: "paused" })
          .eq("id", broadcastId);

        console.log(`[EmailBroadcast] Broadcast ${broadcastId} paused`);

        return new Response(
          JSON.stringify({ success: true, message: "Broadcast paused" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "resume": {
        if (broadcast.status !== "paused") {
          throw new Error(`Cannot resume broadcast with status: ${broadcast.status}`);
        }

        // Update status and let the cron job continue processing
        await supabase
          .from("email_broadcasts")
          .update({ 
            status: "running",
            last_processing_at: new Date().toISOString()
          })
          .eq("id", broadcastId);

        console.log(`[EmailBroadcast] Broadcast ${broadcastId} resumed`);

        return new Response(
          JSON.stringify({ success: true, message: "Broadcast resumed" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "cancel": {
        await supabase
          .from("email_broadcasts")
          .update({ 
            status: "cancelled",
            completed_at: new Date().toISOString()
          })
          .eq("id", broadcastId);

        console.log(`[EmailBroadcast] Broadcast ${broadcastId} cancelled`);

        return new Response(
          JSON.stringify({ success: true, message: "Broadcast cancelled" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      default:
        throw new Error(`Unknown action: ${action}`);
    }
  } catch (error: unknown) {
    console.error("[EmailBroadcast] Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
