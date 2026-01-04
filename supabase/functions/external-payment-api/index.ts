import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

interface CreateChargeRequest {
  product_id: string;
  amount: number;
  buyer_email: string;
  buyer_name: string;
  buyer_document: string;
  buyer_phone?: string;
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
  externalId: string
): Promise<{ transactionId: string; qrCode: string; expiresAt: string }> {
  console.log('Creating GhostsPay charge for amount:', amount);

  const requestBody = {
    amount: Math.round(amount * 100), // Convert to cents
    paymentMethod: 'pix',
    customer: {
      name: buyerName,
      email: buyerEmail,
      document: buyerDocument.replace(/\D/g, ''),
    },
    externalReference: externalId,
    expiresInMinutes: 60,
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
    expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // 1 hour
  };
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

    console.log('External API request:', req.method, url.pathname, 'endpoint:', endpoint);

    // Get API key from header
    const apiKey = req.headers.get('x-api-key') || req.headers.get('X-API-Key') || '';

    // Route: POST /create-charge
    if (req.method === 'POST' && (endpoint === 'create-charge' || url.pathname.includes('create-charge'))) {
      // Validate API key
      const validation = await validateApiKey(supabase, apiKey);
      if (!validation.valid) {
        return new Response(
          JSON.stringify({ success: false, error: validation.error }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const body: CreateChargeRequest = await req.json();
      console.log('Create charge request:', JSON.stringify(body));

      // Validate required fields
      if (!body.product_id || !body.amount || !body.buyer_email || !body.buyer_name || !body.buyer_document) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Missing required fields: product_id, amount, buyer_email, buyer_name, buyer_document' 
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
          JSON.stringify({ success: false, error: 'Product not found or does not belong to your account' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Get gateway credentials
      const credentials = await getGatewayCredentials();

      // Generate external ID
      const externalId = `ext_${Date.now()}_${crypto.randomUUID().substring(0, 8)}`;

      // Create charge with GhostsPay
      const chargeResult = await createGhostpayCharge(
        credentials,
        body.amount,
        body.buyer_email,
        body.buyer_name,
        body.buyer_document,
        externalId
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
          buyer_name: body.buyer_name,
          buyer_cpf: body.buyer_document.replace(/\D/g, ''),
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
          JSON.stringify({ success: false, error: 'Error saving charge' }),
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
          charge_id: charge.id,
          external_id: externalId,
          gateway_transaction_id: chargeResult.transactionId,
          qr_code: chargeResult.qrCode,
          copy_paste: chargeResult.qrCode,
          amount: body.amount,
          expires_at: chargeResult.expiresAt,
          status: 'pending',
          product: {
            id: product.id,
            name: product.name,
          },
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Route: GET /status/:charge_id or /status?charge_id=xxx
    if (req.method === 'GET' && (endpoint === 'status' || url.pathname.includes('status'))) {
      // Validate API key
      const validation = await validateApiKey(supabase, apiKey);
      if (!validation.valid) {
        return new Response(
          JSON.stringify({ success: false, error: validation.error }),
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
          JSON.stringify({ success: false, error: 'charge_id is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Get charge info
      const { data: charge, error: chargeError } = await supabase
        .from('pix_charges')
        .select('id, external_id, amount, status, created_at, paid_at, expires_at, buyer_email, buyer_name, product_id')
        .eq('id', chargeId)
        .eq('seller_id', validation.userId)
        .single();

      if (chargeError || !charge) {
        return new Response(
          JSON.stringify({ success: false, error: 'Charge not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Get transaction if paid
      let transaction = null;
      if (charge.status === 'paid') {
        const { data: txData } = await supabase
          .from('transactions')
          .select('id, amount, seller_amount, platform_fee, created_at')
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
            buyer_email: charge.buyer_email,
            buyer_name: charge.buyer_name,
            product_id: charge.product_id,
          },
          transaction: transaction ? {
            id: transaction.id,
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
    if (req.method === 'GET' && (endpoint === 'charges' || url.pathname.includes('charges'))) {
      // Validate API key
      const validation = await validateApiKey(supabase, apiKey);
      if (!validation.valid) {
        return new Response(
          JSON.stringify({ success: false, error: validation.error }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const limit = parseInt(url.searchParams.get('limit') || '50');
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
          JSON.stringify({ success: false, error: 'Error fetching charges' }),
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
          },
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Route not found
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Endpoint not found',
        available_endpoints: [
          'POST /create-charge - Create a new PIX charge',
          'GET /status?charge_id=xxx - Get charge status',
          'GET /charges - List all charges',
        ]
      }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('External API error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
