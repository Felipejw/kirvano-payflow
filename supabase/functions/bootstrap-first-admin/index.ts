import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type BootstrapRequest = {
  email?: string;
  password?: string;
  full_name?: string;
};

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

// Token "embutido" para não exigir configuração do instalador.
// Segurança adicional: só funciona enquanto não existir nenhum usuário com role "admin".
const SETUP_TOKEN_FALLBACK = "gateflow_setup_v1";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const setupToken = req.headers.get("x-setup-token") || "";
    const expectedToken = Deno.env.get("SETUP_TOKEN") || SETUP_TOKEN_FALLBACK;

    if (!setupToken || setupToken !== expectedToken) {
      return json(401, { error: "Não autorizado" });
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

    const body: BootstrapRequest = await req.json().catch(() => ({}));
    const email = (body.email || "").trim().toLowerCase();
    const password = body.password || "";
    const fullName = (body.full_name || "Admin").trim() || "Admin";

    if (!email || !password) return json(400, { error: "Campos inválidos" });
    if (password.length < 6) return json(400, { error: "A senha deve ter pelo menos 6 caracteres" });

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
        return json(400, { error: createError?.message || "Erro ao criar usuário" });
      }

      userId = created.user.id;
    } else {
      const { error: updateError } = await supabase.auth.admin.updateUserById(userId, { password });
      if (updateError) {
        return json(400, { error: updateError.message || "Erro ao atualizar senha" });
      }
    }

    // Garantir role admin (idempotente)
    const { error: roleInsertError } = await supabase
      .from("user_roles")
      .insert({ user_id: userId, role: "admin" });

    // Ignore duplicate key violation
    if (roleInsertError && roleInsertError.code !== "23505") {
      console.error("[bootstrap-first-admin] roleInsertError:", roleInsertError);
      return json(500, { error: "Erro ao garantir role admin" });
    }

    return json(200, {
      success: true,
      user_id: userId,
      email,
      message: "Admin criado/resetado com sucesso",
    });
  } catch (error: any) {
    console.error("[bootstrap-first-admin] Error:", error);
    return json(500, { error: error?.message || "Erro interno" });
  }
});
