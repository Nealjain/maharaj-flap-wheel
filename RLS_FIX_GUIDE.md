# RLS Policy Fix Guide

## Problem
"Failed to update order: new row violates row-level security policy for table order_items"

## Solution

### Step 1: Run the Fix Script
1. Go to your Supabase Dashboard
2. Navigate to **SQL Editor**
3. Copy and paste the contents of `fix-rls-policies.sql`
4. Click **Run**

### Step 2: Verify Policies
After running the script, you should see 4 policies for order_items:
- Authenticated users can view order items (SELECT)
- Authenticated users can insert order items (INSERT)
- Authenticated users can update order items (UPDATE)
- Authenticated users can delete order items (DELETE)

### Step 3: Test
1. Try recording a partial delivery again
2. Check browser console for detailed error logs
3. If still failing, check the error details in console

## Why This Happens
RLS (Row Level Security) policies control who can read/write data. When updating from the client side, Supabase checks:
1. Is the user authenticated?
2. Does the UPDATE policy allow this?
3. Does the WITH CHECK constraint pass?

The fix ensures authenticated users can update order_items.

## Alternative: Disable RLS (Not Recommended)
If you want to disable RLS temporarily for testing:
```sql
ALTER TABLE order_items DISABLE ROW LEVEL SECURITY;
```

To re-enable:
```sql
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
```
