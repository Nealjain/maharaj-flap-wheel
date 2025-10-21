import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Use service role to bypass RLS for admin operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://fefudfesrzwigzinhpoe.supabase.co'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZlZnVkZmVzcnp3aWd6aW5ocG9lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk0NjkwMTcsImV4cCI6MjA3NTA0NTAxN30.lCIKsSJJt6iyoWoXDaff69hsISBrHdwb1dp5Xr2Rt3Q'

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await params

    // Get the authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch audit logs for this user
    const { data: auditLogs, error: auditError } = await supabaseAdmin
      .from('audit_logs')
      .select('*')
      .eq('performed_by', userId)
      .order('created_at', { ascending: false })
      .limit(100)

    if (auditError) {
      console.error('Error fetching audit logs:', auditError)
      return NextResponse.json({ 
        error: 'Failed to fetch audit logs',
        details: auditError.message 
      }, { status: 500 })
    }

    // Fetch login activities for this user
    const { data: loginActivities, error: loginError } = await supabaseAdmin
      .from('login_activities')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50)

    if (loginError) {
      console.error('Error fetching login activities:', loginError)
      return NextResponse.json({ 
        error: 'Failed to fetch login activities',
        details: loginError.message 
      }, { status: 500 })
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
