import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type BackfillSource = "both" | "transactions" | "gateflow_sales";

interface BackfillRequest {
  product_id?: string;
  dry_run?: boolean;
  limit?: number;
  source?: BackfillSource;
}

type BuyerCandidate = {
  email: string;
  name?: string | null;
  phone?: string | null;
};

const normalizeEmail = (email: string) => email.trim().toLowerCase();

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
    const productId = body.product_id || "e5761661-ebb4-4605-a33c-65943686972c";
    const dryRun = body.dry_run ?? true;
    const limit = Math.min(500, Math.max(1, Math.floor(body.limit ?? 200)));
    const source: BackfillSource = body.source ?? "both";

    console.log("Backfill Gateflow buyers:", { productId, dryRun, limit, source });

    // --- Load source product once (needed for product copy)
    const { data: sourceProduct, error: sourceProductError } = await supabase
      .from("products")
      .select("*")
      .eq("id", productId)
      .single();

    if (sourceProductError || !sourceProduct) {
      console.error("Source product not found:", sourceProductError);
      return json(400, { error: "Produto Gateflow não encontrado" });
    }

    // --- Collect buyers
    const candidatesByEmail = new Map<string, BuyerCandidate>();

    if (source === "both" || source === "gateflow_sales") {
      const { data: sales, error: salesErr } = await supabase
        .from("gateflow_sales")
        .select("buyer_email,buyer_name,buyer_phone,status")
        .eq("status", "paid")
        .order("created_at", { ascending: false })
        .limit(limit);

      if (salesErr) {
        console.error("Error reading gateflow_sales:", salesErr);
        return json(500, { error: "Erro ao ler gateflow_sales" });
      }

      for (const s of sales ?? []) {
        if (!s?.buyer_email) continue;
        const key = normalizeEmail(String(s.buyer_email));
        if (!candidatesByEmail.has(key)) {
          candidatesByEmail.set(key, {
            email: key,
            name: s.buyer_name,
            phone: s.buyer_phone,
          });
        }
      }
    }

    if (source === "both" || source === "transactions") {
      const { data: txs, error: txErr } = await supabase
        .from("transactions")
        .select("id,charge_id,status,product_id")
        .eq("product_id", productId)
        .eq("status", "paid")
        .order("created_at", { ascending: false })
        .limit(limit);

      if (txErr) {
        console.error("Error reading transactions:", txErr);
        return json(500, { error: "Erro ao ler transactions" });
      }

      const chargeIds = (txs ?? [])
        .map((t) => t.charge_id)
        .filter(Boolean) as string[];

      if (chargeIds.length) {
        const { data: charges, error: chargesErr } = await supabase
          .from("pix_charges")
          .select("id,buyer_email,buyer_name,buyer_phone")
          .in("id", chargeIds);

        if (chargesErr) {
          console.error("Error reading pix_charges:", chargesErr);
          return json(500, { error: "Erro ao ler pix_charges" });
        }

        for (const c of charges ?? []) {
          if (!c?.buyer_email) continue;
          const key = normalizeEmail(String(c.buyer_email));
          if (!candidatesByEmail.has(key)) {
            candidatesByEmail.set(key, {
              email: key,
              name: c.buyer_name,
              phone: c.buyer_phone,
            });
          }
        }
      }
    }

    const candidates = Array.from(candidatesByEmail.values());

    // --- Process buyers idempotently
    const totals = {
      scanned_emails: candidates.length,
      created_users: 0,
      existing_users: 0,
      created_tenants: 0,
      existing_tenants: 0,
      created_products: 0,
      existing_products: 0,
      admin_role_upserts: 0,
      errors: 0,
    };

    const errors: Array<{ email: string; error: string }> = [];

    for (const cand of candidates) {
      try {
        const email = normalizeEmail(cand.email);
        if (!email) continue;

        // 1) Resolve user_id by profile.email
        const { data: existingProfile, error: profileErr } = await supabase
          .from("profiles")
          .select("user_id")
          .eq("email", email)
          .maybeSingle();

        if (profileErr) throw profileErr;

        let userId: string | null = existingProfile?.user_id ?? null;
        let createdUser = false;

        if (!userId) {
          if (dryRun) {
            // simulate a new user id without creating
            createdUser = true;
          } else {
            const { data: authData, error: createErr } = await supabase.auth.admin.createUser({
              email,
              password: "123456",
              email_confirm: true,
              user_metadata: {
                full_name: cand.name ?? null,
                phone: cand.phone ?? null,
                payment_mode: "platform_gateway",
              },
            });
            if (createErr || !authData.user) throw createErr || new Error("Erro ao criar usuário");
            userId = authData.user.id;
            createdUser = true;
          }
        }

        if (createdUser) totals.created_users += 1;
        else totals.existing_users += 1;

        if (!dryRun && userId) {
          // 2) Ensure admin role
          const { error: upsertRoleErr } = await supabase
            .from("user_roles")
            .upsert({ user_id: userId, role: "admin" }, { onConflict: "user_id,role" });
          if (upsertRoleErr) throw upsertRoleErr;
          totals.admin_role_upserts += 1;

          // 3) Ensure tenant
          const { data: existingTenant, error: tenantSelectErr } = await supabase
            .from("tenants")
            .select("id")
            .eq("admin_user_id", userId)
            .maybeSingle();
          if (tenantSelectErr) throw tenantSelectErr;

          let tenantId: string | null = existingTenant?.id ?? null;
          let createdTenant = false;

          if (!tenantId) {
            const brandName = (cand.name || email).toString().slice(0, 80);
            const { data: newTenant, error: tenantInsertErr } = await supabase
              .from("tenants")
              .insert({
                admin_user_id: userId,
                brand_name: brandName,
                reseller_commission: 50,
                status: "active",
                is_reseller: true,
              })
              .select("id")
              .single();
            if (tenantInsertErr || !newTenant) throw tenantInsertErr || new Error("Erro ao criar tenant");
            tenantId = newTenant.id;
            createdTenant = true;

            // Keep profile.tenant_id consistent
            await supabase.from("profiles").update({ tenant_id: tenantId }).eq("user_id", userId);
          }

          if (createdTenant) totals.created_tenants += 1;
          else totals.existing_tenants += 1;

          // 4) Ensure Gateflow product copy
          const { data: existingProduct, error: prodSelectErr } = await supabase
            .from("products")
            .select("id")
            .eq("seller_id", userId)
            .eq("parent_product_id", productId)
            .maybeSingle();
          if (prodSelectErr) throw prodSelectErr;

          if (existingProduct?.id) {
            totals.existing_products += 1;
          } else {
            const customSlug = `gateflow-${Date.now()}-${Math.random().toString(16).slice(2)}`;
            const { error: prodInsertErr } = await supabase.from("products").insert({
              seller_id: userId,
              name: sourceProduct.name,
              description: sourceProduct.description,
              price: sourceProduct.price,
              cover_url: sourceProduct.cover_url,
              type: sourceProduct.type,
              status: "active",
              commission_rate: 50,
              allow_affiliates: true,
              checkout_theme: sourceProduct.checkout_theme,
              custom_slug: customSlug,
              deliverable_type: sourceProduct.deliverable_type,
              deliverable_url: sourceProduct.deliverable_url,
              parent_product_id: productId,
              order_bumps: sourceProduct.order_bumps,
            });
            if (prodInsertErr) throw prodInsertErr;
            totals.created_products += 1;
          }
        }
      } catch (e: any) {
        totals.errors += 1;
        errors.push({ email: cand.email, error: e?.message || String(e) });
      }
    }

    return json(200, {
      ok: true,
      dry_run: dryRun,
      product_id: productId,
      source,
      limit,
      totals,
      errors: errors.slice(0, 50),
    });
  } catch (error: any) {
    console.error("Error in backfill-gateflow-buyers:", error);
    return new Response(
      JSON.stringify({ error: error?.message || "Erro interno" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
