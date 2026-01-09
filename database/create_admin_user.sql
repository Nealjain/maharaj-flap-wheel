-- BYPASS RATE LIMITS: Create Admin User Directly via SQL
-- Run this script in the Supabase SQL Editor.

-- Change these values to your desired credentials
DO $$
DECLARE
  new_user_id uuid := uuid_generate_v4();
  user_email text := 'admin@example.com'; -- CHANGE THIS
  user_password text := 'Admin@123';      -- CHANGE THIS
  user_name text := 'System Admin';
  user_phone text := '1234567890';
BEGIN
  -- 1. Insert into auth.users (Using pgcrypto for password hashing)
  -- Ensure pgcrypto extension is enabled: CREATE EXTENSION IF NOT EXISTS "pgcrypto";
  
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    recovery_token,
    email_change_token_new,
    email_change
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    new_user_id,
    'authenticated',
    'authenticated',
    user_email,
    crypt(user_password, gen_salt('bf')),
    now(), -- Auto-confirm email
    '{"provider":"email","providers":["email"]}',
    jsonb_build_object('full_name', user_name, 'phone', user_phone),
    now(),
    now(),
    '',
    '',
    '',
    ''
  );

  -- 2. Insert/Update public.user_profiles to ensure Admin Access
  INSERT INTO public.user_profiles (id, email, full_name, phone, role, status)
  VALUES (
    new_user_id,
    user_email,
    user_name,
    user_phone,
    'admin',    -- EXPLICITLY SET ADMIN ROLE
    'approved'  -- EXPLICITLY APPROVE
  )
  ON CONFLICT (id) DO UPDATE SET
    role = 'admin',
    status = 'approved';

END $$;
