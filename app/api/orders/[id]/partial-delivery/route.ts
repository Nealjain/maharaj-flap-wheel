import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Use service role to bypass RLS
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://fefudfesrzwigzinhpoe.supabase.co'
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZlZnVkZmVzcnp3aWd6aW5ocG9lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk0NjkwMTcsImV4cCI6MjA3NTA0NTAxN30.lCIKsSJJt6iyoWoXDaff69hsISBrHdwb1dp5Xr2Rt3Q'

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: orderId } = await params
    const body = await request.json()
    const { deliveries } = body // deliveries is an object: { item_id: delivered_quantity }

    console.log('Recording partial delivery for order:', orderId, deliveries)

    // Update each order item with delivered quantity
    for (const [itemId, deliveredQty] of Object.entries(deliveries)) {
      const qty = Number(deliveredQty)
      
      const { error } = await supabase
        .from('order_items')
        .update({ delivered_quantity: qty })
        .eq('order_id', orderId)
        .eq('item_id', itemId)

      if (error) {
        console.error('Error updating order item:', error)
        return NextResponse.json({ error: error.message }, { status: 400 })
      }
    }

    // Log audit event
    await supabase
      .from('audit_logs')
      .insert([{
        event_type: 'UPDATE',
        entity: 'orders',
        entity_id: orderId,
        payload: { partial_delivery: deliveries }
      }])

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error recording partial delivery:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
