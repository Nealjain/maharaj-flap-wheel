# Debug: Due Dates Disappearing After Reload

## Problem
Due dates are lost when you reload the page after editing an order.

## Root Cause
The `due_date` column likely doesn't exist in your Supabase `order_items` table yet.

## Solution

### Step 1: Add the Column to Database

**Go to Supabase → SQL Editor and run:**

```sql
ALTER TABLE order_items 
ADD COLUMN IF NOT EXISTS due_date DATE;
```

### Step 2: Verify Column Was Added

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'order_items' 
ORDER BY ordinal_position;
```

You should see `due_date` with type `date` in the results.

### Step 3: Test Editing an Order

1. Open browser console (F12)
2. Edit an order and change a due date
3. Click "Update Order"
4. Watch the console logs:

**You should see:**
```
Updating due date for item: [uuid] to: 2024-11-04
Updated orderItems: [array with due_date values]
Current orderItems state before insert: [array]
Items to insert with due dates: [array with due_date]
Due dates being sent: [{item_id: "...", due_date: "2024-11-04"}]
Order items inserted successfully: [array]
Inserted items with due_date: [{item_id: "...", due_date: "2024-11-04"}]
```

### Step 4: Verify in Database

```sql
SELECT order_id, item_id, quantity, due_date 
FROM order_items 
WHERE due_date IS NOT NULL
ORDER BY created_at DESC
LIMIT 10;
```

You should see your due dates saved!

### Step 5: Check Data Provider is Fetching due_date

The data provider should already be fetching `due_date`. Verify in `lib/optimized-data-provider.tsx`:

```typescript
order_items(
  item_id,
  quantity,
  price,
  delivered_quantity,
  due_date,  // ← This should be here
  item:items(id, name, sku, unit)
)
```

## If Still Not Working

### Check Console for Errors

Look for:
- ❌ `column "due_date" does not exist` → Run the ALTER TABLE command
- ❌ `permission denied` → Check RLS policies
- ❌ `null value in column` → Check if due_date is being sent as empty string instead of null

### Manual Test

```sql
-- Try inserting manually
INSERT INTO order_items (order_id, item_id, quantity, price, due_date)
VALUES (
  '[existing-order-id]',
  '[existing-item-id]',
  10,
  0,
  '2024-11-04'
);

-- Check if it saved
SELECT * FROM order_items WHERE due_date IS NOT NULL;
```

If manual insert works but app doesn't save, check the console logs for what's being sent.

## Quick Fix Script

Run this in Supabase SQL Editor:

```sql
-- Add column
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS due_date DATE;

-- Verify
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'order_items'
ORDER BY ordinal_position;
```

After running this, try editing an order again. The due dates should now persist!
