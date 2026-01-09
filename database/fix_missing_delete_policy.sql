-- FIX: Allow deletion of orders
-- Run this script in the Supabase SQL Editor

-- 1. Orders Delete Policy
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON public.orders;

CREATE POLICY "Enable delete for authenticated users" 
ON public.orders FOR DELETE 
TO authenticated 
USING (true); -- Filter as needed, e.g. status='pending' or created_by=auth.uid()

-- 2. Verify Order Items Cascade (just in case)
-- This was in the previous script but ensuring it ran successfully is key
-- Order items should auto-delete when an order is deleted based on "ON DELETE CASCADE"

-- Add delete policy for other related tables if needed
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON public.order_items;
CREATE POLICY "Enable delete for authenticated users" ON public.order_items FOR DELETE TO authenticated USING (true);
