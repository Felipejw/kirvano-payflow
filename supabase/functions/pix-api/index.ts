import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
};

interface CreateChargeRequest {
  amount: number;
  buyer_email: string;
  buyer_name?: string;
  buyer_document?: string;
  product_id?: string;
  affiliate_code?: string;
  expires_in_minutes?: number;
  webhook_url?: string;
  description?: string;
}

interface ChargeResponse {
  id: string;
  external_id: string;
  amount: number;
  status: string;
  qr_code: string;
  qr_code_base64: string;
  copy_paste: string;
  expires_at: string;
  created_at: string;
}

// BSPAY API Integration
const BSPAY_API_URL = "https://api.bspay.co/v2";

async function getBspayToken(): Promise<string> {
  const clientId = Deno.env.get('BSPAY_CLIENT_ID');
  const clientSecret = Deno.env.get('BSPAY_CLIENT_SECRET');
  
  if (!clientId || !clientSecret) {
    throw new Error('BSPAY credentials not configured');
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

async function getBspayBalance(token: string): Promise<{ balance: number }> {
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

    // GET /balance - Get BSPAY account balance
    if (req.method === 'GET' && path === '/balance') {
      try {
        const token = await getBspayToken();
        const balanceData = await getBspayBalance(token);
        
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

    // POST /charges - Create a new PIX charge via BSPAY
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

      const externalId = generateExternalId();
      const expiresInMinutes = body.expires_in_minutes || 30;
      const expiresAt = new Date(Date.now() + expiresInMinutes * 60 * 1000);
      
      const webhookUrl = body.webhook_url || `${supabaseUrl}/functions/v1/pix-api/webhook`;

      let pixCode: string;
      let qrCodeBase64: string;
      let bspayTransactionId: string | null = null;

      try {
        const token = await getBspayToken();
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
        bspayTransactionId = bspayResult.transactionId;
        
        console.log('BSPAY charge created successfully:', bspayTransactionId);
      } catch (bspayError) {
        console.error('BSPAY error, using fallback:', bspayError);
        pixCode = `00020126580014BR.GOV.BCB.PIX0136pixpay@example.com5204000053039865404${body.amount.toFixed(2)}5802BR5913PIXPAY6009SAO PAULO62070503***6304`;
        qrCodeBase64 = `data:image/svg+xml;base64,${btoa(`
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
            <rect width="200" height="200" fill="white"/>
            <text x="100" y="100" text-anchor="middle" font-size="12" fill="black">QR CODE PIX</text>
            <text x="100" y="120" text-anchor="middle" font-size="8" fill="gray">${externalId}</text>
          </svg>
        `)}`;
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

      const { data: charge, error } = await supabase
        .from('pix_charges')
        .insert({
          external_id: bspayTransactionId || externalId,
          product_id: body.product_id || null,
          buyer_email: body.buyer_email,
          buyer_name: body.buyer_name || null,
          amount: body.amount,
          status: 'pending',
          qr_code: pixCode,
          qr_code_base64: qrCodeBase64,
          copy_paste: pixCode,
          affiliate_id: affiliateId,
          expires_at: expiresAt.toISOString(),
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
          .select('*, products(*), affiliates(*)')
          .or(`external_id.eq.${transactionId},external_id.eq.${requestBody.external_id}`)
          .single();

        if (charge && charge.status === 'pending') {
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

          // Create transaction
          const { data: transaction } = await supabase
            .from('transactions')
            .insert({
              charge_id: charge.id,
              product_id: charge.product_id,
              seller_id: charge.products?.seller_id,
              affiliate_id: charge.affiliate_id,
              amount,
              seller_amount: sellerAmount,
              affiliate_amount: affiliateAmount,
              platform_fee: platformFee,
              status: 'paid',
            })
            .select()
            .single();

          // Create membership for buyer
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

          console.log('Payment confirmed via webhook:', charge.external_id);
        }
      }
      
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

      if (charge.status === 'pending') {
        try {
          const token = await getBspayToken();
          const bspayTransaction = await getBspayTransaction(token, charge.external_id);
          
          if (bspayTransaction.status === 'PAID') {
            await supabase
              .from('pix_charges')
              .update({ status: 'paid', paid_at: new Date().toISOString() })
              .eq('id', charge.id);
            
            charge.status = 'paid';
            charge.paid_at = new Date().toISOString();
          }
        } catch (e) {
          console.log('Could not check BSPAY status:', e);
        }
      }

      return new Response(JSON.stringify(charge), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // POST /charges/:id/confirm - Manual payment confirmation (for testing)
    if (req.method === 'POST' && path.includes('/confirm')) {
      const chargeId = path.replace('/charges/', '').replace('/confirm', '');
      
      const { data: charge, error: fetchError } = await supabase
        .from('pix_charges')
        .select('*, products(*), affiliates(*)')
        .or(`id.eq.${chargeId},external_id.eq.${chargeId}`)
        .single();

      if (fetchError || !charge) {
        return new Response(JSON.stringify({ error: 'Charge not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (charge.status !== 'pending') {
        return new Response(JSON.stringify({ error: 'Charge is not pending' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const { error: updateError } = await supabase
        .from('pix_charges')
        .update({ status: 'paid', paid_at: new Date().toISOString() })
        .eq('id', charge.id);

      if (updateError) {
        console.error('Error updating charge:', updateError);
        return new Response(JSON.stringify({ error: 'Failed to confirm payment' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

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

      const { data: transaction } = await supabase
        .from('transactions')
        .insert({
          charge_id: charge.id,
          product_id: charge.product_id,
          seller_id: charge.products?.seller_id,
          affiliate_id: charge.affiliate_id,
          amount,
          seller_amount: sellerAmount,
          affiliate_amount: affiliateAmount,
          platform_fee: platformFee,
          status: 'paid',
        })
        .select()
        .single();

      // Create membership for buyer
      if (charge.product_id && charge.buyer_email) {
        try {
          const membershipResult = await createMembershipForBuyer(
            supabase,
            charge.buyer_email,
            charge.buyer_name,
            charge.product_id,
            transaction?.id
          );
          console.log('Membership created via manual confirm:', membershipResult);
        } catch (memberError) {
          console.error('Error creating membership:', memberError);
        }
      }

      console.log('Payment confirmed manually:', charge.external_id);

      return new Response(JSON.stringify({ 
        success: true, 
        message: 'Payment confirmed',
        transaction_id: transaction?.id,
      }), {
        status: 200,
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
