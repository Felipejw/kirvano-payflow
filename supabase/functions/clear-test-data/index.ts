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

    // Use service role client for operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check if user is admin
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle();

    if (!roleData) {
      console.error('User is not admin:', user.id);
      return new Response(
        JSON.stringify({ error: 'Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const body = await req.json();
    const { type } = body; // 'all', 'products', 'transactions', 'affiliates', 'charges'

    console.log(`Admin ${user.id} requested to clear data: ${type}`);

    let deletedCount = 0;
    const results: Record<string, number> = {};

    // Delete based on type
    switch (type) {
      case 'transactions':
        // Delete all transactions
        const { count: txCount } = await supabase
          .from('transactions')
          .delete({ count: 'exact' })
          .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
        results.transactions = txCount || 0;
        deletedCount = txCount || 0;
        console.log(`Deleted ${txCount} transactions`);
        break;

      case 'charges':
        // Delete all PIX charges
        const { count: chargeCount } = await supabase
          .from('pix_charges')
          .delete({ count: 'exact' })
          .neq('id', '00000000-0000-0000-0000-000000000000');
        results.pix_charges = chargeCount || 0;
        deletedCount = chargeCount || 0;
        console.log(`Deleted ${chargeCount} PIX charges`);
        break;

      case 'affiliates':
        // Delete all affiliates
        const { count: affCount } = await supabase
          .from('affiliates')
          .delete({ count: 'exact' })
          .neq('id', '00000000-0000-0000-0000-000000000000');
        results.affiliates = affCount || 0;
        deletedCount = affCount || 0;
        console.log(`Deleted ${affCount} affiliates`);
        break;

      case 'products':
        // First delete related data
        const { count: prodTxCount } = await supabase
          .from('transactions')
          .delete({ count: 'exact' })
          .neq('id', '00000000-0000-0000-0000-000000000000');
        results.transactions = prodTxCount || 0;

        const { count: prodChargeCount } = await supabase
          .from('pix_charges')
          .delete({ count: 'exact' })
          .neq('id', '00000000-0000-0000-0000-000000000000');
        results.pix_charges = prodChargeCount || 0;

        const { count: prodAffCount } = await supabase
          .from('affiliates')
          .delete({ count: 'exact' })
          .neq('id', '00000000-0000-0000-0000-000000000000');
        results.affiliates = prodAffCount || 0;

        const { count: memberCount } = await supabase
          .from('members')
          .delete({ count: 'exact' })
          .neq('id', '00000000-0000-0000-0000-000000000000');
        results.members = memberCount || 0;

        // Then delete products
        const { count: prodCount } = await supabase
          .from('products')
          .delete({ count: 'exact' })
          .neq('id', '00000000-0000-0000-0000-000000000000');
        results.products = prodCount || 0;
        deletedCount = prodCount || 0;
        console.log(`Deleted ${prodCount} products and related data`);
        break;

      case 'all':
        // Delete in order due to foreign keys
        const { count: allTxCount } = await supabase
          .from('transactions')
          .delete({ count: 'exact' })
          .neq('id', '00000000-0000-0000-0000-000000000000');
        results.transactions = allTxCount || 0;

        const { count: allChargeCount } = await supabase
          .from('pix_charges')
          .delete({ count: 'exact' })
          .neq('id', '00000000-0000-0000-0000-000000000000');
        results.pix_charges = allChargeCount || 0;

        const { count: allMemberCount } = await supabase
          .from('members')
          .delete({ count: 'exact' })
          .neq('id', '00000000-0000-0000-0000-000000000000');
        results.members = allMemberCount || 0;

        const { count: allAffCount } = await supabase
          .from('affiliates')
          .delete({ count: 'exact' })
          .neq('id', '00000000-0000-0000-0000-000000000000');
        results.affiliates = allAffCount || 0;

        const { count: allProdCount } = await supabase
          .from('products')
          .delete({ count: 'exact' })
          .neq('id', '00000000-0000-0000-0000-000000000000');
        results.products = allProdCount || 0;

        // Delete webhook logs
        const { count: logCount } = await supabase
          .from('webhook_logs')
          .delete({ count: 'exact' })
          .neq('id', '00000000-0000-0000-0000-000000000000');
        results.webhook_logs = logCount || 0;

        console.log(`Deleted all data:`, results);
        break;

      default:
        return new Response(
          JSON.stringify({ error: 'Invalid type. Use: all, products, transactions, affiliates, charges' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

    const summary = {
      success: true,
      type,
      deleted: results,
      message: `Dados removidos com sucesso!`
    };

    console.log('Clear data completed:', summary);

    return new Response(
      JSON.stringify(summary),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error clearing data:', error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});