import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// Initialize Supabase Admin Client (Service Role)
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    }
)

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { email, password, fullName, phone, role } = body

        // 1. Create User in Auth
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true, // Auto-confirm
            user_metadata: {
                full_name: fullName,
                phone: phone
            }
        })

        if (authError) {
            return NextResponse.json({ error: authError.message }, { status: 400 })
        }

        if (!authData.user) {
            return NextResponse.json({ error: 'Failed to create user' }, { status: 500 })
        }

        const userId = authData.user.id

        // 2. Create/Update Profile in public.user_profiles
        // Note: The trigger might have run, but we want to ensure specific Role and Status
        const { error: profileError } = await supabaseAdmin
            .from('user_profiles')
            .upsert({
                id: userId,
                email,
                full_name: fullName,
                phone,
                role: role || 'staff',
                status: 'approved', // Admin-created users are auto-approved
                approved_at: new Date().toISOString(),
                // approved_by: // We don't easily have the creator's ID here without extra checks, leaving null for system creation
            })

        if (profileError) {
            // Rollback auth user if profile fails? 
            // For simplicity, we'll return error but user exists. Admin can delete/fix.
            return NextResponse.json({ error: 'User created but profile update failed: ' + profileError.message }, { status: 500 })
        }

        return NextResponse.json({ success: true, user: authData.user })

    } catch (error: any) {
        console.error('Create user error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
