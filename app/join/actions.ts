'use server'

import { createClient } from '@/lib/supabase-server'
import { normalizePhone } from '@/lib/constants'

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
}

export type RegisterResult =
  | { ok: true; memberId: string }
  | { ok: false; error: string; existingMemberId?: string }

/** /join: create the members row. */
export async function registerMember(input: NewMemberInput): Promise<RegisterResult> {
  const normalized = normalizePhone(input.phone)

  const supabase = createClient()

  const { data: existing } = await supabase
    .from('members')
    .select('member_id')
    .eq('phone', normalized)
    .maybeSingle()

  if (existing) {
    return { ok: false, error: 'This number is already registered.', existingMemberId: existing.member_id }
  }

  const { data: inserted, error: insertError } = await supabase
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

  return { ok: true, memberId: inserted.member_id }
}

export interface QuickJoinInput {
  name: string
  phone: string
  age: number
  gender: string
}

/**
 * Short signup used straight from an event card: creates the same members
 * row as /join, but only from the fields an event actually needs. The
 * members table still requires place/occupation/running_experience, so
 * those get neutral defaults ('' / 'First timer' — the schema's CHECK only
 * allows the four listed values) that the member can fill in later.
 */
export async function registerMemberQuick(input: QuickJoinInput): Promise<RegisterResult> {
  const name = input.name.trim()
  const phone = normalizePhone(input.phone)

  if (!name) return { ok: false, error: 'Please enter your name.' }
  if (!/^\d{10}$/.test(phone)) return { ok: false, error: 'Please enter a valid 10-digit phone number.' }
  if (input.gender !== 'Male' && input.gender !== 'Female') return { ok: false, error: 'Please select your gender.' }
  if (!Number.isInteger(input.age) || input.age < 10 || input.age > 80) {
    return { ok: false, error: 'Please enter a valid age.' }
  }

  return registerMember({
    name,
    phone,
    age: input.age,
    gender: input.gender,
    place: '',
    occupation: '',
    running_experience: 'First timer',
    goals: [],
    emergency_contact_name: null,
    emergency_contact_phone: null,
    medical_conditions: null,
    blood_group: null,
    instagram_handle: null,
    profile_photo_url: null,
    birthday: null,
    height: null,
    weight: null,
    running_pace: null,
    weekly_training_days: null,
    interests: [],
  })
}
