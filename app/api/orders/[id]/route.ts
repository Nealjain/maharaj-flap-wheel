import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: orderId } = await params

    console.log('Deleting order:', orderId)

    // First, get order items to release reserved stock
    const { data: orderItems, error: fetchError } = await supabase
      .from('order_items')
      .select('item_id, quantity')
      .eq('order_id', orderId)

    if (fetchError) {
      console.error('Error fetching order items:', fetchError)
      return NextResponse.json({ error: fetchError.message }, { status: 400 })
    }

    console.log('Order items to release:', orderItems)

    // Release reserved stock for each item
    if (orderItems && orderItems.length > 0) {
      for (const item of orderItems) {
        const { data: currentItem, error: fetchItemError } = await supabase
          .from('items')
          .select('reserved_stock')
          .eq('id', item.item_id)
          .single()

        if (!fetchItemError && currentItem) {
          const newReservedStock = Math.max(0, currentItem.reserved_stock - item.quantity)
          console.log(`Releasing stock for item ${item.item_id}: ${currentItem.reserved_stock} -> ${newReservedStock}`)
          
          await supabase
            .from('items')
            .update({
              reserved_stock: newReservedStock
            })
            .eq('id', item.item_id)
        }
      }
    }

    // Delete order (cascade will delete order_items)
    const { error: orderError } = await supabase
      .from('orders')
      .delete()
      .eq('id', orderId)

    if (orderError) {
      console.error('Error deleting order:', orderError)
      return NextResponse.json({ error: orderError.message }, { status: 400 })
    }

    console.log('Order deleted successfully')

    // Log audit event
    await supabase
      .from('audit_logs')
      .insert([{
        event_type: 'DELETE',
        entity: 'orders',
        entity_id: orderId,
        payload: { items_count: orderItems?.length || 0 }
      }])

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting order:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
