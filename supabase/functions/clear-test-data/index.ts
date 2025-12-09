import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    // Get the user from the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization header required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create client with user's token to verify identity
    const supabaseUser = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !user) {
      console.error('Auth error:', userError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`User ${user.id} requested to clear test data`);

    // Use service role client for deletions
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user's products
    const { data: products } = await supabase
      .from('products')
      .select('id')
      .eq('seller_id', user.id);

    const productIds = products?.map(p => p.id) || [];
    console.log(`Found ${productIds.length} products for user`);

    let deletedTransactions = 0;
    let deletedCharges = 0;
    let deletedMembers = 0;
    let deletedWebhookLogs = 0;

    // Delete transactions for user's products
    if (productIds.length > 0) {
      const { count: txCount } = await supabase
        .from('transactions')
        .delete({ count: 'exact' })
        .eq('seller_id', user.id);
      
      deletedTransactions = txCount || 0;
      console.log(`Deleted ${deletedTransactions} transactions`);

      // Delete PIX charges for user's products
      const { count: chargeCount } = await supabase
        .from('pix_charges')
        .delete({ count: 'exact' })
        .in('product_id', productIds);
      
      deletedCharges = chargeCount || 0;
      console.log(`Deleted ${deletedCharges} PIX charges`);

      // Delete members for user's products
      const { count: memberCount } = await supabase
        .from('members')
        .delete({ count: 'exact' })
        .in('product_id', productIds);
      
      deletedMembers = memberCount || 0;
      console.log(`Deleted ${deletedMembers} members`);
    }

    // Reset affiliate stats for user's products
    const { error: affiliateError } = await supabase
      .from('affiliates')
      .update({ total_earnings: 0, total_sales: 0 })
      .in('product_id', productIds);

    if (affiliateError) {
      console.error('Error resetting affiliates:', affiliateError);
    }

    // Delete user's webhooks logs
    const { data: webhooks } = await supabase
      .from('webhooks')
      .select('id')
      .eq('user_id', user.id);

    if (webhooks && webhooks.length > 0) {
      const webhookIds = webhooks.map(w => w.id);
      const { count: logCount } = await supabase
        .from('webhook_logs')
        .delete({ count: 'exact' })
        .in('webhook_id', webhookIds);
      
      deletedWebhookLogs = logCount || 0;
      console.log(`Deleted ${deletedWebhookLogs} webhook logs`);
    }

    const summary = {
      success: true,
      deleted: {
        transactions: deletedTransactions,
        pix_charges: deletedCharges,
        members: deletedMembers,
        webhook_logs: deletedWebhookLogs,
      },
      message: 'Dados de teste removidos com sucesso!'
    };

    console.log('Clear test data completed:', summary);

    return new Response(
      JSON.stringify(summary),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error clearing test data:', error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});