import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('[ContinueBroadcasts] Starting check for running broadcasts...');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Find broadcasts that are running and have pending recipients
    // Also check that it's not currently being processed (last_processing_at > 90 seconds ago or null)
    const cutoffTime = new Date(Date.now() - 90 * 1000).toISOString(); // 90 seconds ago

    const { data: runningBroadcasts, error: fetchError } = await supabase
      .from('whatsapp_broadcasts')
      .select('id, name, total_recipients, sent_count, failed_count, last_processing_at')
      .eq('status', 'running')
      .or(`last_processing_at.is.null,last_processing_at.lt.${cutoffTime}`);

    if (fetchError) {
      console.error('[ContinueBroadcasts] Error fetching broadcasts:', fetchError);
      return new Response(
        JSON.stringify({ error: fetchError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!runningBroadcasts || runningBroadcasts.length === 0) {
      console.log('[ContinueBroadcasts] No running broadcasts found that need continuation');
      return new Response(
        JSON.stringify({ success: true, message: 'No broadcasts to continue', resumed: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[ContinueBroadcasts] Found ${runningBroadcasts.length} running broadcast(s)`);

    let resumed = 0;

    for (const broadcast of runningBroadcasts) {
      // Check if there are pending recipients
      const { count: pendingCount, error: countError } = await supabase
        .from('whatsapp_broadcast_recipients')
        .select('id', { count: 'exact', head: true })
        .eq('broadcast_id', broadcast.id)
        .eq('status', 'pending');

      if (countError) {
        console.error(`[ContinueBroadcasts] Error counting pending for ${broadcast.id}:`, countError);
        continue;
      }

      if (!pendingCount || pendingCount === 0) {
        // No more pending recipients, mark as completed
        console.log(`[ContinueBroadcasts] Broadcast ${broadcast.id} has no pending recipients, marking as completed`);
        
        await supabase
          .from('whatsapp_broadcasts')
          .update({ 
            status: 'completed',
            completed_at: new Date().toISOString()
          })
          .eq('id', broadcast.id);
        
        continue;
      }

      console.log(`[ContinueBroadcasts] Broadcast ${broadcast.id} (${broadcast.name}) has ${pendingCount} pending recipients, resuming...`);

      // Update last_processing_at to prevent other instances from picking it up
      await supabase
        .from('whatsapp_broadcasts')
        .update({ last_processing_at: new Date().toISOString() })
        .eq('id', broadcast.id);

      // Call the whatsapp-broadcast function to resume
      try {
        const response = await fetch(`${supabaseUrl}/functions/v1/whatsapp-broadcast`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseKey}`,
          },
          body: JSON.stringify({
            action: 'resume',
            broadcastId: broadcast.id,
          }),
        });

        if (response.ok) {
          console.log(`[ContinueBroadcasts] Successfully triggered resume for broadcast ${broadcast.id}`);
          resumed++;
        } else {
          const errorText = await response.text();
          console.error(`[ContinueBroadcasts] Failed to resume broadcast ${broadcast.id}:`, errorText);
        }
      } catch (invokeError) {
        console.error(`[ContinueBroadcasts] Error invoking resume for ${broadcast.id}:`, invokeError);
      }
    }

    console.log(`[ContinueBroadcasts] Finished. Resumed ${resumed} broadcast(s)`);

    return new Response(
      JSON.stringify({ success: true, message: `Resumed ${resumed} broadcast(s)`, resumed }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[ContinueBroadcasts] Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
