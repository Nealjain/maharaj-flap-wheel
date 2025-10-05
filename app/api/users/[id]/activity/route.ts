import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await params

    // Fetch audit logs for this user
    const { data: auditLogs, error: auditError } = await supabase
      .from('audit_logs')
      .select('*')
      .eq('performed_by', userId)
      .order('created_at', { ascending: false })
      .limit(100)

    if (auditError) {
      console.error('Error fetching audit logs:', auditError)
    }

    // Fetch login activities for this user
    const { data: loginActivities, error: loginError } = await supabase
      .from('login_activities')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50)

    if (loginError) {
      console.error('Error fetching login activities:', loginError)
    }

    return NextResponse.json({
      auditLogs: auditLogs || [],
      loginActivities: loginActivities || []
    })
  } catch (error) {
    console.error('Error fetching user activity:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
