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
async function sendText(phone: string, message: string, instanceId: string, token: string, clientToken: string): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(`https://api.z-api.io/instances/${instanceId}/token/${token}/send-text`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Client-Token': clientToken
      },
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
async function sendImage(phone: string, imageUrl: string, caption: string, instanceId: string, token: string, clientToken: string): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(`https://api.z-api.io/instances/${instanceId}/token/${token}/send-image`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Client-Token': clientToken
      },
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
async function sendVideo(phone: string, videoUrl: string, caption: string, instanceId: string, token: string, clientToken: string): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(`https://api.z-api.io/instances/${instanceId}/token/${token}/send-video`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Client-Token': clientToken
      },
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
async function sendDocument(phone: string, documentUrl: string, fileName: string, instanceId: string, token: string, clientToken: string): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(`https://api.z-api.io/instances/${instanceId}/token/${token}/send-document`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Client-Token': clientToken
      },
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

// Send button actions via Z-API (URL and Call buttons)
async function sendButtonActions(
  phone: string, 
  message: string, 
  buttons: Array<{ type: string; label: string; value: string }>,
  instanceId: string, 
  token: string, 
  clientToken: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Build button actions array for Z-API
    const buttonList = buttons.map(btn => {
      if (btn.type === 'url') {
        return { id: `btn_${btn.type}`, type: 'URL', url: btn.value, label: btn.label };
      } else if (btn.type === 'call') {
        return { id: `btn_${btn.type}`, type: 'CALL', phoneNumber: btn.value, label: btn.label };
      }
      return null;
    }).filter(Boolean);

    const response = await fetch(`https://api.z-api.io/instances/${instanceId}/token/${token}/send-button-actions`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Client-Token': clientToken
      },
      body: JSON.stringify({
        phone: formatPhone(phone),
        message,
        buttonActions: buttonList
      })
    });
    
    const data = await response.json();
    console.log(`[Z-API Buttons] Response for ${phone}:`, JSON.stringify(data));
    
    if (!response.ok || data.error) {
      return { success: false, error: data.error || data.message || 'Erro ao enviar botões' };
    }
    
    return { success: true };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[Z-API Buttons] Error for ${phone}:`, error);
    return { success: false, error: errorMessage };
  }
}

// Send quick reply buttons via Z-API (Reply buttons - text only)
async function sendButtonList(
  phone: string, 
  message: string, 
  buttons: Array<{ label: string }>,
  instanceId: string, 
  token: string, 
  clientToken: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Build button list array for Z-API
    const buttonList = buttons.map((btn, idx) => ({
      id: `reply_${idx}`,
      label: btn.label
    }));

    const response = await fetch(`https://api.z-api.io/instances/${instanceId}/token/${token}/send-button-list`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Client-Token': clientToken
      },
      body: JSON.stringify({
        phone: formatPhone(phone),
        message,
        buttonList
      })
    });
    
    const data = await response.json();
    console.log(`[Z-API ButtonList] Response for ${phone}:`, JSON.stringify(data));
    
    if (!response.ok || data.error) {
      return { success: false, error: data.error || data.message || 'Erro ao enviar botões de resposta' };
    }
    
    return { success: true };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[Z-API ButtonList] Error for ${phone}:`, error);
    return { success: false, error: errorMessage };
  }
}

// Send quick reply buttons with image via Z-API
async function sendButtonListImage(
  phone: string, 
  message: string,
  imageUrl: string,
  buttons: Array<{ label: string }>,
  instanceId: string, 
  token: string, 
  clientToken: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const buttonList = buttons.map((btn, idx) => ({
      id: `reply_${idx}`,
      label: btn.label
    }));

    const response = await fetch(`https://api.z-api.io/instances/${instanceId}/token/${token}/send-button-list`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Client-Token': clientToken
      },
      body: JSON.stringify({
        phone: formatPhone(phone),
        message,
        buttonList: {
          image: imageUrl,
          buttons: buttonList
        }
      })
    });
    
    const data = await response.json();
    console.log(`[Z-API ButtonListImage] Response for ${phone}:`, JSON.stringify(data));
    
    if (!response.ok || data.error) {
      return { success: false, error: data.error || data.message || 'Erro ao enviar botões com imagem' };
    }
    
    return { success: true };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[Z-API ButtonListImage] Error for ${phone}:`, error);
    return { success: false, error: errorMessage };
  }
}

// Send quick reply buttons with video via Z-API
async function sendButtonListVideo(
  phone: string, 
  message: string,
  videoUrl: string,
  buttons: Array<{ label: string }>,
  instanceId: string, 
  token: string, 
  clientToken: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const buttonList = buttons.map((btn, idx) => ({
      id: `reply_${idx}`,
      label: btn.label
    }));

    const response = await fetch(`https://api.z-api.io/instances/${instanceId}/token/${token}/send-button-list`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Client-Token': clientToken
      },
      body: JSON.stringify({
        phone: formatPhone(phone),
        message,
        buttonList: {
          video: videoUrl,
          buttons: buttonList
        }
      })
    });
    
    const data = await response.json();
    console.log(`[Z-API ButtonListVideo] Response for ${phone}:`, JSON.stringify(data));
    
    if (!response.ok || data.error) {
      return { success: false, error: data.error || data.message || 'Erro ao enviar botões com vídeo' };
    }
    
    return { success: true };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[Z-API ButtonListVideo] Error for ${phone}:`, error);
    return { success: false, error: errorMessage };
  }
}

// Get random message variation
function getRandomVariation(message: string, variations: string[]): { message: string; variationIndex: number | null } {
  if (!variations || variations.length === 0) {
    return { message, variationIndex: null };
  }
  const randomIndex = Math.floor(Math.random() * variations.length);
  return { message: variations[randomIndex], variationIndex: randomIndex };
}

// Sleep function
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Declare EdgeRuntime type for background tasks
declare const EdgeRuntime: {
  waitUntil: (promise: Promise<unknown>) => void;
};

// Handle function shutdown - log progress
addEventListener('beforeunload', (ev: Event & { detail?: { reason?: string } }) => {
  console.log(`[Broadcast] Function shutdown - Reason: ${ev.detail?.reason || 'unknown'}`);
});

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
    const zapiClientToken = Deno.env.get('ZAPI_CLIENT_TOKEN');

    if (!zapiInstanceId || !zapiToken || !zapiClientToken) {
      console.error('[Broadcast] Z-API credentials not configured - Instance:', !!zapiInstanceId, 'Token:', !!zapiToken, 'ClientToken:', !!zapiClientToken);
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
      // Update status to running and set last_processing_at to prevent duplicate processing
      await supabase
        .from('whatsapp_broadcasts')
        .update({ 
          status: 'running', 
          started_at: action === 'start' ? new Date().toISOString() : broadcast.started_at,
          last_processing_at: new Date().toISOString()
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

      const totalRecipients = recipients?.length || 0;
      console.log(`[Broadcast] Starting processing of ${totalRecipients} pending recipients (Total: ${broadcast.total_recipients})`);

      // Get interval range
      const minInterval = broadcast.interval_min_seconds || broadcast.interval_seconds || 30;
      const maxInterval = broadcast.interval_max_seconds || minInterval + 15;

      console.log(`[Broadcast] Using random interval between ${minInterval}s and ${maxInterval}s`);
      const startTime = Date.now();

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

          // Prepare message with name replacement and variations
          let messageToSend = broadcast.message;
          let variationUsed: number | null = null;
          
          // Check for message variations
          const messageVariations = broadcast.message_variations as string[] | null;
          if (messageVariations && messageVariations.length > 0) {
            const { message: varMessage, variationIndex } = getRandomVariation(broadcast.message, messageVariations);
            messageToSend = varMessage;
            variationUsed = variationIndex;
          }
          
          const personalizedMessage = messageToSend.replace(/\{\{nome\}\}/gi, recipient.name || 'Cliente');

          let result: { success: boolean; error?: string };

          // Check if buttons are enabled
          const buttonsEnabled = broadcast.buttons_enabled;
          const buttonActions = broadcast.button_actions as Array<{ type: string; label: string; value: string }> | null;
          const buttonType = (broadcast as any).button_type as string | null;
          
          if (buttonsEnabled && buttonActions && buttonActions.length > 0) {
            // Send message with buttons
            if (buttonType === 'reply') {
              // Reply buttons support media
              if (broadcast.media_type === 'image' && broadcast.media_url) {
                console.log(`[Broadcast] Sending reply buttons with image to ${recipient.phone}`);
                result = await sendButtonListImage(recipient.phone, personalizedMessage, broadcast.media_url, buttonActions, zapiInstanceId, zapiToken, zapiClientToken);
              } else if (broadcast.media_type === 'video' && broadcast.media_url) {
                console.log(`[Broadcast] Sending reply buttons with video to ${recipient.phone}`);
                result = await sendButtonListVideo(recipient.phone, personalizedMessage, broadcast.media_url, buttonActions, zapiInstanceId, zapiToken, zapiClientToken);
              } else {
                console.log(`[Broadcast] Sending reply buttons (text only) to ${recipient.phone}`);
                result = await sendButtonList(recipient.phone, personalizedMessage, buttonActions, zapiInstanceId, zapiToken, zapiClientToken);
              }
            } else {
              // Action buttons (URL/CALL) do NOT support media - send media first if present
              if (broadcast.media_type && broadcast.media_url) {
                console.log(`[Broadcast] Action buttons with media - sending media first to ${recipient.phone}`);
                // Send media first
                if (broadcast.media_type === 'image') {
                  await sendImage(recipient.phone, broadcast.media_url, '', zapiInstanceId, zapiToken, zapiClientToken);
                } else if (broadcast.media_type === 'video') {
                  await sendVideo(recipient.phone, broadcast.media_url, '', zapiInstanceId, zapiToken, zapiClientToken);
                } else if (broadcast.media_type === 'document') {
                  const fileName = broadcast.media_url.split('/').pop() || 'documento';
                  await sendDocument(recipient.phone, broadcast.media_url, fileName, zapiInstanceId, zapiToken, zapiClientToken);
                }
                // Wait a bit before sending buttons
                await sleep(2000);
              }
              // Then send text with action buttons
              console.log(`[Broadcast] Sending action buttons to ${recipient.phone}`);
              result = await sendButtonActions(recipient.phone, personalizedMessage, buttonActions, zapiInstanceId, zapiToken, zapiClientToken);
            }
          } else if (broadcast.media_type === 'image' && broadcast.media_url) {
            result = await sendImage(recipient.phone, broadcast.media_url, personalizedMessage, zapiInstanceId, zapiToken, zapiClientToken);
          } else if (broadcast.media_type === 'video' && broadcast.media_url) {
            result = await sendVideo(recipient.phone, broadcast.media_url, personalizedMessage, zapiInstanceId, zapiToken, zapiClientToken);
          } else if (broadcast.media_type === 'document' && broadcast.media_url) {
            const fileName = broadcast.media_url.split('/').pop() || 'documento';
            result = await sendDocument(recipient.phone, broadcast.media_url, fileName, zapiInstanceId, zapiToken, zapiClientToken);
            // Send text message after document
            if (result.success && personalizedMessage) {
              await sleep(2000);
              await sendText(recipient.phone, personalizedMessage, zapiInstanceId, zapiToken, zapiClientToken);
            }
          } else {
            result = await sendText(recipient.phone, personalizedMessage, zapiInstanceId, zapiToken, zapiClientToken);
          }

          // Update recipient status
          if (result.success) {
            sentCount++;
            await supabase
              .from('whatsapp_broadcast_recipients')
              .update({ 
                status: 'sent', 
                sent_at: new Date().toISOString(),
                variation_used: variationUsed
              } as any)
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

          const processedSoFar = sentCount + failedCount;
          const elapsedMinutes = Math.floor((Date.now() - startTime) / 60000);
          
          // Log progress every 10 messages or on each message for smaller batches
          if (processedSoFar % 10 === 0 || totalRecipients <= 20) {
            console.log(`[Broadcast] Progress: ${processedSoFar}/${totalRecipients} (${sentCount} sent, ${failedCount} failed) - Elapsed: ${elapsedMinutes}min`);
          } else {
            console.log(`[Broadcast] Processed ${recipient.phone}: ${result.success ? 'sent' : 'failed'} (${processedSoFar}/${totalRecipients})`);
          }

          // Wait for random interval before next message (skip if last recipient)
          const recipientIndex = recipients?.indexOf(recipient) ?? 0;
          if (recipientIndex < totalRecipients - 1) {
            const randomInterval = getRandomInterval(minInterval, maxInterval);
            console.log(`[Broadcast] Waiting ${randomInterval}s before next message`);
            await sleep(randomInterval * 1000);
          }
        }

        // Check if there are more pending recipients
        const { count: remainingPending } = await supabase
          .from('whatsapp_broadcast_recipients')
          .select('id', { count: 'exact', head: true })
          .eq('broadcast_id', broadcastId)
          .eq('status', 'pending');

        const totalElapsed = Math.floor((Date.now() - startTime) / 60000);

        if (remainingPending === 0) {
          // All recipients processed, mark as completed
          const { data: finalBroadcast } = await supabase
            .from('whatsapp_broadcasts')
            .select('status')
            .eq('id', broadcastId)
            .single();

          if (finalBroadcast?.status === 'running') {
            await supabase
              .from('whatsapp_broadcasts')
              .update({ status: 'completed', completed_at: new Date().toISOString() })
              .eq('id', broadcastId);
            console.log(`[Broadcast] COMPLETED! All recipients processed. Sent: ${sentCount}, Failed: ${failedCount}, Total time: ${totalElapsed} minutes`);
          }
        } else {
          // Still more to process, will be picked up by cron
          console.log(`[Broadcast] Batch finished. Sent: ${sentCount}, Failed: ${failedCount}, Remaining: ${remainingPending}. Will be continued by cron job.`);
        }
      };

      // Use EdgeRuntime.waitUntil to keep function alive during background processing
      EdgeRuntime.waitUntil(
        processRecipients().catch((err) => {
          console.error('[Broadcast] Background processing error:', err);
        })
      );

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
