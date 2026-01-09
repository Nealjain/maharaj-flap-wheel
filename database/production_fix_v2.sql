-- PRODUCTION FIX V2
-- Run this script in the Supabase SQL Editor to fix Permissions (403) and potential Query Usage (400) errors.

-- ==========================================
-- 1. FIX RLS POLICIES (Fixes 403 Forbidden errors)
-- ==========================================

-- A. Companies
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.companies;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.companies;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.companies;

CREATE POLICY "Enable read access for authenticated users" ON public.companies FOR SELECT TO authenticated USING (true);
CREATE POLICY "Enable insert for authenticated users" ON public.companies FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Enable update for authenticated users" ON public.companies FOR UPDATE TO authenticated USING (true);

-- B. Transport Companies
ALTER TABLE public.transport_companies ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.transport_companies;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.transport_companies;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.transport_companies;

CREATE POLICY "Enable read access for authenticated users" ON public.transport_companies FOR SELECT TO authenticated USING (true);
CREATE POLICY "Enable insert for authenticated users" ON public.transport_companies FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Enable update for authenticated users" ON public.transport_companies FOR UPDATE TO authenticated USING (true);

-- C. Items
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.items;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.items;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.items;

CREATE POLICY "Enable read access for authenticated users" ON public.items FOR SELECT TO authenticated USING (true);
CREATE POLICY "Enable insert for authenticated users" ON public.items FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Enable update for authenticated users" ON public.items FOR UPDATE TO authenticated USING (true);

-- D. Orders
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.orders;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.orders;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.orders;

CREATE POLICY "Enable read access for authenticated users" ON public.orders FOR SELECT TO authenticated USING (true);
CREATE POLICY "Enable insert for authenticated users" ON public.orders FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Enable update for authenticated users" ON public.orders FOR UPDATE TO authenticated USING (true);

-- E. Order Items
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.order_items;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.order_items;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.order_items;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON public.order_items;

CREATE POLICY "Enable read access for authenticated users" ON public.order_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "Enable insert for authenticated users" ON public.order_items FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Enable update for authenticated users" ON public.order_items FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Enable delete for authenticated users" ON public.order_items FOR DELETE TO authenticated USING (true);


-- ==========================================
-- 2. ENSURE FOREIGN KEY NAMES (Fixes 400 Bad Request errors)
-- ==========================================
-- This section re-enforces the constraint names expected by the application code.
-- It attempts to drop existing constraints (by standard names or guessed names) and recreate them with the EXACT names the code relies on.

DO $$
BEGIN
    -- 1. Orders -> Companies
    -- Try to drop if different name exists or same name exists
    ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_company_id_fkey;
    -- Add it back with correct name
    ALTER TABLE public.orders ADD CONSTRAINT orders_company_id_fkey 
        FOREIGN KEY (company_id) REFERENCES public.companies(id);

    -- 2. Orders -> Transport Companies
    ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_transport_company_id_fkey;
    ALTER TABLE public.orders ADD CONSTRAINT orders_transport_company_id_fkey 
        FOREIGN KEY (transport_company_id) REFERENCES public.transport_companies(id);

    -- 3. Order Items -> Orders
    ALTER TABLE public.order_items DROP CONSTRAINT IF EXISTS order_items_order_id_fkey;
    ALTER TABLE public.order_items ADD CONSTRAINT order_items_order_id_fkey 
        FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;

    -- 4. Order Items -> Items
    ALTER TABLE public.order_items DROP CONSTRAINT IF EXISTS order_items_item_id_fkey;
    ALTER TABLE public.order_items ADD CONSTRAINT order_items_item_id_fkey 
        FOREIGN KEY (item_id) REFERENCES public.items(id);

EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Constraint update failed, manual check required: %', SQLERRM;
END $$;
