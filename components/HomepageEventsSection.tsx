'use client'

import { useState, useEffect, useCallback } from 'react'
import { Event } from '@/lib/types'
import MemberLoginModal from '@/components/MemberLoginModal'
import ConfirmRegisterCard from '@/components/ConfirmRegisterCard'
import EventCard from '@/components/EventCard'
import { getSessionMember } from '@/app/register/session-actions'

interface EventWithSlots extends Event {
  slotsLeft: number
}

interface Props {
  events: EventWithSlots[]
  whatsappLink?: string
}

export default function HomepageEventsSection({ events, whatsappLink }: Props) {
  const [memberFirstName, setMemberFirstName] = useState<string | null>(null)
  const [checkingSession, setCheckingSession] = useState(true)
  const [loginOpenFor, setLoginOpenFor] = useState<string | null>(null)
  const [confirmOpenFor, setConfirmOpenFor] = useState<EventWithSlots | null>(null)

  const checkSession = useCallback(async () => {
    setCheckingSession(true)
    const result = await getSessionMember()
    setMemberFirstName(result.ok ? result.member.name.trim().split(/\s+/)[0] : null)
    setCheckingSession(false)
  }, [])

  useEffect(() => { checkSession() }, [checkSession])

  const handleRegisterClick = (event: EventWithSlots) => {
    if (memberFirstName) {
      setConfirmOpenFor(event)
    } else {
      setLoginOpenFor(event.id)
    }
  }

  const handleLoginSuccess = async () => {
    const pendingEventId = loginOpenFor
    setLoginOpenFor(null)
    await checkSession()
    const event = events.find((e) => e.id === pendingEventId)
    if (event) setConfirmOpenFor(event)
  }

  if (events.length === 0) return null

  return (
    <section id="events" className="border-t border-white/10 py-16 px-4 scroll-mt-24">
      <div className="max-w-5xl mx-auto">
        <p className="eyebrow mb-2">On the calendar</p>
        <h2 className="heading-display text-white text-2xl mb-8">Upcoming Events</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
          {events.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              slotsLeft={event.slotsLeft}
              onRegisterClick={() => handleRegisterClick(event)}
              disabled={checkingSession}
            />
          ))}
        </div>
      </div>

      {loginOpenFor && (
        <MemberLoginModal
          onClose={() => setLoginOpenFor(null)}
          onSuccess={handleLoginSuccess}
          whatsappLink={whatsappLink}
        />
      )}

      {confirmOpenFor && memberFirstName && (
        <ConfirmRegisterCard
          eventId={confirmOpenFor.id}
          eventTitle={confirmOpenFor.title}
          memberFirstName={memberFirstName}
          onClose={() => setConfirmOpenFor(null)}
          onRegistered={() => {}}
        />
      )}
    </section>
  )
}
