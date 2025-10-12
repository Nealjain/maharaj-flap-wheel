# Database Migration Instructions

## Add Partial Delivery Support

To enable partial delivery tracking, you need to add the `delivered_quantity` column to the `order_items` table.

### Steps:

1. Go to your Supabase Dashboard
2. Navigate to the SQL Editor
3. Copy the contents of `supabase-migration-add-delivered-quantity.sql`
4. Paste it into the SQL Editor
5. Click "Run" to execute the migration

### What this does:

- Adds a `delivered_quantity` column to track how many items have been delivered
- Sets default value to 0 for all existing and new records
- Adds a check constraint to ensure the value is never negative
- Updates all existing order items to have delivered_quantity = 0

### After running the migration:

The partial delivery feature will work correctly, allowing you to:
- Track deliveries in increments (e.g., 50 of 100 items delivered)
- View delivery progress on order details
- Record multiple partial deliveries until the order is complete
