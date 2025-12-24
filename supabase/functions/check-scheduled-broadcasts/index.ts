import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('[Scheduler] Checking for scheduled broadcasts...');

    // Find broadcasts that are scheduled and due
    const { data: scheduledBroadcasts, error } = await supabase
      .from('whatsapp_broadcasts')
      .select('id, name, scheduled_at')
      .eq('status', 'scheduled')
      .lte('scheduled_at', new Date().toISOString())
      .order('scheduled_at', { ascending: true });

    if (error) {
      console.error('[Scheduler] Error fetching scheduled broadcasts:', error);
      return new Response(
        JSON.stringify({ error: 'Error fetching scheduled broadcasts' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[Scheduler] Found ${scheduledBroadcasts?.length || 0} broadcasts to start`);

    // Start each scheduled broadcast
    for (const broadcast of scheduledBroadcasts || []) {
      console.log(`[Scheduler] Starting scheduled broadcast: ${broadcast.name} (ID: ${broadcast.id})`);

      // Call the whatsapp-broadcast function to start
      const { error: invokeError } = await supabase.functions.invoke('whatsapp-broadcast', {
        body: { action: 'start', broadcastId: broadcast.id }
      });

      if (invokeError) {
        console.error(`[Scheduler] Error starting broadcast ${broadcast.id}:`, invokeError);
      } else {
        console.log(`[Scheduler] Successfully started broadcast: ${broadcast.id}`);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        started: scheduledBroadcasts?.length || 0,
        message: `Started ${scheduledBroadcasts?.length || 0} scheduled broadcasts` 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Scheduler] Error:', error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
