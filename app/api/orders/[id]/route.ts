import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: orderId } = await params

    // Delete order (cascade will delete order_items)
    const { error: orderError } = await supabase
      .from('orders')
      .delete()
      .eq('id', orderId)

    if (orderError) {
      return NextResponse.json({ error: orderError.message }, { status: 400 })
    }

    // Log audit event
    await supabase
      .from('audit_logs')
      .insert([{
        event_type: 'DELETE',
        entity: 'orders',
        entity_id: orderId,
        payload: {}
      }])

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting order:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
