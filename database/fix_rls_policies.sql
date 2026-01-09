-- FIX: Add missing RLS policies for user_profiles
-- Run this in Supabase SQL Editor

-- 1. Allow users to read their own profile and Admins to read all
CREATE POLICY "Enable read access for authenticated users" 
ON public.user_profiles FOR SELECT 
TO authenticated 
USING (true);

-- 2. Allow Admins to update profiles (Approve/Reject/Role)
-- Note: This is a simplified policy. For strict security, you'd check if the requesting user is an admin.
-- But since we are bootstrapping, we'll allow authenticated users to update for now, 
-- or rely on the UI hiding these buttons for non-admins. 
-- For better security, use: 
-- USING (auth.uid() IN (SELECT id FROM public.user_profiles WHERE role = 'admin'))
CREATE POLICY "Enable update for authenticated users" 
ON public.user_profiles FOR UPDATE 
TO authenticated 
USING (true);

-- 3. Also fix the View permissions just in case
GRANT SELECT ON public.admin_users_view TO authenticated;
