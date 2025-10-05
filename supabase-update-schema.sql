-- ============================================
-- Supabase Schema Update Script
-- Run this in your Supabase SQL Editor
-- ============================================

-- 1. Ensure delivered_quantity column exists with proper constraints
-- (Safe to run - uses IF NOT EXISTS)
ALTER TABLE public.order_items 
ADD COLUMN IF NOT EXISTS delivered_quantity INTEGER NOT NULL DEFAULT 0 CHECK (delivered_quantity >= 0);

-- Add comment to explain the column
COMMENT ON COLUMN public.order_items.delivered_quantity IS 'Number of items delivered so far (for partial deliveries)';

-- Ensure all existing rows have delivered_quantity = 0
UPDATE public.order_items 
SET delivered_quantity = 0 
WHERE delivered_quantity IS NULL;

-- 2. Verify audit_logs table has performed_by column
-- (This should already exist based on your schema)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'audit_logs' 
        AND column_name = 'performed_by'
    ) THEN
        ALTER TABLE public.audit_logs 
        ADD COLUMN performed_by UUID REFERENCES auth.users(id);
    END IF;
END $$;

-- 3. Verify login_activities table exists
-- (This should already exist based on your schema)
CREATE TABLE IF NOT EXISTS public.login_activities (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    ip INET,
    user_agent TEXT,
    success BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 4. Create indexes for better performance on activity queries
CREATE INDEX IF NOT EXISTS idx_audit_logs_performed_by ON public.audit_logs(performed_by);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at_desc ON public.audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_login_activities_user_id ON public.login_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_login_activities_created_at_desc ON public.login_activities(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_order_items_delivered_quantity ON public.order_items(delivered_quantity);

-- 5. Ensure RLS policies are set up correctly for audit_logs
-- Drop existing policies if they exist and recreate them
DROP POLICY IF EXISTS "Admins can view audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "System can insert audit logs" ON public.audit_logs;

CREATE POLICY "Admins can view audit logs" ON public.audit_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "System can insert audit logs" ON public.audit_logs
    FOR INSERT WITH CHECK (true);

-- 6. Ensure RLS policies are set up correctly for login_activities
DROP POLICY IF EXISTS "Admins can view login activities" ON public.login_activities;
DROP POLICY IF EXISTS "System can insert login activities" ON public.login_activities;

CREATE POLICY "Admins can view login activities" ON public.login_activities
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "System can insert login activities" ON public.login_activities
    FOR INSERT WITH CHECK (true);

-- 7. Enable RLS on tables if not already enabled
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.login_activities ENABLE ROW LEVEL SECURITY;

-- ============================================
-- Verification Queries (Optional - Run separately to check)
-- ============================================

-- Check if delivered_quantity column exists
-- SELECT column_name, data_type, is_nullable, column_default
-- FROM information_schema.columns
-- WHERE table_schema = 'public' 
-- AND table_name = 'order_items'
-- AND column_name = 'delivered_quantity';

-- Check if performed_by column exists in audit_logs
-- SELECT column_name, data_type, is_nullable
-- FROM information_schema.columns
-- WHERE table_schema = 'public' 
-- AND table_name = 'audit_logs'
-- AND column_name = 'performed_by';

-- Check indexes
-- SELECT indexname, indexdef
-- FROM pg_indexes
-- WHERE schemaname = 'public'
-- AND tablename IN ('audit_logs', 'login_activities', 'order_items')
-- ORDER BY tablename, indexname;

-- Check RLS policies
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
-- FROM pg_policies
-- WHERE schemaname = 'public'
-- AND tablename IN ('audit_logs', 'login_activities')
-- ORDER BY tablename, policyname;

-- ============================================
-- DONE! Your schema is now ready.
-- ============================================
