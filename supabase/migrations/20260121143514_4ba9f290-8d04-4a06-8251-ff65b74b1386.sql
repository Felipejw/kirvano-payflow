-- Criar usuário admin padrão se não existir
DO $$
DECLARE
  admin_user_id uuid;
BEGIN
  -- Verificar se o usuário admin já existe
  SELECT id INTO admin_user_id 
  FROM auth.users 
  WHERE email = 'admin@admin.com';
  
  -- Se não existir, criar
  IF admin_user_id IS NULL THEN
    admin_user_id := gen_random_uuid();
    
    -- Inserir na tabela auth.users
    INSERT INTO auth.users (
      id,
      instance_id,
      email,
      encrypted_password,
      email_confirmed_at,
      created_at,
      updated_at,
      raw_app_meta_data,
      raw_user_meta_data,
      is_super_admin,
      role,
      aud,
      is_sso_user,
      is_anonymous
    ) VALUES (
      admin_user_id,
      '00000000-0000-0000-0000-000000000000',
      'admin@admin.com',
      crypt('123456', gen_salt('bf')),
      now(),
      now(),
      now(),
      '{"provider":"email","providers":["email"]}',
      '{"full_name":"Administrador"}',
      false,
      'authenticated',
      'authenticated',
      false,
      false
    );
    
    -- Criar perfil para o usuário (com ON CONFLICT para evitar duplicação)
    INSERT INTO public.profiles (user_id, email, full_name)
    VALUES (admin_user_id, 'admin@admin.com', 'Administrador')
    ON CONFLICT (user_id) DO NOTHING;
    
    -- Atribuir role admin (com ON CONFLICT para evitar duplicação)
    INSERT INTO public.user_roles (user_id, role)
    VALUES (admin_user_id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
    
    RAISE NOTICE 'Usuário admin@admin.com criado com sucesso!';
  ELSE
    -- Usuário já existe, garantir que tem role admin
    INSERT INTO public.user_roles (user_id, role)
    VALUES (admin_user_id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
    
    RAISE NOTICE 'Usuário admin@admin.com já existe, garantindo role admin.';
  END IF;
END $$;