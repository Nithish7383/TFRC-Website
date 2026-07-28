'use server'

import { createClient } from '@/lib/supabase-server'
import { createAdminClient } from '@/lib/supabase-admin'
import { normalizePhone } from '@/lib/constants'

function memberEmail(normalizedPhone: string) {
  return `${normalizedPhone}@members.tfrc.local`
}

export type LookupResult =
  | { status: 'not_found' }
  | { status: 'needs_password'; memberId: string }
  | { status: 'has_password'; memberId: string }

/** Step 1: does this phone belong to a member, and have they set a password yet? */
export async function lookupMember(rawPhone: string): Promise<LookupResult> {
  const supabase = createClient()
  const normalized = normalizePhone(rawPhone)

  const { data } = await supabase
    .from('members')
    .select('member_id, auth_user_id')
    .eq('phone', normalized)
    .maybeSingle()

  if (!data) return { status: 'not_found' }

  return data.auth_user_id
    ? { status: 'has_password', memberId: data.member_id }
    : { status: 'needs_password', memberId: data.member_id }
}

export type AuthResult = { ok: true; memberId: string } | { ok: false; error: string }

/** Step 2a: first-time — create the Auth user, link it, and sign in. */
export async function setFirstPassword(
  rawPhone: string,
  password: string
): Promise<AuthResult> {
  if (password.length < 8) {
    return { ok: false, error: 'Password must be at least 8 characters.' }
  }

  const normalized = normalizePhone(rawPhone)
  const email = memberEmail(normalized)

  const supabase = createClient()
  const { data: member } = await supabase
    .from('members')
    .select('member_id, auth_user_id')
    .eq('phone', normalized)
    .maybeSingle()

  if (!member) return { ok: false, error: 'No account found for this number.' }
  if (member.auth_user_id) {
    // Someone already set a password between the lookup and this submit —
    // re-run as a normal login instead of silently overwriting it.
    return loginMember(rawPhone, password)
  }

  const admin = createAdminClient()
  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })

  if (createError || !created.user) {
    return { ok: false, error: 'Could not create account. Please try again.' }
  }

  const { error: linkError } = await admin
    .from('members')
    .update({ auth_user_id: created.user.id })
    .eq('member_id', member.member_id)

  if (linkError) {
    // Roll back the orphaned auth user so this phone can retry cleanly.
    await admin.auth.admin.deleteUser(created.user.id)
    return { ok: false, error: 'Could not link account. Please try again.' }
  }

  const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
  if (signInError) {
    return { ok: false, error: 'Account created — please log in again.' }
  }

  return { ok: true, memberId: member.member_id }
}

/** Step 2b: returning member — normal password login. */
export async function loginMember(rawPhone: string, password: string): Promise<AuthResult> {
  const normalized = normalizePhone(rawPhone)
  const email = memberEmail(normalized)

  const supabase = createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    return { ok: false, error: 'Incorrect phone number or password.' }
  }

  const { data: member } = await supabase
    .from('members')
    .select('member_id')
    .eq('phone', normalized)
    .maybeSingle()

  if (!member) {
    return { ok: false, error: 'Incorrect phone number or password.' }
  }

  return { ok: true, memberId: member.member_id }
}
