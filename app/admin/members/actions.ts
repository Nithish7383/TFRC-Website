'use server'

import { createClient } from '@/lib/supabase-server'
import { createAdminClient } from '@/lib/supabase-admin'

export type ResetPasswordResult = { ok: true } | { ok: false; error: string }

/**
 * Admin-assisted password reset — stands in for a self-service "forgot
 * password" flow. Real SMS/phone-OTP reset would need a paid SMS provider
 * (Twilio etc.) configured in Supabase Auth settings, which this project
 * doesn't have; this works today with no external dependency. Only callable
 * by an authenticated admin (this file is only ever invoked from
 * /admin/members, which is already gated by middleware.ts + a per-page
 * auth check).
 */
export async function resetMemberPassword(memberId: string, newPassword: string): Promise<ResetPasswordResult> {
  if (newPassword.length < 8) {
    return { ok: false, error: 'Password must be at least 8 characters.' }
  }

  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // This action uses the service-role client below, which bypasses RLS —
  // so unlike a normal table write, "is_admin()" isn't enforced by Postgres
  // here. Must check the same app_metadata flag ourselves, or any logged-in
  // MEMBER (not just an admin) could call this server action directly and
  // reset another member's password.
  if (!user || user.app_metadata?.is_admin !== true) {
    return { ok: false, error: 'Not authorized.' }
  }

  const admin = createAdminClient()

  const { data: member } = await admin
    .from('members')
    .select('auth_user_id')
    .eq('member_id', memberId)
    .maybeSingle()

  if (!member?.auth_user_id) {
    return { ok: false, error: 'This member has no login account yet.' }
  }

  const { error } = await admin.auth.admin.updateUserById(member.auth_user_id, { password: newPassword })

  if (error) {
    return { ok: false, error: 'Failed to reset password. Please try again.' }
  }

  // Best-effort audit entry — this is a privileged, service-role action that
  // bypasses RLS, so it's the only record of who reset whose password. Never
  // block the (already-successful) password reset on this insert failing.
  const { error: logError } = await admin.from('admin_actions_log').insert({
    action: 'reset_member_password',
    admin_user_id: user.id,
    admin_email: user.email ?? null,
    target_member_id: memberId,
  })
  if (logError) {
    console.error('Failed to write admin_actions_log entry for password reset:', logError)
  }

  return { ok: true }
}
