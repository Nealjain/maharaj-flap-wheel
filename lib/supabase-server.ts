import { createClient } from '@supabase/supabase-js'

// Server-side Supabase client with service role (bypasses RLS)
// Only use this in API routes, never in client components!

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

export const supabaseAdmin = createClient(
  supabaseUrl,
  supabaseKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)
