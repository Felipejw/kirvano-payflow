import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CreateTenantAdminRequest {
  email: string;
  password: string;
  full_name: string;
  phone?: string;
  brand_name: string;
  custom_domain?: string;
  reseller_commission: number;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Verify caller is super_admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Não autorizado" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user: caller }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !caller) {
      return new Response(
        JSON.stringify({ error: "Token inválido" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: callerRoles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", caller.id);

    const isSuperAdmin = callerRoles?.some(r => r.role === "super_admin");
    if (!isSuperAdmin) {
      return new Response(
        JSON.stringify({ error: "Apenas super admins podem criar novos admins" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse request body
    const body: CreateTenantAdminRequest = await req.json();
    const { email, password, full_name, phone, brand_name, custom_domain, reseller_commission } = body;

    // Validate required fields
    if (!email || !password || !full_name || !brand_name) {
      return new Response(
        JSON.stringify({ error: "Campos obrigatórios: email, password, full_name, brand_name" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // *** FIX: Normalize email to lowercase ***
    const emailNormalized = email.trim().toLowerCase();

    console.log(`Creating admin user for: ${emailNormalized}`);

    let userId: string;
    let isExistingUser = false;

    // Check if user already exists in profiles (using normalized email)
    const { data: existingProfile } = await supabase
      .from("profiles")
      .select("user_id, tenant_id")
      .eq("email", emailNormalized)
      .maybeSingle();

    if (existingProfile?.user_id) {
      userId = existingProfile.user_id;
      isExistingUser = true;
      console.log(`User already exists: ${userId}`);

      // Check if user already has a tenant
      if (existingProfile.tenant_id) {
        const { data: existingTenant } = await supabase
          .from("tenants")
          .select("id, brand_name")
          .eq("id", existingProfile.tenant_id)
          .single();

        if (existingTenant) {
          console.log(`User already has tenant: ${existingTenant.id}`);
          return new Response(
            JSON.stringify({
              success: true,
              user_id: userId,
              tenant_id: existingTenant.id,
              message: `Usuário já existe como admin do tenant "${existingTenant.brand_name}"`,
              existing: true,
            }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }
    } else {
      // Try to create new user in auth (using normalized email)
      const { data: authData, error: createError } = await supabase.auth.admin.createUser({
        email: emailNormalized,
        password,
        email_confirm: true,
        user_metadata: {
          full_name,
          phone,
          document_type: "cnpj",
          payment_mode: "own_gateway",
        },
      });

      if (createError) {
        if (createError.message?.includes("already been registered")) {
          console.log("User exists in auth but not in profiles, searching...");
          
          // *** FIX: Increase perPage and use case-insensitive comparison ***
          const { data: { users } } = await supabase.auth.admin.listUsers({ 
            page: 1, 
            perPage: 1000 
          });
          const existingAuthUser = users?.find(
            u => u.email?.toLowerCase() === emailNormalized
          );
          
          if (existingAuthUser) {
            userId = existingAuthUser.id;
            isExistingUser = true;
            console.log(`Found existing auth user: ${userId}`);
          } else {
            return new Response(
              JSON.stringify({ error: "Usuário existe mas não foi possível localizá-lo" }),
              { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }
        } else {
          console.error("Error creating user:", createError);
          return new Response(
            JSON.stringify({ error: createError.message || "Erro ao criar usuário" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      } else if (authData?.user) {
        userId = authData.user.id;
        console.log(`New user created with ID: ${userId}`);
      } else {
        return new Response(
          JSON.stringify({ error: "Erro ao criar usuário" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }
    console.log(`User ready with ID: ${userId}`);

    // Update profile with phone if provided
    if (phone) {
      await supabase
        .from("profiles")
        .update({ phone })
        .eq("user_id", userId);
    }

    // *** FIX: Add all 3 roles using upsert to avoid duplicate errors ***
    const rolesToAdd: string[] = ["admin", "seller", "member"];
    for (const role of rolesToAdd) {
      const { error: roleError } = await supabase
        .from("user_roles")
        .upsert(
          { user_id: userId, role },
          { onConflict: "user_id,role" }
        );
      if (roleError) {
        console.error(`Error adding role ${role}:`, roleError);
      } else {
        console.log(`Role '${role}' ensured for user ${userId}`);
      }
    }

    // Create tenant
    const { data: tenant, error: tenantError } = await supabase
      .from("tenants")
      .insert({
        admin_user_id: userId,
        brand_name,
        custom_domain: custom_domain || null,
        reseller_commission: reseller_commission || 50,
        status: "active",
        is_reseller: true,
      })
      .select()
      .single();

    if (tenantError) {
      console.error("Error creating tenant:", tenantError);
      return new Response(
        JSON.stringify({ error: tenantError.message }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update profile with tenant_id
    await supabase
      .from("profiles")
      .update({ tenant_id: tenant.id })
      .eq("user_id", userId);

    console.log(`Tenant created: ${tenant.id}`);

    // Add default Gateflow product for reselling
    const GATEFLOW_PRODUCT_ID = "e5761661-ebb4-4605-a33c-65943686972c";
    
    const { data: sourceProduct } = await supabase
      .from("products")
      .select("*")
      .eq("id", GATEFLOW_PRODUCT_ID)
      .single();

    if (sourceProduct) {
      const { error: productError } = await supabase
        .from("products")
        .insert({
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
          custom_slug: `gateflow-${Date.now()}`,
          deliverable_type: sourceProduct.deliverable_type,
          deliverable_url: sourceProduct.deliverable_url,
          parent_product_id: GATEFLOW_PRODUCT_ID,
          order_bumps: sourceProduct.order_bumps,
        });
      
      if (productError) {
        console.error("Error adding default product:", productError);
      } else {
        console.log("Default Gateflow product added for new tenant with parent link");
      }
    } else {
      console.log("Source Gateflow product not found");
    }

    return new Response(
      JSON.stringify({
        success: true,
        user_id: userId,
        tenant_id: tenant.id,
        message: `Admin ${full_name} criado com sucesso`,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("Error in create-tenant-admin:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Erro interno" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
