-- FIX: Allow deletion for ALL main tables
-- Run this script in the Supabase SQL Editor

-- ==========================================
-- 1. COMPANIES
-- ==========================================
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON public.companies;
CREATE POLICY "Enable delete for authenticated users" 
ON public.companies FOR DELETE 
TO authenticated 
USING (true);

-- ==========================================
-- 2. TRANSPORT COMPANIES
-- ==========================================
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON public.transport_companies;
CREATE POLICY "Enable delete for authenticated users" 
ON public.transport_companies FOR DELETE 
TO authenticated 
USING (true);

-- ==========================================
-- 3. ITEMS
-- ==========================================
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON public.items;
CREATE POLICY "Enable delete for authenticated users" 
ON public.items FOR DELETE 
TO authenticated 
USING (true);

-- ==========================================
-- 4. ORDERS (Reinforce)
-- ==========================================
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON public.orders;
CREATE POLICY "Enable delete for authenticated users" 
ON public.orders FOR DELETE 
TO authenticated 
USING (true);

-- ==========================================
-- 5. ORDER ITEMS (Reinforce)
-- ==========================================
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON public.order_items;
CREATE POLICY "Enable delete for authenticated users" 
ON public.order_items FOR DELETE 
TO authenticated 
USING (true);
