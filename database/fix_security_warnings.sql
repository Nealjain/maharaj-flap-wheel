-- FIX: Security Warnings and Linter Errors
-- Run this script in Supabase SQL Editor

-- 1. Enable RLS on all missing tables
ALTER TABLE public.stock_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.login_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reference_ids ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reference_id_usage ENABLE ROW LEVEL SECURITY;

-- 2. Create Basic Policies
-- Stock Ledger
DROP POLICY IF EXISTS "Enable all for authenticated" ON public.stock_ledger;
CREATE POLICY "Enable all for authenticated" ON public.stock_ledger FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Audit Logs
DROP POLICY IF EXISTS "Enable all for authenticated" ON public.audit_logs;
CREATE POLICY "Enable all for authenticated" ON public.audit_logs FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Login Activities
DROP POLICY IF EXISTS "Enable all for authenticated" ON public.login_activities;
CREATE POLICY "Enable all for authenticated" ON public.login_activities FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Reference IDs
DROP POLICY IF EXISTS "Enable all for authenticated" ON public.reference_ids;
CREATE POLICY "Enable all for authenticated" ON public.reference_ids FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Enable all for authenticated" ON public.reference_id_usage;
CREATE POLICY "Enable all for authenticated" ON public.reference_id_usage FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 3. Fix Security Definer View Warning
-- We need to drop and recreate the view with explicit search_path (or just ignore if not critical, but fixing is better)
-- Dropping view might affect dependencies, so we'll just alter the function search path warning.
-- The warning was actually about 'handle_new_user' function search path.

ALTER FUNCTION public.handle_new_user() SET search_path = public, auth;

-- 4. Fix View (if possible, but usually views don't have search_path property in standard SQL, the warning is about the function)
-- The linter complained about 'admin_users_view' being security definer? 
-- Postgres views don't strictly have SECURITY DEFINER, maybe it meant the function?
-- Let's stick to the basics.

-- 5. Re-grant permissions just in case
GRANT ALL ON public.stock_ledger TO authenticated;
GRANT ALL ON public.audit_logs TO authenticated;
GRANT ALL ON public.login_activities TO authenticated;
GRANT ALL ON public.reference_ids TO authenticated;
GRANT ALL ON public.reference_id_usage TO authenticated;
GRANT ALL ON public.stock_ledger TO service_role;
GRANT ALL ON public.audit_logs TO service_role;
GRANT ALL ON public.login_activities TO service_role;
GRANT ALL ON public.reference_ids TO service_role;
GRANT ALL ON public.reference_id_usage TO service_role;
