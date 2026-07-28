'use server'

import { createClient } from '@/lib/supabase-server'
import { createAdminClient } from '@/lib/supabase-admin'
import { normalizePhone } from '@/lib/constants'

function memberEmail(normalizedPhone: string) {
  return `${normalizedPhone}@members.tfrc.local`
}

export interface NewMemberInput {
  name: string
  phone: string
  age: number
  gender: string
  place: string
  occupation: string
  running_experience: string
  goals: string[]
  emergency_contact_name: string | null
  emergency_contact_phone: string | null
  medical_conditions: string | null
  blood_group: string | null
  instagram_handle: string | null
  profile_photo_url: string | null
  birthday: string | null
  height: number | null
  weight: number | null
  running_pace: string | null
  weekly_training_days: number | null
  interests: string[]
  password: string
}

export type RegisterResult =
  | { ok: true; memberId: string }
  | { ok: false; error: string; existingMemberId?: string }

/** /join: create the members row, the Auth user, link them, and sign in — all in one step. */
export async function registerMember(input: NewMemberInput): Promise<RegisterResult> {
  if (input.password.length < 8) {
    return { ok: false, error: 'Password must be at least 8 characters.' }
  }

  const normalized = normalizePhone(input.phone)
  const email = memberEmail(normalized)

  const supabase = createClient()

  const { data: existing } = await supabase
    .from('members')
    .select('member_id')
    .eq('phone', normalized)
    .maybeSingle()

  if (existing) {
    return { ok: false, error: 'This number is already registered.', existingMemberId: existing.member_id }
  }

  const admin = createAdminClient()

  const { data: inserted, error: insertError } = await admin
    .from('members')
    .insert({
      name: input.name,
      phone: normalized,
      age: input.age,
      gender: input.gender,
      place: input.place,
      occupation: input.occupation,
      running_experience: input.running_experience,
      goals: input.goals,
      emergency_contact_name: input.emergency_contact_name,
      emergency_contact_phone: input.emergency_contact_phone,
      medical_conditions: input.medical_conditions,
      blood_group: input.blood_group,
      instagram_handle: input.instagram_handle,
      profile_photo_url: input.profile_photo_url,
      birthday: input.birthday,
      height: input.height,
      weight: input.weight,
      running_pace: input.running_pace,
      weekly_training_days: input.weekly_training_days,
      interests: input.interests,
      attended_count: 0,
    })
    .select('member_id')
    .single()

  if (insertError || !inserted) {
    // Unique violation on phone — a duplicate slipped in between the check above and this insert.
    if ((insertError as { code?: string })?.code === '23505') {
      return { ok: false, error: 'This number is already registered.' }
    }
    return { ok: false, error: 'Something went wrong. Please try again.' }
  }

  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    password: input.password,
    email_confirm: true,
  })

  if (createError || !created.user) {
    // Roll back the members row so this phone can retry cleanly rather than
    // being stuck as a member with no way to ever log in.
    await admin.from('members').delete().eq('member_id', inserted.member_id)
    return { ok: false, error: 'Could not create account. Please try again.' }
  }

  const { error: linkError } = await admin
    .from('members')
    .update({ auth_user_id: created.user.id })
    .eq('member_id', inserted.member_id)

  if (linkError) {
    await admin.auth.admin.deleteUser(created.user.id)
    await admin.from('members').delete().eq('member_id', inserted.member_id)
    return { ok: false, error: 'Could not link account. Please try again.' }
  }

  const { error: signInError } = await supabase.auth.signInWithPassword({ email, password: input.password })
  if (signInError) {
    return { ok: false, error: 'Account created — please log in.' }
  }

  return { ok: true, memberId: inserted.member_id }
}
