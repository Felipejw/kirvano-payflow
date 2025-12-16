import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const domain = url.searchParams.get('domain');

    console.log(`[allow-domain] Checking domain: ${domain}`);

    if (!domain) {
      console.log('[allow-domain] No domain provided');
      return new Response('Domain parameter required', { 
        status: 400,
        headers: corsHeaders 
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check if domain is registered in any active product
    const { data: product, error } = await supabase
      .from('products')
      .select('id, name, custom_domain')
      .eq('custom_domain', domain)
      .eq('status', 'active')
      .maybeSingle();

    if (error) {
      console.error('[allow-domain] Database error:', error);
      return new Response('Internal error', { 
        status: 500,
        headers: corsHeaders 
      });
    }

    if (product) {
      console.log(`[allow-domain] Domain ${domain} ALLOWED - Product: ${product.name}`);
      return new Response('OK', { 
        status: 200,
        headers: corsHeaders 
      });
    }

    console.log(`[allow-domain] Domain ${domain} BLOCKED - Not registered`);
    return new Response('Domain not registered', { 
      status: 403,
      headers: corsHeaders 
    });

  } catch (error) {
    console.error('[allow-domain] Error:', error);
    return new Response('Internal error', { 
      status: 500,
      headers: corsHeaders 
    });
  }
});
