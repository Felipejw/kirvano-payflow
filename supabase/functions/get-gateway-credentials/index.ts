import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user is admin or super_admin
    const { data: isAdmin, error: roleError } = await supabase.rpc('has_role', {
      _user_id: user.id,
      _role: 'admin'
    });

    const { data: isSuperAdmin } = await supabase.rpc('has_role', {
      _user_id: user.id,
      _role: 'super_admin'
    });

    if (roleError || (!isAdmin && !isSuperAdmin)) {
      console.log(`Access denied for user ${user.id}. Is admin: ${isAdmin}, Is super_admin: ${isSuperAdmin}`);
      return new Response(
        JSON.stringify({ error: 'Forbidden - Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { gateway } = await req.json();

    if (!gateway || !['bspay', 'pixup', 'ghostpay'].includes(gateway)) {
      return new Response(
        JSON.stringify({ error: 'Invalid gateway. Must be bspay, pixup or ghostpay' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let credentials: { client_id: string | null; client_secret: string | null };

    // Super Admin: return global environment credentials
    if (isSuperAdmin) {
      console.log(`Super admin ${user.id} accessing global ${gateway} credentials`);
      
      if (gateway === 'bspay') {
        credentials = {
          client_id: Deno.env.get('BSPAY_CLIENT_ID') ?? null,
          client_secret: Deno.env.get('BSPAY_CLIENT_SECRET') ?? null,
        };
      } else if (gateway === 'ghostpay') {
        credentials = {
          client_id: Deno.env.get('GHOSTPAY_COMPANY_ID') ?? null,
          client_secret: Deno.env.get('GHOSTPAY_SECRET_KEY') ?? null,
        };
      } else {
        credentials = {
          client_id: Deno.env.get('PIXUP_CLIENT_ID') ?? null,
          client_secret: Deno.env.get('PIXUP_CLIENT_SECRET') ?? null,
        };
      }

      return new Response(
        JSON.stringify({ credentials, source: 'platform' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Admin (tenant): fetch from seller_gateway_credentials table
    console.log(`Admin ${user.id} accessing their own ${gateway} credentials`);

    // First, get the gateway_id for the requested gateway slug
    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: gatewayData, error: gatewayError } = await adminClient
      .from('payment_gateways')
      .select('id')
      .eq('slug', gateway)
      .maybeSingle();

    if (gatewayError || !gatewayData) {
      console.log(`Gateway ${gateway} not found in payment_gateways table`);
      return new Response(
        JSON.stringify({ credentials: { client_id: null, client_secret: null }, source: 'admin' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch admin's credentials for this gateway
    const { data: sellerCredentials, error: credError } = await adminClient
      .from('seller_gateway_credentials')
      .select('credentials')
      .eq('user_id', user.id)
      .eq('gateway_id', gatewayData.id)
      .eq('is_active', true)
      .maybeSingle();

    if (credError) {
      console.error('Error fetching seller credentials:', credError);
    }

    if (sellerCredentials?.credentials) {
      const creds = sellerCredentials.credentials as { client_id?: string; client_secret?: string };
      credentials = {
        client_id: creds.client_id ?? null,
        client_secret: creds.client_secret ?? null,
      };
    } else {
      credentials = {
        client_id: null,
        client_secret: null,
      };
    }

    return new Response(
      JSON.stringify({ credentials, source: 'admin' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error fetching gateway credentials:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
