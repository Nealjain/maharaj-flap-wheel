# Migration Checklist

## Pre-Migration

### Backup
- [ ] Backup your Supabase database
- [ ] Export current items data
- [ ] Export current orders data
- [ ] Note down current stock levels

### Review
- [ ] Read QUICK-START.md
- [ ] Read STOCK-LEDGER-FEATURES.md
- [ ] Review supabase-stock-ledger-migration.sql
- [ ] Understand the changes

## Migration Steps

### Step 1: Database Migration (5 minutes)
- [ ] Open Supabase SQL Editor
- [ ] Copy content of `supabase-stock-ledger-migration.sql`
- [ ] Paste into SQL Editor
- [ ] Click "Run"
- [ ] Wait for "Success. No rows returned" message
- [ ] Check for any error messages

### Step 2: Verify Database Changes (2 minutes)
Run these queries to verify:

```sql
-- Check custom_unit column
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'items' AND column_name = 'custom_unit';
```
- [ ] Returns 1 row (custom_unit | text)

```sql
-- Check stock_ledger table
SELECT table_name 
FROM information_schema.tables 
WHERE table_name = 'stock_ledger';
```
- [ ] Returns 1 row (stock_ledger)

```sql
-- Check functions
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_name IN ('add_stock_with_ledger', 'update_delivery_quantities');
```
- [ ] Returns 2 rows (both functions)

```sql
-- Check constraint change
SELECT constraint_name, check_clause
FROM information_schema.check_constraints
WHERE constraint_name LIKE '%physical_stock%';
```
- [ ] Constraint allows negative values

### Step 3: Application Deployment (1 minute)
- [ ] Refresh your browser (if already running)
- [ ] Or restart dev server: `npm run dev`
- [ ] Clear browser cache if needed

### Step 4: UI Verification (5 minutes)

#### Items Page
- [ ] Go to Masters → Items
- [ ] Click "Create New Item"
- [ ] See "Use custom unit" checkbox
- [ ] Check the checkbox
- [ ] See custom unit input field
- [ ] Enter "Rolls" as custom unit
- [ ] Fill other fields
- [ ] Save successfully
- [ ] See "Rolls" displayed in items list

#### Stock Page
- [ ] Go to Stock
- [ ] See "View Ledger" button
- [ ] See custom units displayed (if any)
- [ ] Click "View Ledger"
- [ ] See stock ledger page

#### Stock Ledger Page
- [ ] See "Add Stock" button
- [ ] See filters (search, item, type)
- [ ] See export button
- [ ] Click "Add Stock"
- [ ] See modal with form
- [ ] Select an item
- [ ] Enter quantity: 10
- [ ] Enter notes: "Test addition"
- [ ] Click "Add Stock"
- [ ] See success message
- [ ] See new ledger entry in table
- [ ] Verify item stock increased by 10

#### Orders Page
- [ ] Go to Orders → Create Order
- [ ] Select a company
- [ ] Add an item with low stock (e.g., 5 units)
- [ ] Enter quantity: 100 (exceeds stock)
- [ ] See warning: "⚠️ Exceeds available stock by 95"
- [ ] Order is NOT blocked
- [ ] Submit order successfully
- [ ] Verify order created

#### Order Details Page
- [ ] Open an existing order
- [ ] Click "Record Delivery"
- [ ] Enter partial quantities
- [ ] Save
- [ ] Navigate to Orders list
- [ ] Come back to same order
- [ ] Verify delivery quantities are still there
- [ ] Check stock ledger for delivery entry

## Post-Migration Testing

### Test Case 1: Custom Unit Item
- [ ] Create item with custom unit "Bundles"
- [ ] Set stock to 50
- [ ] Verify displays as "50 Bundles"
- [ ] Create order with this item
- [ ] Verify unit shows correctly in order

### Test Case 2: Negative Stock
- [ ] Find item with 10 units
- [ ] Create order for 50 units
- [ ] Verify warning shows
- [ ] Verify order is created
- [ ] Check item stock is now -40
- [ ] Add 100 units via ledger
- [ ] Verify stock is now 60

### Test Case 3: Stock Ledger
- [ ] Add stock: +50 units
- [ ] Check ledger shows "addition" entry
- [ ] Create order (reserves stock)
- [ ] Check ledger shows "order_reserved" entry
- [ ] Record delivery
- [ ] Check ledger shows "order_delivered" entry
- [ ] Export ledger to CSV
- [ ] Verify CSV contains all entries

### Test Case 4: Partial Delivery Persistence
- [ ] Create order with 3 items
- [ ] Record partial delivery (50% of each)
- [ ] Navigate to dashboard
- [ ] Navigate back to order
- [ ] Verify delivery quantities still show
- [ ] Record remaining delivery
- [ ] Verify all quantities saved

### Test Case 5: Edit Order with Deliveries
- [ ] Create order with 2 items
- [ ] Record partial delivery
- [ ] Edit order (change quantities)
- [ ] Save order
- [ ] Verify delivery quantities preserved
- [ ] Verify order items updated correctly

## Rollback Plan (If Needed)

If something goes wrong:

### Option 1: Restore Backup
```sql
-- Restore from backup
-- (Use your backup restoration method)
```

### Option 2: Remove Changes
```sql
-- Remove custom_unit column
ALTER TABLE items DROP COLUMN IF EXISTS custom_unit;

-- Drop stock_ledger table
DROP TABLE IF EXISTS stock_ledger CASCADE;

-- Drop functions
DROP FUNCTION IF EXISTS add_stock_with_ledger;
DROP FUNCTION IF EXISTS update_delivery_quantities;

-- Restore original constraint
ALTER TABLE items DROP CONSTRAINT IF EXISTS items_physical_stock_check;
ALTER TABLE items ADD CONSTRAINT items_physical_stock_check 
  CHECK (physical_stock >= 0);
```

## Common Issues & Solutions

### Issue: Migration fails with "column already exists"
**Solution:** Column was added before. Safe to continue.

### Issue: "RLS policy error" when using features
**Solution:** Re-run the migration SQL file completely.

### Issue: Custom unit not showing
**Solution:** 
1. Verify migration ran successfully
2. Clear browser cache
3. Check browser console for errors

### Issue: Ledger page shows no data
**Solution:**
1. Add some stock first
2. Check RLS policies are enabled
3. Verify you're logged in

### Issue: Delivery quantities not saving
**Solution:**
1. Verify `update_delivery_quantities` function exists
2. Check browser console for errors
3. Try re-running migration

## Success Criteria

Migration is successful when:
- [ ] All database changes applied
- [ ] No errors in browser console
- [ ] Can create item with custom unit
- [ ] Can create order exceeding stock
- [ ] Can add stock via ledger
- [ ] Can record partial delivery
- [ ] Delivery data persists
- [ ] All existing data intact
- [ ] All existing features work

## Timeline

- **Pre-Migration:** 10 minutes
- **Migration:** 5 minutes
- **Verification:** 5 minutes
- **Testing:** 15 minutes
- **Total:** ~35 minutes

## Support Contacts

If you need help:
1. Check troubleshooting in STOCK-LEDGER-FEATURES.md
2. Review error messages in browser console
3. Check Supabase logs
4. Review this checklist again

## Sign-off

- [ ] Migration completed successfully
- [ ] All tests passed
- [ ] Team trained on new features
- [ ] Documentation reviewed
- [ ] Ready for production use

**Completed by:** _______________
**Date:** _______________
**Time:** _______________
**Notes:** _______________________________________________
