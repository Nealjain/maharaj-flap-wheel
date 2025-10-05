import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: orderId } = await params
    const body = await request.json()
    const { company_id, transport_company_id, notes, order_items } = body

    // Update order basic info
    const { error: orderError } = await supabase
      .from('orders')
      .update({
        company_id,
        transport_company_id,
        notes,
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId)

    if (orderError) {
      return NextResponse.json({ error: orderError.message }, { status: 400 })
    }

    // If order_items are provided, update them
    if (order_items && Array.isArray(order_items)) {
      // First, get existing order items to calculate stock changes
      const { data: existingItems, error: fetchError } = await supabase
        .from('order_items')
        .select('item_id, quantity')
        .eq('order_id', orderId)

      if (fetchError) {
        return NextResponse.json({ error: fetchError.message }, { status: 400 })
      }

      // Delete all existing order items
      const { error: deleteError } = await supabase
        .from('order_items')
        .delete()
        .eq('order_id', orderId)

      if (deleteError) {
        return NextResponse.json({ error: deleteError.message }, { status: 400 })
      }

      // Release reserved stock from old items
      for (const oldItem of existingItems || []) {
        const { data: currentItem, error: fetchItemError } = await supabase
          .from('items')
          .select('reserved_stock')
          .eq('id', oldItem.item_id)
          .single()

        if (!fetchItemError && currentItem) {
          await supabase
            .from('items')
            .update({
              reserved_stock: Math.max(0, currentItem.reserved_stock - oldItem.quantity)
            })
            .eq('id', oldItem.item_id)
        }
      }

      // Insert new order items
      const { error: insertError } = await supabase
        .from('order_items')
        .insert(order_items.map((item: any) => ({
          order_id: orderId,
          item_id: item.item_id,
          quantity: item.quantity,
          price: item.price
        })))

      if (insertError) {
        return NextResponse.json({ error: insertError.message }, { status: 400 })
      }

      // Reserve stock for new items
      for (const newItem of order_items) {
        const { data: currentItem, error: fetchItemError } = await supabase
          .from('items')
          .select('reserved_stock')
          .eq('id', newItem.item_id)
          .single()

        if (!fetchItemError && currentItem) {
          await supabase
            .from('items')
            .update({
              reserved_stock: currentItem.reserved_stock + newItem.quantity
            })
            .eq('id', newItem.item_id)
        }
      }
    }

    // Log audit event
    await supabase
      .from('audit_logs')
      .insert([{
        event_type: 'UPDATE',
        entity: 'orders',
        entity_id: orderId,
        payload: {
          company_id,
          transport_company_id,
          notes,
          items_updated: !!order_items
        }
      }])

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating order:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
