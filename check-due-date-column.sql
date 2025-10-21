-- Run this in Supabase SQL Editor to check and fix the due_date column

-- Step 1: Check if column exists
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public'
AND table_name = 'order_items' 
AND column_name = 'due_date';

-- Step 2: If the above returns no rows, add the column
ALTER TABLE order_items 
ADD COLUMN IF NOT EXISTS due_date DATE;

-- Step 3: Verify it was added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'order_items' 
ORDER BY ordinal_position;

-- Step 4: Check if any data exists
SELECT order_id, item_id, quantity, due_date, created_at
FROM order_items 
ORDER BY created_at DESC
LIMIT 5;
