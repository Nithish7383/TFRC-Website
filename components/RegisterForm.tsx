'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { Event, Gender, Question } from '@/lib/types'
import { REASON_OPTIONS, normalizePhone } from '@/lib/constants'
import EventPreviewCard from '@/components/EventPreviewCard'
import { createRegistrationResponses } from '@/app/register/actions'
import { validatePhotoFile } from '@/lib/photo-upload'
import { uploadPaymentScreenshot } from '@/lib/payment-upload'

interface EventWithCounts extends Event {
  male_count: number
  female_count: number
  questions?: Question[]
}

// Matches the columns returned by get_member_for_registration() — a
// column-scoped RPC, not the full members row. See supabase-v7-member-auth.sql
// for why /register can't just select('*') on members anymore.
interface MemberForRegistration {
  member_id: string
  name: string
  age: number
  gender: Gender
  place: string
  occupation: string
  running_experience: string
}

interface Props {
  events: EventWithCounts[]
  preselectedEventId?: string
  paymentQrUrl?: string | null
}

export default function RegisterForm({ events, preselectedEventId, paymentQrUrl }: Props) {
  const router = useRouter()
  const supabase = createClient()

  // Member gate state
  const [phoneInput, setPhoneInput] = useState('')
  const [member, setMember] = useState<MemberForRegistration | null>(null)
  const [memberChecked, setMemberChecked] = useState(false)
  const [memberLooking, setMemberLooking] = useState(false)
  const [memberNotFound, setMemberNotFound] = useState(false)

  const [form, setForm] = useState({
    event_id: preselectedEventId || '',
    name: '',
    age: '',
    place: '',
    phone: '',
    gender: '',
    occupation: '',
    reasons: [] as string[],
    running_experience: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    payment_screenshot_url: '',
    payment_screenshot_path: '',
  })
  const [safetyOpen, setSafetyOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [liveCounts, setLiveCounts] = useState<{ male: number; female: number } | null>(null)
  const [questionAnswers, setQuestionAnswers] = useState<Record<string, string | string[]>>({})
  const [uploadingPayment, setUploadingPayment] = useState(false)
  const [paymentUploadError, setPaymentUploadError] = useState('')
  const paymentFileInputRef = useRef<HTMLInputElement>(null)

  const selectedEvent = events.find((e) => e.id === form.event_id)
  const eventQuestions = selectedEvent?.questions || []

  const setAnswer = (questionId: string, value: string | string[]) => {
    setQuestionAnswers((prev) => ({ ...prev, [questionId]: value }))
    setError('')
  }

  const toggleMultiselectAnswer = (questionId: string, option: string) => {
    setQuestionAnswers((prev) => {
      const current = (prev[questionId] as string[] | undefined) || []
      const next = current.includes(option)
        ? current.filter((o) => o !== option)
        : [...current, option]
      return { ...prev, [questionId]: next }
    })
    setError('')
  }

  useEffect(() => {
    if (!form.event_id) { setLiveCounts(null); return }
    const fetchCounts = async () => {
      const { count: m } = await supabase
        .from('registrations')
        .select('*', { count: 'exact', head: true })
        .eq('event_id', form.event_id)
        .eq('gender', 'Male')
      const { count: f } = await supabase
        .from('registrations')
        .select('*', { count: 'exact', head: true })
        .eq('event_id', form.event_id)
        .eq('gender', 'Female')
      setLiveCounts({ male: m ?? 0, female: f ?? 0 })
    }
    fetchCounts()
  }, [form.event_id])

  const isPastDeadline =
    selectedEvent?.registration_deadline
      ? new Date() > new Date(selectedEvent.registration_deadline)
      : false

  const maleCount = liveCounts?.male ?? selectedEvent?.male_count ?? 0
  const femaleCount = liveCounts?.female ?? selectedEvent?.female_count ?? 0
  const maxMale = selectedEvent?.max_male ?? 0
  const maxFemale = selectedEvent?.max_female ?? 0
  const isMaleFull = selectedEvent ? maleCount >= maxMale : false
  const isFemaleFull = selectedEvent ? femaleCount >= maxFemale : false

  const handlePhoneLookup = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!phoneInput.trim()) return
    setMemberLooking(true)
    setMemberNotFound(false)
    setMemberChecked(false)

    const normalizedPhone = normalizePhone(phoneInput)

    const { data } = await supabase
      .rpc('get_member_for_registration', { lookup_phone: normalizedPhone })
      .maybeSingle()

    setMemberLooking(false)
    setMemberChecked(true)

    if (!data) {
      setMemberNotFound(true)
      setMember(null)
      return
    }

    const m = data as MemberForRegistration
    setMember(m)
    setMemberNotFound(false)
    setForm((prev) => ({
      ...prev,
      phone: normalizedPhone,
      name: m.name,
      age: String(m.age),
      gender: m.gender,
      place: m.place,
      occupation: m.occupation,
      running_experience: m.running_experience,
    }))
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
    if (e.target.name === 'event_id') setQuestionAnswers({})
    setError('')
  }

  const handlePaymentFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const validationError = validatePhotoFile(file)
    if (validationError) {
      setPaymentUploadError(validationError)
      if (paymentFileInputRef.current) paymentFileInputRef.current.value = ''
      return
    }

    setUploadingPayment(true)
    setPaymentUploadError('')

    const uploaded = await uploadPaymentScreenshot(supabase, file)
    setUploadingPayment(false)

    if ('error' in uploaded) {
      setPaymentUploadError(uploaded.error)
      if (paymentFileInputRef.current) paymentFileInputRef.current.value = ''
      return
    }

    setForm((prev) => ({ ...prev, payment_screenshot_url: uploaded.url, payment_screenshot_path: uploaded.path }))
    setError('')
  }

  const toggleReason = (reason: string) => {
    setForm((prev) => ({
      ...prev,
      reasons: prev.reasons.includes(reason)
        ? prev.reasons.filter((r) => r !== reason)
        : [...prev.reasons, reason],
    }))
    setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.event_id) { setError('Please select an event.'); return }
    if (!form.gender) { setError('Please select your gender.'); return }
    if (form.reasons.length === 0) { setError('Please select at least one reason.'); return }
    if (isPastDeadline) { setError('Registration is closed. The deadline has passed.'); return }
    if (selectedEvent?.is_paid && !form.payment_screenshot_url) {
      setError('Please upload your payment screenshot to continue.')
      return
    }

    for (const q of eventQuestions) {
      if (!q.required) continue
      const answer = questionAnswers[q.id]
      const isEmpty = q.type === 'multiselect' ? !(answer as string[] | undefined)?.length : !answer
      if (isEmpty) {
        setError(`Please answer: ${q.text}`)
        return
      }
    }

    const ageNum = parseInt(form.age)
    if (!form.age || Number.isNaN(ageNum)) {
      setError('Please enter a valid age.')
      return
    }

    setLoading(true)
    setError('')

    if (form.gender === 'Male' || form.gender === 'Female') {
      const { count: currentCount } = await supabase
        .from('registrations')
        .select('*', { count: 'exact', head: true })
        .eq('event_id', form.event_id)
        .eq('gender', form.gender)

      const { data: eventLimits } = await supabase
        .from('events')
        .select('max_male, max_female')
        .eq('id', form.event_id)
        .single()

      const limit = form.gender === 'Male'
        ? (eventLimits?.max_male ?? maxMale)
        : (eventLimits?.max_female ?? maxFemale)

      if ((currentCount ?? 0) >= limit) {
        setError(`${form.gender} slots are now full. Registration is closed for ${form.gender.toLowerCase()} participants.`)
        setLoading(false)
        return
      }
    }

    const { data: existing } = await supabase
      .from('registrations')
      .select('id')
      .eq('event_id', form.event_id)
      .eq('phone', form.phone.trim())
      .maybeSingle()

    if (existing) {
      setError('You have already registered for this event with this phone number.')
      setLoading(false)
      return
    }

    const { data: inserted, error: insertError } = await supabase
      .from('registrations')
      .insert({
        event_id: form.event_id,
        name: form.name.trim(),
        age: ageNum,
        place: form.place.trim(),
        phone: form.phone.trim(),
        gender: form.gender,
        occupation: form.occupation.trim(),
        reason: form.reasons.join(', '),
        running_experience: form.running_experience || null,
        emergency_contact_name: form.emergency_contact_name.trim() || null,
        emergency_contact_phone: form.emergency_contact_phone.trim() || null,
        payment_screenshot_url: selectedEvent?.is_paid ? form.payment_screenshot_url : null,
        payment_screenshot_path: selectedEvent?.is_paid ? form.payment_screenshot_path : null,
        payment_status: selectedEvent?.is_paid ? 'pending' : 'not_required',
      })
      .select('id')
      .single()

    if (insertError) {
      if (insertError.message?.toLowerCase().includes('payment screenshot is required')) {
        setError('Please upload your payment screenshot to continue.')
      } else if (
        insertError.message?.toLowerCase().includes('slots are full') ||
        insertError.message?.toLowerCase().includes('male slots') ||
        insertError.message?.toLowerCase().includes('female slots') ||
        (insertError as { code?: string }).code === 'P0001'
      ) {
        setError('Sorry — slots just filled up. Registration is now closed for your gender.')
      } else if (
        insertError.message?.toLowerCase().includes('unique') ||
        insertError.message?.toLowerCase().includes('duplicate') ||
        (insertError as { code?: string }).code === '23505'
      ) {
        setError('You have already registered for this event.')
      } else {
        setError(`Registration failed: ${insertError.message}`)
      }
      setLoading(false)
      return
    }

    if (eventQuestions.length > 0 && inserted) {
      const answers = eventQuestions
        .filter((q) => questionAnswers[q.id] !== undefined)
        .map((q) => {
          const raw = questionAnswers[q.id]
          return { question_id: q.id, answer: Array.isArray(raw) ? raw.join(', ') : raw }
        })
      await createRegistrationResponses(inserted.id, answers)
    }

    const params = new URLSearchParams({
      name: form.name,
      event: selectedEvent?.title || '',
      date: selectedEvent?.date || '',
    })
    router.push(`/confirmation?${params.toString()}`)
  }

  // Step 1: Phone lookup gate
  if (!memberChecked || (memberChecked && !member && !memberNotFound)) {
    return (
      <div className="card space-y-5">
        <div>
          <h2 className="text-white font-semibold text-lg mb-1">First, let&apos;s find your member profile</h2>
          <p className="text-gray-400 text-sm">Enter the WhatsApp number you used to join TFRC.</p>
        </div>
        <form onSubmit={handlePhoneLookup} className="flex flex-col sm:flex-row gap-3">
          <input
            type="tel"
            value={phoneInput}
            onChange={(e) => setPhoneInput(e.target.value)}
            placeholder="e.g. 9876543210"
            required
            className="input-field flex-1"
          />
          <button type="submit" disabled={memberLooking} className="btn-primary whitespace-nowrap">
            {memberLooking ? 'Checking...' : 'Continue →'}
          </button>
        </form>
      </div>
    )
  }

  // Not a member — phone lookup stays visible behind a popup prompting them to join
  if (memberNotFound) {
    return (
      <div className="card space-y-5">
        <form onSubmit={handlePhoneLookup} className="flex flex-col sm:flex-row gap-3">
          <input
            type="tel"
            value={phoneInput}
            onChange={(e) => { setPhoneInput(e.target.value); setMemberChecked(false); setMemberNotFound(false) }}
            placeholder="e.g. 9876543210"
            className="input-field flex-1"
          />
          <button type="submit" disabled={memberLooking} className="btn-primary whitespace-nowrap">
            {memberLooking ? 'Checking...' : 'Continue →'}
          </button>
        </form>

        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/70 backdrop-blur-sm">
          <div className="card max-w-sm w-full border-gold/30 space-y-4 relative">
            <button
              type="button"
              onClick={() => setMemberNotFound(false)}
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-300 text-xl leading-none px-1"
              aria-label="Close"
            >
              ×
            </button>
            <div className="w-12 h-12 rounded-full bg-gold/10 border border-gold/30 flex items-center justify-center">
              <svg className="w-6 h-6 text-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
            </div>
            <div>
              <p className="text-white font-semibold text-lg">You&apos;re not a member yet</p>
              <p className="text-gray-400 text-sm mt-1">
                This number isn&apos;t registered with TFRC. Create a free member profile first — it only takes a minute — then come back here to register for events.
              </p>
            </div>
            <a href="/join" className="btn-primary w-full text-center block">
              Join as Member →
            </a>
            <button
              type="button"
              onClick={() => setMemberNotFound(false)}
              className="text-gray-500 hover:text-gray-300 text-sm w-full text-center"
            >
              Try a different number
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Member found — show full form
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Member badge */}
      {member && (
        <div className="flex items-center gap-3 bg-green-900/20 border border-green-800/30 rounded-xl px-4 py-3">
          <svg className="w-5 h-5 text-green-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <div>
            <span className="text-green-400 text-sm font-medium">Member: {member.member_id}</span>
            <span className="text-gray-500 text-xs ml-2">— {member.name}</span>
          </div>
        </div>
      )}

      {/* Event Selector */}
      <div className="card">
        <label className="block text-gray-300 text-sm font-medium mb-2">
          Select Event <span className="text-red-400">*</span>
        </label>
        {events.length === 0 ? (
          <div className="input-field text-gray-500">No active events available.</div>
        ) : (
          <select
            name="event_id"
            value={form.event_id}
            onChange={handleChange}
            required
            className="input-field"
          >
            <option value="">— Choose an event —</option>
            {events.map((event) => (
              <option key={event.id} value={event.id}>
                {event.title} —{' '}
                {new Date(event.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
              </option>
            ))}
          </select>
        )}

        {isPastDeadline && (
          <p className="mt-3 text-red-400 text-sm font-medium bg-red-900/20 border border-red-800/40 rounded-lg px-4 py-3">
            Registration closed. Deadline has passed.
          </p>
        )}
      </div>

      {/* Event Preview Card */}
      {selectedEvent && (
        <EventPreviewCard event={selectedEvent} />
      )}

      <div className="card space-y-5">
        <h2 className="heading-display text-white text-xl border-b border-white/10 pb-3">Your Details</h2>

        {/* Name */}
        <div>
          <label className="block text-gray-300 text-sm font-medium mb-2">
            Full Name <span className="text-red-400">*</span>
          </label>
          <input type="text" name="name" value={form.name} onChange={handleChange} required placeholder="e.g. Priya Ramesh" className="input-field" />
        </div>

        {/* Age */}
        <div>
          <label className="block text-gray-300 text-sm font-medium mb-2">
            Age <span className="text-red-400">*</span>
          </label>
          <input type="number" name="age" value={form.age} onChange={handleChange} required min="10" max="80" placeholder="e.g. 28" className="input-field" />
        </div>

        {/* Gender */}
        <div>
          <label className="block text-gray-300 text-sm font-medium mb-2">
            Gender <span className="text-red-400">*</span>
          </label>
          <div className="flex gap-3">
            <button
              type="button"
              disabled={isMaleFull}
              onClick={() => { if (!isMaleFull) { setForm((p) => ({ ...p, gender: 'Male' })); setError('') } }}
              className={`flex-1 py-3 px-4 rounded-xl border-2 text-sm font-semibold transition-all ${
                isMaleFull
                  ? 'border-red-800/50 text-red-400 bg-red-900/10 cursor-not-allowed'
                  : form.gender === 'Male'
                  ? 'border-gold text-gold bg-gold/10'
                  : 'border-white/15 text-gray-400 hover:border-white/30'
              }`}
            >
              {isMaleFull ? 'Male — FULL' : selectedEvent ? `Male (${maleCount}/${maxMale})` : 'Male'}
            </button>
            <button
              type="button"
              disabled={isFemaleFull}
              onClick={() => { if (!isFemaleFull) { setForm((p) => ({ ...p, gender: 'Female' })); setError('') } }}
              className={`flex-1 py-3 px-4 rounded-xl border-2 text-sm font-semibold transition-all ${
                isFemaleFull
                  ? 'border-red-800/50 text-red-400 bg-red-900/10 cursor-not-allowed'
                  : form.gender === 'Female'
                  ? 'border-gold text-gold bg-gold/10'
                  : 'border-white/15 text-gray-400 hover:border-white/30'
              }`}
            >
              {isFemaleFull ? 'Female — FULL' : selectedEvent ? `Female (${femaleCount}/${maxFemale})` : 'Female'}
            </button>
          </div>
          {selectedEvent && (
            <div className="mt-3 space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-blue-400 text-xs w-14">Male</span>
                <div className="flex-1 bg-white/10 rounded-full h-1.5 overflow-hidden">
                  <div className={`h-full rounded-full transition-all ${isMaleFull ? 'bg-red-500' : 'bg-blue-500'}`} style={{ width: `${Math.min((maleCount / Math.max(maxMale, 1)) * 100, 100)}%` }} />
                </div>
                <span className={`text-xs w-12 text-right ${isMaleFull ? 'text-red-400' : 'text-gray-500'}`}>{maleCount}/{maxMale}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-pink-400 text-xs w-14">Female</span>
                <div className="flex-1 bg-white/10 rounded-full h-1.5 overflow-hidden">
                  <div className={`h-full rounded-full transition-all ${isFemaleFull ? 'bg-red-500' : 'bg-pink-500'}`} style={{ width: `${Math.min((femaleCount / Math.max(maxFemale, 1)) * 100, 100)}%` }} />
                </div>
                <span className={`text-xs w-12 text-right ${isFemaleFull ? 'text-red-400' : 'text-gray-500'}`}>{femaleCount}/{maxFemale}</span>
              </div>
            </div>
          )}
        </div>

        {/* Place */}
        <div>
          <label className="block text-gray-300 text-sm font-medium mb-2">City / Area <span className="text-red-400">*</span></label>
          <input type="text" name="place" value={form.place} onChange={handleChange} required placeholder="e.g. Anna Nagar, Chennai" className="input-field" />
        </div>

        {/* Occupation */}
        <div>
          <label className="block text-gray-300 text-sm font-medium mb-2">Occupation <span className="text-red-400">*</span></label>
          <input type="text" name="occupation" value={form.occupation} onChange={handleChange} required placeholder="e.g. Software Engineer, Student" className="input-field" />
        </div>

        {/* Running Experience (pre-filled, editable) */}
        <div>
          <label className="block text-gray-300 text-sm font-medium mb-2">Running Experience <span className="text-red-400">*</span></label>
          <div className="grid grid-cols-2 gap-3">
            {([
              { value: 'First timer', label: 'First timer' },
              { value: 'Casual', label: 'Casual (1–2/month)' },
              { value: 'Regular', label: 'Regular (weekly)' },
              { value: 'Competitive', label: 'Competitive' },
            ] as const).map(({ value, label }) => (
              <button
                key={value}
                type="button"
                onClick={() => { setForm((p) => ({ ...p, running_experience: value })); setError('') }}
                className={`py-3 px-4 rounded-xl border-2 text-sm font-medium transition-all text-left ${
                  form.running_experience === value
                    ? 'border-gold text-gold bg-gold/10'
                    : 'border-white/15 text-gray-400 hover:border-white/30'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Reason — multi-select */}
        <div>
          <label className="block text-gray-300 text-sm font-medium mb-3">
            Why do you want to join? <span className="text-red-400">*</span>
          </label>
          <div className="grid grid-cols-2 gap-2">
            {REASON_OPTIONS.map((reason) => (
              <label
                key={reason}
                className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                  form.reasons.includes(reason)
                    ? 'border-gold/60 bg-gold/10'
                    : 'border-white/10 hover:border-white/25'
                }`}
              >
                <input
                  type="checkbox"
                  checked={form.reasons.includes(reason)}
                  onChange={() => toggleReason(reason)}
                  className="accent-gold"
                />
                <span className="text-sm text-gray-300">{reason}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Emergency Contact — accordion */}
        <div className="border border-white/10 rounded-xl overflow-hidden">
          <button
            type="button"
            onClick={() => setSafetyOpen((o) => !o)}
            className="w-full flex items-center justify-between px-5 py-4 text-left bg-white/[0.03] hover:bg-white/[0.06] transition-colors"
          >
            <span className="flex items-center gap-2 text-gray-300 text-sm font-medium">
              Safety info
              <span className="text-[10px] font-mono uppercase tracking-wide text-gray-500 border border-white/15 rounded-full px-2 py-0.5">Optional</span>
            </span>
            <span className="text-gray-500 text-lg">{safetyOpen ? '▲' : '▼'}</span>
          </button>
          {safetyOpen && (
            <div className="px-5 pb-5 pt-4 space-y-4 bg-white/[0.015]">
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">Emergency contact name</label>
                <input type="text" name="emergency_contact_name" value={form.emergency_contact_name} onChange={handleChange} placeholder="e.g. Ramesh Kumar" className="input-field" />
              </div>
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">Emergency contact phone number</label>
                <input type="tel" name="emergency_contact_phone" value={form.emergency_contact_phone} onChange={handleChange} placeholder="e.g. 9876543210" className="input-field" />
              </div>
            </div>
          )}
        </div>

        {/* Event-specific questions */}
        {eventQuestions.length > 0 && (
          <div className="space-y-4 border-t border-white/10 pt-5">
            <h3 className="text-white font-semibold text-sm">A few more questions for this event</h3>
            {eventQuestions.map((q) => (
              <div key={q.id}>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  {q.text} {q.required && <span className="text-red-400">*</span>}
                </label>

                {(q.type === 'text' || q.type === 'number' || q.type === 'date') && (
                  <input
                    type={q.type}
                    value={(questionAnswers[q.id] as string) || ''}
                    onChange={(e) => setAnswer(q.id, e.target.value)}
                    className="input-field"
                  />
                )}

                {q.type === 'textarea' && (
                  <textarea
                    value={(questionAnswers[q.id] as string) || ''}
                    onChange={(e) => setAnswer(q.id, e.target.value)}
                    rows={3}
                    className="input-field resize-none"
                  />
                )}

                {q.type === 'select' && (
                  <select
                    value={(questionAnswers[q.id] as string) || ''}
                    onChange={(e) => setAnswer(q.id, e.target.value)}
                    className="input-field"
                  >
                    <option value="">— Select —</option>
                    {q.options.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                )}

                {q.type === 'multiselect' && (
                  <div className="grid grid-cols-2 gap-2">
                    {q.options.map((opt) => {
                      const selected = ((questionAnswers[q.id] as string[]) || []).includes(opt)
                      return (
                        <label
                          key={opt}
                          className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                            selected ? 'border-gold/60 bg-gold/10' : 'border-white/10 hover:border-white/25'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={selected}
                            onChange={() => toggleMultiselectAnswer(q.id, opt)}
                            className="accent-gold"
                          />
                          <span className="text-sm text-gray-300">{opt}</span>
                        </label>
                      )
                    })}
                  </div>
                )}

                {q.type === 'checkbox' && (
                  <label className="flex items-center gap-3 p-3 rounded-lg border border-white/10 cursor-pointer w-fit">
                    <input
                      type="checkbox"
                      checked={questionAnswers[q.id] === 'true'}
                      onChange={(e) => setAnswer(q.id, e.target.checked ? 'true' : 'false')}
                      className="accent-gold"
                    />
                    <span className="text-sm text-gray-300">Yes</span>
                  </label>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Payment — only for paid events, required before submit */}
      {selectedEvent?.is_paid && (
        <div className="card space-y-4">
          <h2 className="heading-display text-white text-xl border-b border-white/10 pb-3">Payment</h2>
          <p className="text-gray-300 text-sm">
            This event costs <span className="text-gold font-semibold">₹{selectedEvent.price_inr}</span>.
            Scan the QR code below to pay, then upload a screenshot of your payment confirmation.
          </p>

          {paymentQrUrl ? (
            <img src={paymentQrUrl} alt="Payment QR code" className="w-48 h-48 object-contain rounded-lg border border-white/10 bg-white p-2 mx-auto" />
          ) : (
            <p className="text-red-400 text-sm bg-red-900/20 border border-red-800/40 rounded-lg px-4 py-2">
              Payment QR code isn&apos;t set up yet — please contact us before registering.
            </p>
          )}

          <div>
            <label className="block text-gray-300 text-sm font-medium mb-2">
              Payment Screenshot <span className="text-red-400">*</span>
            </label>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              ref={paymentFileInputRef}
              onChange={handlePaymentFileChange}
              disabled={uploadingPayment}
              className="input-field"
            />
            {uploadingPayment && <p className="text-gold text-xs mt-1">Uploading...</p>}
            {paymentUploadError && <p className="text-red-400 text-xs mt-1">{paymentUploadError}</p>}
            {form.payment_screenshot_url && (
              <div className="mt-2 flex items-center gap-3">
                <img src={form.payment_screenshot_url} alt="Payment screenshot preview" className="w-16 h-16 object-cover rounded-lg border border-white/10" />
                <span className="text-green-400 text-xs">Screenshot uploaded ✓</span>
              </div>
            )}
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-900/20 border border-red-800/50 rounded-lg px-4 py-3 text-red-400 text-sm">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading || isPastDeadline || events.length === 0}
        className="btn-primary w-full text-center"
      >
        {loading ? 'Submitting...' : 'Submit Registration'}
      </button>
    </form>
  )
}
