import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    
    // Create service client for privileged operations
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    
    // Validate JWT and get authenticated user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Não autorizado' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await userClient.auth.getClaims(token);
    
    if (claimsError || !claimsData?.claims) {
      console.error('Auth error:', claimsError);
      return new Response(JSON.stringify({ error: 'Token inválido' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const sellerId = claimsData.claims.sub;
    console.log('Authenticated seller:', sellerId);

    // Parse request body
    const body = await req.json();
    const { email, name, productId, sendEmail = true } = body;

    if (!email || !productId) {
      return new Response(JSON.stringify({ error: 'email e productId são obrigatórios' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(JSON.stringify({ error: 'Email inválido' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Granting access to:', email, 'for product:', productId);

    // SECURITY: Validate product ownership
    const { data: product, error: productError } = await supabaseAdmin
      .from('products')
      .select('id, name, seller_id')
      .eq('id', productId)
      .single();

    if (productError || !product) {
      console.error('Product not found:', productError);
      return new Response(JSON.stringify({ error: 'Produto não encontrado' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (product.seller_id !== sellerId) {
      console.error('Unauthorized: Seller', sellerId, 'tried to grant access to product from seller', product.seller_id);
      return new Response(JSON.stringify({ error: 'Você só pode conceder acesso aos seus próprios produtos' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if user already exists
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find((u: any) => u.email === email);
    
    let userId: string;
    let isNewUser = false;
    let password: string | undefined;
    
    if (existingUser) {
      userId = existingUser.id;
      console.log('Existing user found:', userId);
      
      // Check if user already has member role, if not, add it
      const { data: existingRole } = await supabaseAdmin
        .from('user_roles')
        .select('id')
        .eq('user_id', userId)
        .eq('role', 'member')
        .maybeSingle();
      
      if (!existingRole) {
        const { error: insertRoleError } = await supabaseAdmin
          .from('user_roles')
          .insert({
            user_id: userId,
            role: 'member',
          });
        
        if (insertRoleError && !insertRoleError.message.includes('duplicate')) {
          console.error('Error assigning member role:', insertRoleError);
        } else {
          console.log('Member role assigned to existing user:', userId);
        }
      }
    } else {
      // Create new user with default password
      password = "123456";
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: email,
        password: password,
        email_confirm: true,
        user_metadata: {
          full_name: name || 'Cliente',
        },
      });
      
      if (createError) {
        console.error('Error creating user:', createError);
        return new Response(JSON.stringify({ error: `Falha ao criar usuário: ${createError.message}` }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      userId = newUser.user.id;
      isNewUser = true;
      console.log('New user created:', userId);
      
      // Delete the 'seller' role that may be auto-created by trigger
      // and assign 'member' role instead for buyers
      console.log('Updating role to member for new buyer:', userId);
      
      const { error: deleteRoleError } = await supabaseAdmin
        .from('user_roles')
        .delete()
        .eq('user_id', userId);
      
      if (deleteRoleError) {
        console.warn('Error deleting auto-assigned roles:', deleteRoleError);
      }
      
      const { error: insertRoleError } = await supabaseAdmin
        .from('user_roles')
        .insert({
          user_id: userId,
          role: 'member',
        });
      
      if (insertRoleError) {
        console.error('Error assigning member role:', insertRoleError);
      } else {
        console.log('Member role assigned successfully to:', userId);
      }
    }
    
    // Check if membership already exists
    const { data: existingMembership } = await supabaseAdmin
      .from('members')
      .select('id')
      .eq('user_id', userId)
      .eq('product_id', productId)
      .maybeSingle();
    
    if (existingMembership) {
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'Usuário já possui acesso a este produto',
        already_had_access: true 
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    // Create membership (without transaction_id since this is manual)
    const { error: memberError } = await supabaseAdmin
      .from('members')
      .insert({
        user_id: userId,
        product_id: productId,
        access_level: 'full',
        status: 'active',
      });
    
    if (memberError) {
      console.error('Error creating membership:', memberError);
      return new Response(JSON.stringify({ error: `Falha ao criar acesso: ${memberError.message}` }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    console.log('Membership created for user:', userId, 'product:', productId);
    
    // Get member ID for email logging
    const { data: memberData } = await supabaseAdmin
      .from('members')
      .select('id')
      .eq('user_id', userId)
      .eq('product_id', productId)
      .maybeSingle();
    
    const memberId = memberData?.id || null;
    
    // Send access email if requested
    if (sendEmail && memberId) {
      try {
        const emailPayload = {
          buyer_name: name || 'Cliente',
          buyer_email: email,
          product_name: product.name,
          amount: 0, // Manual access, no payment
          paid_at: new Date().toISOString(),
          send_email: true,
          send_whatsapp: false,
          has_members_area: true,
          member_id: memberId,
          member_password: isNewUser ? password : null,
          is_new_member: isNewUser,
          is_manual_access: true,
        };
        
        console.log('Sending access email to:', email, 'with member_id:', memberId);
        
        // Fire and forget
        fetch(`${supabaseUrl}/functions/v1/send-member-access-email`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            member_id: memberId,
            password: isNewUser ? password : undefined,
          }),
        }).catch(err => console.error('Access email error (non-blocking):', err));
        
      } catch (emailError) {
        console.error('Error sending access email:', emailError);
        // Don't fail the request if email fails
      }
    }

    console.log('Access granted successfully to:', email, 'for product:', product.name);

    return new Response(JSON.stringify({ 
      success: true, 
      message: `Acesso concedido com sucesso${isNewUser ? '. Usuário criado com senha 123456' : ''}`,
      is_new_user: isNewUser,
      email_sent: sendEmail,
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in grant-member-access:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
