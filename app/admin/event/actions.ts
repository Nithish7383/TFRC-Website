'use server'

import { createClient } from '@/lib/supabase-server'
import { EventType, EventStatus, QuestionType } from '@/lib/types'

export interface NewEventInput {
  title: string
  date: string
  event_type: EventType
  status: EventStatus
  max_male: number
  max_female: number
  group_link: string | null
  registration_deadline: string | null
  meeting_point_url: string | null
  distance: string | null
  pace_group: string | null
  cover_image_url: string | null
}

export interface NewQuestionInput {
  text: string
  type: QuestionType
  required: boolean
  options: string[]
  order_index: number
}

export type ActionResult<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; error: string }

/**
 * Creates the event, then attaches custom questions to it. Default
 * questions for the event's type are NOT copied onto the event row — they
 * stay as event_id-less rows scoped by event_type, and get merged in at
 * read time by getEventWithQuestions(). "defaultQuestions" here is accepted
 * for admin-authored NEW defaults (is_default questions being introduced for
 * this event_type for the first time), not a copy of existing ones.
 */
export async function createEventWithQuestions(
  eventData: NewEventInput,
  newDefaultQuestions: NewQuestionInput[],
  customQuestions: NewQuestionInput[]
): Promise<ActionResult<{ eventId: string }>> {
  const supabase = createClient()

  const { data: event, error: eventError } = await supabase
    .from('events')
    .insert({
      title: eventData.title,
      date: eventData.date,
      event_type: eventData.event_type,
      status: eventData.status,
      max_male: eventData.max_male,
      max_female: eventData.max_female,
      group_link: eventData.group_link,
      is_active: true,
      registration_deadline: eventData.registration_deadline,
      meeting_point_url: eventData.meeting_point_url,
      distance: eventData.distance,
      pace_group: eventData.pace_group,
      cover_image_url: eventData.cover_image_url,
    })
    .select('id')
    .single()

  if (eventError || !event) {
    return { ok: false, error: 'Failed to create event. Please try again.' }
  }

  const rows = [
    ...newDefaultQuestions.map((q) => ({
      event_id: null,
      event_type: eventData.event_type,
      text: q.text,
      type: q.type,
      required: q.required,
      options: q.options,
      is_default: true,
      order_index: q.order_index,
    })),
    ...customQuestions.map((q) => ({
      event_id: event.id,
      event_type: null,
      text: q.text,
      type: q.type,
      required: q.required,
      options: q.options,
      is_default: false,
      order_index: q.order_index,
    })),
  ]

  if (rows.length > 0) {
    const { error: questionsError } = await supabase.from('questions').insert(rows)
    if (questionsError) {
      // Event exists but questions failed — roll back so the event isn't
      // left silently missing the questions the admin just configured.
      await supabase.from('events').delete().eq('id', event.id)
      return { ok: false, error: 'Event was not saved — failed to attach questions. Please try again.' }
    }
  }

  return { ok: true, data: { eventId: event.id } }
}

export async function updateEventQuestions(
  eventId: string,
  questions: { id: string; text: string; order_index: number; required: boolean }[]
): Promise<ActionResult> {
  const supabase = createClient()

  for (const q of questions) {
    const { error } = await supabase
      .from('questions')
      .update({ text: q.text, order_index: q.order_index, required: q.required })
      .eq('id', q.id)
      .eq('event_id', eventId)

    if (error) {
      return { ok: false, error: 'Failed to save one or more questions.' }
    }
  }

  return { ok: true, data: undefined }
}

export async function deleteQuestion(questionId: string): Promise<ActionResult> {
  const supabase = createClient()

  const { error } = await supabase.from('questions').delete().eq('id', questionId).eq('is_default', false)

  if (error) {
    return { ok: false, error: 'Failed to delete question.' }
  }

  return { ok: true, data: undefined }
}

/** Fetches an event plus every question that applies to it: its own custom
 * questions, and any is_default questions scoped to its event_type. */
export async function getEventWithQuestions(eventId: string) {
  const supabase = createClient()

  const { data: event, error: eventError } = await supabase
    .from('events')
    .select('*')
    .eq('id', eventId)
    .single()

  if (eventError || !event) {
    return { ok: false as const, error: 'Event not found.' }
  }

  const [{ data: customQuestions }, { data: defaultQuestions }] = await Promise.all([
    supabase.from('questions').select('*').eq('event_id', eventId).order('order_index', { ascending: true }),
    event.event_type
      ? supabase.from('questions').select('*').eq('event_type', event.event_type).eq('is_default', true).order('order_index', { ascending: true })
      : Promise.resolve({ data: [] }),
  ])

  const questions = [...(defaultQuestions || []), ...(customQuestions || [])]

  return { ok: true as const, data: { ...event, questions } }
}

export async function getRegistrationResponses(registrationId: string) {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('question_responses')
    .select('*, questions(text, type, order_index)')
    .eq('registration_id', registrationId)

  if (error) {
    return { ok: false as const, error: 'Failed to load responses.' }
  }

  return { ok: true as const, data: data || [] }
}
