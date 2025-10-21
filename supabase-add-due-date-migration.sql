-- Add due_date column to orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS due_date DATE;

-- Add comment to the column
COMMENT ON COLUMN orders.due_date IS 'Expected delivery/completion date for the order';
