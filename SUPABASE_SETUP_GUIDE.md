# Supabase Setup Guide

## What to Update in Supabase

Based on your current schema, here's what you need to do:

### ✅ Already Exists (No Action Needed)
Your schema already has:
- ✅ `audit_logs` table with `performed_by` column
- ✅ `login_activities` table
- ✅ `order_items` table with `delivered_quantity` column
- ✅ All necessary foreign keys and constraints

### 🔧 What You Need to Run

Run the SQL script in your Supabase SQL Editor to ensure everything is properly configured:

**File:** `supabase-update-schema.sql`

This script will:
1. ✅ Ensure `delivered_quantity` column exists (safe - uses IF NOT EXISTS)
2. ✅ Add performance indexes for activity queries
3. ✅ Set up proper RLS (Row Level Security) policies
4. ✅ Enable RLS on audit tables

## Step-by-Step Instructions

### 1. Open Supabase Dashboard
- Go to your Supabase project
- Navigate to **SQL Editor** in the left sidebar

### 2. Run the Update Script
- Click **New Query**
- Copy the entire contents of `supabase-update-schema.sql`
- Paste it into the SQL editor
- Click **Run** (or press Ctrl/Cmd + Enter)

### 3. Verify the Setup (Optional)
After running the script, you can verify by running these queries:

```sql
-- Check delivered_quantity column
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'order_items'
AND column_name = 'delivered_quantity';

-- Check audit_logs performed_by column
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'audit_logs'
AND column_name = 'performed_by';

-- Check if indexes were created
SELECT indexname, indexdef
FROM pg_indexes
WHERE schemaname = 'public'
AND tablename IN ('audit_logs', 'login_activities', 'order_items')
ORDER BY tablename, indexname;
```

## What Each Table Does

### 1. `audit_logs`
Tracks all CRUD operations (CREATE, UPDATE, DELETE) by admin/staff users.

**Columns:**
- `id` - Unique identifier
- `event_type` - Type of operation (CREATE, UPDATE, DELETE, LOGOUT)
- `entity` - What was changed (orders, items, companies, etc.)
- `entity_id` - ID of the changed record
- `performed_by` - **NEW** - User who made the change
- `payload` - JSON data with details of the change
- `created_at` - When it happened

### 2. `login_activities`
Tracks all login/logout attempts.

**Columns:**
- `id` - Unique identifier
- `user_id` - User who logged in
- `ip` - IP address (optional)
- `user_agent` - Browser/device info
- `success` - Whether login was successful
- `created_at` - When it happened

### 3. `order_items.delivered_quantity`
Tracks partial deliveries for each order item.

**Column:**
- `delivered_quantity` - **NEW** - Number of items delivered so far
- Default: 0
- Constraint: Cannot be negative
- Used for: Partial delivery tracking

## Security (RLS Policies)

The script sets up these security policies:

### Audit Logs
- **View:** Only admins can view audit logs
- **Insert:** System can insert (for automatic logging)

### Login Activities
- **View:** Only admins can view login activities
- **Insert:** System can insert (for automatic logging)

## Testing After Setup

1. **Test Login Tracking:**
   - Log out and log back in
   - Go to Users page → Click "View Activity" on your user
   - Check "Login History" tab - you should see your login

2. **Test CRUD Tracking:**
   - Create a new item or company
   - Go to Users page → Click "View Activity" on your user
   - Check "Changes" tab - you should see the CREATE event

3. **Test Partial Delivery:**
   - Go to any order with status "reserved"
   - Click "Partial Delivery"
   - Enter some quantities and save
   - Refresh the page - you should see delivered/pending quantities

## Troubleshooting

### If you see "permission denied" errors:
- Make sure you're logged in as an admin user
- Check that RLS policies are properly set up (run the script again)

### If audit logs aren't showing:
- Check that `performed_by` column exists in `audit_logs` table
- Verify the user making changes is logged in

### If login activities aren't showing:
- Check that `login_activities` table exists
- Verify RLS policies allow admins to view the data

## Performance Notes

The script adds these indexes for better performance:
- `idx_audit_logs_performed_by` - Fast lookup by user
- `idx_audit_logs_created_at_desc` - Fast sorting by date
- `idx_login_activities_user_id` - Fast lookup by user
- `idx_login_activities_created_at_desc` - Fast sorting by date
- `idx_order_items_delivered_quantity` - Fast filtering by delivery status

These indexes will make the activity pages load faster, especially with lots of data.

## Summary

✅ **Run:** `supabase-update-schema.sql` in Supabase SQL Editor
✅ **Test:** Login tracking, CRUD tracking, and partial deliveries
✅ **Done:** Your system is ready to track all admin activities!
