import { createClient } from '@supabase/supabase-js'

// Defines how the backend connects to Supabase with full admin privileges.
// ONLY USE THIS IN SECURE SERVER ENVIRONMENTS (Route Handlers, Server Actions).
export function createAdminClient() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SECRET_KEY) {
    throw new Error('Supabase environment variables missing.')
  }
  
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SECRET_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )
}
