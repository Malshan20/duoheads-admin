import { createClient as _createClient } from "@supabase/supabase-js"

// Admin client with service role key for admin operations
export function createAdminClient() {
  return _createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

// Export createAdminClient as an alias to createClient for compatibility
export const createClient = createAdminClient
