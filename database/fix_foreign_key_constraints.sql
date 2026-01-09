-- FIX: Enable Cascade Delete for Foreign Key Constraints
-- Run this script in the Supabase SQL Editor.

-- This script modifies foreign key constraints to allow deletion of parent records (Items, Companies, etc.)
-- by automatically deleting related child records (Stock Ledger, Order Items, etc.).

-- ==========================================
-- 1. STOCK LEDGER -> ITEMS
-- ==========================================
-- Drop the existing constraint
ALTER TABLE public.stock_ledger
DROP CONSTRAINT IF EXISTS stock_ledger_item_id_fkey;

-- Re-add with ON DELETE CASCADE
ALTER TABLE public.stock_ledger
ADD CONSTRAINT stock_ledger_item_id_fkey
FOREIGN KEY (item_id)
REFERENCES public.items(id)
ON DELETE CASCADE;

-- ==========================================
-- 2. ORDER ITEMS -> ITEMS
-- ==========================================
-- If we delete an Item, we should probably delete it from Order Items too
ALTER TABLE public.order_items
DROP CONSTRAINT IF EXISTS order_items_item_id_fkey;

ALTER TABLE public.order_items
ADD CONSTRAINT order_items_item_id_fkey
FOREIGN KEY (item_id)
REFERENCES public.items(id)
ON DELETE CASCADE;

-- ==========================================
-- 3. ORDERS -> COMPANIES
-- ==========================================
-- If we delete a Company, delete all its orders
ALTER TABLE public.orders
DROP CONSTRAINT IF EXISTS orders_company_id_fkey;

ALTER TABLE public.orders
ADD CONSTRAINT orders_company_id_fkey
FOREIGN KEY (company_id)
REFERENCES public.companies(id)
ON DELETE CASCADE;

-- ==========================================
-- 4. ORDERS -> TRANSPORT COMPANIES
-- ==========================================
-- If we delete a Transport Company, set the field to NULL instead of deleting the order?
-- Or delete the order? Let's assume delete for consistency with request, or SET NULL to keep order history.
-- Usually SET NULL is safer for transport companies.
ALTER TABLE public.orders
DROP CONSTRAINT IF EXISTS orders_transport_company_id_fkey;

ALTER TABLE public.orders
ADD CONSTRAINT orders_transport_company_id_fkey
FOREIGN KEY (transport_company_id)
REFERENCES public.transport_companies(id)
ON DELETE SET NULL;
