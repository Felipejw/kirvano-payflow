import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// SECURITY: Use service role client for database operations
// This is required since RLS now restricts pix_charges updates to service role only
const createServiceClient = () => {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  return createClient(supabaseUrl, supabaseServiceKey);
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
};

interface CreateChargeRequest {
  amount: number;
  buyer_email: string;
  buyer_name?: string;
  buyer_document?: string;
  buyer_phone?: string;
  product_id?: string;
  affiliate_code?: string;
  expires_in_minutes?: number;
  webhook_url?: string;
  description?: string;
  order_bumps?: string[];
  payment_method?: 'pix' | 'card' | 'boleto';
  card_token?: string;
  installments?: number;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
}

interface ChargeResponse {
  id: string;
  external_id: string;
  amount: number;
  status: string;
  status_detail?: string;
  qr_code?: string;
  qr_code_base64?: string;
  copy_paste?: string;
  expires_at: string;
  created_at: string;
}

interface GatewayCredentials {
  client_id?: string;
  client_secret?: string;
  api_key?: string;
  access_token?: string;
  public_key?: string;
  [key: string]: string | undefined;
}

// Get seller's gateway credentials for a specific payment method
async function getSellerGatewayCredentials(
  supabase: any,
  sellerId: string,
  paymentMethod: 'pix' | 'card' | 'boleto'
): Promise<{ credentials: GatewayCredentials; gateway: any } | null> {
  console.log(`Fetching ${paymentMethod} credentials for seller:`, sellerId);
  
  const methodColumn = `use_for_${paymentMethod}`;
  
  const { data, error } = await supabase
    .from('seller_gateway_credentials')
    .select(`
      credentials,
      gateway_id,
      payment_gateways (
        id,
        name,
        slug,
        is_active
      )
    `)
    .eq('user_id', sellerId)
    .eq('is_active', true)
    .eq(methodColumn, true)
    .limit(1)
    .maybeSingle();
  
  if (error) {
    console.error('Error fetching seller credentials:', error);
    return null;
  }
  
  if (!data || !data.payment_gateways?.is_active) {
    console.log('No active credentials found for payment method:', paymentMethod);
    return null;
  }
  
  console.log('Found gateway credentials:', data.payment_gateways.name);
  
  return {
    credentials: data.credentials as GatewayCredentials,
    gateway: data.payment_gateways,
  };
}

// BSPAY API Integration
const BSPAY_API_URL = "https://api.bspay.co/v2";

async function getBspayToken(clientId: string, clientSecret: string): Promise<string> {
  if (!clientId || !clientSecret) {
    throw new Error('BSPAY credentials not provided');
  }
  
  const credentials = `${clientId}:${clientSecret}`;
  const base64Credentials = btoa(credentials);
  
  console.log('Getting BSPAY token...');
  
  const response = await fetch(`${BSPAY_API_URL}/oauth/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${base64Credentials}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error('BSPAY token error:', response.status, errorText);
    throw new Error(`Failed to get BSPAY token: ${response.status}`);
  }
  
  const data = await response.json();
  console.log('BSPAY token obtained successfully');
  return data.access_token;
}

async function createBspayQRCode(
  token: string,
  amount: number,
  externalId: string,
  payer: { name?: string; email: string; document?: string },
  postbackUrl: string,
  description?: string
): Promise<{ qrCode: string; qrCodeBase64: string; transactionId: string }> {
  console.log('Creating BSPAY QRCode for amount:', amount);
  
  const payload = {
    amount: amount,
    external_id: externalId,
    payerQuestion: description || "Pagamento via PIX",
    payer: {
      name: payer.name || "Cliente",
      document: payer.document || "00000000000",
      email: payer.email,
    },
    postbackUrl: postbackUrl,
  };
  
  const response = await fetch(`${BSPAY_API_URL}/pix/qrcode`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error('BSPAY QRCode error:', response.status, errorText);
    throw new Error(`Failed to create BSPAY QRCode: ${response.status} - ${errorText}`);
  }
  
  const data = await response.json();
  console.log('BSPAY QRCode created:', data.transactionId || data.id);
  
  return {
    qrCode: data.qrcode || data.qr_code || data.copyPaste || data.copy_paste,
    qrCodeBase64: data.qrcodeBase64 || data.qr_code_base64 || data.qrCodeImage || '',
    transactionId: data.transactionId || data.transaction_id || data.id,
  };
}

async function getBspayBalance(clientId: string, clientSecret: string): Promise<{ balance: number }> {
  const token = await getBspayToken(clientId, clientSecret);
  console.log('Getting BSPAY balance...');
  
  const response = await fetch(`${BSPAY_API_URL}/balance`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json',
    },
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error('BSPAY balance error:', response.status, errorText);
    throw new Error(`Failed to get BSPAY balance: ${response.status}`);
  }
  
  const data = await response.json();
  console.log('BSPAY balance obtained:', data.balance);
  return { balance: data.balance || data.available || 0 };
}

async function getBspayTransaction(token: string, pixId: string): Promise<any> {
  console.log('Getting BSPAY transaction:', pixId);
  
  const response = await fetch(`${BSPAY_API_URL}/consult-transaction`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({ pix_id: pixId }),
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error('BSPAY transaction error:', response.status, errorText);
    throw new Error(`Failed to get BSPAY transaction: ${response.status}`);
  }
  
  const data = await response.json();
  console.log('BSPAY transaction status:', data.status);
  return data;
}

// ============================================================
// MERCADO PAGO API Integration
// ============================================================
const MERCADOPAGO_API_URL = "https://api.mercadopago.com";

interface MercadoPagoPixResult {
  qrCode: string;
  qrCodeBase64: string;
  paymentId: string;
}

async function createMercadoPagoPixPayment(
  accessToken: string,
  amount: number,
  externalReference: string,
  payer: { email: string; name?: string; document?: string },
  description?: string
): Promise<MercadoPagoPixResult> {
  console.log('Creating Mercado Pago PIX payment for amount:', amount);
  
  if (!accessToken) {
    throw new Error('Mercado Pago access_token not provided');
  }
  
  // Build payer identification
  const payerData: any = {
    email: payer.email,
  };
  
  if (payer.name) {
    const nameParts = payer.name.trim().split(' ');
    payerData.first_name = nameParts[0] || 'Cliente';
    payerData.last_name = nameParts.slice(1).join(' ') || 'Comprador';
  }
  
  if (payer.document) {
    // Remove non-numeric characters from document
    const cleanDoc = payer.document.replace(/\D/g, '');
    payerData.identification = {
      type: cleanDoc.length === 11 ? 'CPF' : 'CNPJ',
      number: cleanDoc,
    };
  }
  
  const payload = {
    transaction_amount: amount,
    description: description || 'Pagamento via PIX',
    payment_method_id: 'pix',
    external_reference: externalReference,
    payer: payerData,
  };
  
  console.log('Mercado Pago payload:', JSON.stringify(payload, null, 2));
  
  const response = await fetch(`${MERCADOPAGO_API_URL}/v1/payments`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'X-Idempotency-Key': externalReference,
    },
    body: JSON.stringify(payload),
  });
  
  const responseText = await response.text();
  console.log('Mercado Pago response status:', response.status);
  console.log('Mercado Pago response:', responseText);
  
  if (!response.ok) {
    console.error('Mercado Pago error:', response.status, responseText);
    throw new Error(`Failed to create Mercado Pago payment: ${response.status} - ${responseText}`);
  }
  
  const data = JSON.parse(responseText);
  
  // Extract PIX data from response
  const pixData = data.point_of_interaction?.transaction_data;
  
  if (!pixData || !pixData.qr_code) {
    console.error('Mercado Pago response missing PIX data:', data);
    throw new Error('Mercado Pago response missing PIX QR code data');
  }
  
  console.log('Mercado Pago PIX payment created:', data.id);
  
  return {
    qrCode: pixData.qr_code,
    qrCodeBase64: pixData.qr_code_base64 || '',
    paymentId: String(data.id),
  };
}

async function getMercadoPagoPayment(accessToken: string, paymentId: string): Promise<any> {
  console.log('Getting Mercado Pago payment:', paymentId);
  
  const response = await fetch(`${MERCADOPAGO_API_URL}/v1/payments/${paymentId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error('Mercado Pago get payment error:', response.status, errorText);
    throw new Error(`Failed to get Mercado Pago payment: ${response.status}`);
  }
  
  const data = await response.json();
  console.log('Mercado Pago payment status:', data.status);
  return data;
}

// ============================================================
// Mercado Pago Card Payment Integration
// ============================================================

interface MercadoPagoCardResult {
  paymentId: string;
  status: string;
  statusDetail: string;
}

async function createMercadoPagoCardPayment(
  accessToken: string,
  amount: number,
  externalReference: string,
  payer: { email: string; name?: string; document?: string },
  cardToken: string,
  installments: number,
  description?: string
): Promise<MercadoPagoCardResult> {
  console.log('Creating Mercado Pago card payment for amount:', amount, 'installments:', installments);
  
  if (!accessToken) {
    throw new Error('Mercado Pago access_token not provided');
  }
  
  if (!cardToken) {
    throw new Error('Card token not provided');
  }
  
  // Build payer data
  const payerData: any = {
    email: payer.email,
  };
  
  if (payer.name) {
    const nameParts = payer.name.trim().split(' ');
    payerData.first_name = nameParts[0] || 'Cliente';
    payerData.last_name = nameParts.slice(1).join(' ') || 'Comprador';
  }
  
  if (payer.document) {
    const cleanDoc = payer.document.replace(/\D/g, '');
    payerData.identification = {
      type: cleanDoc.length === 11 ? 'CPF' : 'CNPJ',
      number: cleanDoc,
    };
  }
  
  const payload = {
    transaction_amount: amount,
    description: description || 'Pagamento via Cartão',
    payment_method_id: 'credit_card',
    token: cardToken,
    installments: installments,
    external_reference: externalReference,
    payer: payerData,
  };
  
  console.log('Mercado Pago card payload:', JSON.stringify({ ...payload, token: '***' }, null, 2));
  
  const response = await fetch(`${MERCADOPAGO_API_URL}/v1/payments`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'X-Idempotency-Key': externalReference,
    },
    body: JSON.stringify(payload),
  });
  
  const responseText = await response.text();
  console.log('Mercado Pago card response status:', response.status);
  console.log('Mercado Pago card response:', responseText);
  
  if (!response.ok) {
    console.error('Mercado Pago card error:', response.status, responseText);
    throw new Error(`Failed to create Mercado Pago card payment: ${response.status} - ${responseText}`);
  }
  
  const data = JSON.parse(responseText);
  
  console.log('Mercado Pago card payment created:', data.id, 'status:', data.status);
  
  return {
    paymentId: String(data.id),
    status: data.status,
    statusDetail: data.status_detail || '',
  };
}

// ============================================================
// End of Mercado Pago Integration
// ============================================================

const generateExternalId = () => {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 10);
  return `PIX${timestamp}${random}`.toUpperCase();
};

// Generate a random password for new users
const generateRandomPassword = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%';
  let password = '';
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
};

// Create or get existing user and create membership
async function createMembershipForBuyer(
  supabase: any,
  buyerEmail: string,
  buyerName: string | null,
  productId: string,
  transactionId: string
): Promise<{ userId: string; isNewUser: boolean; password?: string }> {
  console.log('Creating membership for buyer:', buyerEmail, 'product:', productId);
  
  // Check if user already exists
  const { data: existingUsers } = await supabase.auth.admin.listUsers();
  const existingUser = existingUsers?.users?.find((u: any) => u.email === buyerEmail);
  
  let userId: string;
  let isNewUser = false;
  let password: string | undefined;
  
  if (existingUser) {
    userId = existingUser.id;
    console.log('Existing user found:', userId);
  } else {
    // Create new user
    password = generateRandomPassword();
    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email: buyerEmail,
      password: password,
      email_confirm: true,
      user_metadata: {
        full_name: buyerName || 'Cliente',
      },
    });
    
    if (createError) {
      console.error('Error creating user:', createError);
      throw new Error(`Failed to create user: ${createError.message}`);
    }
    
    userId = newUser.user.id;
    isNewUser = true;
    console.log('New user created:', userId);
  }
  
  // Check if membership already exists
  const { data: existingMembership } = await supabase
    .from('members')
    .select('id')
    .eq('user_id', userId)
    .eq('product_id', productId)
    .maybeSingle();
  
  if (!existingMembership) {
    // Create membership
    const { error: memberError } = await supabase
      .from('members')
      .insert({
        user_id: userId,
        product_id: productId,
        transaction_id: transactionId,
        access_level: 'full',
      });
    
    if (memberError) {
      console.error('Error creating membership:', memberError);
      throw new Error(`Failed to create membership: ${memberError.message}`);
    }
    
    console.log('Membership created for user:', userId);
  } else {
    console.log('Membership already exists for user:', userId);
  }
  
  return { userId, isNewUser, password };
}

// Process payment confirmation (shared logic for all gateways)
async function processPaymentConfirmation(
  supabase: any,
  charge: any,
  supabaseUrl: string
): Promise<void> {
  console.log('Processing payment confirmation for charge:', charge.id);
  
  // Update charge status
  await supabase
    .from('pix_charges')
    .update({ status: 'paid', paid_at: new Date().toISOString() })
    .eq('id', charge.id);

  const { data: platformSettings } = await supabase
    .from('platform_settings')
    .select('platform_fee')
    .single();
  
  const platformFeeRate = platformSettings?.platform_fee ?? 5;

  const amount = Number(charge.amount);
  const platformFee = amount * (platformFeeRate / 100);
  let affiliateAmount = 0;
  let sellerAmount = amount - platformFee;

  if (charge.affiliate_id && charge.affiliates) {
    const commissionRate = charge.affiliates.commission_rate || 10;
    affiliateAmount = amount * (commissionRate / 100);
    sellerAmount = amount - platformFee - affiliateAmount;

    await supabase
      .from('affiliates')
      .update({
        total_sales: charge.affiliates.total_sales + 1,
        total_earnings: Number(charge.affiliates.total_earnings) + affiliateAmount,
      })
      .eq('id', charge.affiliate_id);
  }

  // Get seller_id from product or use null
  const sellerId = charge.products?.seller_id || charge.seller_id || null;
  
  if (!sellerId) {
    console.warn('Transaction created without seller_id - product_id was:', charge.product_id);
  }

  // Create transaction
  const { data: transaction } = await supabase
    .from('transactions')
    .insert({
      charge_id: charge.id,
      product_id: charge.product_id,
      seller_id: sellerId,
      affiliate_id: charge.affiliate_id,
      amount,
      seller_amount: sellerAmount,
      affiliate_amount: affiliateAmount,
      platform_fee: platformFee,
      status: 'paid',
    })
    .select()
    .single();

  // Create membership for buyer and send access email
  if (charge.product_id && charge.buyer_email) {
    try {
      const membershipResult = await createMembershipForBuyer(
        supabase,
        charge.buyer_email,
        charge.buyer_name,
        charge.product_id,
        transaction?.id
      );
      console.log('Membership created:', membershipResult);
      
      // Get the member ID for email logging
      const { data: memberData } = await supabase
        .from('members')
        .select('id')
        .eq('user_id', membershipResult.userId)
        .eq('product_id', charge.product_id)
        .maybeSingle();
      
      // Check if auto email sending is enabled for this product (default: true)
      const autoSendEnabled = charge.products?.auto_send_access_email ?? true;
      
      if (autoSendEnabled) {
        // Send automatic access email
        try {
          const emailResponse = await fetch(`${supabaseUrl}/functions/v1/send-member-access-email`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
            },
            body: JSON.stringify({
              memberEmail: charge.buyer_email,
              memberName: charge.buyer_name,
              productName: charge.products?.name || 'Produto',
              productId: charge.product_id,
              memberId: memberData?.id,
              autoSend: true,
            }),
          });
          
          if (emailResponse.ok) {
            console.log('Access email sent automatically to:', charge.buyer_email);
          } else {
            console.error('Failed to send access email:', await emailResponse.text());
          }
        } catch (emailError) {
          console.error('Error sending access email:', emailError);
        }
      } else {
        console.log('Auto email disabled for product:', charge.product_id);
      }
    } catch (memberError) {
      console.error('Error creating membership:', memberError);
    }
  }

  // Send user webhooks
  const { data: webhooks } = await supabase
    .from('webhooks')
    .select('*')
    .eq('status', 'active')
    .contains('events', ['payment.confirmed']);

  if (webhooks) {
    for (const webhook of webhooks) {
      try {
        const payload = {
          event: 'payment.confirmed',
          charge_id: charge.id,
          external_id: charge.external_id,
          amount: charge.amount,
          paid_at: new Date().toISOString(),
        };

        const response = await fetch(webhook.url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Webhook-Secret': webhook.secret || '',
          },
          body: JSON.stringify(payload),
        });

        await supabase
          .from('webhook_logs')
          .insert({
            webhook_id: webhook.id,
            charge_id: charge.id,
            event_type: 'payment.confirmed',
            payload,
            response_status: response.status,
            response_body: await response.text(),
          });
      } catch (e) {
        console.error('Webhook error:', e);
      }
    }
  }

  // Send payment confirmed notification via WhatsApp and Email
  try {
    const confirmationPayload = {
      buyer_name: charge.buyer_name || 'Cliente',
      buyer_email: charge.buyer_email,
      buyer_phone: charge.buyer_phone,
      product_name: charge.products?.name || 'Produto',
      amount: charge.amount,
      paid_at: new Date().toISOString(),
      send_email: true,
      send_whatsapp: !!charge.buyer_phone,
    };
    
    console.log('Sending payment confirmed notification to buyer');
    
    // Fire and forget - don't wait for response
    fetch(`${supabaseUrl}/functions/v1/send-payment-confirmed`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(confirmationPayload),
    }).catch(err => console.error('Confirmation notification error (non-blocking):', err));
    
  } catch (notifError) {
    console.error('Error triggering confirmation notification:', notifError);
  }

  console.log('Payment confirmed:', charge.external_id);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const url = new URL(req.url);
  const path = url.pathname.replace('/pix-api', '');

  try {
    // API Key authentication for external calls
    const apiKey = req.headers.get('x-api-key');
    let authenticatedUserId: string | null = null;

    if (apiKey) {
      const encoder = new TextEncoder();
      const data = encoder.encode(apiKey);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const keyHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

      const { data: keyData, error: keyError } = await supabase
        .from('api_keys')
        .select('user_id, permissions, status')
        .eq('key_hash', keyHash)
        .eq('status', 'active')
        .single();

      if (keyError || !keyData) {
        return new Response(JSON.stringify({ error: 'Invalid API key' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      authenticatedUserId = keyData.user_id;

      await supabase
        .from('api_keys')
        .update({ last_used_at: new Date().toISOString() })
        .eq('key_hash', keyHash);
    }

    // GET /balance - Get BSPAY account balance (uses seller credentials or global)
    if (req.method === 'GET' && path === '/balance') {
      try {
        // Use global credentials for balance check (admin feature)
        const clientId = Deno.env.get('BSPAY_CLIENT_ID');
        const clientSecret = Deno.env.get('BSPAY_CLIENT_SECRET');
        
        if (!clientId || !clientSecret) {
          throw new Error('BSPAY credentials not configured');
        }
        
        const balanceData = await getBspayBalance(clientId, clientSecret);
        
        return new Response(JSON.stringify(balanceData), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } catch (error) {
        console.error('Balance error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return new Response(JSON.stringify({ error: errorMessage }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // POST /charges - Create a new PIX charge using seller's gateway credentials
    if (req.method === 'POST' && (path === '/charges' || path === '' || path === '/')) {
      const body: CreateChargeRequest = await req.json();
      
      if (!body.amount || body.amount <= 0) {
        return new Response(JSON.stringify({ error: 'Invalid amount' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (!body.buyer_email) {
        return new Response(JSON.stringify({ error: 'buyer_email is required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const paymentMethod = body.payment_method || 'pix';
      
      // Get seller_id from product
      let sellerId: string | null = null;
      if (body.product_id) {
        const { data: productData } = await supabase
          .from('products')
          .select('seller_id')
          .eq('id', body.product_id)
          .single();
        
        if (productData) {
          sellerId = productData.seller_id;
        }
      }

      if (!sellerId) {
        console.error('No seller_id found for product:', body.product_id);
        return new Response(JSON.stringify({ error: 'Produto não encontrado ou sem vendedor associado' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Get seller's gateway credentials for the payment method
      const gatewayData = await getSellerGatewayCredentials(supabase, sellerId, paymentMethod);
      
      if (!gatewayData) {
        console.error('Seller has no configured gateway for payment method:', paymentMethod);
        return new Response(JSON.stringify({ 
          error: `Vendedor não configurou método de pagamento: ${paymentMethod}. Por favor, configure na página de Formas de Pagamento.` 
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const { credentials, gateway } = gatewayData;
      console.log(`Using seller's ${gateway.name} gateway for ${paymentMethod} payment`);

      const externalId = generateExternalId();
      const expiresInMinutes = body.expires_in_minutes || 30;
      const expiresAt = new Date(Date.now() + expiresInMinutes * 60 * 1000);
      
      const webhookUrl = body.webhook_url || `${supabaseUrl}/functions/v1/pix-api/webhook`;

      let pixCode: string | null = null;
      let qrCodeBase64: string | null = null;
      let gatewayTransactionId: string | null = null;
      let cardPaymentStatus: string | null = null;
      let cardStatusDetail: string | null = null;

      try {
        // CARD PAYMENT HANDLING
        if (paymentMethod === 'card') {
          if (gateway.slug !== 'mercadopago') {
            return new Response(JSON.stringify({ 
              error: 'Pagamento com cartão só está disponível via Mercado Pago no momento.' 
            }), {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }
          
          if (!body.card_token) {
            return new Response(JSON.stringify({ error: 'Card token is required for card payments' }), {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }
          
          const accessToken = credentials.access_token;
          if (!accessToken) {
            throw new Error('Mercado Pago access_token not configured');
          }
          
          // Get product name for description
          let description = body.description || 'Pagamento via Cartão';
          if (body.product_id) {
            const { data: productInfo } = await supabase
              .from('products')
              .select('name')
              .eq('id', body.product_id)
              .maybeSingle();
            if (productInfo) {
              description = `Compra: ${productInfo.name}`;
            }
          }
          
          const cardResult = await createMercadoPagoCardPayment(
            accessToken,
            body.amount,
            externalId,
            {
              email: body.buyer_email,
              name: body.buyer_name,
              document: body.buyer_document,
            },
            body.card_token,
            body.installments || 1,
            description
          );
          
          gatewayTransactionId = cardResult.paymentId;
          cardPaymentStatus = cardResult.status;
          cardStatusDetail = cardResult.statusDetail;
          
          console.log('Mercado Pago card payment created:', gatewayTransactionId, 'status:', cardPaymentStatus);
          
        } else {
        // PIX PAYMENT HANDLING
        // Process payment based on gateway type
        if (gateway.slug === 'bspay') {
          const clientId = credentials.client_id;
          const clientSecret = credentials.client_secret;
          
          if (!clientId || !clientSecret) {
            throw new Error('BSPAY credentials incomplete');
          }
          
          const token = await getBspayToken(clientId, clientSecret);
          const bspayResult = await createBspayQRCode(
            token,
            body.amount,
            externalId,
            {
              name: body.buyer_name,
              email: body.buyer_email,
              document: body.buyer_document,
            },
            webhookUrl,
            body.description
          );
          
          pixCode = bspayResult.qrCode;
          qrCodeBase64 = bspayResult.qrCodeBase64;
          gatewayTransactionId = bspayResult.transactionId;
          
          console.log('BSPAY charge created successfully:', gatewayTransactionId);
          
        } else if (gateway.slug === 'mercadopago') {
          // Mercado Pago PIX Integration
          const accessToken = credentials.access_token;
          
          if (!accessToken) {
            throw new Error('Mercado Pago access_token not configured');
          }
          
          // Get product name for description
          let description = body.description || 'Pagamento via PIX';
          if (body.product_id) {
            const { data: productInfo } = await supabase
              .from('products')
              .select('name')
              .eq('id', body.product_id)
              .maybeSingle();
            if (productInfo) {
              description = `Compra: ${productInfo.name}`;
            }
          }
          
          const mpResult = await createMercadoPagoPixPayment(
            accessToken,
            body.amount,
            externalId,
            {
              email: body.buyer_email,
              name: body.buyer_name,
              document: body.buyer_document,
            },
            description
          );
          
          pixCode = mpResult.qrCode;
          qrCodeBase64 = mpResult.qrCodeBase64;
          gatewayTransactionId = mpResult.paymentId;
          
          console.log('Mercado Pago charge created successfully:', gatewayTransactionId);
          
        } else {
          // For other gateways, we'll need to implement their specific APIs
          console.error('Gateway not yet implemented:', gateway.slug);
          return new Response(JSON.stringify({ 
            error: `Gateway ${gateway.name} ainda não está implementado. Por favor, configure um gateway suportado (BSPAY ou Mercado Pago).` 
          }), {
            status: 501,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        } // End of else block for PIX payments
      } catch (gatewayError) {
        console.error('Gateway error:', gatewayError);
        const errorMessage = gatewayError instanceof Error ? gatewayError.message : 'Gateway error';
        return new Response(JSON.stringify({ error: `Erro no gateway de pagamento: ${errorMessage}` }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      let affiliateId: string | null = null;
      if (body.affiliate_code) {
        const { data: affiliate } = await supabase
          .from('affiliates')
          .select('id')
          .eq('affiliate_code', body.affiliate_code)
          .eq('status', 'active')
          .single();
        
        if (affiliate) {
          affiliateId = affiliate.id;
        }
      }

      console.log('Creating charge with product_id:', body.product_id, 'seller_id:', sellerId);

      const { data: charge, error } = await supabase
        .from('pix_charges')
        .insert({
          external_id: gatewayTransactionId || externalId,
          product_id: body.product_id || null,
          seller_id: sellerId,
          buyer_email: body.buyer_email,
          buyer_name: body.buyer_name || null,
          buyer_cpf: body.buyer_document || null,
          buyer_phone: body.buyer_phone || null,
          amount: body.amount,
          status: 'pending',
          qr_code: pixCode,
          qr_code_base64: qrCodeBase64,
          copy_paste: pixCode,
          affiliate_id: affiliateId,
          expires_at: expiresAt.toISOString(),
          order_bumps: body.order_bumps || [],
          utm_source: body.utm_source || null,
          utm_medium: body.utm_medium || null,
          utm_campaign: body.utm_campaign || null,
          utm_content: body.utm_content || null,
          utm_term: body.utm_term || null,
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating charge:', error);
        return new Response(JSON.stringify({ error: 'Failed to create charge' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Get product name for notification
      let productName = 'Produto';
      if (body.product_id) {
        const { data: productInfo } = await supabase
          .from('products')
          .select('name')
          .eq('id', body.product_id)
          .single();
        if (productInfo) {
          productName = productInfo.name;
        }
      }

      // Send email and WhatsApp notification in background
      try {
        const notificationPayload = {
          buyer_name: body.buyer_name || 'Cliente',
          buyer_email: body.buyer_email,
          buyer_phone: body.buyer_phone,
          product_name: productName,
          amount: body.amount,
          pix_code: pixCode,
          expires_at: expiresAt.toISOString(),
          send_email: true,
          send_whatsapp: !!body.buyer_phone,
        };
        
        console.log('Sending PIX notification to buyer');
        
        // Fire and forget - don't wait for response
        fetch(`${supabaseUrl}/functions/v1/send-pix-notification`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(notificationPayload),
        }).catch(err => console.error('Notification error (non-blocking):', err));
        
      } catch (notifError) {
        console.error('Error triggering notification:', notifError);
        // Don't fail the charge creation if notification fails
      }

      const response: ChargeResponse = {
        id: charge.id,
        external_id: charge.external_id,
        amount: charge.amount,
        status: charge.status,
        qr_code: charge.qr_code,
        qr_code_base64: charge.qr_code_base64,
        copy_paste: charge.copy_paste,
        expires_at: charge.expires_at,
        created_at: charge.created_at,
      };

      console.log('Charge created:', response.external_id);

      return new Response(JSON.stringify(response), {
        status: 201,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // POST /webhook - Handle BSPAY payment webhook
    if (req.method === 'POST' && path === '/webhook') {
      const body = await req.json();
      console.log('Received BSPAY webhook:', JSON.stringify(body));
      
      const requestBody = body.requestBody || body;
      
      if (requestBody.transactionType === 'RECEIVEPIX' && requestBody.status === 'PAID') {
        const transactionId = requestBody.transactionId || requestBody.external_id;
        
        const { data: charge, error: fetchError } = await supabase
          .from('pix_charges')
          .select('*, products(name, seller_id, auto_send_access_email), affiliates(*)')
          .or(`external_id.eq.${transactionId},external_id.eq.${requestBody.external_id}`)
          .single();

        if (charge && charge.status === 'pending') {
          await processPaymentConfirmation(supabase, charge, supabaseUrl);
        }
      }
      
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // POST /webhook/mercadopago - Handle Mercado Pago IPN webhook
    if (req.method === 'POST' && (path === '/webhook/mercadopago' || path === '/webhook-mercadopago')) {
      console.log('Received Mercado Pago webhook');
      
      // Get query parameters (MP sends type and data.id as query params)
      const queryType = url.searchParams.get('type');
      const queryDataId = url.searchParams.get('data.id');
      
      let body: any = {};
      try {
        const bodyText = await req.text();
        if (bodyText) {
          body = JSON.parse(bodyText);
        }
      } catch (e) {
        console.log('No body or invalid JSON in webhook');
      }
      
      console.log('Mercado Pago webhook - query params:', { type: queryType, dataId: queryDataId });
      console.log('Mercado Pago webhook - body:', JSON.stringify(body));
      
      // Determine the notification type and payment ID
      const notificationType = queryType || body.type || body.action;
      const paymentId = queryDataId || body.data?.id || body.id;
      
      // Process payment notifications
      if ((notificationType === 'payment' || notificationType === 'payment.updated' || notificationType === 'payment.created') && paymentId) {
        console.log('Processing Mercado Pago payment notification:', paymentId);
        
        // Find the charge by external_id (which stores the MP payment ID)
        const { data: charge, error: fetchError } = await supabase
          .from('pix_charges')
          .select('*, products(name, seller_id, auto_send_access_email), affiliates(*)')
          .eq('external_id', String(paymentId))
          .maybeSingle();
        
        if (fetchError) {
          console.error('Error fetching charge:', fetchError);
        }
        
        if (charge && charge.status === 'pending') {
          // Get seller's credentials to verify payment status
          const gatewayData = await getSellerGatewayCredentials(supabase, charge.seller_id, 'pix');
          
          if (gatewayData && gatewayData.gateway.slug === 'mercadopago') {
            const { credentials } = gatewayData;
            
            try {
              // Verify payment status with Mercado Pago API
              const mpPayment = await getMercadoPagoPayment(credentials.access_token!, String(paymentId));
              
              console.log('Mercado Pago payment status:', mpPayment.status);
              
              // Check if payment is approved
              if (mpPayment.status === 'approved') {
                console.log('Payment approved, processing confirmation...');
                await processPaymentConfirmation(supabase, charge, supabaseUrl);
              } else if (mpPayment.status === 'rejected' || mpPayment.status === 'cancelled') {
                // Update charge status to cancelled
                await supabase
                  .from('pix_charges')
                  .update({ status: 'cancelled' })
                  .eq('id', charge.id);
                console.log('Payment rejected/cancelled:', paymentId);
              }
            } catch (mpError) {
              console.error('Error verifying Mercado Pago payment:', mpError);
            }
          } else {
            console.log('Charge found but gateway is not Mercado Pago or credentials not found');
          }
        } else if (!charge) {
          console.log('No pending charge found for payment ID:', paymentId);
        } else {
          console.log('Charge already processed:', charge.status);
        }
      }
      
      // Always return 200 to acknowledge receipt (MP requirement)
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // GET /charges/:id - Get charge status
    if (req.method === 'GET' && path.startsWith('/charges/')) {
      const chargeId = path.replace('/charges/', '');
      
      const { data: charge, error } = await supabase
        .from('pix_charges')
        .select('*')
        .or(`id.eq.${chargeId},external_id.eq.${chargeId}`)
        .single();

      if (error || !charge) {
        return new Response(JSON.stringify({ error: 'Charge not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (charge.status === 'pending' && charge.seller_id) {
        try {
          // Get seller's credentials to check transaction status
          const gatewayData = await getSellerGatewayCredentials(supabase, charge.seller_id, 'pix');
          
          if (gatewayData) {
            if (gatewayData.gateway.slug === 'bspay') {
              const { credentials } = gatewayData;
              const token = await getBspayToken(credentials.client_id!, credentials.client_secret!);
              const bspayTransaction = await getBspayTransaction(token, charge.external_id);
              
              if (bspayTransaction.status === 'PAID') {
                await supabase
                  .from('pix_charges')
                  .update({ status: 'paid', paid_at: new Date().toISOString() })
                  .eq('id', charge.id);
                
                charge.status = 'paid';
                charge.paid_at = new Date().toISOString();
              }
            } else if (gatewayData.gateway.slug === 'mercadopago') {
              // Check Mercado Pago payment status
              const { credentials } = gatewayData;
              const mpPayment = await getMercadoPagoPayment(credentials.access_token!, charge.external_id);
              
              if (mpPayment.status === 'approved') {
                await supabase
                  .from('pix_charges')
                  .update({ status: 'paid', paid_at: new Date().toISOString() })
                  .eq('id', charge.id);
                
                charge.status = 'paid';
                charge.paid_at = new Date().toISOString();
              } else if (mpPayment.status === 'rejected' || mpPayment.status === 'cancelled') {
                await supabase
                  .from('pix_charges')
                  .update({ status: 'cancelled' })
                  .eq('id', charge.id);
                
                charge.status = 'cancelled';
              }
            }
          }
        } catch (e) {
          console.log('Could not check gateway status:', e);
        }
      }

      return new Response(JSON.stringify(charge), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // GET /payment-methods/:sellerId - Get seller's available payment methods and public key
    if (req.method === 'GET' && path.startsWith('/payment-methods/')) {
      const sellerId = path.replace('/payment-methods/', '');
      
      console.log('Fetching payment methods for seller:', sellerId);
      
      const { data, error } = await supabase
        .from('seller_gateway_credentials')
        .select(`
          use_for_pix,
          use_for_card,
          use_for_boleto,
          is_active,
          credentials,
          payment_gateways (
            is_active,
            slug
          )
        `)
        .eq('user_id', sellerId)
        .eq('is_active', true);
      
      if (error) {
        console.error('Error fetching payment methods:', error);
        return new Response(JSON.stringify({ error: 'Failed to fetch payment methods' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      const methods: string[] = [];
      let publicKey: string | null = null;
      
      if (data && data.length > 0) {
        const activeCredentials = data.filter((c: any) => {
          const gateway = c.payment_gateways;
          return gateway && (Array.isArray(gateway) ? gateway[0]?.is_active : gateway.is_active);
        });
        
        if (activeCredentials.some((c: any) => c.use_for_pix)) methods.push('pix');
        if (activeCredentials.some((c: any) => c.use_for_card)) methods.push('card');
        if (activeCredentials.some((c: any) => c.use_for_boleto)) methods.push('boleto');
        
        // Get public key for Mercado Pago card payments
        const mpCredentials = activeCredentials.find((c: any) => {
          const gateway = c.payment_gateways;
          const slug = Array.isArray(gateway) ? gateway[0]?.slug : gateway?.slug;
          return slug === 'mercadopago' && c.use_for_card;
        });
        
        if (mpCredentials?.credentials?.public_key) {
          publicKey = mpCredentials.credentials.public_key;
        }
      }
      
      console.log('Available payment methods:', methods, 'hasPublicKey:', !!publicKey);
      
      return new Response(JSON.stringify({ methods, publicKey }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // SECURITY: Manual /confirm endpoint has been removed
    // Payment confirmations should only happen via verified gateway webhooks
    if (req.method === 'POST' && path.includes('/confirm')) {
      return new Response(JSON.stringify({ 
        error: 'Manual payment confirmation is not allowed. Payments are confirmed automatically via webhook.' 
      }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Not found' }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('API Error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
