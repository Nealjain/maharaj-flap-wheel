-- Add delivered_quantity column to order_items table
-- This allows tracking partial deliveries

ALTER TABLE order_items 
ADD COLUMN IF NOT EXISTS delivered_quantity INTEGER NOT NULL DEFAULT 0 CHECK (delivered_quantity >= 0);

-- Add comment to explain the column
COMMENT ON COLUMN order_items.delivered_quantity IS 'Number of items delivered so far (for partial deliveries)';

-- Ensure all existing rows have delivered_quantity = 0
UPDATE order_items 
SET delivered_quantity = 0 
WHERE delivered_quantity IS NULL;
