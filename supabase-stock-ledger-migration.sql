-- Migration: Add stock ledger and custom units support
-- Run this in Supabase SQL Editor

-- 1. Add custom_unit column to items table (for custom units like "Rolls", etc.)
ALTER TABLE items ADD COLUMN IF NOT EXISTS custom_unit TEXT;

-- 2. Create stock_ledger table for tracking stock movements
CREATE TABLE IF NOT EXISTS stock_ledger (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  item_id UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('addition', 'removal', 'adjustment', 'order_reserved', 'order_delivered', 'order_cancelled')),
  quantity INTEGER NOT NULL,
  balance_after INTEGER NOT NULL,
  reference_type TEXT,
  reference_id UUID,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 3. Add delivered_quantity column to order_items if not exists
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS delivered_quantity INTEGER NOT NULL DEFAULT 0 CHECK (delivered_quantity >= 0);

-- 4. Remove stock constraints to allow negative stock
ALTER TABLE items DROP CONSTRAINT IF EXISTS items_physical_stock_check;
ALTER TABLE items DROP CONSTRAINT IF EXISTS items_reserved_stock_check;

-- Add new constraints that allow negative values
ALTER TABLE items ADD CONSTRAINT items_physical_stock_check CHECK (physical_stock >= -999999);
ALTER TABLE items ADD CONSTRAINT items_reserved_stock_check CHECK (reserved_stock >= 0);

-- 5. Create indexes for stock_ledger
CREATE INDEX IF NOT EXISTS idx_stock_ledger_item_id ON stock_ledger(item_id);
CREATE INDEX IF NOT EXISTS idx_stock_ledger_created_at ON stock_ledger(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_stock_ledger_transaction_type ON stock_ledger(transaction_type);

-- 6. Enable RLS on stock_ledger
ALTER TABLE stock_ledger ENABLE ROW LEVEL SECURITY;

-- 7. RLS Policies for stock_ledger
CREATE POLICY "Authenticated users can view stock ledger" ON stock_ledger
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert stock ledger" ON stock_ledger
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- 8. Create function to add stock with ledger entry
CREATE OR REPLACE FUNCTION add_stock_with_ledger(
  p_item_id UUID,
  p_quantity INTEGER,
  p_notes TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_new_stock INTEGER;
  v_ledger_id UUID;
BEGIN
  -- Update physical stock
  UPDATE items 
  SET physical_stock = physical_stock + p_quantity,
      updated_at = NOW()
  WHERE id = p_item_id
  RETURNING physical_stock INTO v_new_stock;

  -- Create ledger entry
  INSERT INTO stock_ledger (
    item_id,
    transaction_type,
    quantity,
    balance_after,
    notes,
    created_by
  ) VALUES (
    p_item_id,
    'addition',
    p_quantity,
    v_new_stock,
    p_notes,
    auth.uid()
  ) RETURNING id INTO v_ledger_id;

  RETURN jsonb_build_object(
    'success', true,
    'new_stock', v_new_stock,
    'ledger_id', v_ledger_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Create function to update delivery quantities (fixes RLS issue)
CREATE OR REPLACE FUNCTION update_delivery_quantities(
  p_order_id UUID,
  p_deliveries JSONB
)
RETURNS JSONB AS $$
DECLARE
  v_item_id UUID;
  v_delivered_qty INTEGER;
  v_key TEXT;
BEGIN
  -- Loop through each item in the deliveries object
  FOR v_key IN SELECT jsonb_object_keys(p_deliveries)
  LOOP
    v_item_id := v_key::UUID;
    v_delivered_qty := (p_deliveries->>v_key)::INTEGER;
    
    -- Update the order_items table
    UPDATE order_items
    SET delivered_quantity = v_delivered_qty
    WHERE order_id = p_order_id AND item_id = v_item_id;
    
    -- Create ledger entry
    INSERT INTO stock_ledger (
      item_id,
      transaction_type,
      quantity,
      balance_after,
      reference_type,
      reference_id,
      notes,
      created_by
    )
    SELECT 
      v_item_id,
      'order_delivered',
      v_delivered_qty,
      (SELECT physical_stock FROM items WHERE id = v_item_id),
      'order',
      p_order_id,
      'Partial delivery recorded',
      auth.uid();
  END LOOP;

  RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. Create view for stock ledger with item details
CREATE OR REPLACE VIEW stock_ledger_view AS
SELECT 
  sl.id,
  sl.item_id,
  i.sku,
  i.name as item_name,
  i.unit,
  i.custom_unit,
  sl.transaction_type,
  sl.quantity,
  sl.balance_after,
  sl.reference_type,
  sl.reference_id,
  sl.notes,
  sl.created_by,
  up.full_name as created_by_name,
  sl.created_at
FROM stock_ledger sl
JOIN items i ON sl.item_id = i.id
LEFT JOIN user_profiles up ON sl.created_by = up.id
ORDER BY sl.created_at DESC;

-- Grant access to the view
GRANT SELECT ON stock_ledger_view TO authenticated;

COMMENT ON TABLE stock_ledger IS 'Tracks all stock movements with date-wise history';
COMMENT ON COLUMN items.custom_unit IS 'Custom unit name if standard units are not suitable (e.g., Rolls, Bundles)';
COMMENT ON FUNCTION add_stock_with_ledger IS 'Adds stock to an item and creates a ledger entry';
COMMENT ON FUNCTION update_delivery_quantities IS 'Updates delivery quantities for order items (bypasses RLS)';
