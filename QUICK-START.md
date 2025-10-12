# Quick Start Guide - New Features

## 🚀 Installation (5 minutes)

### 1. Run Database Migration
1. Open your Supabase project
2. Go to SQL Editor
3. Copy the entire content of `supabase-stock-ledger-migration.sql`
4. Paste and click "Run"
5. Wait for "Success" message

### 2. Refresh Your App
```bash
# If running locally
npm run dev

# Or just refresh your browser
```

That's it! All features are now active.

## 📋 Feature Overview

### Feature 1: Custom Units
**Where:** Masters → Items → Create/Edit

**Quick Test:**
1. Go to Masters → Items → Create New Item
2. Check "Use custom unit"
3. Type "Rolls" (or any unit you want)
4. Fill other details and save
5. ✅ Item now uses "Rolls" instead of standard units

### Feature 2: Negative Stock (Backorders)
**Where:** Orders → Create Order

**Quick Test:**
1. Create an item with 10 units stock
2. Create order for 100 units
3. ✅ Order is created (shows warning but allows it)
4. Stock becomes -90 (backorder scenario)

### Feature 3: Stock Ledger
**Where:** Stock → View Ledger

**Quick Test:**
1. Go to Stock → View Ledger
2. Click "Add Stock"
3. Select an item
4. Enter quantity: 50
5. Add note: "Received from supplier"
6. Click "Add Stock"
7. ✅ Stock updated, ledger entry created

### Feature 4: Partial Delivery (Fixed)
**Where:** Orders → Order Details → Record Delivery

**Quick Test:**
1. Create an order with 2 items
2. Go to order details
3. Click "Record Delivery"
4. Enter partial quantities
5. Save
6. Navigate away and come back
7. ✅ Delivery quantities are still there

## 🎯 Common Use Cases

### Use Case 1: Adding Stock from Supplier
```
1. Stock → View Ledger
2. Add Stock
3. Select item
4. Quantity: +100
5. Notes: "Purchase Order #123"
6. Save
```

### Use Case 2: Creating Backorder
```
1. Orders → Create Order
2. Add item with low stock
3. Enter quantity > available
4. See warning but continue
5. Order created successfully
```

### Use Case 3: Custom Unit Item
```
1. Masters → Items → Create
2. Name: "Fabric Roll"
3. Check "Use custom unit"
4. Custom unit: "Rolls"
5. Physical stock: 50
6. Save
```

### Use Case 4: Partial Delivery
```
1. Orders → Select order
2. Record Delivery
3. Item 1: Deliver 30 out of 50
4. Item 2: Deliver 0 out of 20
5. Save
6. Come back later to deliver rest
```

## 📊 What You'll See

### Items List
- Custom units displayed (e.g., "50 Rolls" instead of "50 pcs")
- All existing items still work with standard units

### Stock Page
- "View Ledger" button added
- Custom units in stock display
- Negative stock shown in red (if applicable)

### Orders
- Warning when exceeding stock (but still allows)
- Partial delivery tracking
- Delivery status per item

### Stock Ledger
- Complete history of all stock movements
- Color-coded transaction types
- Filter by item, date, transaction type
- Export to CSV

## ⚠️ Important Notes

1. **Negative Stock** - This is intentional! It allows backorders.
2. **Custom Units** - Optional. Standard units still work fine.
3. **Ledger** - Automatically tracks order-related stock changes.
4. **Deliveries** - Now properly saved and persist across sessions.

## 🐛 Troubleshooting

### "RLS Policy Error" when recording delivery
**Fix:** Re-run the migration SQL file

### Custom unit not saving
**Fix:** Check migration ran successfully
```sql
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'items' AND column_name = 'custom_unit';
```

### Ledger not showing entries
**Fix:** Check you're logged in and have proper permissions

### Stock not updating
**Fix:** Check browser console for errors, verify migration

## 📞 Need Help?

1. Check `STOCK-LEDGER-FEATURES.md` for detailed documentation
2. Check `IMPLEMENTATION-SUMMARY.md` for technical details
3. Review migration SQL file for database changes

## ✅ Verification Checklist

After installation, verify:
- [ ] Can create item with custom unit
- [ ] Custom unit displays in items list
- [ ] Can create order exceeding stock
- [ ] Warning shows but order is created
- [ ] Can access Stock → View Ledger
- [ ] Can add stock via ledger
- [ ] Ledger shows transaction history
- [ ] Can record partial delivery
- [ ] Delivery data persists after navigation
- [ ] Can export ledger to CSV

If all checked, you're good to go! 🎉
