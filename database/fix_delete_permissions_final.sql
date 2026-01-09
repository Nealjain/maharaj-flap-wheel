-- FINAL PERMISSIONS FIX: Re-runnable script to fix ALL DELETE permissions
-- Run this ENTIRE SCRIPT in the Supabase SQL Editor.

-- 1. COMPANIES
-- Enable RLS just in case
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
-- Drop existing delete policy if any (to avoid conflict)
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON public.companies;
-- Create the delete policy
CREATE POLICY "Enable delete for authenticated users" 
ON public.companies FOR DELETE 
TO authenticated 
USING (true);

-- 2. TRANSPORT COMPANIES
ALTER TABLE public.transport_companies ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON public.transport_companies;
CREATE POLICY "Enable delete for authenticated users" 
ON public.transport_companies FOR DELETE 
TO authenticated 
USING (true);

-- 3. ITEMS
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON public.items;
CREATE POLICY "Enable delete for authenticated users" 
ON public.items FOR DELETE 
TO authenticated 
USING (true);

-- 4. ORDERS
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON public.orders;
CREATE POLICY "Enable delete for authenticated users" 
ON public.orders FOR DELETE 
TO authenticated 
USING (true);

-- 5. ORDER ITEMS
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON public.order_items;
CREATE POLICY "Enable delete for authenticated users" 
ON public.order_items FOR DELETE 
TO authenticated 
USING (true);

-- 6. Grant Permissions (Safety Net for Postgres Roles)
GRANT DELETE ON public.companies TO authenticated;
GRANT DELETE ON public.transport_companies TO authenticated;
GRANT DELETE ON public.items TO authenticated;
GRANT DELETE ON public.orders TO authenticated;
GRANT DELETE ON public.order_items TO authenticated;
GRANT DELETE ON public.companies TO service_role;
GRANT DELETE ON public.transport_companies TO service_role;
GRANT DELETE ON public.items TO service_role;
GRANT DELETE ON public.orders TO service_role;
GRANT DELETE ON public.order_items TO service_role;
