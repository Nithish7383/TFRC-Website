'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { Member, Registration } from '@/lib/types'
import { REASON_OPTIONS } from '@/lib/constants'
import StatusBadge from '@/components/ui/StatusBadge'

interface EventWithCounts {
  id: string
  title: string
  date: string
  max_male: number
  max_female: number
  distance: string | null
  pace_group: string | null
  registration_deadline: string | null
  male_count: number
  female_count: number
}

interface Props {
  member: Member
  events: EventWithCounts[]
  registrations: Registration[]
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-IN', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
  })
}

export default function MemberEventsList({ member, events, registrations }: Props) {
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])

  const [openEventId, setOpenEventId] = useState<string | null>(null)
  const [selectedReasons, setSelectedReasons] = useState<string[]>([])
  const [emergencyName, setEmergencyName] = useState(member.emergency_contact_name ?? '')
  const [emergencyPhone, setEmergencyPhone] = useState(member.emergency_contact_phone ?? '')
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [localRegs] = useState<Registration[]>(registrations)
  const [liveCounts, setLiveCounts] = useState<Record<string, { male: number; female: number }>>({})
  const [countsLoading, setCountsLoading] = useState(true)
  const [successEvent, setSuccessEvent] = useState<{
    eventId: string
    eventTitle: string
    eventDate: string
  } | null>(null)

  const fetchCounts = useCallback(async () => {
    setCountsLoading(true)
    try {
      const counts: Record<string, { male: number; female: number }> = {}
      for (const event of events) {
        const { data, error } = await supabase
          .from('registrations')
          .select('gender')
          .eq('event_id', event.id)
        if (!error && data) {
          counts[event.id] = {
            male: data.filter((r) => r.gender === 'Male').length,
            female: data.filter((r) => r.gender === 'Female').length,
          }
        } else {
          counts[event.id] = { male: 0, female: 0 }
        }
      }
      setLiveCounts(counts)
    } catch (e) {
      console.error('fetchCounts error:', e)
    } finally {
      setCountsLoading(false)
    }
  }, [events, supabase])

  useEffect(() => {
    fetchCounts()
    window.addEventListener('focus', fetchCounts)
    return () => window.removeEventListener('focus', fetchCounts)
  }, [fetchCounts])

  const getExistingReg = (eventId: string) =>
    localRegs.find((r) => r.event_id === eventId)

  const toggleReason = (r: string) =>
    setSelectedReasons((prev) =>
      prev.includes(r) ? prev.filter((x) => x !== r) : [...prev, r]
    )

  const openForm = (eventId: string) => {
    setOpenEventId(eventId)
    setSelectedReasons([])
    setSubmitError('')
  }

  const handleRegister = async (event: EventWithCounts) => {
    if (selectedReasons.length === 0) {
      setSubmitError('Please select at least one reason.')
      return
    }
    setSubmitting(true)
    setSubmitError('')

    const { data: dup } = await supabase
      .from('registrations')
      .select('id')
      .eq('event_id', event.id)
      .eq('phone', member.phone)
      .maybeSingle()

    if (dup) {
      setSubmitError('You have already registered for this event.')
      setSubmitting(false)
      return
    }

    const currentMale = liveCounts[event.id]?.male ?? 0
    const currentFemale = liveCounts[event.id]?.female ?? 0

    if (member.gender === 'Male' && currentMale >= event.max_male) {
      setSubmitError('Male slots are now full. Registration is closed.')
      setSubmitting(false)
      return
    }
    if (member.gender === 'Female' && currentFemale >= event.max_female) {
      setSubmitError('Female slots are now full. Registration is closed.')
      setSubmitting(false)
      return
    }

    const { error: insertError } = await supabase
      .from('registrations')
      .insert({
        event_id: event.id,
        name: member.name,
        age: member.age,
        place: member.place,
        phone: member.phone,
        gender: member.gender,
        occupation: member.occupation,
        reason: selectedReasons.join(', '),
        running_experience: member.running_experience,
        emergency_contact_name: emergencyName.trim() || null,
        emergency_contact_phone: emergencyPhone.trim() || null,
      })

    setSubmitting(false)

    if (insertError) {
      console.error('Registration insert error:', insertError)
      if (
        insertError.message?.toLowerCase().includes('slots are full') ||
        insertError.message?.toLowerCase().includes('male slots') ||
        insertError.message?.toLowerCase().includes('female slots') ||
        insertError.code === 'P0001'
      ) {
        setSubmitError('Sorry — slots just filled up. Registration is now closed for your gender.')
      } else if (
        insertError.message?.toLowerCase().includes('unique') ||
        insertError.message?.toLowerCase().includes('duplicate') ||
        insertError.code === '23505'
      ) {
        setSubmitError('You have already registered for this event.')
      } else {
        setSubmitError(`Registration failed: ${insertError.message}`)
      }
      return
    }

    setSuccessEvent({
      eventId: event.id,
      eventTitle: event.title,
      eventDate: event.date,
    })
    setOpenEventId(null)
    fetchCounts()
    setTimeout(() => router.refresh(), 2000)
  }

  if (events.length === 0) {
    return (
      <div className="card text-center py-10">
        <p className="text-gray-500">No active events right now. Check back soon!</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {events.map((event) => {
        const existingReg = getExistingReg(event.id)
        const maleCount = liveCounts[event.id]?.male
        const femaleCount = liveCounts[event.id]?.female
        const isMaleFull = !countsLoading && maleCount !== undefined && maleCount >= event.max_male
        const isFemaleFull = !countsLoading && femaleCount !== undefined && femaleCount >= event.max_female
        const memberGenderFull = member.gender === 'Male' ? isMaleFull : isFemaleFull
        const isPastDeadline =
          event.registration_deadline
            ? new Date() > new Date(event.registration_deadline)
            : false
        const isOpen = openEventId === event.id

        return (
          <div key={event.id} className="card space-y-3">
            {/* Event header */}
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div>
                <h3 className="text-white font-semibold text-base">{event.title}</h3>
                <p className="text-gray-400 text-sm">{formatDate(event.date)}</p>
              </div>
              {successEvent?.eventId === event.id ? (
                <span className="text-xs px-3 py-1.5 rounded-full bg-green-900/30 text-green-400 border border-green-800/40 font-medium">
                  ✓ Registered
                </span>
              ) : existingReg ? (
                <StatusBadge status={existingReg.status} />
              ) : isPastDeadline ? (
                <span className="text-xs px-3 py-1.5 rounded-full bg-white/5 text-gray-500 border border-white/10">
                  Registration closed
                </span>
              ) : memberGenderFull ? (
                <span className="text-xs px-3 py-1.5 rounded-full bg-red-900/20 text-red-400 border border-red-800/40">
                  {member.gender} — FULL
                </span>
              ) : (
                <button
                  onClick={() => isOpen ? setOpenEventId(null) : openForm(event.id)}
                  className="btn-primary text-sm py-2 px-4"
                >
                  {isOpen ? 'Cancel' : 'Register →'}
                </button>
              )}
            </div>

            {/* Slot counts */}
            <div className="flex gap-4 text-xs text-gray-500">
              {(event.distance || event.pace_group) && (
                <span className="text-gray-400">
                  {[event.distance, event.pace_group].filter(Boolean).join(' · ')}
                </span>
              )}
              <span className={isMaleFull ? 'text-red-400' : 'text-gray-500'}>
                ♂ {countsLoading ? '…' : (maleCount ?? '?')}/{event.max_male}
              </span>
              <span className={isFemaleFull ? 'text-red-400' : 'text-gray-500'}>
                ♀ {countsLoading ? '…' : (femaleCount ?? '?')}/{event.max_female}
              </span>
            </div>

            {/* Attended badge */}
            {existingReg?.attended && (
              <span className="inline-block text-xs bg-green-900/30 text-green-400 border border-green-800/40 px-2.5 py-1 rounded-full">
                Attended ✓
              </span>
            )}

            {/* Success card */}
            {successEvent?.eventId === event.id && (
              <div className="border-t border-white/10 pt-4">
                <div className="border-l-2 border-green-500 bg-green-900/10 rounded-xl p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 rounded-full bg-green-900/40 border border-green-700/50 flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <p className="text-green-400 font-semibold text-sm">You&apos;re registered!</p>
                  </div>
                  <div className="bg-white/[0.03] rounded-lg p-4 mt-3 space-y-3">
                    <div>
                      <p className="text-gray-400 text-xs uppercase tracking-wide font-mono">Event</p>
                      <p className="text-white font-medium">{successEvent.eventTitle}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-xs uppercase tracking-wide font-mono">Date</p>
                      <p className="text-white font-medium">
                        {new Date(successEvent.eventDate).toLocaleDateString('en-IN', {
                          weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
                        })}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-xs uppercase tracking-wide font-mono">Status</p>
                      <p className="text-white font-medium flex items-center gap-2 flex-wrap">
                        <span className="bg-white/5 text-gray-400 border border-white/15 text-xs px-2 py-0.5 rounded-full">Pending</span>
                        <span className="text-gray-400 text-sm font-normal">— you&apos;ll be notified on WhatsApp if selected</span>
                      </p>
                    </div>
                  </div>
                  <p className="text-gray-500 text-xs mt-3">Refreshing your profile…</p>
                </div>
              </div>
            )}

            {/* Inline registration form */}
            {!successEvent && isOpen && (
              <div className="border-t border-white/10 pt-4 space-y-4">
                <p className="text-gray-300 text-sm font-medium">Why do you want to join this run?</p>
                <div className="grid grid-cols-2 gap-2">
                  {REASON_OPTIONS.map((reason) => (
                    <label
                      key={reason}
                      className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                        selectedReasons.includes(reason)
                          ? 'border-gold/60 bg-gold/10'
                          : 'border-white/10 hover:border-white/25'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedReasons.includes(reason)}
                        onChange={() => toggleReason(reason)}
                        className="accent-gold"
                      />
                      <span className="text-sm text-gray-300">{reason}</span>
                    </label>
                  ))}
                </div>

                {/* Safety info */}
                <div className="border border-white/10 rounded-xl overflow-hidden">
                  <div className="px-4 py-3 bg-white/[0.03]">
                    <p className="text-gray-400 text-xs font-medium">Safety info (optional)</p>
                  </div>
                  <div className="px-4 pb-4 pt-3 space-y-3 bg-white/[0.015]">
                    <div>
                      <label className="block text-gray-400 text-xs mb-1">Emergency contact name</label>
                      <input
                        type="text"
                        value={emergencyName}
                        onChange={(e) => setEmergencyName(e.target.value)}
                        placeholder="e.g. Ramesh Kumar"
                        className="input-field"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-400 text-xs mb-1">Emergency contact phone</label>
                      <input
                        type="tel"
                        value={emergencyPhone}
                        onChange={(e) => setEmergencyPhone(e.target.value)}
                        placeholder="e.g. 9876543210"
                        className="input-field"
                      />
                    </div>
                  </div>
                </div>

                {submitError && (
                  <div className="bg-red-900/20 border border-red-800/50 rounded-lg px-4 py-3 text-red-400 text-sm">
                    {submitError}
                  </div>
                )}

                <button
                  onClick={() => handleRegister(event)}
                  disabled={submitting}
                  className="btn-primary w-full"
                >
                  {submitting ? 'Registering...' : 'Confirm Registration →'}
                </button>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
