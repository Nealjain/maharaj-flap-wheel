-- insert-sample-data.sql
-- Run this in Supabase SQL Editor to populate your database with sample data.

DO $$
DECLARE
  v_company_id_1 uuid;
  v_company_id_2 uuid;
  v_transport_id_1 uuid;
  v_item_id_1 uuid;
  v_item_id_2 uuid;
  v_item_id_3 uuid;
  v_user_id uuid;
  v_order_id uuid;
BEGIN
  -- 1. Get a User ID (Pick the first available user)
  SELECT id INTO v_user_id FROM auth.users LIMIT 1;

  -- If no user exists, raise a notice and exit (or create a dummy one if you prefer, but usually users are created via Auth)
  IF v_user_id IS NULL THEN
    RAISE NOTICE 'No users found in auth.users. Please sign up at least one user first.';
    RETURN;
  END IF;

  -- 2. Insert Companies
  INSERT INTO public.companies (name, address, gst_number)
  VALUES ('Acme Corp', '123 Industrial Way, Mumbai', '27ABCDE1234F1Z5')
  RETURNING id INTO v_company_id_1;

  INSERT INTO public.companies (name, address, gst_number)
  VALUES ('Globex Industries', '456 Tech Park, Pune', '27FGHIJ5678K1Z9')
  RETURNING id INTO v_company_id_2;

  -- 3. Insert Transport Companies
  INSERT INTO public.transport_companies (name, phone, address)
  VALUES ('Speedy Transports', '9876543210', 'Mumbai Highway')
  RETURNING id INTO v_transport_id_1;

  INSERT INTO public.transport_companies (name, phone, address)
  VALUES ('Safe Keep Logistics', '8888888888', 'Pune Warehouse')
  ON CONFLICT DO NOTHING; -- Just in case

  -- 4. Insert Items
  INSERT INTO public.items (sku, name, description, unit, physical_stock, reserved_stock)
  VALUES ('FW-100', 'Flap Wheel 100mm', '100mm Flap Wheel Grit 60', 'pcs', 1000, 0)
  RETURNING id INTO v_item_id_1;

  INSERT INTO public.items (sku, name, description, unit, physical_stock, reserved_stock)
  VALUES ('FW-150', 'Flap Wheel 150mm', '150mm Flap Wheel Grit 80', 'pcs', 500, 0)
  RETURNING id INTO v_item_id_2;

  INSERT INTO public.items (sku, name, description, unit, physical_stock, reserved_stock)
  VALUES ('AB-DISC', 'Abrasive Disc', 'Premium Abrasive Disc', 'box', 200, 0)
  RETURNING id INTO v_item_id_3;

  -- 5. Insert an Order
  INSERT INTO public.orders (
    company_id,
    transport_company_id,
    created_by,
    status,
    notes,
    due_date
  )
  VALUES (
    v_company_id_1,
    v_transport_id_1,
    v_user_id,
    'pending',
    'Urgent delivery required',
    CURRENT_DATE + INTERVAL '7 days'
  )
  RETURNING id INTO v_order_id;

  -- 6. Insert Order Items
  -- Item 1: 100 qty
  INSERT INTO public.order_items (order_id, item_id, quantity, delivered_quantity, price)
  VALUES (v_order_id, v_item_id_1, 100, 0, 50.00);

  -- Item 2: 50 qty
  INSERT INTO public.order_items (order_id, item_id, quantity, delivered_quantity, price)
  VALUES (v_order_id, v_item_id_2, 50, 0, 75.50);

  -- 7. Update Reserved Stock for Items (Simulating Logic)
  UPDATE public.items SET reserved_stock = reserved_stock + 100 WHERE id = v_item_id_1;
  UPDATE public.items SET reserved_stock = reserved_stock + 50 WHERE id = v_item_id_2;

  -- 8. Add entries to Stock Ledger (Initial Stock + Order Reservation)
  -- Initial Stock
  INSERT INTO public.stock_ledger (item_id, transaction_type, quantity, balance_after, notes, created_by)
  VALUES 
    (v_item_id_1, 'addition', 1000, 1000, 'Opening Stock', v_user_id),
    (v_item_id_2, 'addition', 500, 500, 'Opening Stock', v_user_id),
    (v_item_id_3, 'addition', 200, 200, 'Opening Stock', v_user_id);
    
  -- Order Reservation
  INSERT INTO public.stock_ledger (item_id, transaction_type, quantity, balance_after, reference_type, reference_id, notes, created_by)
  VALUES 
    (v_item_id_1, 'order_pending', -100, 1000, 'orders', v_order_id, 'Reserved for Order', v_user_id),
    (v_item_id_2, 'order_pending', -50, 500, 'orders', v_order_id, 'Reserved for Order', v_user_id);

  RAISE NOTICE 'Sample data inserted successfully!';
END $$;
