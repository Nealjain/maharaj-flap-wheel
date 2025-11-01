import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export async function DELETE(
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

    const { id: userId } = await params

    console.log('Deleting user:', userId)

    // Step 1: Nullify foreign key references
    console.log('Nullifying foreign key references...')
    
    // Update audit logs
    const { error: auditError } = await supabaseAdmin
      .from('audit_logs')
      .update({ performed_by: null })
      .eq('performed_by', userId)
    if (auditError) console.log('Audit logs update:', auditError.message)

    // Update stock ledger
    const { error: ledgerError } = await supabaseAdmin
      .from('stock_ledger')
      .update({ performed_by: null })
      .eq('performed_by', userId)
    if (ledgerError) console.log('Stock ledger update:', ledgerError.message)

    // Update orders (created_by)
    const { error: ordersError } = await supabaseAdmin
      .from('orders')
      .update({ created_by: null })
      .eq('created_by', userId)
    if (ordersError) console.log('Orders update:', ordersError.message)

    // Update user_profiles (approved_by)
    const { error: profilesError } = await supabaseAdmin
      .from('user_profiles')
      .update({ approved_by: null })
      .eq('approved_by', userId)
    if (profilesError) console.log('User profiles update:', profilesError.message)

    // Update reference_ids (created_by)
    const { error: refError } = await supabaseAdmin
      .from('reference_ids')
      .update({ created_by: null })
      .eq('created_by', userId)
    if (refError) console.log('Reference IDs update:', refError.message)

    // Delete reference_id_usage records
    const { error: usageError } = await supabaseAdmin
      .from('reference_id_usage')
      .delete()
      .eq('user_id', userId)
    if (usageError) console.log('Reference usage delete:', usageError.message)

    console.log('Foreign key references handled')

    // Step 2: Delete from user_profiles
    const { error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .delete()
      .eq('id', userId)

    if (profileError) {
      console.error('Error deleting profile:', profileError)
      throw new Error(`Failed to delete profile: ${profileError.message}`)
    }

    console.log('Profile deleted, now deleting auth user...')

    // Step 3: Delete from auth.users using admin API
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId)

    if (authError) {
      console.error('Error deleting auth user:', authError)
      return NextResponse.json(
        { 
          success: false, 
          error: 'Profile deleted but auth deletion failed',
          partialSuccess: true 
        },
        { status: 207 }
      )
    }

    console.log('User deleted successfully')

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error in delete user handler:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
