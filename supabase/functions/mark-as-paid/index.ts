import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
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

// Process payment confirmation (same logic as pix-api)
async function processPaymentConfirmation(
  supabase: any,
  charge: any,
  supabaseUrl: string
): Promise<void> {
  console.log('Processing manual payment confirmation for charge:', charge.id);
  
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

  // Get seller_id from product or charge
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

  // Log manual payment confirmation
  if (sellerId) {
    await supabase.from('platform_gateway_logs').insert({
      seller_id: sellerId,
      charge_id: charge.id,
      transaction_id: transaction?.id || null,
      action: 'manual_mark_as_paid',
      amount: amount,
      product_id: charge.product_id || null,
      buyer_email: charge.buyer_email,
      buyer_name: charge.buyer_name || null,
      external_id: charge.external_id,
      gateway_response: { platform_fee: platformFee, seller_amount: sellerAmount, manual: true },
    });
    console.log('Manual payment logged for seller:', sellerId);
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
      
      memberId = memberData?.id || null;
      
      // Check if auto email sending is enabled for this product (default: true)
      const autoSendEnabled = charge.products?.auto_send_access_email ?? true;
      
      if (autoSendEnabled) {
        console.log('Access info will be included in payment confirmation email for:', charge.buyer_email);
      } else {
        console.log('Auto email disabled for product:', charge.product_id);
      }
    } catch (memberError) {
      console.error('Error creating membership:', memberError);
    }
  }

  // Send payment confirmed notification via Email (and optionally WhatsApp)
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

  console.log('Manual payment confirmed:', charge.external_id);
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    
    // Create service client for privileged operations
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    
    // Validate JWT and get authenticated user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Não autorizado' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await userClient.auth.getClaims(token);
    
    if (claimsError || !claimsData?.claims) {
      console.error('Auth error:', claimsError);
      return new Response(JSON.stringify({ error: 'Token inválido' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const userId = claimsData.claims.sub;
    console.log('Authenticated user:', userId);

    // Parse request body
    const body = await req.json();
    const { charge_id } = body;

    if (!charge_id) {
      return new Response(JSON.stringify({ error: 'charge_id é obrigatório' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Processing mark-as-paid for charge:', charge_id, 'by user:', userId);

    // Fetch charge with product and affiliate info
    const { data: charge, error: chargeError } = await supabaseAdmin
      .from('pix_charges')
      .select(`
        *,
        products:product_id (
          id,
          name,
          seller_id,
          auto_send_access_email
        ),
        affiliates:affiliate_id (
          id,
          commission_rate,
          total_sales,
          total_earnings
        )
      `)
      .eq('id', charge_id)
      .single();

    if (chargeError || !charge) {
      console.error('Charge not found:', chargeError);
      return new Response(JSON.stringify({ error: 'Cobrança não encontrada' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // SECURITY: Validate ownership - user must be the seller
    const chargeSellerId = charge.products?.seller_id || charge.seller_id;
    
    if (chargeSellerId !== userId) {
      console.error('Unauthorized: User', userId, 'tried to mark charge from seller', chargeSellerId);
      return new Response(JSON.stringify({ error: 'Você não tem permissão para marcar esta cobrança' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if charge is pending
    if (charge.status !== 'pending') {
      return new Response(JSON.stringify({ error: `Apenas cobranças pendentes podem ser marcadas como pagas. Status atual: ${charge.status}` }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Process payment confirmation
    await processPaymentConfirmation(supabaseAdmin, charge, supabaseUrl);

    console.log('Charge marked as paid successfully:', charge_id);

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Transação marcada como paga com sucesso',
      charge_id: charge_id
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in mark-as-paid:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
