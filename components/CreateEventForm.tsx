'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { EventType, Question, QuestionType } from '@/lib/types'
import { createEventWithQuestions, NewQuestionInput } from '@/app/admin/event/actions'

const EVENT_TYPES: EventType[] = ['Running', 'Trek', 'Yoga', 'Turf', 'Meetup']

const QUESTION_TYPES: { value: QuestionType; label: string }[] = [
  { value: 'text', label: 'Short text' },
  { value: 'textarea', label: 'Long text' },
  { value: 'number', label: 'Number' },
  { value: 'date', label: 'Date' },
  { value: 'select', label: 'Dropdown (single choice)' },
  { value: 'multiselect', label: 'Checkboxes (multiple choice)' },
  { value: 'checkbox', label: 'Yes / No' },
]

interface CustomQuestionDraft {
  key: string
  text: string
  type: QuestionType
  required: boolean
  optionsText: string
}

function newDraft(): CustomQuestionDraft {
  return { key: crypto.randomUUID(), text: '', type: 'text', required: false, optionsText: '' }
}

export default function CreateEventForm() {
  const router = useRouter()
  const supabase = createClient()

  const [form, setForm] = useState({
    title: '',
    date: '',
    event_type: 'Running' as EventType,
    max_male: '20',
    max_female: '20',
    group_link: '',
    registration_deadline: '',
    meeting_point_url: '',
    distance: '',
    pace_group: '',
    cover_image_url: '',
  })
  const [customQuestions, setCustomQuestions] = useState<CustomQuestionDraft[]>([])
  const [defaultQuestions, setDefaultQuestions] = useState<Question[]>([])
  const [loadingDefaults, setLoadingDefaults] = useState(false)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const fetchDefaults = useCallback(async (eventType: EventType) => {
    setLoadingDefaults(true)
    const { data } = await supabase
      .from('questions')
      .select('*')
      .eq('event_type', eventType)
      .eq('is_default', true)
      .order('order_index', { ascending: true })
    setDefaultQuestions((data || []) as Question[])
    setLoadingDefaults(false)
  }, [supabase])

  useEffect(() => { fetchDefaults(form.event_type) }, [form.event_type, fetchDefaults])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
    setError('')
    setSuccess(false)
  }

  const addQuestion = () => {
    setCustomQuestions((prev) => [...prev, newDraft()])
  }

  const updateQuestion = (key: string, patch: Partial<CustomQuestionDraft>) => {
    setCustomQuestions((prev) => prev.map((q) => (q.key === key ? { ...q, ...patch } : q)))
  }

  const removeQuestion = (key: string) => {
    setCustomQuestions((prev) => prev.filter((q) => q.key !== key))
  }

  const moveQuestion = (index: number, direction: -1 | 1) => {
    setCustomQuestions((prev) => {
      const next = [...prev]
      const target = index + direction
      if (target < 0 || target >= next.length) return prev
      ;[next[index], next[target]] = [next[target], next[index]]
      return next
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    for (const q of customQuestions) {
      if (!q.text.trim()) {
        setError('Every custom question needs question text — remove any empty ones.')
        return
      }
      if ((q.type === 'select' || q.type === 'multiselect') && !q.optionsText.trim()) {
        setError(`"${q.text}" needs at least one option (comma-separated).`)
        return
      }
    }

    setLoading(true)
    setError('')

    const customPayload: NewQuestionInput[] = customQuestions.map((q, i) => ({
      text: q.text.trim(),
      type: q.type,
      required: q.required,
      options: (q.type === 'select' || q.type === 'multiselect')
        ? q.optionsText.split(',').map((o) => o.trim()).filter(Boolean)
        : [],
      order_index: i,
    }))

    const result = await createEventWithQuestions(
      {
        title: form.title.trim(),
        date: form.date,
        event_type: form.event_type,
        max_male: parseInt(form.max_male),
        max_female: parseInt(form.max_female),
        group_link: form.group_link.trim() || null,
        registration_deadline: form.registration_deadline || null,
        meeting_point_url: form.meeting_point_url.trim() || null,
        distance: form.distance.trim() || null,
        pace_group: form.pace_group.trim() || null,
        cover_image_url: form.cover_image_url.trim() || null,
      },
      [], // new admin-authored defaults aren't built in this form — see Section 4 note below
      customPayload
    )

    setLoading(false)

    if (!result.ok) {
      setError(result.error)
      return
    }

    setSuccess(true)
    setForm({
      title: '', date: '', event_type: 'Running', max_male: '20', max_female: '20', group_link: '',
      registration_deadline: '', meeting_point_url: '', distance: '', pace_group: '', cover_image_url: '',
    })
    setCustomQuestions([])
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="card space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="md:col-span-2">
          <label className="block text-gray-300 text-sm font-medium mb-2">
            Event Title <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            name="title"
            value={form.title}
            onChange={handleChange}
            required
            placeholder="e.g. Weekend 5K Morning Run"
            className="input-field"
          />
        </div>

        <div>
          <label className="block text-gray-300 text-sm font-medium mb-2">
            Event Type <span className="text-red-400">*</span>
          </label>
          <select name="event_type" value={form.event_type} onChange={handleChange} required className="input-field">
            {EVENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-gray-300 text-sm font-medium mb-2">
            Event Date <span className="text-red-400">*</span>
          </label>
          <input
            type="date"
            name="date"
            value={form.date}
            onChange={handleChange}
            required
            className="input-field"
          />
        </div>

        <div>
          <label className="block text-gray-300 text-sm font-medium mb-2">
            Max Male Slots <span className="text-red-400">*</span>
          </label>
          <input
            type="number"
            name="max_male"
            value={form.max_male}
            onChange={handleChange}
            required
            min="1"
            max="500"
            className="input-field"
          />
        </div>

        <div>
          <label className="block text-gray-300 text-sm font-medium mb-2">
            Max Female Slots <span className="text-red-400">*</span>
          </label>
          <input
            type="number"
            name="max_female"
            value={form.max_female}
            onChange={handleChange}
            required
            min="1"
            max="500"
            className="input-field"
          />
        </div>

        <div>
          <label className="block text-gray-300 text-sm font-medium mb-2">
            Distance
          </label>
          <input
            type="text"
            name="distance"
            value={form.distance}
            onChange={handleChange}
            placeholder="e.g. 5K, 10K, Half Marathon"
            className="input-field"
          />
        </div>

        <div>
          <label className="block text-gray-300 text-sm font-medium mb-2">
            Pace Group
          </label>
          <input
            type="text"
            name="pace_group"
            value={form.pace_group}
            onChange={handleChange}
            placeholder="e.g. Beginner / All pace welcome"
            className="input-field"
          />
        </div>

        <div>
          <label className="block text-gray-300 text-sm font-medium mb-2">
            Registration Deadline
          </label>
          <input
            type="datetime-local"
            name="registration_deadline"
            value={form.registration_deadline}
            onChange={handleChange}
            className="input-field"
          />
        </div>

        <div>
          <label className="block text-gray-300 text-sm font-medium mb-2">
            Meeting Point URL
          </label>
          <input
            type="text"
            name="meeting_point_url"
            value={form.meeting_point_url}
            onChange={handleChange}
            placeholder="https://maps.google.com/..."
            className="input-field"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-gray-300 text-sm font-medium mb-2">
            WhatsApp Group Link
          </label>
          <input
            type="url"
            name="group_link"
            value={form.group_link}
            onChange={handleChange}
            placeholder="https://chat.whatsapp.com/..."
            className="input-field"
          />
          <p className="text-gray-600 text-xs mt-1">
            Included in the invite message sent to selected runners.
          </p>
        </div>

        <div className="md:col-span-2">
          <label className="block text-gray-300 text-sm font-medium mb-2">
            Cover Image URL (optional)
          </label>
          <input
            type="text"
            name="cover_image_url"
            value={form.cover_image_url}
            onChange={handleChange}
            placeholder="https://... — used as event thumbnail"
            className="input-field"
          />
        </div>
      </div>

      {/* Default questions preview — read-only, scoped to the selected event type */}
      <div className="border-t border-white/10 pt-5">
        <h3 className="text-white font-semibold text-sm mb-1">
          Default questions for {form.event_type} events
        </h3>
        <p className="text-gray-500 text-xs mb-3">
          These already apply to every {form.event_type} event and will be shown automatically —
          add or edit them from an existing {form.event_type} event's question list.
        </p>
        {loadingDefaults ? (
          <p className="text-gray-600 text-sm">Loading...</p>
        ) : defaultQuestions.length === 0 ? (
          <p className="text-gray-600 text-sm">No default questions set for {form.event_type} yet.</p>
        ) : (
          <ul className="space-y-2">
            {defaultQuestions.map((q) => (
              <li key={q.id} className="flex items-center gap-2 bg-white/[0.03] border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-300">
                <span className="text-gray-600 text-xs font-mono uppercase">{q.type}</span>
                {q.text}
                {q.required && <span className="text-red-400">*</span>}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Custom questions builder */}
      <div className="border-t border-white/10 pt-5 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-white font-semibold text-sm">Custom questions for this event</h3>
          <button type="button" onClick={addQuestion} className="btn-secondary text-xs py-1.5 px-3">
            + Add Question
          </button>
        </div>

        {customQuestions.length === 0 ? (
          <p className="text-gray-600 text-sm">No custom questions yet.</p>
        ) : (
          <div className="space-y-3">
            {customQuestions.map((q, i) => (
              <div key={q.key} className="border border-white/10 rounded-xl p-4 space-y-3 bg-white/[0.02]">
                <div className="flex items-start gap-2">
                  <div className="flex-1 space-y-3">
                    <input
                      type="text"
                      value={q.text}
                      onChange={(e) => updateQuestion(q.key, { text: e.target.value })}
                      placeholder="Question text"
                      className="input-field"
                    />
                    <div className="flex flex-wrap gap-3 items-center">
                      <select
                        value={q.type}
                        onChange={(e) => updateQuestion(q.key, { type: e.target.value as QuestionType })}
                        className="input-field w-auto"
                      >
                        {QUESTION_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                      </select>
                      <label className="flex items-center gap-2 text-sm text-gray-400">
                        <input
                          type="checkbox"
                          checked={q.required}
                          onChange={(e) => updateQuestion(q.key, { required: e.target.checked })}
                          className="accent-gold"
                        />
                        Required
                      </label>
                    </div>
                    {(q.type === 'select' || q.type === 'multiselect') && (
                      <input
                        type="text"
                        value={q.optionsText}
                        onChange={(e) => updateQuestion(q.key, { optionsText: e.target.value })}
                        placeholder="Options, comma-separated — e.g. Small, Medium, Large"
                        className="input-field"
                      />
                    )}
                  </div>
                  <div className="flex flex-col gap-1">
                    <button
                      type="button"
                      onClick={() => moveQuestion(i, -1)}
                      disabled={i === 0}
                      className="text-gray-500 hover:text-white disabled:opacity-30 disabled:hover:text-gray-500 text-xs px-2 py-1"
                      title="Move up"
                    >
                      ▲
                    </button>
                    <button
                      type="button"
                      onClick={() => moveQuestion(i, 1)}
                      disabled={i === customQuestions.length - 1}
                      className="text-gray-500 hover:text-white disabled:opacity-30 disabled:hover:text-gray-500 text-xs px-2 py-1"
                      title="Move down"
                    >
                      ▼
                    </button>
                    <button
                      type="button"
                      onClick={() => removeQuestion(q.key)}
                      className="text-red-400 hover:text-red-300 text-xs px-2 py-1"
                      title="Delete"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {error && (
        <p className="text-red-400 text-sm bg-red-900/20 border border-red-800/40 rounded-lg px-4 py-2">
          {error}
        </p>
      )}
      {success && (
        <p className="text-green-400 text-sm bg-green-900/20 border border-green-800/40 rounded-lg px-4 py-2">
          ✓ Event created successfully!
        </p>
      )}

      <button type="submit" disabled={loading} className="btn-primary">
        {loading ? 'Creating...' : 'Create Event'}
      </button>
    </form>
  )
}
