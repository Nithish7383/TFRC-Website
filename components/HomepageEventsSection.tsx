'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase'
import { normalizePhone } from '@/lib/constants'
import { Event, Gender } from '@/lib/types'
import EventsCarousel from '@/components/EventsCarousel'
import Reveal from '@/components/ui/Reveal'
import QuickJoinForm, { QuickJoinedMember } from '@/components/QuickJoinForm'

interface EventWithSlots extends Event {
  slotsLeft: number
}

interface Props {
  events: EventWithSlots[]
  whatsappLink?: string
}

// Matches the columns returned by get_member_for_registration() — a
// column-scoped RPC, not the full members row. See supabase-v7-member-auth.sql.
interface MemberForRegistration {
  member_id: string
  name: string
  age: number
  gender: Gender
  place: string
  occupation: string
  running_experience: string
}

export default function HomepageEventsSection({ events }: Props) {
  const supabase = createClient()
  const router = useRouter()

  const [registerOpenFor, setRegisterOpenFor] = useState<EventWithSlots | null>(null)
  const [phoneInput, setPhoneInput] = useState('')
  const [looking, setLooking] = useState(false)
  const [notFound, setNotFound] = useState(false)
  const [member, setMember] = useState<MemberForRegistration | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const resetModal = () => {
    setRegisterOpenFor(null)
    setPhoneInput('')
    setLooking(false)
    setNotFound(false)
    setMember(null)
    setSubmitting(false)
    setError('')
  }

  const handleRegisterClick = (event: EventWithSlots) => {
    // Paid events skip this quick modal entirely — the payment-screenshot
    // upload step only lives in the full /register form.
    if (event.is_paid) {
      router.push(`/register?event=${event.id}`)
      return
    }
    setRegisterOpenFor(event)
  }

  const handlePhoneLookup = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!phoneInput.trim()) return
    setLooking(true)
    setNotFound(false)
    setError('')

    const { data } = await supabase
      .rpc('get_member_for_registration', { lookup_phone: normalizePhone(phoneInput) })
      .maybeSingle()

    setLooking(false)

    if (!data) {
      setNotFound(true)
      setMember(null)
      return
    }

    setMember(data as MemberForRegistration)
  }

  // Only ever reached for free events — handleRegisterClick redirects paid
  // events straight to /register before this modal (and this function) can
  // be reached, so no payment handling is needed here.
  const handleConfirm = async (memberOverride?: MemberForRegistration) => {
    const registrant = memberOverride ?? member
    if (!registerOpenFor || !registrant) return
    setSubmitting(true)
    setError('')

    const normalizedPhone = normalizePhone(phoneInput)

    const { data: existing } = await supabase
      .from('registrations')
      .select('id')
      .eq('event_id', registerOpenFor.id)
      .eq('phone', normalizedPhone)
      .maybeSingle()

    if (existing) {
      setError('You have already registered for this event with this phone number.')
      setSubmitting(false)
      return
    }

    const { error: insertError } = await supabase.from('registrations').insert({
      event_id: registerOpenFor.id,
      name: registrant.name,
      age: registrant.age,
      place: registrant.place,
      phone: normalizedPhone,
      gender: registrant.gender,
      occupation: registrant.occupation,
      reason: 'Registered via homepage',
      running_experience: registrant.running_experience || null,
    })

    setSubmitting(false)

    if (insertError) {
      if (
        insertError.message?.toLowerCase().includes('slots are full') ||
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
      return
    }

    // Show the event they registered for, not the generic homepage.
    const params = new URLSearchParams({
      name: registrant.name,
      event: registerOpenFor.title,
      date: registerOpenFor.date,
      event_id: registerOpenFor.id,
    })
    router.push(`/confirmation?${params.toString()}`)
  }

  // A brand-new visitor just created their membership from the event card —
  // register them for this event straight away instead of asking again.
  const handleQuickJoined = async (joined: QuickJoinedMember) => {
    const newMember: MemberForRegistration = {
      member_id: joined.member_id,
      name: joined.name,
      age: joined.age,
      gender: joined.gender,
      place: '',
      occupation: '',
      running_experience: '',
    }
    setMember(newMember)
    setNotFound(false)
    await handleConfirm(newMember)
  }

  if (events.length === 0) return null

  return (
    <section id="events" className="relative border-t border-white/10 py-20 md:py-28 px-4 overflow-hidden">
      <div className="relative max-w-5xl mx-auto">
        <Reveal>
          <div className="text-center mb-12">
            <p className="eyebrow eyebrow-line mb-3">On the calendar</p>
            <h2 className="heading-display text-white text-3xl md:text-5xl">
              Upcoming <span className="text-gold-sheen">Events</span>
            </h2>
          </div>
        </Reveal>

        <EventsCarousel
          events={events}
          onRegisterClick={handleRegisterClick}
        />
      </div>

      <AnimatePresence>
      {registerOpenFor && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center px-4"
          onClick={resetModal}
        >
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.97 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="card max-w-sm w-full space-y-5 border-gold/20 shadow-gold-glow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            {member ? (
              <div className="text-center space-y-5">
                <div>
                  <p className="eyebrow mb-2 justify-center w-full">Confirm</p>
                  <h2 className="heading-display text-white text-xl">
                    Register {member.name.trim().split(/\s+/)[0]} for {registerOpenFor.title}?
                  </h2>
                </div>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: [0, -6, 6, -4, 4, 0] }}
                    transition={{ duration: 0.4 }}
                    className="bg-red-900/20 border border-red-800/50 rounded-lg px-4 py-3 text-red-400 text-sm"
                  >
                    {error}
                  </motion.div>
                )}
                <div className="flex flex-col gap-3">
                  <button onClick={() => handleConfirm()} disabled={submitting} className="btn-primary w-full text-center">
                    {submitting ? 'Registering...' : 'Confirm Registration →'}
                  </button>
                  <button onClick={resetModal} className="btn-secondary w-full text-center">
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-5">
                <div>
                  <h2 className="text-white font-semibold text-lg mb-1">Find your member profile</h2>
                  <p className="text-gray-400 text-sm">Enter the phone number you used to join TFRC.</p>
                </div>
                <form onSubmit={handlePhoneLookup} className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="tel"
                    value={phoneInput}
                    onChange={(e) => { setPhoneInput(e.target.value); setNotFound(false) }}
                    placeholder="e.g. 9876543210"
                    required
                    autoFocus
                    className="input-field flex-1"
                  />
                  <button type="submit" disabled={looking} className="btn-primary whitespace-nowrap">
                    {looking ? 'Checking...' : 'Continue →'}
                  </button>
                </form>

                {notFound && (
                  <div className="border-t border-white/10 pt-5">
                    {submitting && <p className="text-gold text-sm mb-3">Registering you...</p>}
                    {error && (
                      <div className="bg-red-900/20 border border-red-800/50 rounded-lg px-4 py-3 text-red-400 text-sm mb-3">
                        {error}
                      </div>
                    )}
                    <QuickJoinForm
                      phone={phoneInput}
                      onJoined={handleQuickJoined}
                      onCancel={() => { setNotFound(false); setError('') }}
                    />
                  </div>
                )}

                <button onClick={resetModal} className="text-gray-500 hover:text-gray-300 text-sm w-full text-center">
                  Cancel
                </button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
      </AnimatePresence>
    </section>
  )
}
