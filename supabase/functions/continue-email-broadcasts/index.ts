import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const RESEND_FROM_EMAIL = Deno.env.get("RESEND_FROM_EMAIL") || "noreply@resend.dev";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Maximum execution time in milliseconds (leaving buffer for cleanup)
const MAX_EXECUTION_TIME_MS = 50000; // 50 seconds

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
      console.error("[ContinueEmailBroadcasts] Resend error:", data);
      return { success: false, error: data.message || "Failed to send email" };
    }

    return { success: true };
  } catch (error: unknown) {
    console.error("[ContinueEmailBroadcasts] Error sending email:", error);
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

  const startTime = Date.now();
  console.log("[ContinueEmailBroadcasts] Starting execution at", new Date().toISOString());

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get all running email broadcasts
    const { data: broadcasts, error: broadcastsError } = await supabase
      .from("email_broadcasts")
      .select("*")
      .eq("status", "running")
      .order("started_at", { ascending: true });

    if (broadcastsError) {
      throw new Error(`Failed to fetch broadcasts: ${broadcastsError.message}`);
    }

    if (!broadcasts || broadcasts.length === 0) {
      console.log("[ContinueEmailBroadcasts] No running broadcasts found");
      return new Response(
        JSON.stringify({ success: true, message: "No running broadcasts" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[ContinueEmailBroadcasts] Found ${broadcasts.length} running broadcast(s)`);

    let totalProcessed = 0;
    let totalSent = 0;
    let totalFailed = 0;

    // Process each broadcast
    for (const broadcast of broadcasts) {
      const remainingExecutionTime = MAX_EXECUTION_TIME_MS - (Date.now() - startTime);
      if (remainingExecutionTime < 10000) {
        console.log("[ContinueEmailBroadcasts] Not enough time remaining, stopping");
        break;
      }

      console.log(`[ContinueEmailBroadcasts] Processing broadcast: ${broadcast.id} (${broadcast.name})`);

      const minInterval = broadcast.interval_min_seconds || 3;
      const maxInterval = broadcast.interval_max_seconds || 8;

      // Calculate how many emails we can send given the remaining time and interval
      const avgInterval = (minInterval + maxInterval) / 2;
      const estimatedEmails = Math.floor(remainingExecutionTime / 1000 / avgInterval);
      const batchSize = Math.min(50, Math.max(estimatedEmails, 2));

      // Get pending recipients
      const { data: recipients, error: recipientsError } = await supabase
        .from("email_broadcast_recipients")
        .select("*")
        .eq("broadcast_id", broadcast.id)
        .eq("status", "pending")
        .order("created_at", { ascending: true })
        .limit(batchSize);

      if (recipientsError) {
        console.error(`[ContinueEmailBroadcasts] Error fetching recipients for ${broadcast.id}:`, recipientsError);
        continue;
      }

      if (!recipients || recipients.length === 0) {
        // Check if all recipients are processed
        const { count } = await supabase
          .from("email_broadcast_recipients")
          .select("*", { count: "exact", head: true })
          .eq("broadcast_id", broadcast.id)
          .eq("status", "pending");

        if (count === 0) {
          console.log(`[ContinueEmailBroadcasts] Broadcast ${broadcast.id} completed - no more pending recipients`);
          
          await supabase
            .from("email_broadcasts")
            .update({ 
              status: "completed", 
              completed_at: new Date().toISOString() 
            })
            .eq("id", broadcast.id);
        }
        continue;
      }

      console.log(`[ContinueEmailBroadcasts] Processing ${recipients.length} recipients for broadcast ${broadcast.id}`);

      // Process recipients
      for (let i = 0; i < recipients.length; i++) {
        const recipient = recipients[i];
        
        // Check time remaining
        const timeElapsed = Date.now() - startTime;
        if (timeElapsed > MAX_EXECUTION_TIME_MS - 5000) {
          console.log("[ContinueEmailBroadcasts] Approaching time limit, stopping batch");
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
        const updateField = result.success ? "sent_count" : "failed_count";
        await supabase
          .from("email_broadcasts")
          .update({ 
            [updateField]: (broadcast[updateField] || 0) + 1,
            last_processing_at: new Date().toISOString()
          })
          .eq("id", broadcast.id);

        // Refetch the updated count for accurate logging
        if (result.success) {
          totalSent++;
          broadcast.sent_count = (broadcast.sent_count || 0) + 1;
        } else {
          totalFailed++;
          broadcast.failed_count = (broadcast.failed_count || 0) + 1;
        }
        totalProcessed++;

        console.log(`[ContinueEmailBroadcasts] Sent email to ${recipient.email}: ${result.success ? "success" : "failed"}`);

        // Wait for random interval before next email (skip if last recipient)
        if (i < recipients.length - 1) {
          const randomInterval = getRandomInterval(minInterval, maxInterval);
          const remainingTime = MAX_EXECUTION_TIME_MS - (Date.now() - startTime);

          // Check if we have enough time for the interval
          if (remainingTime < (randomInterval + 5) * 1000) {
            console.log(`[ContinueEmailBroadcasts] Not enough time for ${randomInterval}s interval, stopping batch`);
            break;
          }

          console.log(`[ContinueEmailBroadcasts] Waiting ${randomInterval}s before next email`);
          await sleep(randomInterval * 1000);
        }
      }
    }

    const executionTime = Date.now() - startTime;
    console.log(`[ContinueEmailBroadcasts] Completed. Processed: ${totalProcessed}, Sent: ${totalSent}, Failed: ${totalFailed}, Time: ${executionTime}ms`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        processed: totalProcessed,
        sent: totalSent,
        failed: totalFailed,
        executionTimeMs: executionTime
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("[ContinueEmailBroadcasts] Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
