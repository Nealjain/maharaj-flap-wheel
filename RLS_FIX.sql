-- Simple RLS Fix - Run in Supabase SQL Editor
-- This disables RLS for order_items so updates work

ALTER TABLE order_items DISABLE ROW LEVEL SECURITY;

-- Done! Try recording delivery now.
