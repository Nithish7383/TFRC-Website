'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
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

// Horizontal drag distance (px) past which a release advances the carousel.
const SWIPE_THRESHOLD = 60

export default function EventsCarousel({ events, onRegisterClick, disabled }: Props) {
  const [index, setIndex] = useState(0)
  // Tracks travel direction so the entering card slides in from the correct side.
  const [direction, setDirection] = useState(0)
  const reduceMotion = useReducedMotion()

  const goTo = useCallback(
    (i: number, dir?: number) => {
      const next = ((i % events.length) + events.length) % events.length
      setDirection(dir ?? (next > index ? 1 : -1))
      setIndex(next)
    },
    [events.length, index]
  )

  const prev = useCallback(() => goTo(index - 1, -1), [goTo, index])
  const next = useCallback(() => goTo(index + 1, 1), [goTo, index])

  // Arrow-key navigation for keyboard users.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') prev()
      if (e.key === 'ArrowRight') next()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [prev, next])

  if (events.length === 0) return null

  return (
    <div className="relative">
      {/* Ambient glow behind the deck */}
      <div className="glow-orb w-[420px] h-[420px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-60" />

      <div
        className="relative mx-auto perspective-1500 touch-pan-y"
        style={{ maxWidth: '340px', height: 'min(70vh, 560px)' }}
      >
        <AnimatePresence initial={false} custom={direction}>
          {events.map((event, i) => {
            // Shortest signed distance from the active card, wrapping around
            // the ends so the last card can sit "before" the first.
            let offset = i - index
            if (offset > events.length / 2) offset -= events.length
            if (offset < -events.length / 2) offset += events.length

            const abs = Math.abs(offset)
            if (abs > MAX_VISIBLE_OFFSET) return null

            const isActive = offset === 0
            const translateX = offset * 42
            const scale = isActive ? 1 : Math.max(1 - abs * 0.11, 0.72)
            const opacity = isActive ? 1 : Math.max(1 - abs * 0.4, 0)
            // Side cards tilt away from the viewer for real depth.
            const rotateY = reduceMotion ? 0 : offset * -18
            const translateZ = isActive ? 0 : -abs * 90

            return (
              <motion.div
                key={event.id}
                onClick={() => !isActive && goTo(i)}
                className="absolute inset-0"
                initial={false}
                animate={{
                  x: translateX,
                  scale,
                  opacity,
                  rotateY,
                  z: translateZ,
                  filter: isActive ? 'brightness(1)' : 'brightness(0.55)',
                }}
                transition={{ type: 'spring', stiffness: 280, damping: 32, mass: 0.9 }}
                style={{
                  zIndex: 20 - abs,
                  transformStyle: 'preserve-3d',
                  pointerEvents: abs <= MAX_VISIBLE_OFFSET ? 'auto' : 'none',
                  cursor: isActive ? 'grab' : 'pointer',
                }}
                // Only the front card is draggable, so a swipe never fights
                // with a click on a peeking neighbour.
                drag={isActive ? 'x' : false}
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.18}
                whileDrag={{ cursor: 'grabbing', scale: 1.02 }}
                onDragEnd={(_, info) => {
                  if (!isActive) return
                  if (info.offset.x < -SWIPE_THRESHOLD) next()
                  else if (info.offset.x > SWIPE_THRESHOLD) prev()
                }}
              >
                <EventCard
                  event={event}
                  slotsLeft={event.slotsLeft}
                  onRegisterClick={() => onRegisterClick(event)}
                  disabled={disabled}
                />
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>

      {events.length > 1 && (
        <div className="relative flex items-center justify-center gap-6 mt-8">
          <NavButton onClick={prev} label="Previous event" dir="left" />

          <div className="flex items-center gap-2">
            {events.map((event, i) => (
              <button
                key={event.id}
                onClick={() => goTo(i)}
                aria-label={`Go to ${event.title}`}
                aria-current={i === index}
                className="group py-2 -my-2"
              >
                <span
                  className={`block rounded-full transition-all duration-500 ease-out-expo ${
                    i === index
                      ? 'w-7 h-2 bg-gold shadow-[0_0_12px_rgba(200,164,53,0.7)]'
                      : 'w-2 h-2 bg-white/20 group-hover:bg-white/50 group-hover:scale-125'
                  }`}
                />
              </button>
            ))}
          </div>

          <NavButton onClick={next} label="Next event" dir="right" />
        </div>
      )}

      <p className="mt-4 text-center text-[11px] font-mono uppercase tracking-[0.2em] text-gray-600 sm:hidden">
        Swipe to explore
      </p>
    </div>
  )
}

function NavButton({
  onClick,
  label,
  dir,
}: {
  onClick: () => void
  label: string
  dir: 'left' | 'right'
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className="group w-11 h-11 rounded-full border border-white/15 bg-white/[0.02] text-gray-300
                 flex items-center justify-center flex-shrink-0
                 transition-all duration-300 ease-out-expo
                 hover:text-gold hover:border-gold/50 hover:bg-gold/10 hover:shadow-gold-glow
                 active:scale-90"
    >
      <svg
        className={`w-4 h-4 transition-transform duration-300 ease-out-expo ${
          dir === 'left' ? 'group-hover:-translate-x-0.5' : 'group-hover:translate-x-0.5'
        }`}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d={dir === 'left' ? 'M15 19l-7-7 7-7' : 'M9 5l7 7-7 7'}
        />
      </svg>
    </button>
  )
}
