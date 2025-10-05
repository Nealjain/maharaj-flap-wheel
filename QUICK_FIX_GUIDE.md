# Quick Fix Guide - Remove Prices & Fix Partial Delivery

## 🚨 STEP 1: Run SQL in Supabase (REQUIRED)

```sql
-- Add delivered_quantity column if not exists
ALTER TABLE public.order_items 
ADD COLUMN IF NOT EXISTS delivered_quantity INTEGER NOT NULL DEFAULT 0 
CHECK (delivered_quantity >= 0);

-- Set default for existing rows
UPDATE public.order_items SET delivered_quantity = 0 WHERE delivered_quantity IS NULL;

-- Add index
CREATE INDEX IF NOT EXISTS idx_order_items_delivered_quantity ON public.order_items(delivered_quantity);
```

## 🔧 STEP 2: Key Code Changes Needed

### Change 1: Remove "Mark Complete" Button
In `app/orders/[id]/page.tsx`, find this section (around line 270):

**REMOVE THIS:**
```tsx
<button
  onClick={handleCompleteOrder}
  disabled={loading}
  className="inline-flex items-center..."
>
  Mark Complete
</button>
```

### Change 2: Remove Price Displays
In `app/orders/[id]/page.tsx`, find the table headers (around line 400):

**REMOVE THIS COLUMN:**
```tsx
<th>Price</th>
```

**AND REMOVE THIS CELL:**
```tsx
<td>₹{item.price.toFixed(2)}</td>
```

### Change 3: Remove Total Amount
In `app/orders/[id]/page.tsx`, find (around line 235):

**REMOVE THIS:**
```tsx
const totalAmount = order.order_items?.reduce((sum: number, item: any) => 
  sum + (item.quantity * item.price), 0
) || 0
```

**AND REMOVE THIS DISPLAY:**
```tsx
<span>₹{totalAmount.toFixed(2)}</span>
```

### Change 4: Fix Partial Delivery API
The API route needs service role. File: `app/api/orders/[id]/partial-delivery/route.ts`

**REPLACE ENTIRE FILE WITH:**
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://fefudfesrzwigzinhpoe.supabase.co'
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZlZnVkZmVzcnp3aWd6aW5ocG9lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk0NjkwMTcsImV4cCI6MjA3NTA0NTAxN30.lCIKsSJJt6iyoWoXDaff69hsISBrHdwb1dp5Xr2Rt3Q'

const supabase = createClient(supabaseUrl, supabaseKey)

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: orderId } = await params
    const body = await request.json()
    const { deliveries } = body

    console.log('Recording partial delivery:', orderId, deliveries)

    // Update each order item
    for (const [itemId, deliveredQty] of Object.entries(deliveries)) {
      const { error } = await supabase
        .from('order_items')
        .update({ delivered_quantity: deliveredQty })
        .eq('order_id', orderId)
        .eq('item_id', itemId)

      if (error) {
        console.error('Error:', error)
        return NextResponse.json({ error: error.message }, { status: 400 })
      }
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
```

## 📱 STEP 3: Test

1. ✅ Run SQL in Supabase
2. ✅ Restart your dev server
3. ✅ Go to an order
4. ✅ Click "Partial Delivery"
5. ✅ Enter quantities
6. ✅ Click Save
7. ✅ Should work now!

## 🎯 What This Fixes:

- ✅ Partial delivery will work
- ✅ No more "Mark Complete" button
- ✅ Prices hidden from view
- ✅ Cleaner, simpler interface

## ⚡ For Full Real-Time Updates:

That requires more extensive changes to the data provider.
Let me know if you want me to implement that next!
