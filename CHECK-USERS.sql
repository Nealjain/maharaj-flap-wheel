-- Check all users in the system
-- Run this in Supabase SQL Editor to see who can login

-- View all users with their profiles
SELECT 
  u.email,
  u.email_confirmed_at,
  u.created_at as user_created,
  p.role,
  p.full_name,
  CASE 
    WHEN u.email_confirmed_at IS NULL THEN '❌ Email not confirmed'
    ELSE '✅ Can login'
  END as status
FROM auth.users u
LEFT JOIN user_profiles p ON u.id = p.id
ORDER BY u.created_at DESC;

-- Count users by role
SELECT 
  COALESCE(p.role, 'no profile') as role,
  COUNT(*) as count
FROM auth.users u
LEFT JOIN user_profiles p ON u.id = p.id
GROUP BY p.role;
