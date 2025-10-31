import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: orderId } = await params
    
    console.log('Reopening order:', orderId)
    
    // Update order status back to pending
    const { data, error } = await supabaseAdmin
      .from('orders')
      .update({ 
        status: 'pending',
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId)
      .select()

    if (error) {
      console.error('Error reopening order:', error)
      throw new Error(error.message)
    }

    if (!data || data.length === 0) {
      throw new Error('Order not found')
    }

    console.log('✅ Order reopened successfully')
    
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error in reopen handler:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
