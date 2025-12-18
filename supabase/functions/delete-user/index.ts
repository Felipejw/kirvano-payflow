import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('No authorization header provided');
      return new Response(
        JSON.stringify({ error: 'Não autorizado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create client with user's token to verify they are admin
    const supabaseUser = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    // Get the calling user
    const { data: { user: callingUser }, error: authError } = await supabaseUser.auth.getUser();
    if (authError || !callingUser) {
      console.error('Auth error:', authError);
      return new Response(
        JSON.stringify({ error: 'Usuário não autenticado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Calling user:', callingUser.id);

    // Create admin client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Verify calling user is admin
    const { data: callerRole, error: callerRoleError } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', callingUser.id)
      .single();

    if (callerRoleError || callerRole?.role !== 'admin') {
      console.error('Caller is not admin:', callerRoleError);
      return new Response(
        JSON.stringify({ error: 'Apenas administradores podem excluir usuários' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get request body
    const { userId } = await req.json();
    
    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'ID do usuário é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Attempting to delete user:', userId);

    // Check if target user is admin - cannot delete admins
    const { data: targetRole, error: targetRoleError } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .single();

    if (targetRoleError) {
      console.error('Error checking target user role:', targetRoleError);
      // If no role found, proceed with deletion (user might not have a role)
    }

    if (targetRole?.role === 'admin') {
      console.error('Attempted to delete admin user');
      return new Response(
        JSON.stringify({ error: 'Não é permitido excluir usuários administradores' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Delete the user using admin API
    // Note: ON DELETE CASCADE should handle related records in profiles, user_roles, members, etc.
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (deleteError) {
      console.error('Error deleting user:', deleteError);
      return new Response(
        JSON.stringify({ error: `Falha ao excluir usuário: ${deleteError.message}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('User deleted successfully:', userId);

    return new Response(
      JSON.stringify({ success: true, message: 'Usuário excluído com sucesso' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
