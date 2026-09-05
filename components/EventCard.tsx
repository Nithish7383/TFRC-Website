import { Event } from '@/lib/types'
import { TFRC_LOCATION } from '@/lib/constants'

interface Props {
  event: Event
  slotsLeft: number
  onRegisterClick: () => void
  disabled?: boolean
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    weekday: 'short', day: 'numeric', month: 'short',
  })
}

function weekLabel(dateStr: string) {
  const d = new Date(dateStr)
  // ISO week number — a simple, deterministic "week N" eyebrow label with
  // no extra admin-authored field required.
  const target = new Date(d.valueOf())
  const dayNr = (d.getUTCDay() + 6) % 7
  target.setUTCDate(target.getUTCDate() - dayNr + 3)
  const firstThursday = new Date(Date.UTC(target.getUTCFullYear(), 0, 4))
  const week = 1 + Math.round(
    ((target.getTime() - firstThursday.getTime()) / 86400000 - 3 + ((firstThursday.getUTCDay() + 6) % 7)) / 7
  )
  return `Week ${week}`
}

export default function EventCard({ event, slotsLeft, onRegisterClick, disabled }: Props) {
  const status = event.status || 'open'
  const isPastDeadline = event.registration_deadline
    ? new Date() > new Date(event.registration_deadline)
    : false
  const isFull = slotsLeft <= 0
  const isClosed = status !== 'not_open_yet' && (isPastDeadline || isFull)

  // Scarcity cue on the poster's top-right corner.
  const showScarcity = !isClosed && status !== 'not_open_yet' && slotsLeft > 0 && slotsLeft <= 5

  return (
    <div
      className="group relative rounded-[22px] overflow-hidden border border-white/10 bg-white/[0.02]
                 aspect-[3/4.3] flex flex-col grain-overlay
                 shadow-lift transition-all duration-500 ease-out-expo
                 hover:border-gold/40 hover:shadow-gold-glow-lg"
    >
      {/* Poster image */}
      <div className="absolute inset-0">
        <img
          src={event.cover_image_url || '/firstruleclublogo.jpg'}
          alt={event.title}
          className="w-full h-full object-cover transition-transform duration-[900ms] ease-out-expo
                     group-hover:scale-[1.07]"
        />

        {/* Legibility scrim — deepens slightly on hover so text stays crisp
            as the image brightens underneath. */}
        <div
          className="absolute inset-0 bg-gradient-to-t from-black via-black/55 to-black/10
                     transition-opacity duration-500 group-hover:opacity-90"
        />
      </div>

      {/* Gold rim that fades in on hover */}
      <div
        aria-hidden="true"
        className="absolute inset-0 rounded-[22px] ring-1 ring-inset ring-gold/0
                   transition-all duration-500 group-hover:ring-gold/25 pointer-events-none"
      />

      {/* Top row — week label + scarcity */}
      <div className="relative z-[1] flex items-start justify-between p-5">
        <span className="inline-flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-[0.2em]
                         text-gold/90 bg-black/40 backdrop-blur-md border border-gold/20
                         rounded-full px-3 py-1.5">
          {weekLabel(event.date)}
        </span>

        {showScarcity && (
          <span className="inline-flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-[0.15em]
                           text-red-300 bg-red-950/50 backdrop-blur-md border border-red-500/30
                           rounded-full px-3 py-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse-slow" />
            {slotsLeft} left
          </span>
        )}
      </div>

      {/* Content */}
      <div className="relative z-[1] mt-auto p-5 space-y-2.5">
        <h3
          className="heading-display text-white text-2xl leading-tight line-clamp-2
                     transition-transform duration-500 ease-out-expo group-hover:-translate-y-0.5"
        >
          {event.title}
        </h3>

        <p className="flex items-center gap-2 text-gray-300 text-sm">
          <svg className="w-3.5 h-3.5 text-gold/70 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          {formatDate(event.date)}
          <span className="text-white/20">·</span>
          <span className="truncate">{TFRC_LOCATION}</span>
        </p>

        <div className="pt-2">
          {status === 'not_open_yet' && (
            <button
              disabled
              className="w-full text-center text-sm font-semibold uppercase tracking-wide py-3 rounded-lg
                         border border-white/15 bg-white/[0.03] text-gray-500 cursor-not-allowed
                         backdrop-blur-sm"
            >
              Opens Soon
            </button>
          )}

          {status === 'closing_soon' && (
            <button
              onClick={onRegisterClick}
              disabled={disabled || isClosed}
              className={`w-full btn-primary py-3.5 ${isClosed ? '' : 'animate-pulse-glow'}`}
            >
              {isFull ? 'Slots Full' : isPastDeadline ? 'Registration Closed' : slotsLeft > 0 ? `${slotsLeft} Slot${slotsLeft !== 1 ? 's' : ''} Left` : 'Register Now'}
            </button>
          )}

          {status === 'open' && (
            <button
              onClick={onRegisterClick}
              disabled={disabled || isClosed}
              className="w-full btn-primary py-3.5"
            >
              {isFull ? 'Slots Full' : isPastDeadline ? 'Registration Closed' : 'Register Now'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
