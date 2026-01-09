-- NUCLEAR PERMISSIONS FIX
-- Run this in Supabase SQL Editor if "Soft Delete" or "Updates" are failing.
-- This resets all policies to a simple "Allow Authenticated Users to do Everything" state.

-- 1. COMPANIES
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.companies;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.companies;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.companies;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.companies;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON public.companies;
-- Create ONE Clean Policy
CREATE POLICY "Enable all access for authenticated users" ON public.companies FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 2. ITEMS
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.items;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.items;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.items;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.items;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON public.items;
CREATE POLICY "Enable all access for authenticated users" ON public.items FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 3. TRANSPORT COMPANIES
ALTER TABLE public.transport_companies ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.transport_companies;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.transport_companies;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.transport_companies;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.transport_companies;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON public.transport_companies;
CREATE POLICY "Enable all access for authenticated users" ON public.transport_companies FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 4. ORDERS
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.orders;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.orders;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.orders;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.orders;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON public.orders;
CREATE POLICY "Enable all access for authenticated users" ON public.orders FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 5. ORDER ITEMS
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.order_items;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.order_items;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.order_items;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.order_items;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON public.order_items;
CREATE POLICY "Enable all access for authenticated users" ON public.order_items FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 6. GRANT POSTGRES PERMISSIONS (The final layer)
GRANT ALL ON public.companies TO authenticated;
GRANT ALL ON public.items TO authenticated;
GRANT ALL ON public.transport_companies TO authenticated;
GRANT ALL ON public.orders TO authenticated;
GRANT ALL ON public.order_items TO authenticated;

GRANT ALL ON public.companies TO service_role;
GRANT ALL ON public.items TO service_role;
GRANT ALL ON public.transport_companies TO service_role;
GRANT ALL ON public.orders TO service_role;
GRANT ALL ON public.order_items TO service_role;

-- 7. Ensure Sequences are accessible (for ID generation if serial) (Optional but good)
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO service_role;
