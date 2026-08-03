'use client'

import { useState } from 'react'
import { Event } from '@/lib/types'
import EventCard from '@/components/EventCard'

interface EventWithSlots extends Event {
  slotsLeft: number
}

interface Props {
  events: EventWithSlots[]
  onRegisterClick: (event: EventWithSlots) => void
  disabled?: boolean
}

// How far (in cards) an offset card sits from the active one before it's
// fully hidden — anything beyond this just isn't rendered.
const MAX_VISIBLE_OFFSET = 2

export default function EventsCarousel({ events, onRegisterClick, disabled }: Props) {
  const [index, setIndex] = useState(0)

  const goTo = (i: number) => setIndex(((i % events.length) + events.length) % events.length)
  const prev = () => goTo(index - 1)
  const next = () => goTo(index + 1)

  if (events.length === 0) return null

  return (
    <div className="relative">
      <div
        className="relative mx-auto"
        style={{ perspective: '1500px', maxWidth: '340px', height: 'min(70vh, 560px)' }}
      >
        {events.map((event, i) => {
          // Shortest signed distance from the active card, wrapping around
          // the ends so the last card can sit "before" the first.
          let offset = i - index
          if (offset > events.length / 2) offset -= events.length
          if (offset < -events.length / 2) offset += events.length

          const abs = Math.abs(offset)
          if (abs > MAX_VISIBLE_OFFSET) return null

          const isActive = offset === 0
          const translateX = offset * 36
          const scale = isActive ? 1 : Math.max(1 - abs * 0.12, 0.7)
          const opacity = isActive ? 1 : Math.max(1 - abs * 0.4, 0)

          return (
            <div
              key={event.id}
              onClick={() => !isActive && goTo(i)}
              className="absolute inset-0 transition-all duration-500 ease-out"
              style={{
                transform: `translateX(${translateX}px) scale(${scale})`,
                opacity,
                zIndex: 20 - abs,
                pointerEvents: isActive ? 'auto' : abs <= MAX_VISIBLE_OFFSET ? 'auto' : 'none',
                cursor: isActive ? 'default' : 'pointer',
              }}
            >
              <EventCard
                event={event}
                slotsLeft={event.slotsLeft}
                onRegisterClick={() => onRegisterClick(event)}
                disabled={disabled}
              />
            </div>
          )
        })}
      </div>

      {events.length > 1 && (
        <div className="flex items-center justify-center gap-6 mt-6">
          <button
            onClick={prev}
            aria-label="Previous event"
            className="w-10 h-10 rounded-full border border-white/15 text-gray-300 hover:text-white hover:border-white/40 transition-colors flex items-center justify-center flex-shrink-0"
          >
            ←
          </button>

          <div className="flex items-center gap-2">
            {events.map((event, i) => (
              <button
                key={event.id}
                onClick={() => goTo(i)}
                aria-label={`Go to ${event.title}`}
                aria-current={i === index}
                className={`rounded-full transition-all ${
                  i === index ? 'w-6 h-2 bg-gold' : 'w-2 h-2 bg-white/20 hover:bg-white/40'
                }`}
              />
            ))}
          </div>

          <button
            onClick={next}
            aria-label="Next event"
            className="w-10 h-10 rounded-full border border-white/15 text-gray-300 hover:text-white hover:border-white/40 transition-colors flex items-center justify-center flex-shrink-0"
          >
            →
          </button>
        </div>
      )}
    </div>
  )
}
