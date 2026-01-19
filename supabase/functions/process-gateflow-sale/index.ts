import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ProcessGateflowSaleRequest {
  buyer_email: string;
  buyer_name?: string;
  buyer_phone?: string;
  amount: number;
  transaction_id?: string;
  reseller_tenant_id?: string;
  reseller_user_id?: string;
}

// Gerar senha aleatória segura
function generatePassword(length: number = 12): string {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%";
  let password = "";
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    // Cliente com service role para operações admin
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const body: ProcessGateflowSaleRequest = await req.json();
    console.log("Processing GateFlow sale:", body);

    const { 
      buyer_email, 
      buyer_name, 
      buyer_phone, 
      amount, 
      transaction_id,
      reseller_tenant_id,
      reseller_user_id 
    } = body;

    if (!buyer_email) {
      return new Response(
        JSON.stringify({ error: "Email do comprador é obrigatório" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verificar se o usuário já existe
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find(u => u.email === buyer_email);

    if (existingUser) {
      console.log("User already exists:", buyer_email);
      
      // Verificar se já é admin
      const { data: existingRole } = await supabaseAdmin
        .from("user_roles")
        .select("*")
        .eq("user_id", existingUser.id)
        .eq("role", "admin")
        .single();

      if (existingRole) {
        // Já é admin, apenas registrar a venda
        const commissionAmount = amount * 0.5; // 50% de comissão padrão

        await supabaseAdmin.from("gateflow_sales").insert({
          buyer_email,
          buyer_name,
          buyer_phone,
          amount,
          commission_amount: commissionAmount,
          transaction_id,
          reseller_tenant_id,
          reseller_user_id,
          status: "paid",
          notes: "Usuário já existente como admin",
        });

        return new Response(
          JSON.stringify({ 
            success: true, 
            message: "Usuário já é admin. Venda registrada.",
            user_id: existingUser.id 
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Gerar senha aleatória
    const generatedPassword = generatePassword();

    // Criar novo usuário
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: buyer_email,
      password: generatedPassword,
      email_confirm: true,
      user_metadata: {
        full_name: buyer_name || "Novo Admin",
        phone: buyer_phone,
      },
    });

    if (createError) {
      console.error("Error creating user:", createError);
      return new Response(
        JSON.stringify({ error: `Erro ao criar usuário: ${createError.message}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = newUser.user.id;
    console.log("User created:", userId);

    // Criar tenant para o novo admin
    const brandName = buyer_name ? `${buyer_name} Digital` : "Minha Empresa";
    
    const { data: newTenant, error: tenantError } = await supabaseAdmin
      .from("tenants")
      .insert({
        admin_user_id: userId,
        brand_name: brandName,
        status: "active",
        is_reseller: true,
        reseller_commission: 50, // 50% de comissão padrão
      })
      .select()
      .single();

    if (tenantError) {
      console.error("Error creating tenant:", tenantError);
      // Continuar mesmo com erro no tenant
    }

    const tenantId = newTenant?.id;

    // Atualizar profile com tenant_id
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .update({
        full_name: buyer_name,
        phone: buyer_phone,
        email: buyer_email,
        tenant_id: tenantId,
        payment_mode: "platform_gateway",
      })
      .eq("user_id", userId);

    if (profileError) {
      console.error("Error updating profile:", profileError);
    }

    // Adicionar role 'admin'
    const { error: roleError } = await supabaseAdmin
      .from("user_roles")
      .insert({
        user_id: userId,
        role: "admin",
      });

    if (roleError) {
      console.error("Error adding admin role:", roleError);
    }

    // Registrar a venda no gateflow_sales
    const commissionAmount = amount * 0.5; // 50% de comissão padrão

    const { error: saleError } = await supabaseAdmin
      .from("gateflow_sales")
      .insert({
        buyer_email,
        buyer_name,
        buyer_phone,
        amount,
        commission_amount: commissionAmount,
        transaction_id,
        reseller_tenant_id,
        reseller_user_id,
        status: "paid",
      });

    if (saleError) {
      console.error("Error recording sale:", saleError);
    }

    // Adicionar produto Gateflow padrão para revenda (copiar do produto principal)
    const GATEFLOW_PRODUCT_ID = "e5761661-ebb4-4605-a33c-65943686972c";
    
    const { data: sourceProduct } = await supabaseAdmin
      .from("products")
      .select("*")
      .eq("id", GATEFLOW_PRODUCT_ID)
      .single();

    if (sourceProduct) {
      const { error: productError } = await supabaseAdmin
        .from("products")
        .insert({
          seller_id: userId,
          name: sourceProduct.name,
          description: sourceProduct.description,
          price: sourceProduct.price,
          cover_url: sourceProduct.cover_url,
          type: sourceProduct.type,
          status: "active",
          commission_rate: 50, // 50% commission for affiliates
          allow_affiliates: true,
          checkout_theme: sourceProduct.checkout_theme,
          custom_slug: `gateflow-${Date.now()}`,
          deliverable_type: sourceProduct.deliverable_type,
          deliverable_url: sourceProduct.deliverable_url,
        });
      
      if (productError) {
        console.error("Error adding default product:", productError);
      } else {
        console.log("Default Gateflow product added for new tenant");
      }
    } else {
      console.log("Source Gateflow product not found");
    }

    // Enviar email de boas-vindas com credenciais
    try {
      const resendApiKey = Deno.env.get("RESEND_API_KEY");
      
      if (resendApiKey) {
        const emailResponse = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${resendApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "GateFlow <noreply@resend.dev>",
            to: [buyer_email],
            subject: "🎉 Bem-vindo ao Sistema GateFlow!",
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h1 style="color: #10b981;">🎉 Parabéns pela sua compra!</h1>
                
                <p>Olá ${buyer_name || ""},</p>
                
                <p>Seu acesso ao <strong>Sistema GateFlow</strong> foi liberado com sucesso!</p>
                
                <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                  <h3 style="margin-top: 0;">Suas credenciais de acesso:</h3>
                  <p><strong>Email:</strong> ${buyer_email}</p>
                  <p><strong>Senha:</strong> ${generatedPassword}</p>
                </div>
                
                <p style="color: #ef4444;"><strong>⚠️ Importante:</strong> Por segurança, recomendamos que você altere sua senha após o primeiro acesso.</p>
                
                <a href="https://pixgate-hub.lovable.app/?page=auth" 
                   style="display: inline-block; background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin: 20px 0;">
                  Acessar Plataforma
                </a>
                
                <p>Qualquer dúvida, entre em contato com nosso suporte.</p>
                
                <p>Atenciosamente,<br>Equipe GateFlow</p>
              </div>
            `,
          }),
        });

        if (!emailResponse.ok) {
          console.error("Failed to send welcome email:", await emailResponse.text());
        } else {
          console.log("Welcome email sent successfully");
        }
      } else {
        console.log("RESEND_API_KEY not configured, skipping email");
      }
    } catch (emailError) {
      console.error("Error sending welcome email:", emailError);
      // Não falhar a operação por causa do email
    }

    console.log("GateFlow sale processed successfully:", {
      userId,
      tenantId,
      email: buyer_email,
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: "Admin criado com sucesso!",
        user_id: userId,
        tenant_id: tenantId,
        credentials: {
          email: buyer_email,
          password: generatedPassword,
        },
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error processing GateFlow sale:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
