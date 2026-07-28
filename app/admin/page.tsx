import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase-server'
import { Event } from '@/lib/types'
import CreateEventForm from '@/components/CreateEventForm'
import AdminEventList from '@/components/AdminEventList'
import AdminHeader from '@/components/ui/AdminHeader'

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const hours = Math.floor(diff / 3600000)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

function daysUntil(dateStr: string): number {
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000)
}

export default async function AdminDashboard() {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/admin/login')

  const today = new Date().toISOString().split('T')[0]

  // Fetch everything in parallel
  const [
    { data: events },
    { count: totalMembers },
    { data: allMembers },
    { data: allRegsRaw },
    { data: nextEventData },
    { data: last5Members },
  ] = await Promise.all([
    supabase.from('events').select('*').order('created_at', { ascending: false }),
    supabase.from('members').select('*', { count: 'exact', head: true }),
    supabase.from('members').select('attended_count, created_at'),
    supabase.from('registrations').select('id, event_id, gender, status, attended, phone, created_at'),
    supabase
      .from('events')
      .select('*')
      .eq('is_active', true)
      .gte('date', today)
      .order('date', { ascending: true })
      .limit(1),
    supabase
      .from('members')
      .select('member_id, name, place, created_at')
      .order('created_at', { ascending: false })
      .limit(5),
  ])

  const eventsWithStats = await Promise.all(
    (events || []).map(async (event: Event) => {
      const [{ count: total }, { count: selected }] = await Promise.all([
        supabase.from('registrations').select('*', { count: 'exact', head: true }).eq('event_id', event.id),
        supabase.from('registrations').select('*', { count: 'exact', head: true }).eq('event_id', event.id).eq('status', 'selected'),
      ])
      return { ...event, total: total ?? 0, selected: selected ?? 0 }
    })
  )

  // Next event stats
  const nextEvent = nextEventData?.[0] ?? null
  let nextEventMaleCount = 0
  let nextEventFemaleCount = 0
  let nextEventPendingCount = 0
  if (nextEvent) {
    const [{ count: mc }, { count: fc }, { count: pc }] = await Promise.all([
      supabase.from('registrations').select('*', { count: 'exact', head: true }).eq('event_id', nextEvent.id).eq('gender', 'Male'),
      supabase.from('registrations').select('*', { count: 'exact', head: true }).eq('event_id', nextEvent.id).eq('gender', 'Female'),
      supabase.from('registrations').select('*', { count: 'exact', head: true }).eq('event_id', nextEvent.id).eq('status', 'pending'),
    ])
    nextEventMaleCount = mc ?? 0
    nextEventFemaleCount = fc ?? 0
    nextEventPendingCount = pc ?? 0
  }

  // Member stats
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString()
  const oneWeekAgo = new Date(Date.now() - 7 * 86400000).toISOString()
  const membersThisWeek = (allMembers || []).filter((m) => m.created_at >= oneWeekAgo).length
  const neverShowedUp = (allMembers || []).filter(
    (m) => m.attended_count === 0 && m.created_at < thirtyDaysAgo
  ).length

  // Engagement
  type RegRow = { id: string; event_id: string; gender: string; status: string; attended: boolean | null; phone: string; created_at: string }
  const allRegs: RegRow[] = (allRegsRaw || []) as RegRow[]

  const phonesRegistered = new Set(allRegs.map((r) => r.phone))
  const membersRegistered = phonesRegistered.size

  const totalAttended = allRegs.filter((r) => r.attended === true).length

  // Events with pending registrations
  const pendingByEvent: Record<string, number> = {}
  allRegs.filter((r) => r.status === 'pending').forEach((r) => {
    pendingByEvent[r.event_id] = (pendingByEvent[r.event_id] || 0) + 1
  })
  const eventsPendingList = Object.entries(pendingByEvent)

  // Duplicate members detection
  const { data: allMembersForDup } = await supabase.from('members').select('id, phone, name')
  const phoneMap: Record<string, number> = {}
  const nameMap: Record<string, number> = {}
  ;(allMembersForDup || []).forEach((m: { id: string; phone: string; name: string }) => {
    phoneMap[m.phone] = (phoneMap[m.phone] || 0) + 1
    const normalized = m.name.toLowerCase().trim()
    nameMap[normalized] = (nameMap[normalized] || 0) + 1
  })
  const duplicateCount =
    Object.values(phoneMap).filter((c) => c > 1).length +
    Object.values(nameMap).filter((c) => c > 1).length

  // Events missing cover image
  const eventsMissingImage = (events || []).filter((e: Event) => !e.cover_image_url).length

  const needsAttentionCount = eventsPendingList.length + (duplicateCount > 0 ? 1 : 0) + (eventsMissingImage > 0 ? 1 : 0)

  // Map event id to title for display
  const eventMap: Record<string, string> = {}
  ;(events || []).forEach((e: Event) => { eventMap[e.id] = e.title })

  return (
    <main className="min-h-screen bg-black">
      <AdminHeader
        subtitle="Admin Dashboard"
        email={user.email}
        links={[
          { href: '/admin', label: 'Dashboard' },
          { href: '/admin/members', label: 'Members' },
          { href: '/admin/settings', label: 'Settings' },
        ]}
      />

      <div className="max-w-5xl mx-auto px-4 py-6 md:py-10 space-y-8">

        {/* BLOCK 1 — Next Event Panel */}
        <section>
          <h2 className="heading-display text-white text-lg mb-3">Next Event</h2>
          {nextEvent ? (
            <div className="card border border-gold/30 space-y-4">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div>
                  <h3 className="text-white font-semibold text-lg">{nextEvent.title}</h3>
                  <p className="text-gray-400 text-sm">
                    {new Date(nextEvent.date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' })}
                    {' · '}
                    <span className="text-gold">{daysUntil(nextEvent.date)} days away</span>
                  </p>
                </div>
                <Link
                  href={`/admin/event/${nextEvent.id}`}
                  className="btn-primary text-sm py-2 px-4 whitespace-nowrap"
                >
                  Go to Event →
                </Link>
              </div>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div className="text-center">
                  <p className="text-blue-400 font-bold text-xl">{nextEventMaleCount}/{nextEvent.max_male}</p>
                  <p className="text-gray-500 text-xs">Male slots</p>
                </div>
                <div className="text-center">
                  <p className="text-pink-400 font-bold text-xl">{nextEventFemaleCount}/{nextEvent.max_female}</p>
                  <p className="text-gray-500 text-xs">Female slots</p>
                </div>
                <div className="text-center">
                  <p className="text-yellow-400 font-bold text-xl">{nextEventPendingCount}</p>
                  <p className="text-gray-500 text-xs">Pending</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="card text-center py-8">
              <p className="text-gray-500">No upcoming events. Create one below.</p>
            </div>
          )}
        </section>

        {/* BLOCK 2 — Member Stats */}
        <section>
          <h2 className="heading-display text-white text-lg mb-3">Member Stats</h2>
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Total Members', value: totalMembers ?? 0, color: 'text-white' },
              { label: 'Joined This Week', value: membersThisWeek, color: 'text-gold' },
              { label: 'Never Showed Up', value: neverShowedUp, color: 'text-gray-400' },
            ].map(({ label, value, color }) => (
              <div key={label} className="card text-center">
                <p className={`text-2xl font-bold mb-1 ${color}`}>{value}</p>
                <p className="text-gray-500 text-xs">{label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* BLOCK 3 — Engagement */}
        <section>
          <h2 className="heading-display text-white text-lg mb-3">Engagement</h2>
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Members Registered', value: membersRegistered, color: 'text-green-400' },
              { label: 'Total Attended', value: totalAttended, color: 'text-blue-400' },
              { label: 'Needs Attention', value: needsAttentionCount, color: 'text-yellow-400' },
            ].map(({ label, value, color }) => (
              <div key={label} className="card text-center">
                <p className={`text-2xl font-bold mb-1 ${color}`}>{value}</p>
                <p className="text-gray-500 text-xs">{label}</p>
              </div>
            ))}
          </div>
        </section>

        <div className="grid gap-6 md:grid-cols-2">
          {/* BLOCK 4 — Recent Joins */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="heading-display text-white text-lg">Recent Joins</h2>
              <Link href="/admin/members" className="text-gold hover:underline text-xs">
                View all →
              </Link>
            </div>
            <div className="card space-y-3">
              {(last5Members || []).map((m: { member_id: string; name: string; place: string; created_at: string }) => (
                <div key={m.member_id} className="flex items-center gap-3">
                  <span className="stat-number text-gold text-xs tracking-wider bg-gold/10 border border-gold/30 px-2 py-1 rounded-lg whitespace-nowrap">
                    {m.member_id}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">{m.name}</p>
                    <p className="text-gray-500 text-xs">{m.place}</p>
                  </div>
                  <span className="text-gray-600 text-xs whitespace-nowrap">{timeAgo(m.created_at)}</span>
                </div>
              ))}
              {(last5Members || []).length === 0 && (
                <p className="text-gray-600 text-sm">No members yet.</p>
              )}
            </div>
          </section>

          {/* BLOCK 5 — Needs Attention */}
          <section>
            <h2 className="heading-display text-white text-lg mb-3">Needs Attention</h2>
            <div className="card space-y-3">
              {eventsPendingList.map(([eventId, count]) => (
                <Link
                  key={eventId}
                  href={`/admin/event/${eventId}`}
                  className="flex items-center justify-between bg-yellow-900/20 border border-yellow-800/30 rounded-lg px-4 py-3 hover:bg-yellow-900/30 transition-colors"
                >
                  <span className="text-yellow-300 text-sm">
                    {count} pending registration{count !== 1 ? 's' : ''}
                  </span>
                  <span className="text-gray-500 text-xs truncate ml-2 max-w-[120px]">
                    {eventMap[eventId] ?? 'Event'}
                  </span>
                </Link>
              ))}
              {duplicateCount > 0 && (
                <Link
                  href="/admin/members"
                  className="flex items-center justify-between bg-orange-900/20 border border-orange-800/30 rounded-lg px-4 py-3 hover:bg-orange-900/30 transition-colors"
                >
                  <span className="text-orange-300 text-sm">
                    {duplicateCount} duplicate member{duplicateCount !== 1 ? 's' : ''} detected
                  </span>
                </Link>
              )}
              {eventsMissingImage > 0 && (
                <div className="flex items-center justify-between bg-white/5 border border-white/10 rounded-lg px-4 py-3">
                  <span className="text-gray-400 text-sm">
                    {eventsMissingImage} event{eventsMissingImage !== 1 ? 's' : ''} missing cover image
                  </span>
                </div>
              )}
              {needsAttentionCount === 0 && (
                <p className="text-gray-600 text-sm">All clear!</p>
              )}
            </div>
          </section>
        </div>

        {/* Create Event */}
        <section>
          <h2 className="heading-display text-white text-xl mb-4">Create New Event</h2>
          <CreateEventForm />
        </section>

        {/* Events List */}
        <section>
          <h2 className="heading-display text-white text-xl mb-4">All Events</h2>
          <AdminEventList events={eventsWithStats} />
        </section>
      </div>
    </main>
  )
}
