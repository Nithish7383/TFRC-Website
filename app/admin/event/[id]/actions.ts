'use server'

import { createClient } from '@/lib/supabase-server'

interface ResponseWithQuestion {
  id: string
  answer: string | null
  // Supabase's untyped client infers a to-one FK join as an array; at
  // runtime PostgREST returns a single object here since question_id is a
  // many-to-one FK from question_responses to questions.
  questions: { id: string; text: string; type: string; order_index: number } | null
}

/** Admin view: a single registration plus every question+answer pair for it, ordered for display. */
export async function getRegistrationWithResponses(registrationId: string) {
  const supabase = createClient()

  const { data: registration, error: regError } = await supabase
    .from('registrations')
    .select('*')
    .eq('id', registrationId)
    .single()

  if (regError || !registration) {
    return { ok: false as const, error: 'Registration not found.' }
  }

  const { data: responses, error: responsesError } = await supabase
    .from('question_responses')
    .select('id, answer, questions(id, text, type, order_index)')
    .eq('registration_id', registrationId)

  if (responsesError) {
    return { ok: false as const, error: 'Failed to load answers.' }
  }

  const sorted = ((responses || []) as unknown as ResponseWithQuestion[])
    .filter((r) => r.questions)
    .sort((a, b) => (a.questions!.order_index ?? 0) - (b.questions!.order_index ?? 0))

  return { ok: true as const, data: { registration, responses: sorted } }
}
