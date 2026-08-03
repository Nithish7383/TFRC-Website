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

  return (
    <div className="relative rounded-[20px] overflow-hidden border border-white/10 bg-white/[0.02] aspect-[3/4.3] flex flex-col group">
      {/* Poster image */}
      <div className="absolute inset-0">
        {event.cover_image_url ? (
          <img
            src={event.cover_image_url}
            alt={event.title}
            className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-white/5 to-black" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/10" />
      </div>

      {/* Content */}
      <div className="relative z-[1] mt-auto p-5 space-y-2">
        <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-gold">
          {weekLabel(event.date)}
        </p>
        <h3 className="heading-display text-white text-2xl leading-tight">{event.title}</h3>
        <p className="text-gray-300 text-sm">
          {formatDate(event.date)} · {TFRC_LOCATION}
        </p>

        <div className="pt-2">
          {status === 'not_open_yet' && (
            <button
              disabled
              className="w-full text-center text-sm font-semibold uppercase tracking-wide py-3 rounded-lg border border-white/20 text-gray-500 cursor-not-allowed"
            >
              Opens Soon
            </button>
          )}

          {status === 'closing_soon' && (
            <button
              onClick={onRegisterClick}
              disabled={disabled || isClosed}
              className={`relative w-full text-center btn-primary py-3 rounded-lg ${isClosed ? '' : 'animate-pulse-glow'}`}
            >
              {isFull ? 'Slots Full' : isPastDeadline ? 'Registration Closed' : slotsLeft > 0 ? `${slotsLeft} Slot${slotsLeft !== 1 ? 's' : ''} Left` : 'Register Now'}
            </button>
          )}

          {status === 'open' && (
            <button
              onClick={onRegisterClick}
              disabled={disabled || isClosed}
              className="w-full text-center btn-primary py-3"
            >
              {isFull ? 'Slots Full' : isPastDeadline ? 'Registration Closed' : 'Register Now'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
