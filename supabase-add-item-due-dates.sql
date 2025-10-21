-- Add due_date column to order_items table
ALTER TABLE order_items 
ADD COLUMN IF NOT EXISTS due_date DATE;

-- Add comment to explain the column
COMMENT ON COLUMN order_items.due_date IS 'Expected delivery/due date for this specific item in the order';

-- Create index for better query performance on due dates
CREATE INDEX IF NOT EXISTS idx_order_items_due_date ON order_items(due_date);
