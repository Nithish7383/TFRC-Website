'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import { Event } from '@/lib/types'
import CloneEventButton from '@/components/CloneEventButton'
import EditEventForm from '@/components/EditEventForm'

interface EventWithStats extends Event {
  total: number
  selected: number
}

interface Props {
  events: EventWithStats[]
}

export default function AdminEventList({ events }: Props) {
  const router = useRouter()
  const supabase = createClient()

  const [editingEventId, setEditingEventId] = useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [toggling, setToggling] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)

  const handleToggle = async (eventId: string, currentIsActive: boolean) => {
    setToggling(eventId)
    await supabase.from('events').update({ is_active: !currentIsActive }).eq('id', eventId)
    setToggling(null)
    router.refresh()
  }

  const handleDelete = async (eventId: string) => {
    setDeleting(eventId)
    await supabase.from('events').delete().eq('id', eventId)
    setDeleting(null)
    setConfirmDeleteId(null)
    router.refresh()
  }

  if (events.length === 0) {
    return (
      <div className="card text-center py-10 text-gray-500">
        No events yet. Create one above.
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {events.map((event) => (
        <div key={event.id}>
          <div className="card flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-start gap-3">
              <div className="flex-shrink-0 pt-0.5">
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${
                  event.is_active
                    ? 'bg-green-900/30 text-green-400 border-green-800/40'
                    : 'bg-gray-800 text-gray-500 border-gray-700'
                }`}>
                  {event.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-white font-medium">{event.title}</p>
                <p className="text-gray-500 text-sm">
                  {event.date
                    ? new Date(event.date).toLocaleDateString('en-IN', {
                        weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
                      })
                    : 'No date set'}
                </p>
                {(event.distance || event.pace_group) && (
                  <p className="text-gray-600 text-xs mt-0.5">
                    {[event.distance, event.pace_group].filter(Boolean).join(' · ')}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-4 text-sm flex-shrink-0">
                <div className="text-center">
                  <p className="text-white font-semibold">{event.total}</p>
                  <p className="text-gray-500 text-xs">registered</p>
                </div>
                <div className="text-center">
                  <p className="text-green-400 font-semibold">{event.selected}</p>
                  <p className="text-gray-500 text-xs">selected</p>
                </div>
                <div className="text-center">
                  <p className="text-blue-400 font-semibold">♂ {event.max_male}</p>
                  <p className="text-gray-500 text-xs">male limit</p>
                </div>
                <div className="text-center">
                  <p className="text-pink-400 font-semibold">♀ {event.max_female}</p>
                  <p className="text-gray-500 text-xs">female limit</p>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-wrap gap-2">
              <Link href={`/admin/event/${event.id}`} className="btn-secondary text-sm py-2">
                View Registrations
              </Link>
              <CloneEventButton event={event} />
              <button
                onClick={() => handleToggle(event.id, event.is_active)}
                disabled={toggling === event.id}
                className={`text-sm py-2 px-3 rounded-lg border transition-colors ${
                  event.is_active
                    ? 'border-gray-700 text-gray-400 hover:text-red-400 hover:border-red-800/50'
                    : 'border-gray-700 text-gray-400 hover:text-green-400 hover:border-green-800/50'
                }`}
              >
                {toggling === event.id ? '...' : event.is_active ? 'Deactivate' : 'Activate'}
              </button>
              <button
                onClick={() => {
                  setEditingEventId(editingEventId === event.id ? null : event.id)
                  setConfirmDeleteId(null)
                }}
                className={`text-sm py-2 px-3 rounded-lg border transition-colors ${
                  editingEventId === event.id
                    ? 'border-[#C9A227]/50 text-[#C9A227] bg-[#C9A227]/10'
                    : 'border-gray-700 text-gray-400 hover:text-[#C9A227] hover:border-[#C9A227]/40'
                }`}
              >
                Edit
              </button>
              {confirmDeleteId === event.id ? (
                <div className="flex gap-2 items-center">
                  <button
                    onClick={() => handleDelete(event.id)}
                    disabled={deleting === event.id}
                    className="text-sm py-2 px-3 rounded-lg bg-red-600 hover:bg-red-500 text-white font-semibold transition-colors"
                  >
                    {deleting === event.id ? 'Deleting...' : 'Confirm Delete'}
                  </button>
                  <button
                    onClick={() => setConfirmDeleteId(null)}
                    className="text-sm py-2 px-2 rounded-lg border border-gray-700 text-gray-400 hover:text-gray-200 transition-colors"
                  >
                    ×
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => { setConfirmDeleteId(event.id); setEditingEventId(null) }}
                  className="text-sm py-2 px-3 rounded-lg border border-red-800/50 text-red-400 hover:bg-red-900/20 transition-colors"
                >
                  Delete
                </button>
              )}
            </div>
          </div>

          {editingEventId === event.id && (
            <EditEventForm
              event={event}
              onClose={() => setEditingEventId(null)}
            />
          )}
        </div>
      ))}
    </div>
  )
}
