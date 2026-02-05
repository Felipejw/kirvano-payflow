import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface BackfillRequest {
  dry_run?: boolean;
  limit?: number;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const json = (status: number, body: any) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // --- Auth (caller must be super_admin)
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json(401, { error: "Não autorizado" });
    const token = authHeader.replace("Bearer ", "");

    const {
      data: { user: caller },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !caller) return json(401, { error: "Token inválido" });

    const { data: callerRoles, error: rolesErr } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", caller.id);

    if (rolesErr) {
      console.error("Error reading caller roles:", rolesErr);
      return json(500, { error: "Erro ao validar permissões" });
    }

    const isSuperAdmin = callerRoles?.some((r) => r.role === "super_admin");
    if (!isSuperAdmin) return json(403, { error: "Apenas super admins" });

    // --- Input
    const body: BackfillRequest = await req.json().catch(() => ({}));
    const dryRun = body.dry_run ?? true;
    const limit = Math.min(500, Math.max(1, Math.floor(body.limit ?? 200)));

    console.log("Backfill order bump memberships:", { dryRun, limit });

    // --- Find paid charges with order_bumps
    const { data: charges, error: chargesErr } = await supabase
      .from("pix_charges")
      .select("id, buyer_email, buyer_name, order_bumps, product_id")
      .eq("status", "paid")
      .not("order_bumps", "is", null)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (chargesErr) {
      console.error("Error reading pix_charges:", chargesErr);
      return json(500, { error: "Erro ao ler pix_charges" });
    }

    // Filter charges that actually have order_bumps array with items
    const chargesWithBumps = (charges ?? []).filter(
      (c) => Array.isArray(c.order_bumps) && c.order_bumps.length > 0
    );

    console.log(`Found ${chargesWithBumps.length} charges with order bumps`);

    const totals = {
      scanned_charges: chargesWithBumps.length,
      total_order_bumps: 0,
      memberships_created: 0,
      memberships_existing: 0,
      users_not_found: 0,
      errors: 0,
    };

    const errors: Array<{ email: string; productId: string; error: string }> = [];
    const details: Array<{ email: string; productId: string; action: string }> = [];

    for (const charge of chargesWithBumps) {
      if (!charge.buyer_email || !charge.order_bumps) continue;

      const email = charge.buyer_email.trim().toLowerCase();

      // Find user_id by email
      const { data: profile, error: profileErr } = await supabase
        .from("profiles")
        .select("user_id")
        .eq("email", email)
        .maybeSingle();

      if (profileErr) {
        console.error("Error finding profile for:", email, profileErr);
        totals.errors += 1;
        errors.push({ email, productId: "N/A", error: profileErr.message });
        continue;
      }

      if (!profile?.user_id) {
        console.log("User not found for email:", email);
        totals.users_not_found += 1;
        continue;
      }

      const userId = profile.user_id;

      // Process each order bump
      for (const bumpProductId of charge.order_bumps) {
        totals.total_order_bumps += 1;

        try {
          // Check if membership already exists
          const { data: existingMember, error: memberErr } = await supabase
            .from("members")
            .select("id")
            .eq("user_id", userId)
            .eq("product_id", bumpProductId)
            .maybeSingle();

          if (memberErr) {
            console.error("Error checking membership:", memberErr);
            totals.errors += 1;
            errors.push({ email, productId: bumpProductId, error: memberErr.message });
            continue;
          }

          if (existingMember) {
            totals.memberships_existing += 1;
            details.push({ email, productId: bumpProductId, action: "already_exists" });
            continue;
          }

          // Create membership if not dry run
          if (!dryRun) {
            const { error: insertErr } = await supabase.from("members").insert({
              user_id: userId,
              product_id: bumpProductId,
              access_level: "full",
              status: "active",
            });

            if (insertErr) {
              console.error("Error creating membership:", insertErr);
              totals.errors += 1;
              errors.push({ email, productId: bumpProductId, error: insertErr.message });
              continue;
            }
          }

          totals.memberships_created += 1;
          details.push({ email, productId: bumpProductId, action: dryRun ? "would_create" : "created" });
          console.log(`${dryRun ? "[DRY-RUN] Would create" : "Created"} membership for ${email} -> ${bumpProductId}`);
        } catch (e: any) {
          totals.errors += 1;
          errors.push({ email, productId: bumpProductId, error: e?.message || String(e) });
        }
      }
    }

    return json(200, {
      ok: true,
      dry_run: dryRun,
      limit,
      totals,
      details: details.slice(0, 100),
      errors: errors.slice(0, 50),
    });
  } catch (error: any) {
    console.error("Error in backfill-order-bump-memberships:", error);
    return new Response(
      JSON.stringify({ error: error?.message || "Erro interno" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
