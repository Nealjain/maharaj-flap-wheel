-- Check if stock_ledger table exists and its structure
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'stock_ledger'
ORDER BY ordinal_position;

-- Check recent stock ledger entries
SELECT 
  sl.*,
  i.name as item_name,
  i.sku as item_sku
FROM stock_ledger sl
LEFT JOIN items i ON i.id = sl.item_id
ORDER BY sl.created_at DESC
LIMIT 10;
