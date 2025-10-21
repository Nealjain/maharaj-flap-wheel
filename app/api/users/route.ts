import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    console.log('Fetching users...')
    
    // Fetch all users from user_profiles
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching users:', error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    console.log('Users fetched:', data?.length)
    return NextResponse.json({ users: data || [] })
  } catch (error: any) {
    console.error('Error in users API:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, role } = body

    if (!userId || !role) {
      return NextResponse.json({ error: 'Missing userId or role' }, { status: 400 })
    }

    if (!['admin', 'staff', 'user'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
    }

    // Update user role
    const { error } = await supabase
      .from('user_profiles')
      .update({ role })
      .eq('id', userId)

    if (error) {
      console.error('Error updating user role:', error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    // Log audit event
    await supabase
      .from('audit_logs')
      .insert([{
        event_type: 'UPDATE',
        entity: 'user_profiles',
        entity_id: userId,
        payload: { role }
      }])

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in users PATCH API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
