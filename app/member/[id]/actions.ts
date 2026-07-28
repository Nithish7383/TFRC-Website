'use server'

import { createClient } from '@/lib/supabase-server'

export interface ProfileUpdateInput {
  name: string
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

export type UpdateResult = { ok: true } | { ok: false; error: string }

/** Member self-edit — relies on the "Members can update own row" RLS policy (auth.uid() = auth_user_id). */
export async function updateOwnProfile(memberId: string, input: ProfileUpdateInput): Promise<UpdateResult> {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { ok: false, error: 'Not signed in.' }

  const { error } = await supabase
    .from('members')
    .update(input)
    .eq('member_id', memberId)
    .eq('auth_user_id', user.id)

  if (error) {
    return { ok: false, error: 'Could not save changes. Please try again.' }
  }

  return { ok: true }
}
