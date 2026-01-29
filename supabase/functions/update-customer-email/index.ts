import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Não autorizado - Token não fornecido' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create client with user's token to verify identity
    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Create admin client for privileged operations
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Verify the user's token
    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await supabaseClient.auth.getClaims(token);
    
    if (claimsError || !claimsData?.claims?.sub) {
      console.error('Token verification failed:', claimsError);
      return new Response(
        JSON.stringify({ error: 'Token inválido ou expirado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const callingUserId = claimsData.claims.sub;
    console.log('Calling user ID:', callingUserId);

    // Check if calling user has admin or super_admin role
    const { data: roleData, error: roleError } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', callingUserId)
      .in('role', ['admin', 'super_admin']);

    if (roleError) {
      console.error('Error checking user role:', roleError);
      return new Response(
        JSON.stringify({ error: 'Erro ao verificar permissões' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!roleData || roleData.length === 0) {
      console.log('User does not have admin permissions');
      return new Response(
        JSON.stringify({ error: 'Você não tem permissão para realizar esta operação' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('User has admin role:', roleData);

    // Parse request body
    const { userId, newEmail } = await req.json();

    if (!userId || !newEmail) {
      return new Response(
        JSON.stringify({ error: 'userId e newEmail são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail)) {
      return new Response(
        JSON.stringify({ error: 'Formato de email inválido' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Updating email for user ${userId} to ${newEmail}`);

    // Get the current user data to find old email
    const { data: userData, error: getUserError } = await supabaseAdmin.auth.admin.getUserById(userId);
    
    if (getUserError || !userData?.user) {
      console.error('Error getting user:', getUserError);
      return new Response(
        JSON.stringify({ error: 'Usuário não encontrado' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const oldEmail = userData.user.email;
    console.log(`Old email: ${oldEmail}`);

    // Check if new email is already in use by another user using profiles table
    const { data: existingProfile, error: existingProfileError } = await supabaseAdmin
      .from('profiles')
      .select('user_id')
      .eq('email', newEmail)
      .neq('user_id', userId)
      .maybeSingle();

    if (existingProfileError) {
      console.error('Error checking existing email:', existingProfileError);
    }

    if (existingProfile) {
      return new Response(
        JSON.stringify({ error: 'Este email já está em uso por outro usuário' }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update email in auth.users
    const { data: updatedUser, error: updateAuthError } = await supabaseAdmin.auth.admin.updateUserById(
      userId,
      { email: newEmail, email_confirm: true }
    );

    if (updateAuthError) {
      console.error('Error updating auth.users:', updateAuthError);
      return new Response(
        JSON.stringify({ error: `Erro ao atualizar autenticação: ${updateAuthError.message}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Updated auth.users successfully');

    // Update email in profiles table
    const { error: updateProfileError } = await supabaseAdmin
      .from('profiles')
      .update({ email: newEmail })
      .eq('user_id', userId);

    if (updateProfileError) {
      console.error('Error updating profiles:', updateProfileError);
      // Don't fail the whole operation, just log it
    } else {
      console.log('Updated profiles successfully');
    }

    // Update email in pix_charges table (for all charges with old email)
    if (oldEmail) {
      const { data: updatedCharges, error: updateChargesError } = await supabaseAdmin
        .from('pix_charges')
        .update({ buyer_email: newEmail })
        .eq('buyer_email', oldEmail)
        .select('id');

      if (updateChargesError) {
        console.error('Error updating pix_charges:', updateChargesError);
        // Don't fail the whole operation, just log it
      } else {
        console.log(`Updated ${updatedCharges?.length || 0} pix_charges records`);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Email atualizado com sucesso em todos os registros',
        data: {
          userId,
          oldEmail,
          newEmail,
          updatedAt: new Date().toISOString()
        }
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: `Erro inesperado: ${errorMessage}` }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
