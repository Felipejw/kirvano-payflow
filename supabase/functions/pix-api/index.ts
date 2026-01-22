import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

// ============================================================
// SECURITY: basic per-IP rate limiting for public endpoints
// NOTE: This is best-effort (edge runtime is ephemeral), but helps against abuse.
// ============================================================
type RateEntry = { count: number; resetAt: number };
const rateLimitStore = new Map<string, RateEntry>();

function getClientIp(req: Request): string {
  const xff = req.headers.get('x-forwarded-for');
  if (xff && xff.trim()) return xff.split(',')[0].trim();
  const realIp = req.headers.get('x-real-ip');
  if (realIp && realIp.trim()) return realIp.trim();
  return 'unknown';
}

function checkRateLimit(ip: string, limit: number, windowMs: number) {
  const now = Date.now();
  const entry = rateLimitStore.get(ip);
  if (!entry || entry.resetAt <= now) {
    rateLimitStore.set(ip, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: limit - 1, resetAt: now + windowMs };
  }
  if (entry.count >= limit) {
    return { ok: false, remaining: 0, resetAt: entry.resetAt };
  }
  entry.count += 1;
  rateLimitStore.set(ip, entry);
  return { ok: true, remaining: limit - entry.count, resetAt: entry.resetAt };
}

// SECURITY: Use service role client for database operations
// This is required since RLS now restricts pix_charges updates to service role only
const createServiceClient = () => {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  return createClient(supabaseUrl, supabaseServiceKey);
};

// ============================================================
// SECURITY: Input Validation Schemas
// ============================================================

// Brazilian CPF validation (basic format + checksum)
const cpfSchema = z.string().optional().transform((val) => {
  if (!val) return undefined;
  return val.replace(/\D/g, '');
}).refine((val) => {
  if (!val) return true;
  if (val.length !== 11) return false;
  // Check for known invalid patterns
  if (/^(\d)\1+$/.test(val)) return false;
  // Validate checksum
  let sum = 0;
  for (let i = 0; i < 9; i++) sum += parseInt(val[i]) * (10 - i);
  let check = 11 - (sum % 11);
  if (check >= 10) check = 0;
  if (check !== parseInt(val[9])) return false;
  sum = 0;
  for (let i = 0; i < 10; i++) sum += parseInt(val[i]) * (11 - i);
  check = 11 - (sum % 11);
  if (check >= 10) check = 0;
  return check === parseInt(val[10]);
}, { message: "CPF inválido" });

// Brazilian phone validation
const phoneSchema = z.string().optional().transform((val) => {
  if (!val) return undefined;
  return val.replace(/\D/g, '');
}).refine((val) => {
  if (!val) return true;
  // Valid formats: 10 or 11 digits (with or without area code 9)
  return val.length >= 10 && val.length <= 11;
}, { message: "Telefone inválido" });

// Email validation
const emailSchema = z.string().email({ message: "Email inválido" }).max(255);

// Amount validation (security: max R$50.000 per transaction)
const amountSchema = z.number()
  .positive({ message: "Valor deve ser positivo" })
  .max(50000, { message: "Valor máximo permitido é R$50.000" });

// Full charge request validation schema
const chargeRequestSchema = z.object({
  amount: amountSchema,
  buyer_email: emailSchema,
  buyer_name: z.string().max(200).nullable().optional(),
  buyer_document: cpfSchema,
  buyer_phone: phoneSchema,
  product_id: z.string().uuid().nullable().optional(),
  affiliate_code: z.string().max(50).nullable().optional(),
  expires_in_minutes: z.number().min(5).max(1440).nullable().optional(),
  webhook_url: z.string().url().nullable().optional(),
  description: z.string().max(500).nullable().optional(),
  order_bumps: z.array(z.string().uuid()).nullable().optional(),
  payment_method: z.enum(['pix', 'card', 'boleto']).nullable().optional(),
  card_token: z.string().nullable().optional(),
  installments: z.number().min(1).max(12).nullable().optional(),
  utm_source: z.string().max(100).nullable().optional(),
  utm_medium: z.string().max(100).nullable().optional(),
  utm_campaign: z.string().max(100).nullable().optional(),
  utm_content: z.string().max(100).nullable().optional(),
  utm_term: z.string().max(100).nullable().optional(),
  card_data: z.object({
    holderName: z.string(),
    number: z.string(),
    expiryMonth: z.string(),
    expiryYear: z.string(),
    ccv: z.string(),
  }).nullable().optional(),
  card_holder_info: z.object({
    name: z.string(),
    email: z.string().email(),
    cpfCnpj: z.string(),
    postalCode: z.string(),
    addressNumber: z.string(),
    phone: z.string().optional(),
  }).nullable().optional(),
  remote_ip: z.string().nullable().optional(),
});

// ============================================================
// SECURITY: Price Validation Function
// ============================================================
async function validateAndGetExpectedPrice(
  supabase: any,
  productId: string,
  orderBumps?: string[]
): Promise<{ expectedAmount: number; productName: string; sellerId: string; parentProductId: string | null }> {
  // Fetch the product price from database
  const { data: product, error: productError } = await supabase
    .from('products')
    .select('price, name, seller_id, parent_product_id, order_bumps')
    .eq('id', productId)
    .single();

  if (productError || !product) {
    throw new Error('Produto não encontrado');
  }

  let expectedAmount = product.price;

  // Add order bumps prices if any
  if (orderBumps && orderBumps.length > 0) {
    const { data: bumpProducts, error: bumpError } = await supabase
      .from('products')
      .select('id, price')
      .in('id', orderBumps);

    if (!bumpError && bumpProducts) {
      for (const bump of bumpProducts) {
        expectedAmount += bump.price;
      }
    }
  }

  return {
    expectedAmount,
    productName: product.name,
    sellerId: product.seller_id,
    parentProductId: product.parent_product_id,
  };
}

// ============================================================
// SECURITY: Log Security Events
// ============================================================
async function logSecurityEvent(
  supabase: any,
  eventType: string,
  details: Record<string, any>,
  ipAddress?: string | null,
  userAgent?: string | null
) {
  try {
    await supabase.from('platform_gateway_logs').insert({
      seller_id: details.seller_id || '00000000-0000-0000-0000-000000000000',
      action: `SECURITY:${eventType}`,
      amount: details.received_amount || 0,
      product_id: details.product_id || null,
      buyer_email: details.buyer_email || null,
      buyer_name: details.buyer_name || null,
      external_id: `SEC-${Date.now()}`,
      error_message: JSON.stringify(details),
      ip_address: ipAddress,
      user_agent: userAgent,
    });
    console.error(`SECURITY EVENT [${eventType}]:`, JSON.stringify(details));
  } catch (logError) {
    console.error('Failed to log security event:', logError);
  }
}

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
  // Asaas card-specific fields (no tokenization)
  card_data?: {
    holderName: string;
    number: string;
    expiryMonth: string;
    expiryYear: string;
    ccv: string;
  };
  card_holder_info?: {
    name: string;
    email: string;
    cpfCnpj: string;
    postalCode: string;
    addressNumber: string;
    phone?: string;
  };
  remote_ip?: string;
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

// PIXUP API Integration (similar to BSPAY)
const PIXUP_API_URL = "https://api.pixupbr.com/v2";

async function getPixupToken(clientId: string, clientSecret: string): Promise<string> {
  if (!clientId || !clientSecret) {
    throw new Error('PIXUP credentials not provided');
  }
  
  const credentials = `${clientId}:${clientSecret}`;
  const base64Credentials = btoa(credentials);
  
  console.log('Getting PIXUP token...');
  
  const response = await fetch(`${PIXUP_API_URL}/oauth/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${base64Credentials}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error('PIXUP token error:', response.status, errorText);
    throw new Error(`Failed to get PIXUP token: ${response.status}`);
  }
  
  const data = await response.json();
  console.log('PIXUP token obtained successfully');
  return data.access_token;
}

async function createPixupQRCode(
  token: string,
  amount: number,
  externalId: string,
  payer: { name?: string; email: string; document?: string },
  postbackUrl: string,
  description?: string
): Promise<{ qrCode: string; qrCodeBase64: string; transactionId: string }> {
  console.log('Creating PIXUP QRCode for amount:', amount);
  
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
  
  const response = await fetch(`${PIXUP_API_URL}/pix/qrcode`, {
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
    console.error('PIXUP QRCode error:', response.status, errorText);
    throw new Error(`Failed to create PIXUP QRCode: ${response.status} - ${errorText}`);
  }
  
  const data = await response.json();
  console.log('PIXUP QRCode created:', data.transactionId || data.id);
  
  return {
    qrCode: data.qrcode || data.qr_code || data.copyPaste || data.copy_paste,
    qrCodeBase64: data.qrcodeBase64 || data.qr_code_base64 || data.qrCodeImage || '',
    transactionId: data.transactionId || data.transaction_id || data.id,
  };
}

async function getPixupBalance(clientId: string, clientSecret: string): Promise<{ balance: number }> {
  const token = await getPixupToken(clientId, clientSecret);
  console.log('Getting PIXUP balance...');
  
  const response = await fetch(`${PIXUP_API_URL}/balance`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json',
    },
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error('PIXUP balance error:', response.status, errorText);
    throw new Error(`Failed to get PIXUP balance: ${response.status}`);
  }
  
  const data = await response.json();
  console.log('PIXUP balance obtained:', data.balance);
  return { balance: data.balance || data.available || 0 };
}

async function getPixupTransaction(token: string, pixId: string): Promise<any> {
  console.log('Getting PIXUP transaction:', pixId);
  
  const response = await fetch(`${PIXUP_API_URL}/consult-transaction`, {
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
    console.error('PIXUP transaction error:', response.status, errorText);
    throw new Error(`Failed to get PIXUP transaction: ${response.status}`);
  }
  
  const data = await response.json();
  console.log('PIXUP transaction status:', data.status);
  return data;
}

// End of PIXUP Integration

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

// ============================================================
// ASAAS API Integration
// ============================================================
const ASAAS_API_URL = "https://api.asaas.com/v3";
const ASAAS_SANDBOX_URL = "https://sandbox.asaas.com/api/v3";

// Get or create Asaas customer
async function getOrCreateAsaasCustomer(
  apiKey: string,
  cpfCnpj: string,
  name: string,
  email: string,
  phone?: string
): Promise<string> {
  const baseUrl = apiKey.includes('$aact_') ? ASAAS_API_URL : ASAAS_SANDBOX_URL;
  
  // Clean document
  const cleanDoc = cpfCnpj.replace(/\D/g, '');
  
  // Try to find existing customer
  console.log('Searching for existing Asaas customer with document:', cleanDoc);
  const searchResponse = await fetch(`${baseUrl}/customers?cpfCnpj=${cleanDoc}`, {
    method: 'GET',
    headers: {
      'access_token': apiKey,
      'Content-Type': 'application/json',
    },
  });
  
  if (searchResponse.ok) {
    const searchData = await searchResponse.json();
    if (searchData.data && searchData.data.length > 0) {
      console.log('Found existing Asaas customer:', searchData.data[0].id);
      return searchData.data[0].id;
    }
  }
  
  // Create new customer
  console.log('Creating new Asaas customer');
  const createPayload: any = {
    name: name || 'Cliente',
    email: email,
    cpfCnpj: cleanDoc,
  };
  
  if (phone) {
    const cleanPhone = phone.replace(/\D/g, '');
    createPayload.mobilePhone = cleanPhone;
  }
  
  const createResponse = await fetch(`${baseUrl}/customers`, {
    method: 'POST',
    headers: {
      'access_token': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(createPayload),
  });
  
  if (!createResponse.ok) {
    const errorText = await createResponse.text();
    console.error('Asaas customer creation error:', createResponse.status, errorText);
    throw new Error(`Failed to create Asaas customer: ${createResponse.status} - ${errorText}`);
  }
  
  const createData = await createResponse.json();
  console.log('Asaas customer created:', createData.id);
  return createData.id;
}

// Create Asaas PIX payment
interface AsaasPixResult {
  paymentId: string;
  qrCode: string;
  qrCodeBase64: string;
  payload: string;
}

async function createAsaasPixPayment(
  apiKey: string,
  customerId: string,
  amount: number,
  externalReference: string,
  description?: string
): Promise<AsaasPixResult> {
  const baseUrl = apiKey.includes('$aact_') ? ASAAS_API_URL : ASAAS_SANDBOX_URL;
  
  console.log('Creating Asaas PIX payment for amount:', amount);
  
  // Create payment
  const paymentPayload = {
    customer: customerId,
    billingType: 'PIX',
    value: amount,
    externalReference: externalReference,
    description: description || 'Pagamento via PIX',
    dueDate: new Date(Date.now() + 30 * 60 * 1000).toISOString().split('T')[0], // 30 min expiry
  };
  
  const paymentResponse = await fetch(`${baseUrl}/payments`, {
    method: 'POST',
    headers: {
      'access_token': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(paymentPayload),
  });
  
  if (!paymentResponse.ok) {
    const errorText = await paymentResponse.text();
    console.error('Asaas payment creation error:', paymentResponse.status, errorText);
    throw new Error(`Failed to create Asaas payment: ${paymentResponse.status} - ${errorText}`);
  }
  
  const paymentData = await paymentResponse.json();
  const paymentId = paymentData.id;
  console.log('Asaas payment created:', paymentId);
  
  // Get QR Code
  const qrResponse = await fetch(`${baseUrl}/payments/${paymentId}/pixQrCode`, {
    method: 'GET',
    headers: {
      'access_token': apiKey,
      'Content-Type': 'application/json',
    },
  });
  
  if (!qrResponse.ok) {
    const errorText = await qrResponse.text();
    console.error('Asaas QR code error:', qrResponse.status, errorText);
    throw new Error(`Failed to get Asaas QR code: ${qrResponse.status} - ${errorText}`);
  }
  
  const qrData = await qrResponse.json();
  
  return {
    paymentId: paymentId,
    qrCode: qrData.encodedImage || '',
    qrCodeBase64: qrData.encodedImage || '',
    payload: qrData.payload || '',
  };
}

// Create Asaas Card payment
interface AsaasCardResult {
  paymentId: string;
  status: string;
  statusDetail: string;
}

async function createAsaasCardPayment(
  apiKey: string,
  customerId: string,
  amount: number,
  externalReference: string,
  creditCard: {
    holderName: string;
    number: string;
    expiryMonth: string;
    expiryYear: string;
    ccv: string;
  },
  creditCardHolderInfo: {
    name: string;
    email: string;
    cpfCnpj: string;
    postalCode: string;
    addressNumber: string;
    phone?: string;
  },
  installments: number,
  remoteIp: string,
  description?: string
): Promise<AsaasCardResult> {
  const baseUrl = apiKey.includes('$aact_') ? ASAAS_API_URL : ASAAS_SANDBOX_URL;
  
  console.log('Creating Asaas card payment for amount:', amount, 'installments:', installments);
  
  // Clean card number
  const cleanCardNumber = creditCard.number.replace(/\D/g, '');
  const cleanDoc = creditCardHolderInfo.cpfCnpj.replace(/\D/g, '');
  const cleanPostalCode = creditCardHolderInfo.postalCode.replace(/\D/g, '');
  
  const paymentPayload: any = {
    customer: customerId,
    billingType: 'CREDIT_CARD',
    value: amount,
    externalReference: externalReference,
    description: description || 'Pagamento via Cartão',
    dueDate: new Date().toISOString().split('T')[0],
    creditCard: {
      holderName: creditCard.holderName,
      number: cleanCardNumber,
      expiryMonth: creditCard.expiryMonth,
      expiryYear: creditCard.expiryYear.length === 2 ? `20${creditCard.expiryYear}` : creditCard.expiryYear,
      ccv: creditCard.ccv,
    },
    creditCardHolderInfo: {
      name: creditCardHolderInfo.name,
      email: creditCardHolderInfo.email,
      cpfCnpj: cleanDoc,
      postalCode: cleanPostalCode,
      addressNumber: creditCardHolderInfo.addressNumber,
      phone: creditCardHolderInfo.phone?.replace(/\D/g, '') || undefined,
    },
    remoteIp: remoteIp || '0.0.0.0',
  };
  
  if (installments > 1) {
    paymentPayload.installmentCount = installments;
    paymentPayload.installmentValue = amount / installments;
  }
  
  // Log without sensitive data
  console.log('Asaas card payload (sanitized):', JSON.stringify({
    ...paymentPayload,
    creditCard: { ...paymentPayload.creditCard, number: '****', ccv: '***' }
  }, null, 2));
  
  const paymentResponse = await fetch(`${baseUrl}/payments`, {
    method: 'POST',
    headers: {
      'access_token': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(paymentPayload),
  });
  
  const responseText = await paymentResponse.text();
  console.log('Asaas card response status:', paymentResponse.status);
  
  if (!paymentResponse.ok) {
    console.error('Asaas card payment error:', paymentResponse.status, responseText);
    throw new Error(`Failed to create Asaas card payment: ${paymentResponse.status} - ${responseText}`);
  }
  
  const paymentData = JSON.parse(responseText);
  console.log('Asaas card payment created:', paymentData.id, 'status:', paymentData.status);
  
  // Map Asaas status to our status
  let status = 'pending';
  let statusDetail = paymentData.status || '';
  
  if (paymentData.status === 'CONFIRMED' || paymentData.status === 'RECEIVED') {
    status = 'approved';
  } else if (paymentData.status === 'PENDING') {
    status = 'pending';
  } else if (paymentData.status === 'REFUNDED' || paymentData.status === 'REFUND_REQUESTED') {
    status = 'refunded';
  } else if (['OVERDUE', 'AWAITING_RISK_ANALYSIS'].includes(paymentData.status)) {
    status = 'in_process';
  } else {
    status = 'rejected';
    statusDetail = paymentData.description || paymentData.status;
  }
  
  return {
    paymentId: paymentData.id,
    status: status,
    statusDetail: statusDetail,
  };
}

// Get Asaas payment status
async function getAsaasPayment(apiKey: string, paymentId: string): Promise<any> {
  const baseUrl = apiKey.includes('$aact_') ? ASAAS_API_URL : ASAAS_SANDBOX_URL;
  
  console.log('Getting Asaas payment:', paymentId);
  
  const response = await fetch(`${baseUrl}/payments/${paymentId}`, {
    method: 'GET',
    headers: {
      'access_token': apiKey,
      'Content-Type': 'application/json',
    },
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error('Asaas get payment error:', response.status, errorText);
    throw new Error(`Failed to get Asaas payment: ${response.status}`);
  }
  
  const data = await response.json();
  console.log('Asaas payment status:', data.status);
  return data;
}

// ============================================================
// End of Asaas Integration
// ============================================================

// ============================================================
// GHOSTPAY API Integration
// ============================================================
const GHOSTPAY_API_URL = "https://api.ghostspaysv2.com/functions/v1";

function getGhostpayAuthHeader(secretKey: string, companyId: string): string {
  const credentials = `${secretKey}:${companyId}`;
  return `Basic ${btoa(credentials)}`;
}

// Map Ghostpay status to internal status
function mapGhostpayStatus(ghostpayStatus: string): string {
  const statusMap: Record<string, string> = {
    'waiting_payment': 'pending',
    'paid': 'paid',
    'refused': 'failed',
    'failed': 'failed',
    'expired': 'expired',
    'refunded': 'refunded',
    'chargedback': 'chargeback',
    'canceled': 'cancelled',
    'in_analisys': 'pending',
    'in_protest': 'disputed'
  };
  return statusMap[ghostpayStatus] || 'pending';
}

interface GhostpayPaymentResult {
  transactionId: string;
  qrCode?: string;
  qrCodeBase64?: string;
  boletoUrl?: string;
  barcode?: string;
  typedLine?: string;
  status: string;
}

async function createGhostpayPixPayment(
  secretKey: string,
  companyId: string,
  amount: number,
  externalId: string,
  customer: { name: string; email: string; document: string; phone?: string },
  postbackUrl: string,
  description?: string
): Promise<GhostpayPaymentResult> {
  console.log('Creating Ghostpay PIX payment for amount:', amount);
  
  // Formato correto conforme documentação GhostsPay
  const payload = {
    amount: Math.round(amount * 100), // Valor em centavos
    paymentMethod: 'PIX', // camelCase, valor em maiúsculo
    customer: {
      name: customer.name || 'Cliente',
      email: customer.email,
      phone: customer.phone?.replace(/\D/g, '') || undefined,
      document: {
        number: customer.document?.replace(/\D/g, '') || '00000000000',
        type: 'CPF'
      }
    },
    items: [
      {
        title: description || 'Pagamento via PIX',
        unitPrice: Math.round(amount * 100),
        quantity: 1,
        externalRef: externalId
      }
    ],
    pix: {
      expiresInDays: 1
    },
    postbackUrl: postbackUrl,
    metadata: {
      external_id: externalId,
      ip: '0.0.0.0'
    }
  };
  
  console.log('Ghostpay PIX payload:', JSON.stringify(payload, null, 2));
  
  const response = await fetch(`${GHOSTPAY_API_URL}/transactions`, {
    method: 'POST',
    headers: {
      'Authorization': getGhostpayAuthHeader(secretKey, companyId),
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  
  const responseText = await response.text();
  console.log('Ghostpay PIX response status:', response.status);
  console.log('Ghostpay PIX response:', responseText);
  
  if (!response.ok) {
    console.error('Ghostpay PIX error:', response.status, responseText);
    throw new Error(`Failed to create Ghostpay PIX payment: ${response.status} - ${responseText}`);
  }
  
  const data = JSON.parse(responseText);
  
  console.log('Ghostpay PIX payment created:', data.id);
  
  // GhostsPay retorna pix.qrcode (minúsculo) - este é o código copia e cola
  const copyPasteCode = data.pix?.qrcode || data.pix?.qrCode || data.pix?.qr_code || data.pix?.emv || '';
  
  console.log('Ghostpay PIX copyPasteCode:', copyPasteCode ? copyPasteCode.substring(0, 50) + '...' : 'EMPTY');
  
  return {
    transactionId: data.id,
    qrCode: copyPasteCode, // Código copia e cola (EMV)
    qrCodeBase64: '', // GhostsPay não retorna imagem base64, usamos biblioteca para gerar
    status: mapGhostpayStatus(data.status),
  };
}

async function createGhostpayCardPayment(
  secretKey: string,
  companyId: string,
  amount: number,
  externalId: string,
  customer: { name: string; email: string; document: string; phone?: string },
  cardData: {
    holderName: string;
    number: string;
    expiryMonth: string;
    expiryYear: string;
    ccv: string;
  },
  billingAddress: {
    zipcode: string;
    street: string;
    street_number: string;
    neighborhood?: string;
    city?: string;
    state?: string;
  },
  installments: number,
  postbackUrl: string,
  description?: string
): Promise<GhostpayPaymentResult> {
  console.log('Creating Ghostpay card payment for amount:', amount, 'installments:', installments);
  
  const cleanCardNumber = cardData.number.replace(/\D/g, '');
  
  // Formato correto conforme documentação GhostsPay
  const payload = {
    amount: Math.round(amount * 100), // Valor em centavos
    paymentMethod: 'CREDIT_CARD', // camelCase, valor em maiúsculo
    customer: {
      name: customer.name || 'Cliente',
      email: customer.email,
      phone: customer.phone?.replace(/\D/g, '') || undefined,
      document: {
        number: customer.document?.replace(/\D/g, '') || '00000000000',
        type: 'CPF'
      }
    },
    items: [
      {
        title: description || 'Pagamento via Cartão',
        unitPrice: Math.round(amount * 100),
        quantity: 1,
        externalRef: externalId
      }
    ],
    card: {
      holderName: cardData.holderName,
      number: cleanCardNumber,
      expirationDate: `${cardData.expiryMonth}/${cardData.expiryYear.slice(-2)}`,
      cvv: cardData.ccv,
      installments: installments
    },
    billing: {
      address: {
        zipCode: billingAddress.zipcode?.replace(/\D/g, '') || '',
        street: billingAddress.street || '',
        number: billingAddress.street_number || '',
        neighborhood: billingAddress.neighborhood || '',
        city: billingAddress.city || '',
        state: billingAddress.state || '',
        country: 'BR',
      },
    },
    postbackUrl: postbackUrl,
    metadata: {
      external_id: externalId,
      ip: '0.0.0.0'
    }
  };
  
  console.log('Ghostpay card payload (sanitized):', JSON.stringify({
    ...payload,
    card: { ...payload.card, number: '****', cvv: '***' }
  }, null, 2));
  
  const response = await fetch(`${GHOSTPAY_API_URL}/transactions`, {
    method: 'POST',
    headers: {
      'Authorization': getGhostpayAuthHeader(secretKey, companyId),
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  
  const responseText = await response.text();
  console.log('Ghostpay card response status:', response.status);
  
  if (!response.ok) {
    console.error('Ghostpay card error:', response.status, responseText);
    throw new Error(`Failed to create Ghostpay card payment: ${response.status} - ${responseText}`);
  }
  
  const data = JSON.parse(responseText);
  
  console.log('Ghostpay card payment created:', data.id, 'status:', data.status);
  
  return {
    transactionId: data.id,
    status: mapGhostpayStatus(data.status),
  };
}

async function createGhostpayBoletoPayment(
  secretKey: string,
  companyId: string,
  amount: number,
  externalId: string,
  customer: { name: string; email: string; document: string; phone?: string },
  postbackUrl: string,
  description?: string
): Promise<GhostpayPaymentResult> {
  console.log('Creating Ghostpay boleto payment for amount:', amount);
  
  // Formato correto conforme documentação GhostsPay
  const payload = {
    amount: Math.round(amount * 100), // Valor em centavos
    paymentMethod: 'BOLETO', // camelCase, valor em maiúsculo
    customer: {
      name: customer.name || 'Cliente',
      email: customer.email,
      phone: customer.phone?.replace(/\D/g, '') || undefined,
      document: {
        number: customer.document?.replace(/\D/g, '') || '00000000000',
        type: 'CPF'
      }
    },
    items: [
      {
        title: description || 'Pagamento via Boleto',
        unitPrice: Math.round(amount * 100),
        quantity: 1,
        externalRef: externalId
      }
    ],
    boleto: {
      expiresInDays: 3
    },
    postbackUrl: postbackUrl,
    metadata: {
      external_id: externalId,
      ip: '0.0.0.0'
    }
  };
  
  console.log('Ghostpay boleto payload:', JSON.stringify(payload, null, 2));
  
  const response = await fetch(`${GHOSTPAY_API_URL}/transactions`, {
    method: 'POST',
    headers: {
      'Authorization': getGhostpayAuthHeader(secretKey, companyId),
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  
  const responseText = await response.text();
  console.log('Ghostpay boleto response status:', response.status);
  console.log('Ghostpay boleto response:', responseText);
  
  if (!response.ok) {
    console.error('Ghostpay boleto error:', response.status, responseText);
    throw new Error(`Failed to create Ghostpay boleto payment: ${response.status} - ${responseText}`);
  }
  
  const data = JSON.parse(responseText);
  
  console.log('Ghostpay boleto payment created:', data.id);
  
  return {
    transactionId: data.id,
    boletoUrl: data.boleto?.url || data.boleto?.pdfUrl || data.boleto?.pdf_url || '',
    barcode: data.boleto?.barcode || '',
    typedLine: data.boleto?.digitableLine || data.boleto?.digitable_line || data.boleto?.line || '',
    status: mapGhostpayStatus(data.status),
  };
}

async function getGhostpayPayment(secretKey: string, companyId: string, transactionId: string): Promise<any> {
  console.log('Getting Ghostpay payment:', transactionId);
  
  const response = await fetch(`${GHOSTPAY_API_URL}/transactions/${transactionId}`, {
    method: 'GET',
    headers: {
      'Authorization': getGhostpayAuthHeader(secretKey, companyId),
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error('Ghostpay get payment error:', response.status, errorText);
    throw new Error(`Failed to get Ghostpay payment: ${response.status}`);
  }
  
  const data = await response.json();
  console.log('Ghostpay payment status:', data.status);
  return data;
}

// ============================================================
// End of Ghostpay Integration
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
    // Create new user with default password
    password = "123456";
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
    
    // CRITICAL: Delete the 'seller' role that was auto-created by trigger
    // and assign 'member' role instead for buyers
    console.log('Updating role to member for new buyer:', userId);
    
    const { error: deleteRoleError } = await supabase
      .from('user_roles')
      .delete()
      .eq('user_id', userId);
    
    if (deleteRoleError) {
      console.warn('Error deleting auto-assigned seller role:', deleteRoleError);
    }
    
    const { error: insertRoleError } = await supabase
      .from('user_roles')
      .insert({
        user_id: userId,
        role: 'member',
      });
    
    if (insertRoleError) {
      console.error('Error assigning member role:', insertRoleError);
    } else {
      console.log('Member role assigned successfully to:', userId);
    }
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
  
  // Re-check charge status to prevent duplicate processing
  const { data: currentCharge } = await supabase
    .from('pix_charges')
    .select('status')
    .eq('id', charge.id)
    .single();

  if (currentCharge?.status === 'paid') {
    console.log('Charge already paid, skipping duplicate processing:', charge.id);
    return;
  }

  // Check if transaction already exists for this charge (extra safety)
  const { data: existingTransaction } = await supabase
    .from('transactions')
    .select('id')
    .eq('charge_id', charge.id)
    .maybeSingle();

  if (existingTransaction) {
    console.log('Transaction already exists for charge, skipping:', charge.id);
    return;
  }
  
  // Update charge status
  await supabase
    .from('pix_charges')
    .update({ status: 'paid', paid_at: new Date().toISOString() })
    .eq('id', charge.id);

  const amount = Number(charge.amount);
  // Get seller_id from product or use null
  const sellerId = charge.products?.seller_id || charge.seller_id || null;

  // Determine fee settings: per-seller override (own_gateway) or platform settings
  const { data: platformSettings } = await supabase
    .from('platform_settings')
    .select('platform_fee, platform_gateway_fee_percentage, platform_gateway_fee_fixed, own_gateway_fee_percentage, own_gateway_fee_fixed')
    .single();

  let feePercentage = Number(platformSettings?.platform_fee ?? 5);
  let feeFixed = 0;

  if (sellerId) {
    const { data: sellerProfile } = await supabase
      .from('profiles')
      .select('payment_mode')
      .eq('user_id', sellerId)
      .maybeSingle();

    const paymentMode = sellerProfile?.payment_mode || 'own_gateway';

    if (paymentMode === 'platform_gateway') {
      feePercentage = Number(platformSettings?.platform_gateway_fee_percentage ?? feePercentage);
      feeFixed = Number(platformSettings?.platform_gateway_fee_fixed ?? 0);
    } else {
      // own_gateway: try seller-specific fee settings (PIX)
      const { data: sellerFees } = await supabase
        .from('seller_fee_settings')
        .select('pix_fee_percentage, pix_fee_fixed')
        .eq('user_id', sellerId)
        .maybeSingle();

      if (sellerFees) {
        feePercentage = Number(sellerFees.pix_fee_percentage ?? (platformSettings?.own_gateway_fee_percentage ?? feePercentage));
        feeFixed = Number(sellerFees.pix_fee_fixed ?? (platformSettings?.own_gateway_fee_fixed ?? 0));
      } else {
        feePercentage = Number(platformSettings?.own_gateway_fee_percentage ?? feePercentage);
        feeFixed = Number(platformSettings?.own_gateway_fee_fixed ?? 0);
      }
    }
  }

  const platformFee = (amount * (feePercentage / 100)) + feeFixed;
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

  // Log platform gateway payment confirmation
  if (sellerId) {
    const { data: sellerProfile } = await supabase
      .from('profiles')
      .select('payment_mode')
      .eq('user_id', sellerId)
      .single();
    
    if (sellerProfile?.payment_mode === 'platform_gateway') {
      await supabase.from('platform_gateway_logs').insert({
        seller_id: sellerId,
        charge_id: charge.id,
        transaction_id: transaction?.id || null,
        action: 'pix_paid',
        amount: amount,
        product_id: charge.product_id || null,
        buyer_email: charge.buyer_email,
        buyer_name: charge.buyer_name || null,
        external_id: charge.external_id,
        gateway_response: { platform_fee: platformFee, seller_amount: sellerAmount },
      });
      console.log('Platform gateway payment logged for seller:', sellerId);
    }
  }

  // Variables to store member info for payment confirmation email
  let memberId: string | null = null;
  let memberPassword: string | null = null;
  let isNewMember = false;

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
      
      // Store password for new users
      if (membershipResult.isNewUser && membershipResult.password) {
        memberPassword = membershipResult.password;
        isNewMember = true;
      }
      
      // Get the member ID for email logging
      const { data: memberData } = await supabase
        .from('members')
        .select('id')
        .eq('user_id', membershipResult.userId)
        .eq('product_id', charge.product_id)
        .maybeSingle();
      
      // Store member ID for later use
      memberId = memberData?.id || null;
      
      // Check if auto email sending is enabled for this product (default: true)
      const autoSendEnabled = charge.products?.auto_send_access_email ?? true;
      
      // NOTE: We no longer send a separate access email here because
      // the send-payment-confirmed function already includes access credentials.
      // This prevents duplicate emails being sent to buyers.
      if (autoSendEnabled) {
        console.log('Access info will be included in payment confirmation email for:', charge.buyer_email);
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
      has_members_area: !!charge.product_id,
      member_id: memberId,
      member_password: memberPassword,
      is_new_member: isNewMember,
    };
    
    console.log('Sending payment confirmed notification to buyer with member_id:', memberId);
    
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

  // ============================================================
  // GATEFLOW PRODUCT AUTO-REGISTRATION
  // When someone buys the GateFlow System product, automatically
  // create a new Admin user and Tenant for them
  // ============================================================
  try {
    // ID do produto "Sistema Gatteflow" na tabela products
    const GATEFLOW_PRODUCT_ID = 'e5761661-ebb4-4605-a33c-65943686972c';
    
    console.log('Checking if this is a GateFlow product sale. charge.product_id:', charge.product_id, 'GATEFLOW_PRODUCT_ID:', GATEFLOW_PRODUCT_ID);
    
    if (charge.product_id === GATEFLOW_PRODUCT_ID) {
      console.log('GateFlow product sale detected! Processing auto-registration...');
      
      // Call the process-gateflow-sale edge function
      const gateflowPayload = {
        buyer_email: charge.buyer_email,
        buyer_name: charge.buyer_name,
        buyer_phone: charge.buyer_phone,
        amount: charge.amount,
        transaction_id: charge.id,
        // If there's an affiliate, pass their tenant info
        reseller_tenant_id: charge.affiliates?.tenant_id || null,
        reseller_user_id: charge.affiliate_id || null,
      };
      
      console.log('Calling process-gateflow-sale with:', gateflowPayload);
      
      // Fire and forget - don't wait for response to not block webhook
      fetch(`${supabaseUrl}/functions/v1/process-gateflow-sale`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(gateflowPayload),
      }).catch(err => console.error('GateFlow auto-registration error (non-blocking):', err));
    }
  } catch (gateflowError) {
    console.error('Error checking GateFlow product:', gateflowError);
    // Don't fail the payment confirmation due to GateFlow processing error
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
      const rawBody = await req.json();
      
      // ============================================================
      // SECURITY: Validate all input fields with Zod schema
      // ============================================================
      const validationResult = chargeRequestSchema.safeParse(rawBody);
      
      if (!validationResult.success) {
        const errors = validationResult.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
        console.error('SECURITY: Input validation failed:', errors);
        
        await logSecurityEvent(supabase, 'INPUT_VALIDATION_FAILED', {
          errors,
          buyer_email: rawBody.buyer_email,
          product_id: rawBody.product_id,
          received_amount: rawBody.amount,
        }, req.headers.get('x-forwarded-for'), req.headers.get('user-agent'));
        
        return new Response(JSON.stringify({ error: `Dados inválidos: ${errors}` }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      const body: CreateChargeRequest = {
        ...rawBody,
        buyer_document: validationResult.data.buyer_document,
        buyer_phone: validationResult.data.buyer_phone,
      };

      const paymentMethod = body.payment_method || 'pix';
      
      // Get seller_id from product or authenticated user
      let sellerId: string | null = null;
      let originalSellerId: string | null = null;
      let validatedAmount: number = body.amount;
      
      // ============================================================
      // SECURITY: Validate price against database
      // ============================================================
      if (body.product_id) {
        try {
          const priceData = await validateAndGetExpectedPrice(supabase, body.product_id, body.order_bumps);
          
          // CRITICAL: Check if received amount matches expected amount
          const priceTolerance = 0.05; // R$ 0.05 tolerance for rounding
          const priceDifference = Math.abs(body.amount - priceData.expectedAmount);
          
          if (priceDifference > priceTolerance) {
            // SECURITY ALERT: Price manipulation detected!
            console.error('SECURITY ALERT: Price manipulation detected!', {
              received_amount: body.amount,
              expected_amount: priceData.expectedAmount,
              difference: priceDifference,
              product_id: body.product_id,
              product_name: priceData.productName,
              buyer_email: body.buyer_email,
            });
            
            await logSecurityEvent(supabase, 'PRICE_MANIPULATION', {
              received_amount: body.amount,
              expected_amount: priceData.expectedAmount,
              difference: priceDifference,
              product_id: body.product_id,
              product_name: priceData.productName,
              buyer_email: body.buyer_email,
              buyer_name: body.buyer_name,
              seller_id: priceData.sellerId,
            }, req.headers.get('x-forwarded-for'), req.headers.get('user-agent'));
            
            return new Response(JSON.stringify({ 
              error: 'Valor do pedido inválido. Por favor, atualize a página e tente novamente.' 
            }), {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }
          
          // Use the validated amount from database (not client-provided)
          validatedAmount = priceData.expectedAmount;
          originalSellerId = priceData.sellerId;
          sellerId = priceData.sellerId;
          
          // If product has parent_product_id, use parent's seller_id for payment credentials
          if (priceData.parentProductId) {
            console.log('Product has parent_product_id:', priceData.parentProductId);
            const { data: parentProduct } = await supabase
              .from('products')
              .select('seller_id')
              .eq('id', priceData.parentProductId)
              .single();
            
            if (parentProduct?.seller_id) {
              console.log('Using parent seller_id for payment:', parentProduct.seller_id);
              sellerId = parentProduct.seller_id;
            }
          }
          
          console.log('Price validated successfully:', { 
            received: body.amount, 
            expected: priceData.expectedAmount, 
            using: validatedAmount 
          });
          
        } catch (priceError) {
          console.error('Error validating product price:', priceError);
          return new Response(JSON.stringify({ 
            error: priceError instanceof Error ? priceError.message : 'Erro ao validar produto' 
          }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      }
      
      // If no product_id, try to get seller_id from JWT token (authenticated user)
      if (!sellerId) {
        const authHeader = req.headers.get('Authorization');
        if (authHeader?.startsWith('Bearer ')) {
          const token = authHeader.substring(7);
          const { data: { user }, error: userError } = await supabase.auth.getUser(token);
          if (user && !userError) {
            sellerId = user.id;
            originalSellerId = user.id;
            console.log('Using authenticated user as seller:', sellerId);
          }
        }
      }

      if (!sellerId) {
        console.error('No seller_id found for product:', body.product_id);
        return new Response(JSON.stringify({ error: 'Produto não encontrado ou usuário não autenticado' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      // Use originalSellerId for recording the transaction owner (the reseller)
      // Use sellerId for fetching payment credentials (may be parent's seller_id)
      const transactionOwnerId = originalSellerId || sellerId;

      // Check seller's payment_mode to determine which gateway to use
      const { data: sellerProfile } = await supabase
        .from('profiles')
        .select('payment_mode')
        .eq('user_id', sellerId)
        .single();
      
      const paymentMode = sellerProfile?.payment_mode || 'own_gateway';
      console.log('Seller payment mode:', paymentMode);
      
      let credentials: GatewayCredentials;
      let gateway: { slug: string; name: string };
      let usePlatformGateway = false;
      
      if (paymentMode === 'platform_gateway') {
        // Get platform gateway type (bspay or pixup)
        const { data: platformSettings } = await supabase
          .from('platform_settings')
          .select('platform_gateway_type')
          .single();
        
        const platformGatewayType = platformSettings?.platform_gateway_type || 'bspay';
        console.log('Platform gateway type:', platformGatewayType);
        
        let globalClientId: string | undefined;
        let globalClientSecret: string | undefined;
        let gatewaySlug: string;
        let gatewayName: string;
        
        if (platformGatewayType === 'pixup') {
          globalClientId = Deno.env.get('PIXUP_CLIENT_ID');
          globalClientSecret = Deno.env.get('PIXUP_CLIENT_SECRET');
          gatewaySlug = 'pixup';
          gatewayName = 'PIXUP (Plataforma)';
        } else if (platformGatewayType === 'ghostpay') {
          globalClientId = Deno.env.get('GHOSTPAY_COMPANY_ID');
          globalClientSecret = Deno.env.get('GHOSTPAY_SECRET_KEY');
          gatewaySlug = 'ghostpay';
          gatewayName = 'GHOSTPAY (Plataforma)';
        } else {
          globalClientId = Deno.env.get('BSPAY_CLIENT_ID');
          globalClientSecret = Deno.env.get('BSPAY_CLIENT_SECRET');
          gatewaySlug = 'bspay';
          gatewayName = 'BSPAY (Plataforma)';
        }
        
        if (!globalClientId || !globalClientSecret) {
          console.error('Platform gateway credentials not configured for:', platformGatewayType);
          return new Response(JSON.stringify({ 
            error: `Gateway da plataforma (${platformGatewayType.toUpperCase()}) não está configurado. Entre em contato com o suporte.` 
          }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        
        // Use os campos corretos para cada gateway
        if (platformGatewayType === 'ghostpay') {
          credentials = {
            secret_key: globalClientSecret,
            company_id: globalClientId,
          };
        } else {
          credentials = {
            client_id: globalClientId,
            client_secret: globalClientSecret,
          };
        }
        gateway = { slug: gatewaySlug, name: gatewayName };
        usePlatformGateway = true;
        
        console.log(`Using platform ${gatewaySlug.toUpperCase()} gateway for seller:`, sellerId);
        
        // Platform gateway only supports PIX for now
        if (paymentMethod === 'card') {
          return new Response(JSON.stringify({ 
            error: 'O Gateway da Plataforma suporta apenas pagamentos via PIX. Para aceitar cartão, configure seu próprio gateway.' 
          }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      } else {
        // Use seller's own gateway credentials
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
        
        credentials = gatewayData.credentials;
        gateway = gatewayData.gateway;
      }
      
      console.log(`Using ${gateway.name} gateway for ${paymentMethod} payment (platform: ${usePlatformGateway})`);

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
          
          if (gateway.slug === 'mercadopago') {
            if (!body.card_token) {
              return new Response(JSON.stringify({ error: 'Card token is required for Mercado Pago card payments' }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              });
            }
            
            const accessToken = credentials.access_token;
            if (!accessToken) {
              throw new Error('Mercado Pago access_token not configured');
            }
            
            const cardResult = await createMercadoPagoCardPayment(
              accessToken,
              validatedAmount,
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
            
          } else if (gateway.slug === 'asaas') {
            // Asaas card payment - requires full card data (no tokenization)
            if (!body.card_data || !body.card_holder_info) {
              return new Response(JSON.stringify({ 
                error: 'Card data and holder info are required for Asaas card payments' 
              }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              });
            }
            
            const accessToken = credentials.access_token;
            if (!accessToken) {
              throw new Error('Asaas access_token not configured');
            }
            
            // Create or get Asaas customer
            const customerId = await getOrCreateAsaasCustomer(
              accessToken,
              body.buyer_document || body.card_holder_info.cpfCnpj,
              body.buyer_name || body.card_holder_info.name,
              body.buyer_email,
              body.buyer_phone
            );
            
            const cardResult = await createAsaasCardPayment(
              accessToken,
              customerId,
              validatedAmount,
              externalId,
              body.card_data,
              body.card_holder_info,
              body.installments || 1,
              body.remote_ip || '0.0.0.0',
              description
            );
            
            gatewayTransactionId = cardResult.paymentId;
            cardPaymentStatus = cardResult.status;
            cardStatusDetail = cardResult.statusDetail;
            
            console.log('Asaas card payment created:', gatewayTransactionId, 'status:', cardPaymentStatus);
            
          } else if (gateway.slug === 'ghostpay') {
            // Ghostpay card payment - requires full card data
            if (!body.card_data || !body.card_holder_info) {
              return new Response(JSON.stringify({ 
                error: 'Card data and holder info are required for Ghostpay card payments' 
              }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              });
            }
            
            const secretKey = credentials.secret_key;
            const companyId = credentials.company_id;
            if (!secretKey || !companyId) {
              throw new Error('Ghostpay credentials not configured');
            }
            
            const cardResult = await createGhostpayCardPayment(
              secretKey,
              companyId,
              validatedAmount,
              externalId,
              {
                name: body.buyer_name || body.card_holder_info.name,
                email: body.buyer_email,
                document: body.buyer_document || body.card_holder_info.cpfCnpj,
                phone: body.buyer_phone,
              },
              body.card_data,
              {
                zipcode: body.card_holder_info.postalCode,
                street: (body.card_holder_info as any).street || '',
                street_number: body.card_holder_info.addressNumber,
                neighborhood: (body.card_holder_info as any).neighborhood || '',
                city: (body.card_holder_info as any).city || '',
                state: (body.card_holder_info as any).state || '',
              },
              body.installments || 1,
              webhookUrl + '/ghostpay',
              description
            );
            
            gatewayTransactionId = cardResult.transactionId;
            cardPaymentStatus = cardResult.status === 'paid' ? 'approved' : cardResult.status;
            cardStatusDetail = cardResult.status;
            
            console.log('Ghostpay card payment created:', gatewayTransactionId, 'status:', cardPaymentStatus);
            
          } else {
            return new Response(JSON.stringify({ 
              error: `Pagamento com cartão não suportado pelo gateway ${gateway.name}.` 
            }), {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }
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
            validatedAmount,
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
          
        } else if (gateway.slug === 'pixup') {
          // PIXUP PIX Integration (same API format as BSPAY)
          const clientId = credentials.client_id;
          const clientSecret = credentials.client_secret;
          
          if (!clientId || !clientSecret) {
            throw new Error('PIXUP credentials incomplete');
          }
          
          const token = await getPixupToken(clientId, clientSecret);
          const pixupResult = await createPixupQRCode(
            token,
            validatedAmount,
            externalId,
            {
              name: body.buyer_name,
              email: body.buyer_email,
              document: body.buyer_document,
            },
            webhookUrl,
            body.description
          );
          
          pixCode = pixupResult.qrCode;
          qrCodeBase64 = pixupResult.qrCodeBase64;
          gatewayTransactionId = pixupResult.transactionId;
          
          console.log('PIXUP charge created successfully:', gatewayTransactionId);
          
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
            validatedAmount,
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
          
        } else if (gateway.slug === 'asaas') {
          // Asaas PIX Integration
          const accessToken = credentials.access_token;
          
          if (!accessToken) {
            throw new Error('Asaas access_token not configured');
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
          
          // Create or get Asaas customer
          const customerId = await getOrCreateAsaasCustomer(
            accessToken,
            body.buyer_document || '00000000000',
            body.buyer_name || 'Cliente',
            body.buyer_email,
            body.buyer_phone
          );
          
          const asaasResult = await createAsaasPixPayment(
            accessToken,
            customerId,
            validatedAmount,
            externalId,
            description
          );
          
          pixCode = asaasResult.payload;
          qrCodeBase64 = asaasResult.qrCodeBase64;
          gatewayTransactionId = asaasResult.paymentId;
          
          console.log('Asaas charge created successfully:', gatewayTransactionId);
          
        } else if (gateway.slug === 'ghostpay') {
          // Ghostpay PIX Integration
          const secretKey = credentials.secret_key;
          const companyId = credentials.company_id;
          
          if (!secretKey || !companyId) {
            throw new Error('Ghostpay credentials incomplete');
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
          
          const ghostpayResult = await createGhostpayPixPayment(
            secretKey,
            companyId,
            validatedAmount,
            externalId,
            {
              name: body.buyer_name || 'Cliente',
              email: body.buyer_email,
              document: body.buyer_document || '00000000000',
              phone: body.buyer_phone,
            },
            webhookUrl + '/ghostpay',
            description
          );
          
          pixCode = ghostpayResult.qrCode || '';
          qrCodeBase64 = ghostpayResult.qrCodeBase64 || '';
          gatewayTransactionId = ghostpayResult.transactionId;
          
          console.log('Ghostpay charge created successfully:', gatewayTransactionId);
          
        } else {
          // For other gateways, we'll need to implement their specific APIs
          console.error('Gateway not yet implemented:', gateway.slug);
          return new Response(JSON.stringify({ 
            error: `Gateway ${gateway.name} ainda não está implementado. Por favor, configure um gateway suportado.` 
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

      // Determine initial status for card payments
      let initialStatus = 'pending';
      if (paymentMethod === 'card' && cardPaymentStatus === 'approved') {
        initialStatus = 'paid';
      }

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
          amount: validatedAmount,
          status: initialStatus,
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
          paid_at: initialStatus === 'paid' ? new Date().toISOString() : null,
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating charge:', error);
        
        // Log error if using platform gateway
        if (usePlatformGateway) {
          await supabase.from('platform_gateway_logs').insert({
            seller_id: sellerId,
            action: 'error',
            amount: validatedAmount,
            product_id: body.product_id || null,
            buyer_email: body.buyer_email,
            buyer_name: body.buyer_name || null,
            external_id: externalId,
            error_message: `Erro ao criar charge: ${error.message}`,
            ip_address: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || null,
            user_agent: req.headers.get('user-agent') || null,
          });
        }
        
        return new Response(JSON.stringify({ error: 'Failed to create charge' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      // Log platform gateway transaction if using platform gateway
      if (usePlatformGateway) {
        console.log('Logging platform gateway transaction for seller:', sellerId);
        await supabase.from('platform_gateway_logs').insert({
          seller_id: sellerId,
          charge_id: charge.id,
          action: 'pix_created',
          amount: validatedAmount,
          product_id: body.product_id || null,
          buyer_email: body.buyer_email,
          buyer_name: body.buyer_name || null,
          external_id: gatewayTransactionId || externalId,
          gateway_response: { gateway: gateway.name, payment_method: paymentMethod },
          ip_address: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || null,
          user_agent: req.headers.get('user-agent') || null,
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

      // For card payments approved immediately, process the payment confirmation
      if (paymentMethod === 'card' && cardPaymentStatus === 'approved') {
        console.log('Card payment approved immediately, processing confirmation...');
        
        // Fetch complete charge data for confirmation
        const { data: fullCharge } = await supabase
          .from('pix_charges')
          .select('*, products(name, seller_id, auto_send_access_email), affiliates(*)')
          .eq('id', charge.id)
          .single();
        
        if (fullCharge) {
          await processPaymentConfirmation(supabase, fullCharge, supabaseUrl);
        }
      } else if (paymentMethod === 'pix') {
        // Send email and WhatsApp notification in background for PIX only
        try {
          const notificationPayload = {
            buyer_name: body.buyer_name || 'Cliente',
            buyer_email: body.buyer_email,
            buyer_phone: body.buyer_phone,
            product_name: productName,
            amount: validatedAmount,
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
      }

      const response: ChargeResponse = {
        id: charge.id,
        external_id: charge.external_id,
        amount: charge.amount,
        status: initialStatus,
        status_detail: cardStatusDetail || undefined,
        qr_code: charge.qr_code,
        qr_code_base64: charge.qr_code_base64,
        copy_paste: charge.copy_paste,
        expires_at: charge.expires_at,
        created_at: charge.created_at,
      };

      console.log('Charge created:', response.external_id, 'status:', initialStatus);

      return new Response(JSON.stringify(response), {
        status: 201,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // POST /webhook - Handle BSPAY/PIXUP payment webhook (same format)
    if (req.method === 'POST' && path === '/webhook') {
      const body = await req.json();
      console.log('Received BSPAY/PIXUP webhook:', JSON.stringify(body));
      
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

    // POST /webhook/asaas - Handle Asaas payment webhook
    if (req.method === 'POST' && (path === '/webhook/asaas' || path === '/webhook-asaas')) {
      console.log('Received Asaas webhook');
      
      let body: any = {};
      try {
        const bodyText = await req.text();
        if (bodyText) {
          body = JSON.parse(bodyText);
        }
      } catch (e) {
        console.log('No body or invalid JSON in Asaas webhook');
      }
      
      console.log('Asaas webhook - body:', JSON.stringify(body));
      
      // Asaas sends event and payment info
      const event = body.event;
      const payment = body.payment;
      
      // Process payment notifications
      if (payment && ['PAYMENT_RECEIVED', 'PAYMENT_CONFIRMED'].includes(event)) {
        const paymentId = payment.id;
        console.log('Processing Asaas payment notification:', paymentId, 'event:', event);
        
        // Find the charge by external_id (which stores the Asaas payment ID)
        const { data: charge, error: fetchError } = await supabase
          .from('pix_charges')
          .select('*, products(name, seller_id, auto_send_access_email), affiliates(*)')
          .eq('external_id', paymentId)
          .maybeSingle();
        
        if (fetchError) {
          console.error('Error fetching charge for Asaas webhook:', fetchError);
        }
        
        if (charge && charge.status === 'pending') {
          console.log('Payment confirmed via Asaas webhook, processing...');
          await processPaymentConfirmation(supabase, charge, supabaseUrl);
        } else if (!charge) {
          console.log('No pending charge found for Asaas payment ID:', paymentId);
        } else {
          console.log('Charge already processed:', charge.status);
        }
      } else if (payment && ['PAYMENT_OVERDUE', 'PAYMENT_DELETED', 'PAYMENT_REFUNDED'].includes(event)) {
        const paymentId = payment.id;
        console.log('Processing Asaas cancellation:', paymentId, 'event:', event);
        
        await supabase
          .from('pix_charges')
          .update({ status: event === 'PAYMENT_REFUNDED' ? 'cancelled' : 'expired' })
          .eq('external_id', paymentId);
      }
      
      // Always return 200 to acknowledge receipt
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // POST /webhook/ghostpay - Handle Ghostpay payment webhook
    if (req.method === 'POST' && (path === '/webhook/ghostpay' || path === '/webhook-ghostpay')) {
      console.log('Received Ghostpay webhook');
      
      let body: any = {};
      try {
        const bodyText = await req.text();
        if (bodyText) {
          body = JSON.parse(bodyText);
        }
      } catch (e) {
        console.log('No body or invalid JSON in Ghostpay webhook');
      }
      
      console.log('Ghostpay webhook - body:', JSON.stringify(body));
      
      // GhostsPay sends transaction data inside body.data
      const transactionData = body.data || body;
      
      // Parse metadata if it's a string (GhostsPay sends it as JSON string)
      let metadata: any = {};
      if (typeof transactionData.metadata === 'string') {
        try {
          metadata = JSON.parse(transactionData.metadata);
        } catch (e) {
          console.log('Could not parse metadata string:', transactionData.metadata);
        }
      } else if (transactionData.metadata) {
        metadata = transactionData.metadata;
      }
      
      // Get the correct transaction ID and status from the nested data
      const transactionId = transactionData.id || body.objectId || body.id;
      const status = transactionData.status || body.status;
      const externalId = metadata.external_id || transactionData.external_id;
      
      console.log('Ghostpay webhook parsed:', { transactionId, status, externalId, metadata });
      
      // Process payment notifications
      if (transactionId && status === 'paid') {
        console.log('Processing Ghostpay payment notification:', transactionId);
        
        // Find the charge by external_id (which stores the Ghostpay transaction ID)
        const { data: charge, error: fetchError } = await supabase
          .from('pix_charges')
          .select('*, products(name, seller_id, auto_send_access_email), affiliates(*)')
          .or(`external_id.eq.${transactionId},external_id.eq.${externalId}`)
          .maybeSingle();
        
        if (fetchError) {
          console.error('Error fetching charge for Ghostpay webhook:', fetchError);
        }
        
        if (charge && charge.status === 'pending') {
          console.log('Payment confirmed via Ghostpay webhook, processing...');
          await processPaymentConfirmation(supabase, charge, supabaseUrl);
        } else if (!charge) {
          console.log('No pending charge found for Ghostpay transaction ID:', transactionId);
        } else {
          console.log('Charge already processed:', charge.status);
        }
      } else if (transactionId && ['refused', 'failed', 'expired', 'canceled', 'refunded'].includes(status)) {
        console.log('Processing Ghostpay cancellation:', transactionId, 'status:', status);
        
        const newStatus = status === 'refunded' ? 'cancelled' : status === 'expired' ? 'expired' : 'cancelled';
        
        await supabase
          .from('pix_charges')
          .update({ status: newStatus })
          .or(`external_id.eq.${transactionId},external_id.eq.${externalId}`);
      }
      
      // Always return 200 to acknowledge receipt
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // GET /charges/:id - Get charge status
    if (req.method === 'GET' && path.startsWith('/charges/')) {
      const chargeId = path.replace('/charges/', '');

      // SECURITY: rate-limit public status checks (avoid enumeration/abuse)
      const ip = getClientIp(req);
      const rl = checkRateLimit(ip, 60, 60_000); // 60 req/min per IP
      if (!rl.ok) {
        await logSecurityEvent(
          supabase,
          'RATE_LIMITED_STATUS_CHECK',
          { ip, path, charge_id: chargeId, reset_at: new Date(rl.resetAt).toISOString() },
          ip,
          req.headers.get('user-agent')
        );

        return new Response(JSON.stringify({ error: 'Too many requests' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      const { data: charge, error } = await supabase
        .from('pix_charges')
        // SECURITY: Never return buyer PII from public endpoints
        // Only select what we need to sync status with the gateway
        .select('id,status,amount,expires_at,paid_at,seller_id,external_id')
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
            } else if (gatewayData.gateway.slug === 'asaas') {
              // Check Asaas payment status
              const { credentials } = gatewayData;
              const asaasPayment = await getAsaasPayment(credentials.access_token!, charge.external_id);
              
              if (['CONFIRMED', 'RECEIVED'].includes(asaasPayment.status)) {
                await supabase
                  .from('pix_charges')
                  .update({ status: 'paid', paid_at: new Date().toISOString() })
                  .eq('id', charge.id);
                
                charge.status = 'paid';
                charge.paid_at = new Date().toISOString();
              } else if (['OVERDUE', 'DELETED', 'REFUNDED'].includes(asaasPayment.status)) {
                await supabase
                  .from('pix_charges')
                  .update({ status: 'cancelled' })
                  .eq('id', charge.id);
                
                charge.status = 'cancelled';
              }
            } else if (gatewayData.gateway.slug === 'ghostpay') {
              // Check Ghostpay payment status
              const { credentials } = gatewayData;
              const ghostpayPayment = await getGhostpayPayment(
                credentials.secret_key!,
                credentials.company_id!,
                charge.external_id
              );
              
              const mappedStatus = mapGhostpayStatus(ghostpayPayment.status);
              
              if (mappedStatus === 'paid') {
                await supabase
                  .from('pix_charges')
                  .update({ status: 'paid', paid_at: new Date().toISOString() })
                  .eq('id', charge.id);
                
                charge.status = 'paid';
                charge.paid_at = new Date().toISOString();
              } else if (['cancelled', 'expired', 'failed'].includes(mappedStatus)) {
                await supabase
                  .from('pix_charges')
                  .update({ status: mappedStatus })
                  .eq('id', charge.id);
                
                charge.status = mappedStatus;
              }
            }
          }
        } catch (e) {
          console.log('Could not check gateway status:', e);
        }
      }

      const publicCharge = {
        id: charge.id,
        status: charge.status,
        amount: charge.amount,
        expires_at: charge.expires_at,
        paid_at: charge.paid_at,
      };

      return new Response(JSON.stringify(publicCharge), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // GET /payment-methods/:sellerId - Get seller's available payment methods and public key
    if (req.method === 'GET' && path.startsWith('/payment-methods/')) {
      let sellerId = path.replace('/payment-methods/', '');
      
      console.log('Original seller for payment methods:', sellerId);
      
      // First, check if this seller uses platform_gateway mode
      const { data: sellerProfile } = await supabase
        .from('profiles')
        .select('payment_mode')
        .eq('user_id', sellerId)
        .maybeSingle();
      
      console.log('Seller payment_mode:', sellerProfile?.payment_mode);
      
      // If seller uses platform_gateway, return PIX as available (platform gateway only supports PIX)
      if (sellerProfile?.payment_mode === 'platform_gateway') {
        // Verify platform gateway is configured
        const { data: platformSettings } = await supabase
          .from('platform_settings')
          .select('platform_gateway_type')
          .single();
        
        const platformGatewayType = platformSettings?.platform_gateway_type || 'bspay';
        
        let hasCredentials = false;
        if (platformGatewayType === 'pixup') {
          hasCredentials = !!(Deno.env.get('PIXUP_CLIENT_ID') && Deno.env.get('PIXUP_CLIENT_SECRET'));
        } else if (platformGatewayType === 'ghostpay') {
          hasCredentials = !!(Deno.env.get('GHOSTPAY_COMPANY_ID') && Deno.env.get('GHOSTPAY_SECRET_KEY'));
        } else {
          hasCredentials = !!(Deno.env.get('BSPAY_CLIENT_ID') && Deno.env.get('BSPAY_CLIENT_SECRET'));
        }
        
        if (hasCredentials) {
          console.log('Seller uses platform_gateway, returning PIX as available method');
          return new Response(JSON.stringify({ 
            methods: ['pix'], 
            publicKey: null, 
            cardGateway: null,
            usingPlatformGateway: true 
          }), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        } else {
          console.error('Platform gateway credentials not configured for:', platformGatewayType);
          return new Response(JSON.stringify({ 
            methods: [], 
            publicKey: null, 
            cardGateway: null,
            error: 'Gateway da plataforma não está configurado'
          }), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      }
      
      // Check if this seller has a Gateflow product with parent_product_id
      // If so, use the parent product's seller_id for payment credentials
      const { data: childProduct } = await supabase
        .from('products')
        .select('parent_product_id')
        .eq('seller_id', sellerId)
        .not('parent_product_id', 'is', null)
        .limit(1)
        .maybeSingle();
      
      if (childProduct?.parent_product_id) {
        console.log('Found child product with parent_product_id:', childProduct.parent_product_id);
        
        const { data: parentProduct } = await supabase
          .from('products')
          .select('seller_id')
          .eq('id', childProduct.parent_product_id)
          .single();
        
        if (parentProduct?.seller_id) {
          console.log('Using parent seller_id for payment credentials:', parentProduct.seller_id);
          sellerId = parentProduct.seller_id;
        }
      }
      
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
      let cardGateway: string | null = null;
      
      if (data && data.length > 0) {
        const activeCredentials = data.filter((c: any) => {
          const gateway = c.payment_gateways;
          return gateway && (Array.isArray(gateway) ? gateway[0]?.is_active : gateway.is_active);
        });
        
        if (activeCredentials.some((c: any) => c.use_for_pix)) methods.push('pix');
        if (activeCredentials.some((c: any) => c.use_for_card)) methods.push('card');
        if (activeCredentials.some((c: any) => c.use_for_boleto)) methods.push('boleto');
        
        // Get card gateway info
        const cardCredentials = activeCredentials.find((c: any) => c.use_for_card);
        if (cardCredentials) {
          const gateway = cardCredentials.payment_gateways as any;
          cardGateway = Array.isArray(gateway) ? gateway[0]?.slug : gateway?.slug;
          
          // Get public key for Mercado Pago card payments
          if (cardGateway === 'mercadopago' && cardCredentials.credentials?.public_key) {
            publicKey = cardCredentials.credentials.public_key;
          }
        }
      }
      
      console.log('Available payment methods:', methods, 'hasPublicKey:', !!publicKey, 'cardGateway:', cardGateway);
      
      return new Response(JSON.stringify({ methods, publicKey, cardGateway }), {
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
