import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

// Complete order handler
async function completeOrder(orderId: string) {
  // Runtime check for environment variables
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Missing Supabase configuration')
  }
  
  // Create admin client at runtime
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )
  
  console.log('Starting completeOrder for:', orderId)
  
  // Update order status to completed
    const { data: orderData, error: orderError} = await supabaseAdmin
      .from('orders')
      .update({ 
        status: 'completed',
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId)
      .select()

    console.log('Order update result:', { orderData, orderError })

    if (orderError) {
      console.error('Order update failed:', orderError)
      throw new Error(`Failed to update order: ${orderError.message}`)
    }
    
    if (!orderData || orderData.length === 0) {
      throw new Error('Order not found or update failed - check RLS policies')
    }

    // Get order items with delivered quantities
    const { data: orderItems, error: itemsError } = await supabaseAdmin
      .from('order_items')
      .select('item_id, quantity, delivered_quantity')
      .eq('order_id', orderId)

    if (itemsError) {
      throw new Error(itemsError.message)
    }

    // Update stock for each item
    for (const item of orderItems || []) {
      // Get current stock levels
      const { data: currentItem, error: fetchError } = await supabaseAdmin
        .from('items')
        .select('physical_stock, reserved_stock')
        .eq('id', item.item_id)
        .single()

      if (fetchError) {
        console.error('Error fetching item:', item.item_id, fetchError)
        continue
      }

      // Calculate new stock levels
      // 1. Release reserved stock (full quantity was reserved)
      // 2. Reduce physical stock by delivered quantity
      const newReservedStock = Math.max(0, currentItem.reserved_stock - item.quantity)
      const newPhysicalStock = Math.max(0, currentItem.physical_stock - (item.delivered_quantity || 0))

      const { error: stockError } = await supabaseAdmin
        .from('items')
        .update({
          physical_stock: newPhysicalStock,
          reserved_stock: newReservedStock,
          updated_at: new Date().toISOString()
        })
        .eq('id', item.item_id)

      if (stockError) {
        console.error('Error updating stock for item:', item.item_id, stockError)
      } else {
        // Log to stock ledger (only if table exists)
        try {
          await supabaseAdmin
            .from('stock_ledger')
            .insert({
              item_id: item.item_id,
              transaction_type: 'order_delivered',
              quantity: -(item.delivered_quantity || 0),
              balance_after: newPhysicalStock,
              reference_type: 'order',
              reference_id: orderId,
              notes: `Order completed - delivered ${item.delivered_quantity || 0} units`
            })
        } catch (ledgerError) {
          console.warn('Could not log to stock ledger (table may not exist):', ledgerError)
        }
      }
    }

    // Log audit event
    await supabaseAdmin
      .from('audit_logs')
      .insert([{
        event_type: 'UPDATE',
        entity: 'orders',
        entity_id: orderId,
        payload: { status: 'completed' }
      }])

  return { success: true }
}

// POST handler for auto-complete
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Handle params properly for Next.js 15
    const resolvedParams = await params;
    const { id: orderId } = resolvedParams;
    
    console.log('POST /api/orders/complete - Order ID:', orderId)
    const result = await completeOrder(orderId)
    console.log('Complete order result:', result)
    return NextResponse.json(result)
  } catch (error: any) {
    console.error('Error completing order in POST handler:', error)
    console.error('Error stack:', error.stack)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

// PATCH handler for backward compatibility
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Handle params properly for Next.js 15
    const resolvedParams = await params;
    const { id: orderId } = resolvedParams;
    
    const result = await completeOrder(orderId)
    return NextResponse.json(result)
  } catch (error: any) {
    console.error('Error completing order:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}