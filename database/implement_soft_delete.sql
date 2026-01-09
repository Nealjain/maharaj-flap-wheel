-- SOFT DELETE IMPLEMENTATION
-- Run this in Supabase SQL Editor

-- 1. Add deleted_at column to Master Tables
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS deleted_at timestamp with time zone;
ALTER TABLE public.transport_companies ADD COLUMN IF NOT EXISTS deleted_at timestamp with time zone;
ALTER TABLE public.items ADD COLUMN IF NOT EXISTS deleted_at timestamp with time zone;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS deleted_at timestamp with time zone;

-- 2. Create Indexes for performance (since we'll query 'where deleted_at is null' often)
CREATE INDEX IF NOT EXISTS idx_companies_deleted_at ON public.companies(deleted_at);
CREATE INDEX IF NOT EXISTS idx_transport_companies_deleted_at ON public.transport_companies(deleted_at);
CREATE INDEX IF NOT EXISTS idx_items_deleted_at ON public.items(deleted_at);
CREATE INDEX IF NOT EXISTS idx_orders_deleted_at ON public.orders(deleted_at);

-- 3. (Optional) Setup pg_cron to auto-delete after 30 days
-- NOTE: This requires the pg_cron extension to be enabled in Supabase Dashboard (Database > Extensions)
-- If you cannot enable pg_cron, you can run the CLEANUP commands manually or via an Edge Function.

/*
CREATE EXTENSION IF NOT EXISTS pg_cron;

SELECT cron.schedule(
  'cleanup-deleted-records', -- name of the cron job
  '0 0 * * *', -- runs every day at midnight
  $$ 
    DELETE FROM public.companies WHERE deleted_at < NOW() - INTERVAL '30 days';
    DELETE FROM public.transport_companies WHERE deleted_at < NOW() - INTERVAL '30 days';
    DELETE FROM public.items WHERE deleted_at < NOW() - INTERVAL '30 days';
    DELETE FROM public.orders WHERE deleted_at < NOW() - INTERVAL '30 days';
  $$
);
*/

-- 4. Create a Cleanup Function (Manual alternative)
CREATE OR REPLACE FUNCTION public.cleanup_deleted_records()
RETURNS void AS $$
BEGIN
    DELETE FROM public.companies WHERE deleted_at < NOW() - INTERVAL '30 days';
    DELETE FROM public.transport_companies WHERE deleted_at < NOW() - INTERVAL '30 days';
    DELETE FROM public.items WHERE deleted_at < NOW() - INTERVAL '30 days';
    DELETE FROM public.orders WHERE deleted_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
