# Testing Due Date Feature

## 1. Verify Database Column Exists

Run this in Supabase SQL Editor:

```sql
-- Check if due_date column exists
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'order_items' 
AND column_name = 'due_date';

-- Check existing data
SELECT order_id, item_id, quantity, due_date 
FROM order_items 
WHERE due_date IS NOT NULL
LIMIT 10;
```

## 2. Test Creating Order with Due Date

1. Go to Create Order page
2. Add an item
3. Set a due date
4. Create the order
5. Check browser console for: "Order data:" - should show due_date
6. Check Supabase order_items table - should have due_date value

## 3. Test Editing Order Due Date

1. Open an existing order
2. Click "Edit Order"
3. Change the due date
4. Check browser console for:
   - "Updating due date for item: [id] to: [date]"
   - "Items to insert with due dates: [...]"
5. Click "Update Order"
6. Check Supabase order_items table - should show updated due_date

## 4. Test Viewing Due Dates

### Desktop:
- Due date should appear in separate column

### Mobile:
- Due date should appear under item name
- Color coded: Red (overdue), Orange (due soon), Blue (normal)

## 5. If Due Dates Not Saving

Run this SQL to add the column:

```sql
ALTER TABLE order_items 
ADD COLUMN IF NOT EXISTS due_date DATE;
```

Then test again.
