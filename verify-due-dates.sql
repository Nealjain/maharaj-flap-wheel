-- Run this in Supabase SQL Editor to verify due dates are saved

-- Check if due_date column exists and has data
SELECT 
  oi.order_id,
  oi.item_id,
  i.name as item_name,
  oi.quantity,
  oi.due_date,
  oi.delivered_quantity,
  o.created_at as order_created
FROM order_items oi
JOIN items i ON i.id = oi.item_id
JOIN orders o ON o.id = oi.order_id
ORDER BY o.created_at DESC
LIMIT 20;

-- Count items with due dates
SELECT 
  COUNT(*) as total_items,
  COUNT(due_date) as items_with_due_date,
  COUNT(*) - COUNT(due_date) as items_without_due_date
FROM order_items;

-- Show recent updates
SELECT 
  oi.order_id,
  i.name,
  oi.due_date,
  o.updated_at
FROM order_items oi
JOIN items i ON i.id = oi.item_id  
JOIN orders o ON o.id = oi.order_id
WHERE o.updated_at > NOW() - INTERVAL '1 hour'
ORDER BY o.updated_at DESC;
