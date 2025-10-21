# Item-wise Due Date Feature

## Overview
Added support for item-wise due dates in orders. Each item in an order can now have its own due date, which can be set during order creation and updated when editing orders.

## Database Changes

### Migration Required
Run the following SQL migration in your Supabase SQL Editor:

```sql
-- File: supabase-add-item-due-dates.sql
ALTER TABLE order_items 
ADD COLUMN IF NOT EXISTS due_date DATE;

COMMENT ON COLUMN order_items.due_date IS 'Expected delivery/due date for this specific item in the order';

CREATE INDEX IF NOT EXISTS idx_order_items_due_date ON order_items(due_date);
```

## Features Implemented

### 1. Order Detail Page (`app/orders/[id]/page.tsx`)
- **Due Date Column**: Added a new "Due Date" column in the order items table
- **Visual Indicators**:
  - Overdue items (past due date with pending quantity) are highlighted in red
  - Items due soon (within 3 days) are highlighted in orange
  - Regular due dates are shown in gray
- **Responsive Design**: Due dates are shown inline on mobile devices

### 2. Edit Order Page (`app/orders/[id]/edit/page.tsx`)
- **Due Date Input**: Added date picker for each order item
- **Preserve Data**: Due dates are preserved when editing orders
- **Improved Layout**: Reorganized item cards to accommodate the new due date field
- **Grid Layout**: Uses responsive grid for better organization of quantity, price, and due date fields

### 3. Create Order Page (`app/orders/create/page.tsx`)
- **Due Date Support**: Already had due date support implemented
- **Optional Field**: Due date is optional when creating orders

## Usage

### Creating an Order with Due Dates
1. Navigate to "Create Order"
2. Select company and add items
3. For each item, optionally set a due date using the date picker
4. Submit the order

### Viewing Due Dates
1. Open any order detail page
2. The "Due Date" column shows each item's due date
3. Overdue items are highlighted in red
4. Items due within 3 days are highlighted in orange

### Editing Due Dates
1. Open an order and click "Edit Order"
2. Each item card has a "Due Date" field
3. Update the due date using the date picker
4. Save the order to update all changes

## Technical Details

### Data Structure
```typescript
interface OrderItem {
  order_id: string
  item_id: string
  quantity: number
  price: number
  delivered_quantity: number
  due_date?: string  // ISO date string (YYYY-MM-DD)
}
```

### Visual Indicators Logic
- **Overdue**: `due_date < today AND pending_quantity > 0`
- **Due Soon**: `due_date <= today + 3 days AND pending_quantity > 0`
- **Normal**: All other cases

## Benefits

1. **Better Planning**: Track individual item delivery expectations
2. **Priority Management**: Quickly identify overdue or urgent items
3. **Flexibility**: Different items in the same order can have different due dates
4. **Visual Feedback**: Color-coded indicators help prioritize work
