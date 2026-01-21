import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// SECURITY: Service role is required because quiz_leads is not publicly writable
const createServiceClient = () => {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  return createClient(supabaseUrl, supabaseServiceKey);
};

const createLeadSchema = z.object({
  quiz_id: z.string().uuid(),
  session_id: z.string().uuid(),
  user_agent: z.string().max(500).nullable().optional(),
  ip_address: z.string().max(100).nullable().optional(),
  utm_source: z.string().max(100).nullable().optional(),
  utm_medium: z.string().max(100).nullable().optional(),
  utm_campaign: z.string().max(100).nullable().optional(),
  utm_content: z.string().max(100).nullable().optional(),
  utm_term: z.string().max(100).nullable().optional(),
});

const updateLeadSchema = z.object({
  lead_id: z.string().uuid(),
  session_id: z.string().uuid(),
  name: z.string().max(200).nullable().optional(),
  email: z.string().email().max(255).nullable().optional(),
  phone: z.string().max(30).nullable().optional(),
  status: z.enum(['started', 'completed']).nullable().optional(),
  current_step_id: z.string().uuid().nullable().optional(),
  interaction_count: z.number().int().min(0).nullable().optional(),
  last_interaction_at: z.string().datetime().nullable().optional(),
  completed_at: z.string().datetime().nullable().optional(),
});

const insertResponseSchema = z.object({
  lead_id: z.string().uuid(),
  session_id: z.string().uuid(),
  step_id: z.string().uuid(),
  element_id: z.string().uuid().nullable().optional(),
  response: z.any(),
});

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createServiceClient();
  const url = new URL(req.url);
  const rawPath = url.pathname.replace('/quiz-public', '');

  try {
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json().catch(() => ({}));
    // When called via supabase.functions.invoke(), we can't pass URL subpaths.
    // So we accept a virtual path in the payload.
    const path = typeof body?.__path === 'string' ? body.__path : rawPath;

    // POST /leads
    if (path === '/leads') {
      const parsed = createLeadSchema.safeParse(body);
      if (!parsed.success) {
        return new Response(JSON.stringify({ error: 'Invalid payload', details: parsed.error.flatten() }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Ensure quiz exists and is active
      const { data: quiz, error: quizError } = await supabase
        .from('quizzes')
        .select('id,status')
        .eq('id', parsed.data.quiz_id)
        .single();

      if (quizError || !quiz || quiz.status !== 'active') {
        return new Response(JSON.stringify({ error: 'Quiz not found or inactive' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const { data, error } = await supabase
        .from('quiz_leads')
        .insert({
          quiz_id: parsed.data.quiz_id,
          session_id: parsed.data.session_id,
          status: 'started',
          ip_address: parsed.data.ip_address ?? null,
          user_agent: parsed.data.user_agent ?? null,
          utm_source: parsed.data.utm_source ?? null,
          utm_medium: parsed.data.utm_medium ?? null,
          utm_campaign: parsed.data.utm_campaign ?? null,
          utm_content: parsed.data.utm_content ?? null,
          utm_term: parsed.data.utm_term ?? null,
        })
        .select('id')
        .single();

      if (error || !data) {
        return new Response(JSON.stringify({ error: 'Failed to create lead' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ lead_id: data.id }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // POST /leads/update
    if (path === '/leads/update') {
      const parsed = updateLeadSchema.safeParse(body);
      if (!parsed.success) {
        return new Response(JSON.stringify({ error: 'Invalid payload', details: parsed.error.flatten() }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const { data: lead, error: leadError } = await supabase
        .from('quiz_leads')
        .select('id,session_id')
        .eq('id', parsed.data.lead_id)
        .single();

      if (leadError || !lead) {
        return new Response(JSON.stringify({ error: 'Lead not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (lead.session_id !== parsed.data.session_id) {
        return new Response(JSON.stringify({ error: 'Forbidden' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const updatePayload: Record<string, any> = {};
      for (const key of ['name','email','phone','status','current_step_id','interaction_count','last_interaction_at','completed_at'] as const) {
        if (key in parsed.data) updatePayload[key] = (parsed.data as any)[key] ?? null;
      }

      if (Object.keys(updatePayload).length === 0) {
        return new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const { error: updError } = await supabase
        .from('quiz_leads')
        .update(updatePayload)
        .eq('id', parsed.data.lead_id);

      if (updError) {
        return new Response(JSON.stringify({ error: 'Failed to update lead' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // POST /responses
    if (path === '/responses') {
      const parsed = insertResponseSchema.safeParse(body);
      if (!parsed.success) {
        return new Response(JSON.stringify({ error: 'Invalid payload', details: parsed.error.flatten() }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const { data: lead, error: leadError } = await supabase
        .from('quiz_leads')
        .select('id,session_id')
        .eq('id', parsed.data.lead_id)
        .single();

      if (leadError || !lead) {
        return new Response(JSON.stringify({ error: 'Lead not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (lead.session_id !== parsed.data.session_id) {
        return new Response(JSON.stringify({ error: 'Forbidden' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const { error } = await supabase
        .from('quiz_lead_responses')
        .insert({
          lead_id: parsed.data.lead_id,
          step_id: parsed.data.step_id,
          element_id: parsed.data.element_id ?? null,
          response: parsed.data.response,
        });

      if (error) {
        return new Response(JSON.stringify({ error: 'Failed to save response' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Not found' }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('quiz-public error:', e);
    return new Response(JSON.stringify({ error: 'Internal error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
