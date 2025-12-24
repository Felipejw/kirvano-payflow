import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface BroadcastRequest {
  action: 'start' | 'pause' | 'cancel' | 'resume';
  broadcastId: string;
}

// Format phone number to Brazilian format
function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('55')) {
    return cleaned;
  }
  return `55${cleaned}`;
}

// Get random interval between min and max
function getRandomInterval(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Send text message via Z-API
async function sendText(phone: string, message: string, instanceId: string, token: string): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(`https://api.z-api.io/instances/${instanceId}/token/${token}/send-text`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone: formatPhone(phone),
        message
      })
    });
    
    const data = await response.json();
    console.log(`[Z-API Text] Response for ${phone}:`, JSON.stringify(data));
    
    if (!response.ok || data.error) {
      return { success: false, error: data.error || data.message || 'Erro ao enviar mensagem' };
    }
    
    return { success: true };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[Z-API Text] Error for ${phone}:`, error);
    return { success: false, error: errorMessage };
  }
}

// Send image via Z-API
async function sendImage(phone: string, imageUrl: string, caption: string, instanceId: string, token: string): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(`https://api.z-api.io/instances/${instanceId}/token/${token}/send-image`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone: formatPhone(phone),
        image: imageUrl,
        caption
      })
    });
    
    const data = await response.json();
    console.log(`[Z-API Image] Response for ${phone}:`, JSON.stringify(data));
    
    if (!response.ok || data.error) {
      return { success: false, error: data.error || data.message || 'Erro ao enviar imagem' };
    }
    
    return { success: true };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[Z-API Image] Error for ${phone}:`, error);
    return { success: false, error: errorMessage };
  }
}

// Send video via Z-API
async function sendVideo(phone: string, videoUrl: string, caption: string, instanceId: string, token: string): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(`https://api.z-api.io/instances/${instanceId}/token/${token}/send-video`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone: formatPhone(phone),
        video: videoUrl,
        caption
      })
    });
    
    const data = await response.json();
    console.log(`[Z-API Video] Response for ${phone}:`, JSON.stringify(data));
    
    if (!response.ok || data.error) {
      return { success: false, error: data.error || data.message || 'Erro ao enviar vídeo' };
    }
    
    return { success: true };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[Z-API Video] Error for ${phone}:`, error);
    return { success: false, error: errorMessage };
  }
}

// Send document via Z-API
async function sendDocument(phone: string, documentUrl: string, fileName: string, instanceId: string, token: string): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(`https://api.z-api.io/instances/${instanceId}/token/${token}/send-document`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone: formatPhone(phone),
        document: documentUrl,
        fileName: fileName || 'documento'
      })
    });
    
    const data = await response.json();
    console.log(`[Z-API Document] Response for ${phone}:`, JSON.stringify(data));
    
    if (!response.ok || data.error) {
      return { success: false, error: data.error || data.message || 'Erro ao enviar documento' };
    }
    
    return { success: true };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[Z-API Document] Error for ${phone}:`, error);
    return { success: false, error: errorMessage };
  }
}

// Sleep function
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const zapiInstanceId = Deno.env.get('ZAPI_INSTANCE_ID');
    const zapiToken = Deno.env.get('ZAPI_TOKEN');

    if (!zapiInstanceId || !zapiToken) {
      console.error('[Broadcast] Z-API credentials not configured');
      return new Response(
        JSON.stringify({ error: 'Z-API credentials not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { action, broadcastId } = await req.json() as BroadcastRequest;

    console.log(`[Broadcast] Action: ${action}, Broadcast ID: ${broadcastId}`);

    // Get broadcast details
    const { data: broadcast, error: broadcastError } = await supabase
      .from('whatsapp_broadcasts')
      .select('*')
      .eq('id', broadcastId)
      .single();

    if (broadcastError || !broadcast) {
      console.error('[Broadcast] Not found:', broadcastError);
      return new Response(
        JSON.stringify({ error: 'Broadcast not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Handle different actions
    if (action === 'pause') {
      await supabase
        .from('whatsapp_broadcasts')
        .update({ status: 'paused' })
        .eq('id', broadcastId);

      return new Response(
        JSON.stringify({ success: true, message: 'Broadcast pausado' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'cancel') {
      await supabase
        .from('whatsapp_broadcasts')
        .update({ status: 'cancelled', completed_at: new Date().toISOString() })
        .eq('id', broadcastId);

      return new Response(
        JSON.stringify({ success: true, message: 'Broadcast cancelado' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Start or resume broadcast
    if (action === 'start' || action === 'resume') {
      // Update status to running
      await supabase
        .from('whatsapp_broadcasts')
        .update({ 
          status: 'running', 
          started_at: action === 'start' ? new Date().toISOString() : broadcast.started_at 
        })
        .eq('id', broadcastId);

      // Get pending recipients
      const { data: recipients, error: recipientsError } = await supabase
        .from('whatsapp_broadcast_recipients')
        .select('*')
        .eq('broadcast_id', broadcastId)
        .eq('status', 'pending')
        .order('created_at', { ascending: true });

      if (recipientsError) {
        console.error('[Broadcast] Error fetching recipients:', recipientsError);
        return new Response(
          JSON.stringify({ error: 'Error fetching recipients' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log(`[Broadcast] Processing ${recipients?.length || 0} recipients`);

      // Get interval range
      const minInterval = broadcast.interval_min_seconds || broadcast.interval_seconds || 30;
      const maxInterval = broadcast.interval_max_seconds || minInterval + 15;

      console.log(`[Broadcast] Using random interval between ${minInterval}s and ${maxInterval}s`);

      // Process recipients in background
      const processRecipients = async () => {
        let sentCount = broadcast.sent_count || 0;
        let failedCount = broadcast.failed_count || 0;

        for (const recipient of recipients || []) {
          // Check if broadcast was paused or cancelled
          const { data: currentBroadcast } = await supabase
            .from('whatsapp_broadcasts')
            .select('status')
            .eq('id', broadcastId)
            .single();

          if (currentBroadcast?.status === 'paused' || currentBroadcast?.status === 'cancelled') {
            console.log(`[Broadcast] Stopped - status is ${currentBroadcast.status}`);
            break;
          }

          // Prepare message with name replacement
          const personalizedMessage = broadcast.message.replace(/\{\{nome\}\}/gi, recipient.name || 'Cliente');

          let result: { success: boolean; error?: string };

          // Send based on media type
          if (broadcast.media_type === 'image' && broadcast.media_url) {
            result = await sendImage(recipient.phone, broadcast.media_url, personalizedMessage, zapiInstanceId, zapiToken);
          } else if (broadcast.media_type === 'video' && broadcast.media_url) {
            result = await sendVideo(recipient.phone, broadcast.media_url, personalizedMessage, zapiInstanceId, zapiToken);
          } else if (broadcast.media_type === 'document' && broadcast.media_url) {
            const fileName = broadcast.media_url.split('/').pop() || 'documento';
            result = await sendDocument(recipient.phone, broadcast.media_url, fileName, zapiInstanceId, zapiToken);
            // Send text message after document
            if (result.success && personalizedMessage) {
              await sleep(2000);
              await sendText(recipient.phone, personalizedMessage, zapiInstanceId, zapiToken);
            }
          } else {
            result = await sendText(recipient.phone, personalizedMessage, zapiInstanceId, zapiToken);
          }

          // Update recipient status
          if (result.success) {
            sentCount++;
            await supabase
              .from('whatsapp_broadcast_recipients')
              .update({ 
                status: 'sent', 
                sent_at: new Date().toISOString() 
              })
              .eq('id', recipient.id);
          } else {
            failedCount++;
            await supabase
              .from('whatsapp_broadcast_recipients')
              .update({ 
                status: 'failed', 
                error_message: result.error,
                sent_at: new Date().toISOString() 
              })
              .eq('id', recipient.id);
          }

          // Update broadcast counts
          await supabase
            .from('whatsapp_broadcasts')
            .update({ sent_count: sentCount, failed_count: failedCount })
            .eq('id', broadcastId);

          console.log(`[Broadcast] Processed ${recipient.phone}: ${result.success ? 'sent' : 'failed'}`);

          // Wait for random interval before next message
          const randomInterval = getRandomInterval(minInterval, maxInterval);
          console.log(`[Broadcast] Waiting ${randomInterval}s before next message`);
          await sleep(randomInterval * 1000);
        }

        // Check final status
        const { data: finalBroadcast } = await supabase
          .from('whatsapp_broadcasts')
          .select('status')
          .eq('id', broadcastId)
          .single();

        // Mark as completed if still running
        if (finalBroadcast?.status === 'running') {
          await supabase
            .from('whatsapp_broadcasts')
            .update({ status: 'completed', completed_at: new Date().toISOString() })
            .eq('id', broadcastId);
        }

        console.log(`[Broadcast] Finished. Sent: ${sentCount}, Failed: ${failedCount}`);
      };

      // Run in background - start processing and return immediately
      processRecipients().catch((err) => {
        console.error('[Broadcast] Background processing error:', err);
      });

      return new Response(
        JSON.stringify({ success: true, message: 'Broadcast iniciado' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Broadcast] Error:', error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
