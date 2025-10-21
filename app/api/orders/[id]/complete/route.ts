import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// Complete order route - Next.js 15 compatible
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: orderId } = await params

    // Update order status to completed
    const { error: orderError } = await supabase
      .from('orders')
      .update({ 
        status: 'completed',
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId)

    if (orderError) {
      return NextResponse.json({ error: orderError.message }, { status: 400 })
    }

    // Get order items to release reserved stock
    const { data: orderItems, error: itemsError } = await supabase
      .from('order_items')
      .select('item_id, quantity')
      .eq('order_id', orderId)

    if (itemsError) {
      return NextResponse.json({ error: itemsError.message }, { status: 400 })
    }

    // Release reserved stock for each item
    for (const item of orderItems || []) {
      // First get current reserved stock
      const { data: currentItem, error: fetchError } = await supabase
        .from('items')
        .select('reserved_stock')
        .eq('id', item.item_id)
        .single()

      if (fetchError) {
        console.error('Error fetching item:', item.item_id, fetchError)
        continue
      }

      // Update with calculated value
      const { error: stockError } = await supabase
        .from('items')
        .update({
          reserved_stock: Math.max(0, currentItem.reserved_stock - item.quantity),
          updated_at: new Date().toISOString()
        })
        .eq('id', item.item_id)

      if (stockError) {
        console.error('Error updating stock for item:', item.item_id, stockError)
      }
    }

    // Log audit event
    await supabase
      .from('audit_logs')
      .insert([{
        event_type: 'UPDATE',
        entity: 'orders',
        entity_id: orderId,
        payload: { status: 'completed' }
      }])

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error completing order:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
