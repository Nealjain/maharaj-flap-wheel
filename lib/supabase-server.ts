import { createClient } from '@supabase/supabase-js'

// Server-side Supabase client with service role (bypasses RLS)
// Only use this in API routes, never in client components!
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)
