import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { type } = await request.json()

    if (!type || !['users', 'orders', 'stock', 'transport'].includes(type)) {
      return NextResponse.json({ error: 'Invalid deletion type' }, { status: 400 })
    }

    // Check if user is admin (this would need proper authentication)
    // For now, we'll proceed with the deletion

    let result

    switch (type) {
      case 'users':
        // Delete all users except the current user
        result = await supabase
          .from('user_profiles')
          .delete()
          .neq('role', 'admin') // Don't delete admin users
        break

      case 'orders':
        // Delete all orders and related order_items
        await supabase.from('order_items').delete().neq('order_id', '00000000-0000-0000-0000-000000000000')
        result = await supabase.from('orders').delete().neq('id', '00000000-0000-0000-0000-000000000000')
        break

      case 'stock':
        // Reset all stock to 0
        result = await supabase
          .from('items')
          .update({ 
            physical_stock: 0, 
            reserved_stock: 0 
          })
          .neq('id', '00000000-0000-0000-0000-000000000000')
        break

      case 'transport':
        // Delete all transport companies
        result = await supabase
          .from('transport_companies')
          .delete()
          .neq('id', '00000000-0000-0000-0000-000000000000')
        break

      default:
        return NextResponse.json({ error: 'Invalid deletion type' }, { status: 400 })
    }

    if (result?.error) {
      return NextResponse.json({ error: result.error.message }, { status: 400 })
    }

    // Log the deletion
    await supabase
      .from('audit_logs')
      .insert([{
        event_type: 'DELETE_ALL',
        entity: type,
        payload: { deleted_at: new Date().toISOString() }
      }])

    return NextResponse.json({ success: true, message: `All ${type} deleted successfully` })
  } catch (error) {
    console.error('Error deleting data:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
