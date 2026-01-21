import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface BootstrapRequest {
  email?: string;
  password?: string;
  full_name?: string;
}

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json(401, { error: "Não autorizado" });

    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user: caller },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !caller) return json(401, { error: "Token inválido" });

    const { data: callerRoles, error: roleError } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", caller.id);

    if (roleError) return json(500, { error: "Erro ao validar permissões" });
    const isSuperAdmin = callerRoles?.some((r) => r.role === "super_admin");
    if (!isSuperAdmin) {
      return json(403, { error: "Apenas super admins podem executar esta ação" });
    }

    const body: BootstrapRequest = await req.json().catch(() => ({}));
    const email = (body.email || "admin@admin.com").trim().toLowerCase();
    const password = body.password || "123456";
    const fullName = body.full_name || "Admin";

    if (!email || !password) {
      return json(400, { error: "Campos inválidos" });
    }
    if (password.length < 6) {
      return json(400, { error: "A senha deve ter pelo menos 6 caracteres" });
    }

    // Prefer using profiles as the source of truth to find the user_id by email.
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
      const { error: updateError } = await supabase.auth.admin.updateUserById(userId, {
        password,
      });

      if (updateError) {
        return json(400, {
          error: updateError.message || "Erro ao atualizar senha",
        });
      }
    }

    // Ensure role 'admin' exists.
    const { error: roleInsertError } = await supabase
      .from("user_roles")
      .insert({ user_id: userId, role: "admin" });

    // Ignore duplicate role errors.
    if (roleInsertError && roleInsertError.code !== "23505") {
      return json(500, { error: "Erro ao garantir role admin" });
    }

    return json(200, {
      success: true,
      user_id: userId,
      email,
      message: "Usuário admin criado/resetado com sucesso",
    });
  } catch (error: any) {
    console.error("[admin-bootstrap] Error:", error);
    return json(500, { error: error?.message || "Erro interno" });
  }
});
