import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase-server'
import { Registration } from '@/lib/types'
import RegistrationTable from '@/components/RegistrationTable'
import CopyWhatsAppButton from '@/components/CopyWhatsAppButton'
import EventPhotoManager from '@/components/EventPhotoManager'

export default async function EventDetailPage({
  params,
  searchParams,
}: {
  params: { id: string }
  searchParams: { gender?: string; minAge?: string; maxAge?: string }
}) {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/admin/login')

  const { data: event } = await supabase
    .from('events')
    .select('*')
    .eq('id', params.id)
    .single()

  if (!event) notFound()

  let query = supabase
    .from('registrations')
    .select('*')
    .eq('event_id', params.id)
    .order('created_at', { ascending: false })

  if (searchParams.gender) query = query.eq('gender', searchParams.gender)
  if (searchParams.minAge) query = query.gte('age', parseInt(searchParams.minAge))
  if (searchParams.maxAge) query = query.lte('age', parseInt(searchParams.maxAge))

  const { data: registrations } = await query

  const allRegs = registrations || []
  const pending = allRegs.filter((r: Registration) => r.status === 'pending').length
  const selected = allRegs.filter((r: Registration) => r.status === 'selected').length
  const rejected = allRegs.filter((r: Registration) => r.status === 'rejected').length
  const attended = allRegs.filter((r: Registration) => r.attended).length
  const maleCount = allRegs.filter((r: Registration) => r.gender === 'Male').length
  const femaleCount = allRegs.filter((r: Registration) => r.gender === 'Female').length

  const selectedUsers = allRegs.filter((r: Registration) => r.status === 'selected')

  return (
    <main className="min-h-screen bg-gray-950">
      <header className="border-b border-gray-800 bg-gray-900/50 px-4 py-4">
        <div className="max-w-6xl mx-auto flex items-center gap-3">
          <Link href="/admin" className="text-gray-500 hover:text-gray-300 text-sm">
            ← Dashboard
          </Link>
          <div className="flex-1 min-w-0">
            <h1 className="text-white font-bold text-lg truncate">{event.title}</h1>
            <p className="text-gray-500 text-sm">
              {new Date(event.date).toLocaleDateString('en-IN', {
                weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
              })}
            </p>
          </div>
          <span className={`text-xs font-medium px-2.5 py-1 rounded-full border flex-shrink-0 ${
            event.is_active
              ? 'bg-green-900/30 text-green-400 border-green-800/40'
              : 'bg-gray-800 text-gray-500 border-gray-700'
          }`}>
            {event.is_active ? 'Active' : 'Inactive'}
          </span>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">

        {/* Event meta */}
        {(event.distance || event.pace_group || event.meeting_point_url || event.registration_deadline) && (
          <div className="card grid grid-cols-2 md:grid-cols-4 gap-4">
            {event.distance && (
              <div>
                <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">Distance</p>
                <p className="text-white font-medium">{event.distance}</p>
              </div>
            )}
            {event.pace_group && (
              <div>
                <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">Pace Group</p>
                <p className="text-white font-medium">{event.pace_group}</p>
              </div>
            )}
            {event.registration_deadline && (
              <div>
                <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">Deadline</p>
                <p className="text-white font-medium text-sm">
                  {new Date(event.registration_deadline).toLocaleString('en-IN', {
                    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                  })}
                </p>
              </div>
            )}
            {event.meeting_point_url && (
              <div>
                <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">Meeting Point</p>
                <a
                  href={event.meeting_point_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#C9A227] hover:underline text-sm"
                >
                  Open in Maps →
                </a>
              </div>
            )}
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            { label: 'Total', value: allRegs.length, color: 'text-white' },
            { label: 'Pending', value: pending, color: 'text-yellow-400' },
            { label: 'Selected', value: selected, color: 'text-green-400' },
            { label: 'Rejected', value: rejected, color: 'text-red-400' },
            { label: 'Attended', value: attended, color: 'text-blue-400' },
          ].map(({ label, value, color }) => (
            <div key={label} className="card text-center">
              <p className={`text-3xl font-bold mb-1 ${color}`}>{value}</p>
              <p className="text-gray-500 text-sm">{label}</p>
            </div>
          ))}
        </div>

        {/* Gender slot progress */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="card">
            <div className="flex items-center justify-between mb-2">
              <span className="text-blue-400 text-sm font-medium">♂ Male slots</span>
              <span className="text-gray-400 text-sm">{maleCount} / {event.max_male}</span>
            </div>
            <div className="w-full bg-gray-800 rounded-full h-2.5 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${maleCount >= event.max_male ? 'bg-red-500' : 'bg-blue-500'}`}
                style={{ width: `${Math.min((maleCount / event.max_male) * 100, 100)}%` }}
              />
            </div>
            {maleCount >= event.max_male && <p className="text-red-400 text-xs mt-1">Male slots full</p>}
          </div>
          <div className="card">
            <div className="flex items-center justify-between mb-2">
              <span className="text-pink-400 text-sm font-medium">♀ Female slots</span>
              <span className="text-gray-400 text-sm">{femaleCount} / {event.max_female}</span>
            </div>
            <div className="w-full bg-gray-800 rounded-full h-2.5 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${femaleCount >= event.max_female ? 'bg-red-500' : 'bg-pink-500'}`}
                style={{ width: `${Math.min((femaleCount / event.max_female) * 100, 100)}%` }}
              />
            </div>
            {femaleCount >= event.max_female && <p className="text-red-400 text-xs mt-1">Female slots full</p>}
          </div>
        </div>

        {/* WhatsApp section */}
        {selectedUsers.length > 0 && (
          <div className="card border-green-800/30 bg-green-900/10">
            <h3 className="text-white font-semibold mb-1">
              {selectedUsers.length} participant{selectedUsers.length !== 1 ? 's' : ''} selected
            </h3>
            <p className="text-gray-400 text-sm mb-4">
              Send the WhatsApp invite to each selected runner.
            </p>
            <CopyWhatsAppButton
              groupLink={event.group_link || '#'}
              selectedUsers={selectedUsers.map((u: Registration) => ({
                name: u.name,
                phone: u.phone,
              }))}
            />
          </div>
        )}

        {/* Filters */}
        <div>
          <h2 className="text-lg font-bold text-white mb-4">
            Registrations
            {(searchParams.gender || searchParams.minAge || searchParams.maxAge) && (
              <Link href={`/admin/event/${params.id}`} className="ml-3 text-sm text-gray-500 hover:text-gray-300 font-normal">
                Clear filters ×
              </Link>
            )}
          </h2>

          <form method="GET" className="flex flex-col sm:flex-row flex-wrap gap-3 mb-6">
            <select name="gender" defaultValue={searchParams.gender || ''} className="input-field sm:w-auto">
              <option value="">All genders</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>
            <input type="number" name="minAge" defaultValue={searchParams.minAge || ''} placeholder="Min age" className="input-field sm:w-28" />
            <input type="number" name="maxAge" defaultValue={searchParams.maxAge || ''} placeholder="Max age" className="input-field sm:w-28" />
            <button type="submit" className="btn-secondary">Filter</button>
          </form>

          <RegistrationTable
            registrations={allRegs}
            eventId={params.id}
            eventTitle={event.title}
            maxParticipants={event.max_male + event.max_female}
          />
        </div>

        {/* Photos */}
        <div className="border-t border-gray-800 pt-8">
          <EventPhotoManager eventId={params.id} />
        </div>
      </div>
    </main>
  )
}
