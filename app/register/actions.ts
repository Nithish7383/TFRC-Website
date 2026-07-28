'use server'

import { createClient } from '@/lib/supabase-server'

export interface QuestionAnswerInput {
  question_id: string
  answer: string
}

export type ActionResult = { ok: true } | { ok: false; error: string }

/** Saves every custom-question answer for a just-created registration. */
export async function createRegistrationResponses(
  registrationId: string,
  answers: QuestionAnswerInput[]
): Promise<ActionResult> {
  if (answers.length === 0) return { ok: true }

  const supabase = createClient()

  const { error } = await supabase.from('question_responses').insert(
    answers.map((a) => ({
      registration_id: registrationId,
      question_id: a.question_id,
      answer: a.answer,
    }))
  )

  if (error) {
    return { ok: false, error: 'Registration was saved, but some answers could not be recorded.' }
  }

  return { ok: true }
}
