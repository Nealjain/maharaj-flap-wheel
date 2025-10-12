# Stock Ledger & Enhanced Features

## Overview
This update adds three major features to the inventory management system:

1. **Custom Units** - Add custom units like "Rolls", "Bundles", "Cartons" etc.
2. **Negative Stock Support** - Allow orders that exceed available stock
3. **Stock Ledger** - Date-wise stock tracking with complete history

## Installation Steps

### 1. Run Database Migration

Open your Supabase SQL Editor and run the migration file:

```bash
supabase-stock-ledger-migration.sql
```

This will:
- Add `custom_unit` column to items table
- Create `stock_ledger` table for tracking all stock movements
- Add `delivered_quantity` column to order_items (if not exists)
- Remove stock constraints to allow negative values
- Create helper functions for stock management
- Set up RLS policies

### 2. Verify Migration

After running the migration, verify:

```sql
-- Check if custom_unit column exists
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'items' AND column_name = 'custom_unit';

-- Check if stock_ledger table exists
SELECT table_name 
FROM information_schema.tables 
WHERE table_name = 'stock_ledger';

-- Check if functions exist
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_name IN ('add_stock_with_ledger', 'update_delivery_quantities');
```

## Features

### 1. Custom Units

**Location:** Product Master (Items)

**How to Use:**
1. Go to Masters → Items → Create/Edit Item
2. Check "Use custom unit" checkbox
3. Enter your custom unit (e.g., "Rolls", "Bundles", "Cartons")
4. Save the item

**Benefits:**
- No longer limited to predefined units (pcs, kg, m, etc.)
- Support for industry-specific units
- Custom units display throughout the system

### 2. Negative Stock Support

**Location:** Orders → Create/Edit Order

**How it Works:**
- Previously: Orders were blocked if quantity exceeded available stock
- Now: Orders can be placed for any quantity
- Warning shown when quantity exceeds available stock
- Physical stock can go negative (useful for backorders)

**Example:**
- Available stock: 10 units
- Order quantity: 100 units
- Result: Order created successfully, stock becomes -90
- Warning: "⚠️ Exceeds available stock by 90"

### 3. Stock Ledger

**Location:** Stock → View Ledger

**Features:**
- **Date-wise tracking** of all stock movements
- **Transaction types:**
  - Addition (manual stock added)
  - Removal (manual stock removed)
  - Adjustment (stock corrections)
  - Order Reserved (when order is created)
  - Order Delivered (when delivery is recorded)
  - Order Cancelled (when order is cancelled)

**How to Add Stock:**
1. Go to Stock → View Ledger
2. Click "Add Stock" button
3. Select item from dropdown
4. Enter quantity (positive to add, negative to remove)
5. Add optional notes
6. Click "Add Stock"

**Ledger Information:**
- Date & Time of transaction
- Item details (name, SKU)
- Transaction type with color coding
- Quantity changed
- Balance after transaction
- Notes/remarks
- User who performed the action

**Filtering:**
- Search by item name or SKU
- Filter by specific item
- Filter by transaction type
- Export to CSV

## Database Schema Changes

### Items Table
```sql
-- New column
custom_unit TEXT  -- Custom unit name (e.g., "Rolls", "Bundles")

-- Modified constraints
physical_stock >= -999999  -- Allows negative stock
```

### Stock Ledger Table
```sql
CREATE TABLE stock_ledger (
  id UUID PRIMARY KEY,
  item_id UUID REFERENCES items(id),
  transaction_type TEXT,  -- addition, removal, adjustment, etc.
  quantity INTEGER,
  balance_after INTEGER,
  reference_type TEXT,    -- 'order', 'adjustment', etc.
  reference_id UUID,      -- Related order ID, etc.
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMP
)
```

### Order Items Table
```sql
-- Existing column (migration ensures it exists)
delivered_quantity INTEGER DEFAULT 0  -- Tracks partial deliveries
```

## API Functions

### add_stock_with_ledger
Adds stock to an item and creates a ledger entry.

```sql
SELECT add_stock_with_ledger(
  p_item_id := 'uuid-here',
  p_quantity := 100,
  p_notes := 'Received from supplier'
);
```

### update_delivery_quantities
Updates delivery quantities for order items (bypasses RLS).

```sql
SELECT update_delivery_quantities(
  p_order_id := 'uuid-here',
  p_deliveries := '{"item-id-1": 50, "item-id-2": 30}'::jsonb
);
```

## UI Changes

### Items Master
- ✅ Custom unit checkbox and input field
- ✅ Display custom unit throughout the system
- ✅ Custom unit in exports

### Stock Page
- ✅ "View Ledger" button added
- ✅ Display custom units in stock table

### Orders
- ✅ Removed max quantity validation
- ✅ Warning when exceeding available stock
- ✅ Allow negative stock scenarios

### Stock Ledger (New Page)
- ✅ Complete transaction history
- ✅ Add stock functionality
- ✅ Advanced filtering
- ✅ CSV export
- ✅ Color-coded transaction types

## Partial Delivery Fix

**Issue:** Partial delivery data was not persisting when navigating away and back to order details.

**Solution:**
1. Created `update_delivery_quantities` function that bypasses RLS
2. Function directly updates order_items table
3. Creates ledger entries for tracking
4. Local state updates immediately for better UX

**How to Use:**
1. Go to Order Details
2. Click "Record Delivery"
3. Enter delivered quantities for each item
4. Click "Save Delivery"
5. Data persists even after navigation

## Testing Checklist

- [ ] Create item with custom unit (e.g., "Rolls")
- [ ] Verify custom unit displays in items list
- [ ] Create order with quantity exceeding stock
- [ ] Verify warning message appears
- [ ] Verify order is created successfully
- [ ] Add stock via ledger page
- [ ] Verify ledger entry is created
- [ ] Verify item stock is updated
- [ ] Record partial delivery on order
- [ ] Navigate away and back to order
- [ ] Verify delivery quantities persist
- [ ] Export ledger to CSV
- [ ] Filter ledger by item and transaction type

## Troubleshooting

### Issue: "RLS Policy Error" when recording delivery
**Solution:** Ensure you've run the migration SQL file which creates the `update_delivery_quantities` function.

### Issue: Custom unit not saving
**Solution:** Check that the `custom_unit` column exists in the items table.

### Issue: Stock ledger not showing entries
**Solution:** 
1. Check RLS policies are enabled
2. Verify user is authenticated
3. Check browser console for errors

### Issue: Cannot add negative stock
**Solution:** Ensure the stock constraint has been updated to allow negative values.

## Future Enhancements

Potential improvements for future versions:

1. **Stock Alerts** - Notifications when stock goes below threshold
2. **Batch Operations** - Add/remove stock for multiple items at once
3. **Stock Reports** - Analytics and trends
4. **Barcode Scanning** - Quick stock updates via barcode
5. **Stock Transfer** - Move stock between locations
6. **Reorder Points** - Automatic purchase order suggestions
7. **Stock Audit** - Compare physical vs system stock

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review the migration SQL file
3. Check browser console for errors
4. Verify database schema changes

## Version History

- **v1.0** (Current)
  - Custom units support
  - Negative stock support
  - Stock ledger with date-wise tracking
  - Partial delivery persistence fix
