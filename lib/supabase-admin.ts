import { createClient as createSupabaseClient } from '@supabase/supabase-js'

/**
 * Service-role client — bypasses RLS entirely. Only import this from
 * server-only files ('use server' actions, Server Components) — never from
 * a 'use client' file, or the service-role key would ship to the browser.
 * Used only for admin.createUser() when a member sets their first password.
 */
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}
