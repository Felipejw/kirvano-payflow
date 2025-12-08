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
  product_id?: string;
  affiliate_code?: string;
  expires_in_minutes?: number;
  webhook_url?: string;
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

const generateExternalId = () => {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 10);
  return `PIX${timestamp}${random}`.toUpperCase();
};

const generatePixCode = (externalId: string, amount: number) => {
  // Simulated PIX code - in production, integrate with a real PSP
  const pixKey = "pixpay@example.com";
  const merchantName = "PIXPAY GATEWAY";
  const merchantCity = "SAO PAULO";
  const txId = externalId.substring(0, 25);
  
  // EMV QR Code format (simplified)
  return `00020126580014BR.GOV.BCB.PIX0136${pixKey}5204000053039865404${amount.toFixed(2)}5802BR5913${merchantName}6009${merchantCity}62070503***6304`;
};

const generateQRCodeBase64 = async (data: string): Promise<string> => {
  // Generate a simple QR code placeholder - in production use a proper QR library
  return `data:image/svg+xml;base64,${btoa(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
      <rect width="200" height="200" fill="white"/>
      <text x="100" y="100" text-anchor="middle" font-size="12" fill="black">QR CODE PIX</text>
      <text x="100" y="120" text-anchor="middle" font-size="8" fill="gray">${data.substring(0, 20)}...</text>
    </svg>
  `)}`;
};

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
      // Hash the API key and look it up
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

      // Update last used timestamp
      await supabase
        .from('api_keys')
        .update({ last_used_at: new Date().toISOString() })
        .eq('key_hash', keyHash);
    }

    // POST /charges - Create a new PIX charge
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
      
      const pixCode = generatePixCode(externalId, body.amount);
      const qrCodeBase64 = await generateQRCodeBase64(pixCode);

      // Check for affiliate
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
          external_id: externalId,
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

      return new Response(JSON.stringify(charge), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // POST /charges/:id/confirm - Simulate payment confirmation (for testing)
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

      // Update charge status
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

      // Calculate amounts
      const amount = Number(charge.amount);
      const platformFee = amount * 0.05; // 5% platform fee
      let affiliateAmount = 0;
      let sellerAmount = amount - platformFee;

      if (charge.affiliate_id && charge.affiliates) {
        const commissionRate = charge.affiliates.commission_rate || 10;
        affiliateAmount = amount * (commissionRate / 100);
        sellerAmount = amount - platformFee - affiliateAmount;

        // Update affiliate stats
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

      // Send webhooks
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

      console.log('Payment confirmed:', charge.external_id);

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
