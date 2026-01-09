-- WARNING: THIS ACTION WILL DESTROY ALL DATA IN THE PUBLIC SCHEMA
-- ENABLE/CREATE EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. CLEANUP
DROP TABLE IF EXISTS public.stock_ledger CASCADE;
DROP TABLE IF EXISTS public.order_items CASCADE;
DROP TABLE IF EXISTS public.orders CASCADE;
DROP TABLE IF EXISTS public.items CASCADE;
DROP TABLE IF EXISTS public.transport_companies CASCADE;
DROP TABLE IF EXISTS public.companies CASCADE;
DROP TABLE IF EXISTS public.reference_id_usage CASCADE;
DROP TABLE IF EXISTS public.reference_ids CASCADE;
DROP TABLE IF EXISTS public.user_profiles CASCADE;
DROP TABLE IF EXISTS public.login_activities CASCADE;
DROP TABLE IF EXISTS public.audit_logs CASCADE;

-- CLEAR AUTH USERS
-- WARNING: This deletes all registered users from the authentication system
TRUNCATE TABLE auth.users CASCADE;

-- Drop Enums if they exist to start fresh
DROP TYPE IF EXISTS user_role;

-- 2. ENUMS
CREATE TYPE user_role AS ENUM ('admin', 'manager', 'staff');

-- 3. TABLES

-- User Profiles (Extends auth.users)
CREATE TABLE public.user_profiles (
  id uuid NOT NULL,
  email text NOT NULL,
  full_name text,
  phone text,
  role user_role NOT NULL DEFAULT 'staff',
  status text DEFAULT 'pending'::text CHECK (status IN ('pending', 'approved', 'rejected', 'disabled')),
  approved_by uuid,
  approved_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT user_profiles_pkey PRIMARY KEY (id),
  CONSTRAINT user_profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT user_profiles_email_key UNIQUE (email)
);

-- Companies (Customers)
CREATE TABLE public.companies (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  address text,
  gst_number text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT companies_pkey PRIMARY KEY (id),
  CONSTRAINT companies_name_key UNIQUE (name)
);

-- Transport Companies
CREATE TABLE public.transport_companies (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  address text,
  phone text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT transport_companies_pkey PRIMARY KEY (id),
  CONSTRAINT transport_companies_name_key UNIQUE (name)
);

-- Items (Inventory)
CREATE TABLE public.items (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  sku text NOT NULL,
  name text NOT NULL,
  description text,
  unit text NOT NULL DEFAULT 'pcs',
  custom_unit text,
  physical_stock integer NOT NULL DEFAULT 0,
  reserved_stock integer NOT NULL DEFAULT 0 CHECK (reserved_stock >= 0),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT items_pkey PRIMARY KEY (id),
  CONSTRAINT items_sku_key UNIQUE (sku),
  CONSTRAINT physical_stock_check CHECK (physical_stock >= -999999)
);

-- Orders
CREATE TABLE public.orders (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  company_id uuid NOT NULL,
  transport_company_id uuid,
  created_by uuid NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled')),
  notes text,
  due_date date,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT orders_pkey PRIMARY KEY (id),
  CONSTRAINT orders_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id),
  CONSTRAINT orders_transport_company_id_fkey FOREIGN KEY (transport_company_id) REFERENCES public.transport_companies(id),
  CONSTRAINT orders_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id)
);

-- Order Items
CREATE TABLE public.order_items (
  order_id uuid NOT NULL,
  item_id uuid NOT NULL,
  quantity integer NOT NULL CHECK (quantity > 0),
  delivered_quantity integer NOT NULL DEFAULT 0 CHECK (delivered_quantity >= 0),
  price numeric DEFAULT 0,
  CONSTRAINT order_items_pkey PRIMARY KEY (order_id, item_id),
  CONSTRAINT order_items_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE,
  CONSTRAINT order_items_item_id_fkey FOREIGN KEY (item_id) REFERENCES public.items(id)
);

-- Stock Ledger (Audit Trail for Inventory)
CREATE TABLE public.stock_ledger (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  item_id uuid NOT NULL,
  transaction_type text NOT NULL CHECK (transaction_type IN ('addition', 'removal', 'adjustment', 'order_pending', 'order_delivered', 'order_cancelled')),
  quantity integer NOT NULL,
  balance_after integer NOT NULL,
  reference_type text,
  reference_id uuid,
  notes text,
  created_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT stock_ledger_pkey PRIMARY KEY (id),
  CONSTRAINT stock_ledger_item_id_fkey FOREIGN KEY (item_id) REFERENCES public.items(id),
  CONSTRAINT stock_ledger_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id)
);

-- Reference IDs (for specific workflows if needed)
CREATE TABLE public.reference_ids (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  reference_code text NOT NULL,
  created_by uuid NOT NULL,
  valid_from timestamp with time zone NOT NULL DEFAULT now(),
  valid_until timestamp with time zone NOT NULL,
  max_uses integer NOT NULL DEFAULT 1,
  current_uses integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'exhausted', 'revoked')),
  allowed_role text NOT NULL DEFAULT 'staff',
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT reference_ids_pkey PRIMARY KEY (id),
  CONSTRAINT reference_ids_reference_code_key UNIQUE (reference_code),
  CONSTRAINT reference_ids_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id)
);

CREATE TABLE public.reference_id_usage (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  reference_id uuid NOT NULL,
  user_id uuid NOT NULL,
  used_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT reference_id_usage_pkey PRIMARY KEY (id),
  CONSTRAINT reference_id_usage_reference_id_fkey FOREIGN KEY (reference_id) REFERENCES public.reference_ids(id),
  CONSTRAINT reference_id_usage_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);

-- Logs
CREATE TABLE public.audit_logs (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  event_type text NOT NULL,
  entity text NOT NULL,
  entity_id uuid,
  performed_by uuid,
  payload jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT audit_logs_pkey PRIMARY KEY (id)
);

CREATE TABLE public.login_activities (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  user_id uuid NOT NULL,
  ip inet,
  user_agent text,
  success boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT login_activities_pkey PRIMARY KEY (id),
  CONSTRAINT login_activities_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- 4. INDEXES (Optimization)
CREATE INDEX idx_user_profiles_email ON public.user_profiles(email);
CREATE INDEX idx_user_profiles_status ON public.user_profiles(status);
CREATE INDEX idx_items_sku ON public.items(sku);
CREATE INDEX idx_companies_name ON public.companies(name);
CREATE INDEX idx_orders_company ON public.orders(company_id);
CREATE INDEX idx_orders_status ON public.orders(status);
CREATE INDEX idx_stock_ledger_item ON public.stock_ledger(item_id);
CREATE INDEX idx_stock_ledger_date ON public.stock_ledger(created_at DESC);

-- 5. FUNCTION & TRIGGER to create User Profile on Signup (Safety net)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, full_name, phone, role, status)
  VALUES (
    new.id, 
    new.email, 
    new.raw_user_meta_data->>'full_name', 
    new.raw_user_meta_data->>'phone',
    'staff', 
    'pending'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger only if it doesn't exist (Drop to be safe)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 6. RLS Policies (Basic Setup - Enable RLS on all tables)
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Allow users to read profiles (Essential for auth check)
CREATE POLICY "Enable read access for authenticated users" ON public.user_profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Enable update for authenticated users" ON public.user_profiles FOR UPDATE TO authenticated USING (true);

-- Allow public read for now (you should lock this down later)
CREATE POLICY "Enable read access for authenticated users" ON public.companies FOR SELECT TO authenticated USING (true);
CREATE POLICY "Enable read access for authenticated users" ON public.items FOR SELECT TO authenticated USING (true);
-- Add more specific policies as needed

-- 7. VIEWS
CREATE OR REPLACE VIEW public.admin_users_view AS 
SELECT 
  u.*, 
  (SELECT created_at FROM public.login_activities WHERE user_id = u.id ORDER BY created_at DESC LIMIT 1) as last_sign_in_at 
FROM public.user_profiles u;

-- Grant access to view
GRANT SELECT ON public.admin_users_view TO authenticated;


