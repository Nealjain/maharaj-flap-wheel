-- Reset password for existing admin user
-- Run this in Supabase SQL Editor

-- Option 1: Reset password for admin@maharaj.com
UPDATE auth.users
SET 
  encrypted_password = crypt('Admin@123', gen_salt('bf')),
  email_confirmed_at = NOW()  -- Also confirm email
WHERE email = 'admin@maharaj.com';

-- Check if it worked
SELECT email, email_confirmed_at, created_at
FROM auth.users
WHERE email = 'admin@maharaj.com';

-- Also check the profile
SELECT id, email, role, full_name
FROM user_profiles
WHERE email = 'admin@maharaj.com';
