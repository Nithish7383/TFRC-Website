'use server'

import { createClient } from '@/lib/supabase-server'

export type SessionMemberResult =
  | { ok: true; member: { member_id: string; name: string; gender: string } }
  | { ok: false; error: string }

/** Used by the homepage to decide login-modal vs. confirm-card, and to show the member's first name in the confirm copy. */
export async function getSessionMember(): Promise<SessionMemberResult> {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { ok: false, error: 'Not signed in.' }

  const { data: member } = await supabase
    .from('members')
    .select('member_id, name, gender')
    .eq('auth_user_id', user.id)
    .maybeSingle()

  if (!member) return { ok: false, error: 'No member profile linked to this account.' }

  return { ok: true, member }
}

export type RegisterForEventResult =
  | { ok: true }
  | { ok: false; error: string }

/**
 * Registers the CURRENTLY SIGNED-IN member for an event. The member is
 * resolved server-side from the session's auth.uid() — never from anything
 * the client submits — so there is no way to register on behalf of a
 * member ID you don't control the session for.
 */
export async function registerForEvent(eventId: string, reason: string): Promise<RegisterForEventResult> {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { ok: false, error: 'Your session has expired. Please close this and log in again.' }

  const { data: member } = await supabase
    .from('members')
    .select('*')
    .eq('auth_user_id', user.id)
    .maybeSingle()

  if (!member) return { ok: false, error: 'We couldn\'t find your member profile. Please close this and log in again.' }

  const { data: event } = await supabase
    .from('events')
    .select('id, is_active, registration_deadline, max_male, max_female')
    .eq('id', eventId)
    .maybeSingle()

  if (!event || !event.is_active) {
    return { ok: false, error: 'This event is no longer open for registration.' }
  }

  if (event.registration_deadline && new Date() > new Date(event.registration_deadline)) {
    return { ok: false, error: 'Registration is closed. The deadline has passed.' }
  }

  const { data: existing } = await supabase
    .from('registrations')
    .select('id')
    .eq('event_id', eventId)
    .eq('phone', member.phone)
    .maybeSingle()

  if (existing) {
    return { ok: false, error: 'You have already registered for this event.' }
  }

  const { error: insertError } = await supabase.from('registrations').insert({
    event_id: eventId,
    name: member.name,
    age: member.age,
    place: member.place,
    phone: member.phone,
    gender: member.gender,
    occupation: member.occupation,
    reason: reason || 'Registered via homepage',
    running_experience: member.running_experience,
    emergency_contact_name: member.emergency_contact_name || null,
    emergency_contact_phone: member.emergency_contact_phone || null,
  })

  if (insertError) {
    // The gender-slot trigger (check_gender_slots(), see supabase-v5-slot-fix.sql
    // / supabase-v6-rls-fix.sql) raises P0001 when a slot just filled up.
    if ((insertError as { code?: string }).code === 'P0001') {
      return { ok: false, error: 'Sorry — slots just filled up for your gender. Registration is now closed.' }
    }
    if ((insertError as { code?: string }).code === '23505') {
      return { ok: false, error: 'You have already registered for this event.' }
    }
    return { ok: false, error: 'Registration failed. Please try again.' }
  }

  return { ok: true }
}
