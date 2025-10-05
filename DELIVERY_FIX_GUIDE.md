# 🔧 Record Delivery Fix Guide

## Issues Fixed

### ✅ 1. Watermark/Splash Screen Timing
- **Changed**: Auto-dismiss from 8 seconds → 5 seconds
- **Location**: `components/SplashScreen.tsx`
- **Status**: ✅ Fixed in code

### ⚠️ 2. Record Delivery Not Working

## Problem
The "Record Delivery" feature is not working because the database is missing the `delivered_quantity` column in the `order_items` table.

## Solution

### Step 1: Run Database Migration
You need to run the update schema in your Supabase SQL Editor:

1. Go to your Supabase Dashboard
2. Navigate to **SQL Editor**
3. Copy and paste the contents of `supabase-update-schema.sql`
4. Click **Run** to execute the migration

### Step 2: Verify the Column Exists
Run this query in Supabase SQL Editor to verify:

```sql
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'order_items'
AND column_name = 'delivered_quantity';
```

You should see:
```
column_name         | data_type | is_nullable | column_default
--------------------|-----------|-------------|---------------
delivered_quantity  | integer   | NO          | 0
```

### Step 3: Test Record Delivery
1. Go to any order with status "Reserved"
2. Click "Record Delivery" button
3. Enter delivered quantities for items
4. Click "Save Delivery"
5. Verify the delivered quantities are saved

## What the Migration Does

The `supabase-update-schema.sql` file adds:

1. **delivered_quantity column** to order_items table
   - Type: INTEGER
   - Default: 0
   - Constraint: Must be >= 0
   - Purpose: Track partial deliveries

2. **Indexes** for better performance
   - `idx_order_items_delivered_quantity`
   - `idx_audit_logs_performed_by`
   - `idx_login_activities_user_id`

3. **RLS Policies** for audit_logs and login_activities

## Current Schema Status

### ✅ Already in Database (from supabase-schema.sql)
- user_profiles
- companies
- transport_companies
- items
- orders
- order_items (without delivered_quantity)
- audit_logs
- login_activities

### ⚠️ Missing (needs supabase-update-schema.sql)
- order_items.delivered_quantity column
- Performance indexes
- Updated RLS policies

## How Record Delivery Works

1. **Frontend** (`app/orders/[id]/page.tsx`):
   - Shows "Record Delivery" button for reserved orders
   - Opens modal with all order items
   - Allows entering delivered quantities
   - Sends PATCH request to API

2. **API** (`app/api/orders/[id]/partial-delivery/route.ts`):
   - Receives deliveries object: `{ item_id: delivered_quantity }`
   - Updates each order_item with delivered_quantity
   - Logs audit event
   - Returns success/error

3. **Database** (order_items table):
   - Stores delivered_quantity for each item
   - Allows tracking partial deliveries
   - Used to calculate pending quantities

## Troubleshooting

### If Record Delivery Still Doesn't Work:

1. **Check Browser Console** for errors
2. **Check Network Tab** for API response
3. **Verify Database Column** exists
4. **Check Supabase Logs** for RLS policy issues
5. **Verify Service Role Key** is set in environment variables

### Common Errors:

**Error: "column delivered_quantity does not exist"**
- Solution: Run `supabase-update-schema.sql`

**Error: "permission denied for table order_items"**
- Solution: Check RLS policies in Supabase

**Error: "Failed to record delivery"**
- Solution: Check browser console and Supabase logs

## Testing Checklist

- [ ] Splash screen dismisses after 5 seconds
- [ ] Database migration completed successfully
- [ ] delivered_quantity column exists
- [ ] Can open Record Delivery modal
- [ ] Can enter delivery quantities
- [ ] Can save delivery successfully
- [ ] Delivered quantities show in order details
- [ ] Pending quantities calculated correctly

## Next Steps

1. Run the database migration
2. Test the Record Delivery feature
3. Verify splash screen timing
4. Check all functionality works as expected

---

**Note**: The code is already fixed. You just need to run the database migration!
