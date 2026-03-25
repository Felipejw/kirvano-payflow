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

    const { data: isAdmin } = await supabase.rpc('has_role', { _user_id: user.id, _role: 'admin' });
    const { data: isSuperAdmin } = await supabase.rpc('has_role', { _user_id: user.id, _role: 'super_admin' });

    if (!isAdmin && !isSuperAdmin) {
      return new Response(
        JSON.stringify({ error: 'Forbidden - Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { gateway } = await req.json();

    if (!gateway || !['bspay', 'pixup', 'ghostpay', 'sigilopay'].includes(gateway)) {
      return new Response(
        JSON.stringify({ error: 'Invalid gateway' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    let credentials: { client_id: string | null; client_secret: string | null };

    // Super Admin: env vars first, then DB fallback
    if (isSuperAdmin) {
      // Try env vars first
      let envId: string | null = null;
      let envSecret: string | null = null;

      if (gateway === 'bspay') {
        envId = Deno.env.get('BSPAY_CLIENT_ID') ?? null;
        envSecret = Deno.env.get('BSPAY_CLIENT_SECRET') ?? null;
      } else if (gateway === 'ghostpay') {
        envId = Deno.env.get('GHOSTPAY_COMPANY_ID') ?? null;
        envSecret = Deno.env.get('GHOSTPAY_SECRET_KEY') ?? null;
      } else if (gateway === 'sigilopay') {
        envId = Deno.env.get('SIGILOPAY_PUBLIC_KEY') ?? null;
        envSecret = Deno.env.get('SIGILOPAY_SECRET_KEY') ?? null;
      } else {
        envId = Deno.env.get('PIXUP_CLIENT_ID') ?? null;
        envSecret = Deno.env.get('PIXUP_CLIENT_SECRET') ?? null;
      }

      if (envId && envSecret) {
        credentials = { client_id: envId, client_secret: envSecret };
        return new Response(
          JSON.stringify({ credentials, source: 'platform' }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Fallback: DB platform_gateway_credentials
      const { data: platformCreds } = await adminClient
        .from('platform_gateway_credentials')
        .select('credentials')
        .eq('gateway_slug', gateway)
        .maybeSingle();

      const dbCreds = platformCreds?.credentials as Record<string, string> | null;
      if (gateway === 'sigilopay') {
        credentials = {
          client_id: dbCreds?.x_public_key ?? dbCreds?.client_id ?? null,
          client_secret: dbCreds?.x_secret_key ?? dbCreds?.client_secret ?? null,
        };
      } else if (gateway === 'ghostpay') {
        credentials = {
          client_id: dbCreds?.company_id ?? dbCreds?.client_id ?? null,
          client_secret: dbCreds?.secret_key ?? dbCreds?.client_secret ?? null,
        };
      } else {
        credentials = {
          client_id: dbCreds?.client_id ?? null,
          client_secret: dbCreds?.client_secret ?? null,
        };
      }

      return new Response(
        JSON.stringify({ credentials, source: 'platform' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Admin (tenant): fetch from seller_gateway_credentials
    const { data: gatewayData } = await adminClient
      .from('payment_gateways')
      .select('id')
      .eq('slug', gateway)
      .maybeSingle();

    if (!gatewayData) {
      return new Response(
        JSON.stringify({ credentials: { client_id: null, client_secret: null }, source: 'admin' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: sellerCredentials } = await adminClient
      .from('seller_gateway_credentials')
      .select('credentials')
      .eq('user_id', user.id)
      .eq('gateway_id', gatewayData.id)
      .eq('is_active', true)
      .maybeSingle();

    if (sellerCredentials?.credentials) {
      const creds = sellerCredentials.credentials as { client_id?: string; client_secret?: string };
      credentials = { client_id: creds.client_id ?? null, client_secret: creds.client_secret ?? null };
    } else {
      credentials = { client_id: null, client_secret: null };
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
