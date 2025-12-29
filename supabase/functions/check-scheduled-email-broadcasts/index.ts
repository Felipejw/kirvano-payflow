import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log("[CheckScheduledEmailBroadcasts] Checking for scheduled email broadcasts...");

    // Find email broadcasts that are scheduled and due
    const { data: scheduledBroadcasts, error } = await supabase
      .from("email_broadcasts")
      .select("id, name, scheduled_at")
      .eq("status", "scheduled")
      .lte("scheduled_at", new Date().toISOString())
      .order("scheduled_at", { ascending: true });

    if (error) {
      console.error("[CheckScheduledEmailBroadcasts] Error fetching scheduled broadcasts:", error);
      return new Response(
        JSON.stringify({ error: "Error fetching scheduled broadcasts" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[CheckScheduledEmailBroadcasts] Found ${scheduledBroadcasts?.length || 0} email broadcasts to start`);

    const startedBroadcasts: string[] = [];
    const failedBroadcasts: { id: string; error: string }[] = [];

    // Start each scheduled broadcast
    for (const broadcast of scheduledBroadcasts || []) {
      console.log(`[CheckScheduledEmailBroadcasts] Starting scheduled email broadcast: ${broadcast.name} (ID: ${broadcast.id})`);

      try {
        // Call the email-broadcast function to start
        const { error: invokeError } = await supabase.functions.invoke("email-broadcast", {
          body: { action: "start", broadcastId: broadcast.id }
        });

        if (invokeError) {
          console.error(`[CheckScheduledEmailBroadcasts] Error starting broadcast ${broadcast.id}:`, invokeError);
          failedBroadcasts.push({ id: broadcast.id, error: invokeError.message });
        } else {
          console.log(`[CheckScheduledEmailBroadcasts] Successfully started email broadcast: ${broadcast.id}`);
          startedBroadcasts.push(broadcast.id);
        }
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : "Unknown error";
        console.error(`[CheckScheduledEmailBroadcasts] Exception starting broadcast ${broadcast.id}:`, err);
        failedBroadcasts.push({ id: broadcast.id, error: errorMessage });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        started: startedBroadcasts.length,
        failed: failedBroadcasts.length,
        startedBroadcasts,
        failedBroadcasts,
        message: `Started ${startedBroadcasts.length} scheduled email broadcasts, ${failedBroadcasts.length} failed`
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("[CheckScheduledEmailBroadcasts] Error:", error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
