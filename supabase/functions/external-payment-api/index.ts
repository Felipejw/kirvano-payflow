import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
};

interface CreateChargeRequest {
  product_id: string;
  amount: number;
  buyer_email: string;
  buyer_name?: string;
  buyer_cpf?: string;
  buyer_document?: string;
  buyer_phone?: string;
  external_id?: string;
  expires_in_minutes?: number;
  description?: string;
  metadata?: Record<string, any>;
}

// Simple hash function for API key validation
async function hashApiKey(key: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(key);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Generate HMAC-SHA256 signature
async function generateSignature(payload: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const messageData = encoder.encode(payload);
  
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const signature = await crypto.subtle.sign('HMAC', cryptoKey, messageData);
  const hashArray = Array.from(new Uint8Array(signature));
  return 'sha256=' + hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Validate API key and return seller info
async function validateApiKey(supabase: any, apiKey: string): Promise<{ valid: boolean; userId?: string; error?: string }> {
  if (!apiKey) {
    return { valid: false, error: 'API key is required' };
  }

  // Extract prefix (first 8 chars)
  const prefix = apiKey.substring(0, 8);
  const keyHash = await hashApiKey(apiKey);

  console.log('Validating API key with prefix:', prefix);

  const { data: keyData, error } = await supabase
    .from('api_keys')
    .select('id, user_id, status, expires_at, rate_limit')
    .eq('key_prefix', prefix)
    .eq('key_hash', keyHash)
    .single();

  if (error || !keyData) {
    console.log('API key not found:', error?.message);
    return { valid: false, error: 'Invalid API key' };
  }

  if (keyData.status !== 'active') {
    return { valid: false, error: 'API key is inactive' };
  }

  if (keyData.expires_at && new Date(keyData.expires_at) < new Date()) {
    return { valid: false, error: 'API key has expired' };
  }

  // Update last_used_at
  await supabase
    .from('api_keys')
    .update({ last_used_at: new Date().toISOString() })
    .eq('id', keyData.id);

  return { valid: true, userId: keyData.user_id };
}

// Get platform gateway credentials
async function getGatewayCredentials(): Promise<{ companyId: string; secretKey: string }> {
  const companyId = Deno.env.get('GHOSTPAY_COMPANY_ID');
  const secretKey = Deno.env.get('GHOSTPAY_SECRET_KEY');

  if (!companyId || !secretKey) {
    throw new Error('Gateway credentials not configured');
  }

  return { companyId, secretKey };
}

// Create PIX charge with GhostsPay
async function createGhostpayCharge(
  credentials: { companyId: string; secretKey: string },
  amount: number,
  buyerEmail: string,
  buyerName: string,
  buyerDocument: string,
  externalId: string,
  expiresInMinutes: number = 60
): Promise<{ transactionId: string; qrCode: string; expiresAt: string }> {
  console.log('Creating GhostsPay charge for amount:', amount);

  const requestBody = {
    amount: Math.round(amount * 100), // Convert to cents
    paymentMethod: 'pix',
    customer: {
      name: buyerName || 'Cliente',
      email: buyerEmail,
      document: buyerDocument?.replace(/\D/g, '') || '00000000000',
    },
    externalReference: externalId,
    expiresInMinutes,
  };

  console.log('GhostsPay request body:', JSON.stringify(requestBody));

  const response = await fetch('https://api.ghostspay.com/api/v1/transactions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Company-ID': credentials.companyId,
      'X-Secret-Key': credentials.secretKey,
    },
    body: JSON.stringify(requestBody),
  });

  const responseText = await response.text();
  console.log('GhostsPay response status:', response.status);
  console.log('GhostsPay response:', responseText);

  if (!response.ok) {
    throw new Error(`GhostsPay error: ${responseText}`);
  }

  const data = JSON.parse(responseText);

  // Extract copy-paste code
  const copyPasteCode = data.pix?.qrcode || data.pix?.qrCode || data.pix?.qr_code || data.pix?.emv || '';

  return {
    transactionId: data.id,
    qrCode: copyPasteCode,
    expiresAt: new Date(Date.now() + expiresInMinutes * 60 * 1000).toISOString(),
  };
}

// Send webhook notification
async function sendWebhook(
  supabase: any,
  webhookConfig: { id: string; url: string; secret: string },
  event: string,
  data: any
): Promise<void> {
  const payload = {
    event,
    timestamp: new Date().toISOString(),
    data,
  };

  const payloadString = JSON.stringify(payload);
  const signature = await generateSignature(payloadString, webhookConfig.secret);

  console.log(`Sending webhook to ${webhookConfig.url} for event ${event}`);

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    const response = await fetch(webhookConfig.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Signature': signature,
        'X-Webhook-Event': event,
      },
      body: payloadString,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const responseBody = await response.text();

    // Log webhook attempt
    await supabase.from('external_webhook_logs').insert({
      webhook_id: webhookConfig.id,
      event_type: event,
      payload,
      response_status: response.status,
      response_body: responseBody.substring(0, 1000),
    });

    // Update last_triggered_at
    await supabase
      .from('webhook_configs')
      .update({ 
        last_triggered_at: new Date().toISOString(),
        failure_count: response.ok ? 0 : supabase.raw('failure_count + 1')
      })
      .eq('id', webhookConfig.id);

    console.log(`Webhook response: ${response.status} - ${responseBody.substring(0, 200)}`);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`Webhook failed: ${errorMessage}`);

    // Log failed attempt
    await supabase.from('external_webhook_logs').insert({
      webhook_id: webhookConfig.id,
      event_type: event,
      payload,
      error_message: errorMessage,
    });

    // Increment failure count
    await supabase
      .from('webhook_configs')
      .update({ failure_count: supabase.raw('failure_count + 1') })
      .eq('id', webhookConfig.id);
  }
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const url = new URL(req.url);
    const path = url.pathname.split('/').filter(Boolean);
    const endpoint = path[path.length - 1];
    const fullPath = '/' + path.slice(path.indexOf('external-payment-api') + 1).join('/');

    console.log('External API request:', req.method, url.pathname, 'endpoint:', endpoint, 'fullPath:', fullPath);

    // Get API key from header
    const apiKey = req.headers.get('x-api-key') || req.headers.get('X-API-Key') || '';

    // Route: POST /create-charge
    if (req.method === 'POST' && (endpoint === 'create-charge' || fullPath.includes('/create-charge'))) {
      // Validate API key
      const validation = await validateApiKey(supabase, apiKey);
      if (!validation.valid) {
        return new Response(
          JSON.stringify({ success: false, error: validation.error, code: 'INVALID_API_KEY' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const body: CreateChargeRequest = await req.json();
      console.log('Create charge request:', JSON.stringify(body));

      // Validate required fields
      if (!body.product_id || !body.amount || !body.buyer_email) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Missing required fields: product_id, amount, buyer_email',
            code: 'MISSING_FIELDS'
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Validate product belongs to this seller
      const { data: product, error: productError } = await supabase
        .from('products')
        .select('id, name, seller_id, price')
        .eq('id', body.product_id)
        .eq('seller_id', validation.userId)
        .single();

      if (productError || !product) {
        return new Response(
          JSON.stringify({ success: false, error: 'Product not found or does not belong to your account', code: 'PRODUCT_NOT_FOUND' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Get gateway credentials
      const credentials = await getGatewayCredentials();

      // Generate external ID
      const externalId = body.external_id || `ext_${Date.now()}_${crypto.randomUUID().substring(0, 8)}`;
      const expiresInMinutes = body.expires_in_minutes || 60;

      // Create charge with GhostsPay
      const chargeResult = await createGhostpayCharge(
        credentials,
        body.amount,
        body.buyer_email,
        body.buyer_name || 'Cliente',
        body.buyer_cpf || body.buyer_document || '',
        externalId,
        expiresInMinutes
      );

      // Save to pix_charges table
      const { data: charge, error: chargeError } = await supabase
        .from('pix_charges')
        .insert({
          external_id: externalId,
          product_id: body.product_id,
          seller_id: validation.userId,
          amount: body.amount,
          buyer_email: body.buyer_email,
          buyer_name: body.buyer_name || null,
          buyer_cpf: (body.buyer_cpf || body.buyer_document || '').replace(/\D/g, '') || null,
          buyer_phone: body.buyer_phone || null,
          copy_paste: chargeResult.qrCode,
          qr_code: chargeResult.qrCode,
          expires_at: chargeResult.expiresAt,
          status: 'pending',
        })
        .select()
        .single();

      if (chargeError) {
        console.error('Error saving charge:', chargeError);
        return new Response(
          JSON.stringify({ success: false, error: 'Error saving charge', code: 'DATABASE_ERROR' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Log the API request
      await supabase
        .from('platform_gateway_logs')
        .insert({
          seller_id: validation.userId!,
          action: 'external_api_create_charge',
          amount: body.amount,
          buyer_email: body.buyer_email,
          buyer_name: body.buyer_name,
          product_id: body.product_id,
          charge_id: charge.id,
          external_id: externalId,
          gateway_response: { gateway_transaction_id: chargeResult.transactionId },
        });

      return new Response(
        JSON.stringify({
          success: true,
          charge: {
            id: charge.id,
            external_id: externalId,
            amount: body.amount,
            status: 'pending',
            qr_code: `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(chargeResult.qrCode)}`,
            copy_paste: chargeResult.qrCode,
            expires_at: chargeResult.expiresAt,
            created_at: charge.created_at,
          },
          product: {
            id: product.id,
            name: product.name,
          },
        }),
        { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Route: GET /status/:charge_id or /status?charge_id=xxx
    if (req.method === 'GET' && (endpoint === 'status' || fullPath.includes('/status'))) {
      // Validate API key
      const validation = await validateApiKey(supabase, apiKey);
      if (!validation.valid) {
        return new Response(
          JSON.stringify({ success: false, error: validation.error, code: 'INVALID_API_KEY' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Get charge_id from URL params or path
      let chargeId = url.searchParams.get('charge_id');
      if (!chargeId) {
        // Try to get from path /status/:charge_id
        const statusIndex = path.indexOf('status');
        if (statusIndex !== -1 && path[statusIndex + 1]) {
          chargeId = path[statusIndex + 1];
        }
      }

      if (!chargeId) {
        return new Response(
          JSON.stringify({ success: false, error: 'charge_id is required', code: 'MISSING_CHARGE_ID' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Get charge info
      const { data: charge, error: chargeError } = await supabase
        .from('pix_charges')
        .select('id, external_id, amount, status, created_at, paid_at, expires_at, buyer_email, buyer_name, buyer_cpf, product_id')
        .eq('id', chargeId)
        .eq('seller_id', validation.userId)
        .single();

      if (chargeError || !charge) {
        return new Response(
          JSON.stringify({ success: false, error: 'Charge not found', code: 'CHARGE_NOT_FOUND' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Get transaction if paid
      let transaction = null;
      if (charge.status === 'paid') {
        const { data: txData } = await supabase
          .from('transactions')
          .select('id, gateway_transaction_id, amount, seller_amount, platform_fee, created_at')
          .eq('charge_id', chargeId)
          .single();
        transaction = txData;
      }

      return new Response(
        JSON.stringify({
          success: true,
          charge: {
            id: charge.id,
            external_id: charge.external_id,
            amount: charge.amount,
            status: charge.status,
            created_at: charge.created_at,
            paid_at: charge.paid_at,
            expires_at: charge.expires_at,
            buyer: {
              email: charge.buyer_email,
              name: charge.buyer_name,
              cpf: charge.buyer_cpf,
            },
            product_id: charge.product_id,
          },
          transaction: transaction ? {
            id: transaction.id,
            gateway_transaction_id: transaction.gateway_transaction_id,
            amount: transaction.amount,
            seller_amount: transaction.seller_amount,
            platform_fee: transaction.platform_fee,
            created_at: transaction.created_at,
          } : null,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Route: GET /charges - List charges
    if (req.method === 'GET' && (endpoint === 'charges' || fullPath === '/charges')) {
      // Validate API key
      const validation = await validateApiKey(supabase, apiKey);
      if (!validation.valid) {
        return new Response(
          JSON.stringify({ success: false, error: validation.error, code: 'INVALID_API_KEY' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 100);
      const offset = parseInt(url.searchParams.get('offset') || '0');
      const status = url.searchParams.get('status');
      const productId = url.searchParams.get('product_id');

      let query = supabase
        .from('pix_charges')
        .select('id, external_id, amount, status, created_at, paid_at, buyer_email, buyer_name, product_id', { count: 'exact' })
        .eq('seller_id', validation.userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (status) {
        query = query.eq('status', status);
      }
      if (productId) {
        query = query.eq('product_id', productId);
      }

      const { data: charges, error: chargesError, count } = await query;

      if (chargesError) {
        return new Response(
          JSON.stringify({ success: false, error: 'Error fetching charges', code: 'DATABASE_ERROR' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({
          success: true,
          charges: charges || [],
          pagination: {
            total: count || 0,
            limit,
            offset,
            has_more: (offset + limit) < (count || 0),
          },
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Route: POST /webhook/register - Register a webhook
    if (req.method === 'POST' && (fullPath.includes('/webhook/register') || endpoint === 'register')) {
      const validation = await validateApiKey(supabase, apiKey);
      if (!validation.valid) {
        return new Response(
          JSON.stringify({ success: false, error: validation.error, code: 'INVALID_API_KEY' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const body = await req.json();
      
      if (!body.url) {
        return new Response(
          JSON.stringify({ success: false, error: 'URL is required', code: 'MISSING_URL' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Validate URL
      try {
        const webhookUrl = new URL(body.url);
        if (webhookUrl.protocol !== 'https:') {
          return new Response(
            JSON.stringify({ success: false, error: 'Webhook URL must use HTTPS', code: 'INVALID_URL' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      } catch {
        return new Response(
          JSON.stringify({ success: false, error: 'Invalid URL format', code: 'INVALID_URL' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Generate webhook secret
      const secret = 'whsec_' + crypto.randomUUID().replace(/-/g, '');
      const events = body.events || ['payment.confirmed'];

      const { data: webhook, error: webhookError } = await supabase
        .from('webhook_configs')
        .insert({
          user_id: validation.userId,
          url: body.url,
          secret,
          events,
          is_active: true,
        })
        .select()
        .single();

      if (webhookError) {
        console.error('Error creating webhook:', webhookError);
        return new Response(
          JSON.stringify({ success: false, error: 'Error creating webhook', code: 'DATABASE_ERROR' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({
          success: true,
          webhook: {
            id: webhook.id,
            url: webhook.url,
            secret, // Only returned once!
            events: webhook.events,
            is_active: webhook.is_active,
            created_at: webhook.created_at,
          },
          message: 'Webhook created successfully. Save the secret - it will not be shown again!',
        }),
        { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Route: GET /webhook/list - List webhooks
    if (req.method === 'GET' && (fullPath.includes('/webhook/list') || (fullPath.includes('/webhook') && endpoint === 'webhook'))) {
      const validation = await validateApiKey(supabase, apiKey);
      if (!validation.valid) {
        return new Response(
          JSON.stringify({ success: false, error: validation.error, code: 'INVALID_API_KEY' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { data: webhooks, error: webhooksError } = await supabase
        .from('webhook_configs')
        .select('id, url, events, is_active, created_at, last_triggered_at, failure_count')
        .eq('user_id', validation.userId)
        .order('created_at', { ascending: false });

      if (webhooksError) {
        return new Response(
          JSON.stringify({ success: false, error: 'Error fetching webhooks', code: 'DATABASE_ERROR' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({
          success: true,
          webhooks: webhooks || [],
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Route: DELETE /webhook/delete?id=xxx - Delete webhook
    if (req.method === 'DELETE' && (fullPath.includes('/webhook/delete') || fullPath.includes('/webhook'))) {
      const validation = await validateApiKey(supabase, apiKey);
      if (!validation.valid) {
        return new Response(
          JSON.stringify({ success: false, error: validation.error, code: 'INVALID_API_KEY' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const webhookId = url.searchParams.get('id');
      if (!webhookId) {
        return new Response(
          JSON.stringify({ success: false, error: 'Webhook ID is required', code: 'MISSING_ID' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { error: deleteError } = await supabase
        .from('webhook_configs')
        .delete()
        .eq('id', webhookId)
        .eq('user_id', validation.userId);

      if (deleteError) {
        return new Response(
          JSON.stringify({ success: false, error: 'Error deleting webhook', code: 'DATABASE_ERROR' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Webhook deleted successfully',
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Route not found
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Endpoint not found',
        code: 'NOT_FOUND',
        available_endpoints: [
          'POST /create-charge - Create a new PIX charge',
          'GET /status?charge_id=xxx - Get charge status',
          'GET /charges - List all charges',
          'POST /webhook/register - Register a webhook URL',
          'GET /webhook/list - List configured webhooks',
          'DELETE /webhook/delete?id=xxx - Delete a webhook',
        ]
      }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('External API error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage, code: 'INTERNAL_ERROR' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
