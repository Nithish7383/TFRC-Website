import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase-server'
import { Event } from '@/lib/types'
import CreateEventForm from '@/components/CreateEventForm'
import AdminEventList from '@/components/AdminEventList'
import AdminHeader from '@/components/ui/AdminHeader'
import AdminQuickSearch from '@/components/AdminQuickSearch'

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
    supabase.from('registrations').select('id, event_id, gender, status, attended, phone, created_at, payment_status'),
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
  type RegRow = { id: string; event_id: string; gender: string; status: string; attended: boolean | null; phone: string; created_at: string; payment_status: string }
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

  // Payments awaiting verification
  const paymentsToVerify = allRegs.filter((r) => r.payment_status === 'pending').length
  const firstUnverifiedEventId = allRegs.find((r) => r.payment_status === 'pending')?.event_id ?? null

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

      <div className="max-w-5xl mx-auto px-4 py-6 md:py-10 space-y-10">

        {/* QUICK SEARCH */}
        <AdminQuickSearch />

        {/* ACTION BAR — the two things worth acting on today */}
        <section className="grid gap-4 md:grid-cols-2">
          {nextEvent ? (
            <div className="card border border-gold/30">
              <div className="flex items-start justify-between gap-3 flex-wrap mb-3">
                <div>
                  <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">Next Event</p>
                  <h3 className="text-white font-semibold">{nextEvent.title}</h3>
                  <p className="text-gray-400 text-xs mt-0.5">
                    {new Date(nextEvent.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    {' · '}
                    <span className="text-gold">{daysUntil(nextEvent.date)}d away</span>
                  </p>
                </div>
                <Link href={`/admin/event/${nextEvent.id}`} className="btn-primary text-xs py-1.5 px-3 whitespace-nowrap">
                  View →
                </Link>
              </div>
              <div className="flex gap-4 text-xs border-t border-white/10 pt-3">
                <span className="text-blue-400">{nextEventMaleCount}/{nextEvent.max_male} <span className="text-gray-500">male</span></span>
                <span className="text-pink-400">{nextEventFemaleCount}/{nextEvent.max_female} <span className="text-gray-500">female</span></span>
                <span className="text-yellow-400">{nextEventPendingCount} <span className="text-gray-500">pending</span></span>
              </div>
            </div>
          ) : (
            <div className="card flex items-center justify-center text-center py-6">
              <p className="text-gray-500 text-sm">No upcoming events. Create one below.</p>
            </div>
          )}

          <div className="card">
            <p className="text-gray-500 text-xs uppercase tracking-wide mb-3">Needs Action</p>
            <div className="space-y-2">
              {paymentsToVerify > 0 && firstUnverifiedEventId && (
                <Link
                  href={`/admin/event/${firstUnverifiedEventId}`}
                  className="flex items-center justify-between bg-yellow-900/20 border border-yellow-800/30 rounded-lg px-3 py-2 hover:bg-yellow-900/30 transition-colors"
                >
                  <span className="text-yellow-300 text-sm">{paymentsToVerify} payment{paymentsToVerify !== 1 ? 's' : ''} to verify</span>
                  <span className="text-gray-500 text-xs">→</span>
                </Link>
              )}
              {eventsPendingList.map(([eventId, count]) => (
                <Link
                  key={eventId}
                  href={`/admin/event/${eventId}`}
                  className="flex items-center justify-between bg-white/[0.03] border border-white/10 rounded-lg px-3 py-2 hover:bg-white/5 transition-colors"
                >
                  <span className="text-gray-300 text-sm">{count} pending registration{count !== 1 ? 's' : ''}</span>
                  <span className="text-gray-500 text-xs truncate ml-2 max-w-[100px]">{eventMap[eventId] ?? 'Event'}</span>
                </Link>
              ))}
              {duplicateCount > 0 && (
                <Link
                  href="/admin/members"
                  className="flex items-center justify-between bg-orange-900/20 border border-orange-800/30 rounded-lg px-3 py-2 hover:bg-orange-900/30 transition-colors"
                >
                  <span className="text-orange-300 text-sm">{duplicateCount} duplicate member{duplicateCount !== 1 ? 's' : ''}</span>
                  <span className="text-gray-500 text-xs">→</span>
                </Link>
              )}
              {eventsMissingImage > 0 && (
                <div className="flex items-center justify-between bg-white/[0.03] border border-white/10 rounded-lg px-3 py-2">
                  <span className="text-gray-400 text-sm">{eventsMissingImage} event{eventsMissingImage !== 1 ? 's' : ''} missing cover image</span>
                </div>
              )}
              {paymentsToVerify === 0 && eventsPendingList.length === 0 && duplicateCount === 0 && eventsMissingImage === 0 && (
                <p className="text-gray-600 text-sm py-1">All clear!</p>
              )}
            </div>
          </div>
        </section>

        {/* OVERVIEW STATS */}
        <section>
          <h2 className="heading-display text-white text-lg mb-3">Overview</h2>
          <div className="card grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 divide-x divide-y sm:divide-y-0 divide-white/10">
            {[
              { label: 'Total Members', value: totalMembers ?? 0, color: 'text-white' },
              { label: 'Joined This Week', value: membersThisWeek, color: 'text-gold' },
              { label: 'Never Showed Up', value: neverShowedUp, color: 'text-gray-400' },
              { label: 'Registered', value: membersRegistered, color: 'text-green-400' },
              { label: 'Attended', value: totalAttended, color: 'text-blue-400' },
            ].map(({ label, value, color }) => (
              <div key={label} className="text-center px-2 py-3 first:pl-0 last:pr-0">
                <p className={`text-2xl font-bold mb-1 ${color}`}>{value}</p>
                <p className="text-gray-500 text-xs">{label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* RECENT JOINS */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="heading-display text-white text-lg">Recent Joins</h2>
            <Link href="/admin/members" className="text-gold hover:underline text-xs">
              View all →
            </Link>
          </div>
          <div className="card grid gap-3 sm:grid-cols-2 md:grid-cols-5">
            {(last5Members || []).map((m: { member_id: string; name: string; place: string; created_at: string }) => (
              <div key={m.member_id} className="min-w-0">
                <span className="stat-number text-gold text-xs tracking-wider bg-gold/10 border border-gold/30 px-2 py-1 rounded-lg whitespace-nowrap inline-block mb-1.5">
                  {m.member_id}
                </span>
                <p className="text-white text-sm font-medium truncate">{m.name}</p>
                <p className="text-gray-500 text-xs truncate">{m.place} · {timeAgo(m.created_at)}</p>
              </div>
            ))}
            {(last5Members || []).length === 0 && (
              <p className="text-gray-600 text-sm">No members yet.</p>
            )}
          </div>
        </section>

        {/* MANAGE EVENTS */}
        <section className="border-t border-white/10 pt-8 space-y-8">
          <h2 className="heading-display text-white text-xl">Manage Events</h2>
          <div>
            <h3 className="text-white font-semibold mb-4">Create New Event</h3>
            <CreateEventForm />
          </div>
          <div>
            <h3 className="text-white font-semibold mb-4">All Events</h3>
            <AdminEventList events={eventsWithStats} />
          </div>
        </section>
      </div>
    </main>
  )
}
