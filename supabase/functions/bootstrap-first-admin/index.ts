import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const defaultAllowHeaders =
  "authorization, x-client-info, apikey, content-type, x-setup-token, x-supabase-api-version";

const buildCorsHeaders = (req: Request) => {
  // Alguns proxies/browsers enviam um conjunto diferente de headers no preflight.
  // Refletir o que foi solicitado costuma ser mais robusto do que manter uma lista fixa.
  const requested = req.headers.get("access-control-request-headers") || "";
  const allowHeaders = requested.trim() ? requested : defaultAllowHeaders;

  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": allowHeaders,
  };
};

type BootstrapRequest = {
  email?: string;
  password?: string;
  full_name?: string;
  setup_token?: string;
};

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    // CORS headers devem ser injetados pelo handler principal (porque podem depender do preflight).
    // Aqui, setamos apenas o Content-Type.
    headers: { "Content-Type": "application/json" },
  });

// Token "embutido" para não exigir configuração do instalador.
// Segurança adicional: só funciona enquanto não existir nenhum usuário com role "admin".
const SETUP_TOKEN_FALLBACK = "gateflow_setup_v1";

Deno.serve(async (req) => {
  const corsHeaders = buildCorsHeaders(req);

  if (req.method === "OPTIONS") {
    // Log seguro (não inclui credenciais)
    console.log(
      "[bootstrap-first-admin] OPTIONS preflight",
      JSON.stringify({
        origin: req.headers.get("origin"),
        requested_headers: req.headers.get("access-control-request-headers"),
      }),
    );
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Aceita token tanto por header (retrocompatibilidade) quanto por body (evita preflight em muitos VPS/proxies)
    const setupTokenHeader = req.headers.get("x-setup-token") || "";
    const rawBody = await req.json().catch(() => ({}));
    const body: BootstrapRequest = (rawBody || {}) as BootstrapRequest;

    const setupTokenBody = (body.setup_token || "").trim();
    const setupToken = (setupTokenHeader || setupTokenBody || "").trim();
    const expectedToken = Deno.env.get("SETUP_TOKEN") || SETUP_TOKEN_FALLBACK;

    if (!setupToken || setupToken !== expectedToken) {
      return new Response(
        JSON.stringify({ error: "Não autorizado" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // One-time guard: se já existe algum admin, não permite executar novamente.
    const { data: existingAdmin, error: adminCheckError } = await supabase
      .from("user_roles")
      .select("user_id")
      .eq("role", "admin")
      .limit(1)
      .maybeSingle();

    if (adminCheckError) {
      console.error("[bootstrap-first-admin] adminCheckError:", adminCheckError);
      return json(500, { error: "Erro ao validar setup" });
    }

    if (existingAdmin?.user_id) {
      return json(409, { error: "Setup já concluído" });
    }

    const email = (body.email || "").trim().toLowerCase();
    const password = body.password || "";
    const fullName = (body.full_name || "Admin").trim() || "Admin";

    if (!email || !password) {
      return new Response(JSON.stringify({ error: "Campos inválidos" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (password.length < 6) {
      return new Response(
        JSON.stringify({ error: "A senha deve ter pelo menos 6 caracteres" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Prefer profiles como fonte de verdade para encontrar user_id por email.
    const { data: existingProfile } = await supabase
      .from("profiles")
      .select("user_id")
      .eq("email", email)
      .maybeSingle();

    let userId = existingProfile?.user_id ?? null;

    if (!userId) {
      const { data: created, error: createError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: fullName },
      });

      if (createError || !created.user) {
        return new Response(
          JSON.stringify({ error: createError?.message || "Erro ao criar usuário" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      userId = created.user.id;
    } else {
      const { error: updateError } = await supabase.auth.admin.updateUserById(userId, { password });
      if (updateError) {
        return new Response(
          JSON.stringify({ error: updateError.message || "Erro ao atualizar senha" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
    }

    // Garantir role admin (idempotente)
    const { error: roleInsertError } = await supabase
      .from("user_roles")
      .insert({ user_id: userId, role: "admin" });

    // Ignore duplicate key violation
    if (roleInsertError && roleInsertError.code !== "23505") {
      console.error("[bootstrap-first-admin] roleInsertError:", roleInsertError);
      return new Response(JSON.stringify({ error: "Erro ao garantir role admin" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        user_id: userId,
        email,
        message: "Admin criado/resetado com sucesso",
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error: any) {
    console.error("[bootstrap-first-admin] Error:", error);
    return new Response(JSON.stringify({ error: error?.message || "Erro interno" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
