-- Run this in your Supabase SQL Editor to add the due_date column

-- Add due_date column to order_items table
ALTER TABLE order_items 
ADD COLUMN IF NOT EXISTS due_date DATE;

-- Verify the column was added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'order_items' 
AND column_name = 'due_date';
