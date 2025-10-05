import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

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
      const { error } = await supabase
        .from('order_items')
        .update({ delivered_quantity: deliveredQty })
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
  } catch (error) {
    console.error('Error recording partial delivery:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
