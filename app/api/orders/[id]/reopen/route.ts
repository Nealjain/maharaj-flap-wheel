import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
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
