import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase-server'
import { Member, Registration } from '@/lib/types'
import MemberProfileCard from '@/components/MemberProfileCard'
import MemberEventsList from '@/components/MemberEventsList'

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

export default async function MemberProfilePage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = createClient()

  const { data: memberData } = await supabase
    .from('members')
    .select('*')
    .eq('member_id', params.id)
    .single()

  if (!memberData) notFound()

  const member = memberData as Member

  const [{ data: regsData }, { data: eventsData }] = await Promise.all([
    supabase
      .from('registrations')
      .select('*, events(title, date, distance, pace_group)')
      .eq('phone', member.phone)
      .order('created_at', { ascending: false }),
    supabase
      .from('events')
      .select('*')
      .eq('is_active', true)
      .order('date', { ascending: true }),
  ])

  const registrations: Registration[] = (regsData || []) as Registration[]

  // Fetch slot counts for each active event
  const activeEvents = eventsData || []
  const eventsWithCounts: EventWithCounts[] = await Promise.all(
    activeEvents.map(async (event) => {
      const [{ count: male_count }, { count: female_count }] = await Promise.all([
        supabase
          .from('registrations')
          .select('*', { count: 'exact', head: true })
          .eq('event_id', event.id)
          .eq('gender', 'Male'),
        supabase
          .from('registrations')
          .select('*', { count: 'exact', head: true })
          .eq('event_id', event.id)
          .eq('gender', 'Female'),
      ])
      return {
        id: event.id,
        title: event.title,
        date: event.date,
        max_male: event.max_male,
        max_female: event.max_female,
        distance: event.distance ?? null,
        pace_group: event.pace_group ?? null,
        registration_deadline: event.registration_deadline ?? null,
        male_count: male_count ?? 0,
        female_count: female_count ?? 0,
      }
    })
  )

  // Registrations that match active events (for MemberEventsList)
  const activeEventIds = new Set(eventsWithCounts.map((e) => e.id))
  const activeRegistrations = registrations.filter((r) => activeEventIds.has(r.event_id))

  // Past registrations with event info
  type RegWithEvent = Registration & {
    events?: { title: string; date: string; distance?: string; pace_group?: string } | null
  }
  const pastRegs: RegWithEvent[] = registrations as RegWithEvent[]

  return (
    <main className="min-h-screen bg-gray-950">
      {/* Sticky nav */}
      <nav className="border-b border-gray-800 bg-gray-900/70 px-4 py-3 sticky top-0 z-10 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <img src="/firstruleclublogo.jpg" alt="TFRC" className="w-9 h-9 rounded-full object-cover" />
            <span className="text-white font-semibold text-sm hidden sm:block">The First Rule Club</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/gallery" className="text-gray-400 hover:text-white text-sm transition-colors">
              Gallery
            </Link>
            <Link href="/login" className="text-gray-400 hover:text-white text-sm transition-colors">
              Member Login
            </Link>
            <Link
              href="/admin/login"
              className="text-xs text-gray-500 hover:text-[#C9A227] border border-gray-700 hover:border-[#C9A227]/50 px-3 py-1.5 rounded-lg transition-colors"
            >
              Admin
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-10">
        {/* Profile card */}
        <MemberProfileCard member={member} />

        {/* Upcoming events + inline registration */}
        <section>
          <h2 className="text-xl font-bold text-white mb-4">Upcoming Events</h2>
          <MemberEventsList
            member={member}
            events={eventsWithCounts}
            registrations={activeRegistrations}
          />
        </section>

        {/* Registration history */}
        <section>
          <h2 className="text-xl font-bold text-white mb-4">My Registrations</h2>
          {pastRegs.length === 0 ? (
            <div className="card text-center py-8">
              <p className="text-gray-500">No registrations yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pastRegs.map((reg) => (
                <div key={reg.id} className="card flex items-center justify-between gap-3 flex-wrap">
                  <div>
                    <p className="text-white font-medium">
                      {reg.events?.title ?? 'Event'}
                    </p>
                    {reg.events?.date && (
                      <p className="text-gray-500 text-xs">
                        {new Date(reg.events.date).toLocaleDateString('en-IN', {
                          day: 'numeric', month: 'short', year: 'numeric',
                        })}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {reg.attended && (
                      <span className="text-xs bg-green-900/30 text-green-400 border border-green-800/40 px-2.5 py-1 rounded-full">
                        Attended ✓
                      </span>
                    )}
                    <span className={`text-xs px-3 py-1 rounded-full border font-medium ${
                      reg.status === 'selected'
                        ? 'bg-green-900/30 text-green-400 border-green-800/40'
                        : reg.status === 'rejected'
                        ? 'bg-red-900/30 text-red-400 border-red-800/40'
                        : 'bg-gray-800 text-gray-400 border-gray-700'
                    }`}>
                      {reg.status === 'selected' ? '✓ Selected' :
                       reg.status === 'rejected' ? '✗ Not selected' : '⏳ Pending'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  )
}
