import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

    // Check if user is admin using the has_role function
    const { data: isAdmin, error: roleError } = await supabase.rpc('has_role', {
      _user_id: user.id,
      _role: 'admin'
    });

    if (roleError || !isAdmin) {
      console.log(`Access denied for user ${user.id}. Is admin: ${isAdmin}`);
      return new Response(
        JSON.stringify({ error: 'Forbidden - Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { gateway } = await req.json();

    if (!gateway || !['bspay', 'pixup'].includes(gateway)) {
      return new Response(
        JSON.stringify({ error: 'Invalid gateway. Must be bspay or pixup' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let credentials: { client_id: string | null; client_secret: string | null };

    if (gateway === 'bspay') {
      credentials = {
        client_id: Deno.env.get('BSPAY_CLIENT_ID') ?? null,
        client_secret: Deno.env.get('BSPAY_CLIENT_SECRET') ?? null,
      };
    } else {
      credentials = {
        client_id: Deno.env.get('PIXUP_CLIENT_ID') ?? null,
        client_secret: Deno.env.get('PIXUP_CLIENT_SECRET') ?? null,
      };
    }

    console.log(`Admin ${user.id} accessed ${gateway} credentials`);

    return new Response(
      JSON.stringify({ credentials }),
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
