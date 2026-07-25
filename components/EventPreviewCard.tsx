import { Event } from '@/lib/types'

interface Props {
  event: Event & { male_count: number; female_count: number }
}

function formatEventDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })
}

export default function EventPreviewCard({ event }: Props) {
  const deadline = event.registration_deadline ? new Date(event.registration_deadline) : null
  const now = new Date()
  const hoursUntilDeadline = deadline ? (deadline.getTime() - now.getTime()) / (1000 * 60 * 60) : null
  const deadlineUrgent = hoursUntilDeadline !== null && hoursUntilDeadline > 0 && hoursUntilDeadline <= 24

  return (
    <div className="border border-[#C9A227]/30 bg-[#C9A227]/5 rounded-xl p-5 space-y-3">
      <div>
        <h3 className="text-white font-bold text-lg">{event.title}</h3>
        <p className="text-gray-400 text-sm">{formatEventDate(event.date)}</p>
      </div>

      <div className="flex flex-wrap gap-3 text-sm text-gray-300">
        {event.meeting_point_url && (
          <a
            href={event.meeting_point_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-[#C9A227] hover:underline"
          >
            📍 View meeting point
          </a>
        )}
        {(event.distance || event.pace_group) && (
          <span>
            🎯 {[event.distance, event.pace_group].filter(Boolean).join(' · ')}
          </span>
        )}
      </div>

      <p className="text-sm text-gray-300">
        👥 Male: {event.male_count}/{event.max_male} · Female: {event.female_count}/{event.max_female}
      </p>

      {deadline && deadline > now && (
        <p className={`text-sm font-medium ${deadlineUrgent ? 'text-red-400' : 'text-gray-400'}`}>
          ⏰ Closes:{' '}
          {deadline.toLocaleString('en-IN', {
            day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit',
          })}
          {deadlineUrgent && ' — Closing soon!'}
        </p>
      )}
    </div>
  )
}
