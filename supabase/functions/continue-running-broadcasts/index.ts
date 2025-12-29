import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

// Sleep function
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
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

// Declare EdgeRuntime type for background tasks
declare const EdgeRuntime: {
  waitUntil: (promise: Promise<unknown>) => void;
};

// Handle function shutdown
addEventListener('beforeunload', (ev: Event & { detail?: { reason?: string } }) => {
  console.log(`[ContinueBroadcasts] Function shutdown - Reason: ${ev.detail?.reason || 'unknown'}`);
});

interface BroadcastData {
  id: string;
  name: string;
  message: string;
  media_type: string | null;
  media_url: string | null;
  interval_seconds: number | null;
  interval_min_seconds: number | null;
  interval_max_seconds: number | null;
  sent_count: number | null;
  failed_count: number | null;
  total_recipients: number | null;
  last_processing_at: string | null;
}

interface RecipientData {
  id: string;
  phone: string;
  name: string | null;
  status: string;
}

// Process a batch of recipients for a broadcast
async function processBroadcastBatch(
  supabase: any,
  broadcast: BroadcastData,
  zapiInstanceId: string,
  zapiToken: string,
  zapiClientToken: string
): Promise<void> {
  const startTime = Date.now();
  const MAX_EXECUTION_TIME_MS = 100 * 1000; // 100 seconds to stay under 2 min limit
  
  console.log(`[ContinueBroadcasts] Processing broadcast ${broadcast.id} (${broadcast.name})`);
  
  // Get pending recipients (limit to avoid timeout)
  const { data: recipients, error: recipientsError } = await supabase
    .from('whatsapp_broadcast_recipients')
    .select('id, phone, name, status')
    .eq('broadcast_id', broadcast.id)
    .eq('status', 'pending')
    .order('created_at', { ascending: true })
    .limit(100);

  if (recipientsError) {
    console.error(`[ContinueBroadcasts] Error fetching recipients for ${broadcast.id}:`, recipientsError);
    return;
  }

  const recipientsList = recipients as RecipientData[] | null;

  if (!recipientsList || recipientsList.length === 0) {
    console.log(`[ContinueBroadcasts] No pending recipients for ${broadcast.id}, marking as completed`);
    await supabase
      .from('whatsapp_broadcasts')
      .update({ 
        status: 'completed',
        completed_at: new Date().toISOString()
      })
      .eq('id', broadcast.id);
    return;
  }

  console.log(`[ContinueBroadcasts] Found ${recipientsList.length} pending recipients`);

  // Get interval range
  const minInterval = broadcast.interval_min_seconds || broadcast.interval_seconds || 30;
  const maxInterval = broadcast.interval_max_seconds || minInterval + 15;

  console.log(`[ContinueBroadcasts] Using random interval between ${minInterval}s and ${maxInterval}s`);

  let sentCount = broadcast.sent_count || 0;
  let failedCount = broadcast.failed_count || 0;
  let processedInBatch = 0;

  for (const recipient of recipientsList) {
    // Check execution time - stop if approaching limit
    if (Date.now() - startTime > MAX_EXECUTION_TIME_MS) {
      console.log(`[ContinueBroadcasts] Approaching time limit, stopping batch. Processed ${processedInBatch} in this batch.`);
      break;
    }

    // Check if broadcast was paused or cancelled
    const { data: currentBroadcast } = await supabase
      .from('whatsapp_broadcasts')
      .select('status')
      .eq('id', broadcast.id)
      .single();

    if (currentBroadcast?.status === 'paused' || currentBroadcast?.status === 'cancelled') {
      console.log(`[ContinueBroadcasts] Broadcast ${broadcast.id} was ${currentBroadcast.status}, stopping`);
      break;
    }

    // Prepare message with name replacement and variations
    let messageToSend = broadcast.message;
    let variationUsed: number | null = null;
    
    const messageVariations = (broadcast as any).message_variations as string[] | null;
    if (messageVariations && messageVariations.length > 0) {
      const { message: varMessage, variationIndex } = getRandomVariation(broadcast.message, messageVariations);
      messageToSend = varMessage;
      variationUsed = variationIndex;
    }
    
    const personalizedMessage = messageToSend.replace(/\{\{nome\}\}/gi, recipient.name || 'Cliente');

    let result: { success: boolean; error?: string };

    const buttonsEnabled = (broadcast as any).buttons_enabled;
    const buttonActions = (broadcast as any).button_actions as Array<{ type: string; label: string; value: string }> | null;
    const buttonType = (broadcast as any).button_type as string | null;

    if (buttonsEnabled && buttonActions && buttonActions.length > 0) {
      if (buttonType === 'reply') {
        // Reply buttons support media
        if (broadcast.media_type === 'image' && broadcast.media_url) {
          console.log(`[ContinueBroadcasts] Sending reply buttons with image to ${recipient.phone}`);
          result = await sendButtonListImage(recipient.phone, personalizedMessage, broadcast.media_url, buttonActions, zapiInstanceId, zapiToken, zapiClientToken);
        } else if (broadcast.media_type === 'video' && broadcast.media_url) {
          console.log(`[ContinueBroadcasts] Sending reply buttons with video to ${recipient.phone}`);
          result = await sendButtonListVideo(recipient.phone, personalizedMessage, broadcast.media_url, buttonActions, zapiInstanceId, zapiToken, zapiClientToken);
        } else {
          console.log(`[ContinueBroadcasts] Sending reply buttons (text only) to ${recipient.phone}`);
          result = await sendButtonList(recipient.phone, personalizedMessage, buttonActions, zapiInstanceId, zapiToken, zapiClientToken);
        }
      } else {
        // Action buttons (URL/CALL) do NOT support media - send media first if present
        if (broadcast.media_type && broadcast.media_url) {
          console.log(`[ContinueBroadcasts] Action buttons with media - sending media first to ${recipient.phone}`);
          if (broadcast.media_type === 'image') {
            await sendImage(recipient.phone, broadcast.media_url, '', zapiInstanceId, zapiToken, zapiClientToken);
          } else if (broadcast.media_type === 'video') {
            await sendVideo(recipient.phone, broadcast.media_url, '', zapiInstanceId, zapiToken, zapiClientToken);
          } else if (broadcast.media_type === 'document') {
            const fileName = broadcast.media_url.split('/').pop() || 'documento';
            await sendDocument(recipient.phone, broadcast.media_url, fileName, zapiInstanceId, zapiToken, zapiClientToken);
          }
          await sleep(2000);
        }
        console.log(`[ContinueBroadcasts] Sending action buttons to ${recipient.phone}`);
        result = await sendButtonActions(recipient.phone, personalizedMessage, buttonActions, zapiInstanceId, zapiToken, zapiClientToken);
      }
    } else if (broadcast.media_type === 'image' && broadcast.media_url) {
      result = await sendImage(recipient.phone, broadcast.media_url, personalizedMessage, zapiInstanceId, zapiToken, zapiClientToken);
    } else if (broadcast.media_type === 'video' && broadcast.media_url) {
      result = await sendVideo(recipient.phone, broadcast.media_url, personalizedMessage, zapiInstanceId, zapiToken, zapiClientToken);
    } else if (broadcast.media_type === 'document' && broadcast.media_url) {
      const fileName = broadcast.media_url.split('/').pop() || 'documento';
      result = await sendDocument(recipient.phone, broadcast.media_url, fileName, zapiInstanceId, zapiToken, zapiClientToken);
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

    processedInBatch++;

    // Update broadcast counts and last_processing_at every 5 messages
    if (processedInBatch % 5 === 0) {
      await supabase
        .from('whatsapp_broadcasts')
        .update({ 
          sent_count: sentCount, 
          failed_count: failedCount,
          last_processing_at: new Date().toISOString()
        })
        .eq('id', broadcast.id);
    }

    console.log(`[ContinueBroadcasts] Processed ${recipient.phone}: ${result.success ? 'sent' : 'failed'} (batch: ${processedInBatch}/${recipientsList.length})`);

    // Wait for random interval before next message (skip if last recipient in current batch)
    const recipientIndex = recipientsList.indexOf(recipient);
    
    if (recipientIndex < recipientsList.length - 1) {
      const randomInterval = getRandomInterval(minInterval, maxInterval);
      const remainingTime = MAX_EXECUTION_TIME_MS - (Date.now() - startTime);
      
      // Check if we have enough time for the interval + safety margin (15s)
      if (remainingTime < (randomInterval + 15) * 1000) {
        console.log(`[ContinueBroadcasts] Not enough time for ${randomInterval}s interval (remaining: ${Math.floor(remainingTime/1000)}s), stopping batch. Next cron will continue.`);
        break;
      }
      
      console.log(`[ContinueBroadcasts] Waiting ${randomInterval}s before next message (remaining time: ${Math.floor(remainingTime/1000)}s)`);
      await sleep(randomInterval * 1000);
    }
  }

  // Final update
  await supabase
    .from('whatsapp_broadcasts')
    .update({ 
      sent_count: sentCount, 
      failed_count: failedCount,
      last_processing_at: new Date().toISOString()
    })
    .eq('id', broadcast.id);

  // Check if there are more pending recipients
  const { count: remainingPending } = await supabase
    .from('whatsapp_broadcast_recipients')
    .select('id', { count: 'exact', head: true })
    .eq('broadcast_id', broadcast.id)
    .eq('status', 'pending');

  const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);

  if (remainingPending === 0) {
    // All recipients processed, mark as completed
    const { data: finalBroadcast } = await supabase
      .from('whatsapp_broadcasts')
      .select('status')
      .eq('id', broadcast.id)
      .single();

    if (finalBroadcast?.status === 'running') {
      await supabase
        .from('whatsapp_broadcasts')
        .update({ status: 'completed', completed_at: new Date().toISOString() })
        .eq('id', broadcast.id);
      console.log(`[ContinueBroadcasts] COMPLETED! Broadcast ${broadcast.id} finished. Sent: ${sentCount}, Failed: ${failedCount}`);
    }
  } else {
    console.log(`[ContinueBroadcasts] Batch finished for ${broadcast.id}. Processed: ${processedInBatch}, Remaining: ${remainingPending}, Elapsed: ${elapsedSeconds}s`);
  }
}

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

    // Get Z-API credentials
    const zapiInstanceId = Deno.env.get('ZAPI_INSTANCE_ID');
    const zapiToken = Deno.env.get('ZAPI_TOKEN');
    const zapiClientToken = Deno.env.get('ZAPI_CLIENT_TOKEN');

    if (!zapiInstanceId || !zapiToken || !zapiClientToken) {
      console.error('[ContinueBroadcasts] Z-API credentials not configured');
      return new Response(
        JSON.stringify({ error: 'Z-API credentials not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Find broadcasts that are running and haven't been processed recently (90 seconds ago)
    const cutoffTime = new Date(Date.now() - 90 * 1000).toISOString();

    const { data: runningBroadcasts, error: fetchError } = await supabase
      .from('whatsapp_broadcasts')
      .select('id, name, message, media_type, media_url, interval_seconds, interval_min_seconds, interval_max_seconds, sent_count, failed_count, total_recipients, last_processing_at')
      .eq('status', 'running')
      .or(`last_processing_at.is.null,last_processing_at.lt.${cutoffTime}`);

    if (fetchError) {
      console.error('[ContinueBroadcasts] Error fetching broadcasts:', fetchError);
      return new Response(
        JSON.stringify({ error: fetchError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const broadcastsList = runningBroadcasts as BroadcastData[] | null;

    if (!broadcastsList || broadcastsList.length === 0) {
      console.log('[ContinueBroadcasts] No running broadcasts found that need continuation');
      return new Response(
        JSON.stringify({ success: true, message: 'No broadcasts to continue', resumed: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[ContinueBroadcasts] Found ${broadcastsList.length} running broadcast(s) to process`);

    let processed = 0;

    for (const broadcast of broadcastsList) {
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

      console.log(`[ContinueBroadcasts] Broadcast ${broadcast.id} (${broadcast.name}) has ${pendingCount} pending recipients`);

      // Update last_processing_at immediately to prevent other instances from picking it up
      await supabase
        .from('whatsapp_broadcasts')
        .update({ last_processing_at: new Date().toISOString() })
        .eq('id', broadcast.id);

      // Process in background using EdgeRuntime.waitUntil
      EdgeRuntime.waitUntil(
        processBroadcastBatch(supabase, broadcast, zapiInstanceId, zapiToken, zapiClientToken)
          .catch((err) => {
            console.error(`[ContinueBroadcasts] Error processing broadcast ${broadcast.id}:`, err);
          })
      );

      processed++;

      // Only process one broadcast at a time to avoid overwhelming the function
      break;
    }

    console.log(`[ContinueBroadcasts] Started processing ${processed} broadcast(s)`);

    return new Response(
      JSON.stringify({ success: true, message: `Started processing ${processed} broadcast(s)`, processed }),
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
