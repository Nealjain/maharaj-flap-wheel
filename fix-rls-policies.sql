-- Fix RLS Policies for order_items
-- Run this in your Supabase SQL Editor

-- Drop existing policies
DROP POLICY IF EXISTS "Authenticated users can view order items" ON order_items;
DROP POLICY IF EXISTS "Authenticated users can insert order items" ON order_items;
DROP POLICY IF EXISTS "Authenticated users can update order items" ON order_items;
DROP POLICY IF EXISTS "Authenticated users can delete order items" ON order_items;

-- Recreate policies with proper permissions
CREATE POLICY "Authenticated users can view order items" ON order_items
  FOR SELECT 
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert order items" ON order_items
  FOR INSERT 
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update order items" ON order_items
  FOR UPDATE 
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete order items" ON order_items
  FOR DELETE 
  USING (auth.role() = 'authenticated');

-- Verify policies are created
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE tablename = 'order_items'
ORDER BY policyname;
