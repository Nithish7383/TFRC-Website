import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'
import { Member, Registration } from '@/lib/types'
import MemberProfileCard from '@/components/MemberProfileCard'
import MemberEventsList from '@/components/MemberEventsList'
import MemberSignOutButton from '@/components/MemberSignOutButton'
import SiteHeader from '@/components/ui/SiteHeader'
import StatusBadge from '@/components/ui/StatusBadge'
import Avatar from '@/components/ui/Avatar'

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

const TIERS = [
  { min: 20, label: 'Elite' },
  { min: 8, label: 'Regular' },
  { min: 1, label: 'Rising' },
  { min: 0, label: 'Rookie' },
]

function getTier(attendedCount: number): string {
  return TIERS.find((t) => attendedCount >= t.min)?.label ?? 'Rookie'
}

/** Consecutive most-recent attended events, newest first, stopping at the first miss. */
function computeStreak(regs: { attended?: boolean; events?: { date: string } | null }[]): number {
  const sorted = [...regs]
    .filter((r) => r.events?.date)
    .sort((a, b) => new Date(b.events!.date).getTime() - new Date(a.events!.date).getTime())

  let streak = 0
  for (const r of sorted) {
    if (r.attended) streak++
    else break
  }
  return streak
}

export default async function MemberProfilePage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: memberData } = await supabase
    .from('members')
    .select('*')
    .eq('member_id', params.id)
    .single()

  // RLS ("Members can read own row") already scopes this select to the
  // logged-in member's own row, so a mismatched [id] in the URL returns no
  // row rather than someone else's data — but check explicitly too, since
  // relying solely on RLS here would silently 404 instead of redirecting to
  // login, which is confusing if the session itself is simply stale.
  if (!memberData || memberData.auth_user_id !== user.id) {
    notFound()
  }

  const member = memberData as Member
  const firstName = member.name.trim().split(/\s+/)[0]

  const [
    { data: regsData },
    { data: eventsData },
    { count: totalMembers },
    { count: totalEvents },
    { data: allAttendedCounts },
    { data: topMembers },
    { data: settingsRows },
  ] = await Promise.all([
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
    supabase.from('members').select('*', { count: 'exact', head: true }),
    supabase.from('events').select('*', { count: 'exact', head: true }),
    supabase.from('members').select('attended_count'),
    supabase
      .from('members')
      .select('name, member_id, attended_count')
      .order('attended_count', { ascending: false })
      .limit(5),
    supabase.from('site_settings').select('key, value'),
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

  const activeEventIds = new Set(eventsWithCounts.map((e) => e.id))
  const activeRegistrations = registrations.filter((r) => activeEventIds.has(r.event_id))

  type RegWithEvent = Registration & {
    events?: { title: string; date: string; distance?: string; pace_group?: string } | null
  }
  const pastRegs: RegWithEvent[] = registrations as RegWithEvent[]

  // Real, derived stats — no schema changes
  const communityAttended = (allAttendedCounts || []).reduce((sum, m) => sum + (m.attended_count ?? 0), 0)
  const streak = computeStreak(pastRegs)
  const tier = getTier(member.attended_count)
  const leaderboard = (topMembers || []) as { name: string; member_id: string; attended_count: number }[]

  const settings: Record<string, string> = {}
  ;(settingsRows || []).forEach((r: { key: string; value: string }) => { settings[r.key] = r.value })
  const quoteCandidates = [
    { text: settings['quote_1_text'], name: settings['quote_1_name'] },
    { text: settings['quote_2_text'], name: settings['quote_2_name'] },
    { text: settings['quote_3_text'], name: settings['quote_3_name'] },
  ].filter((q) => q.text)
  const featuredQuote = quoteCandidates[0] ?? { text: 'Luck is optional. Effort isn\'t.', name: 'TFRC' }

  return (
    <main className="min-h-screen bg-black">
      <SiteHeader />

      <div className="max-w-5xl mx-auto px-4 py-8 space-y-10">

        {/* WELCOME HEADER */}
        <section className="flex flex-col sm:flex-row sm:items-center gap-5 justify-between">
          <div className="flex items-center gap-4">
            <Avatar name={member.name} size="md" />
            <div>
              <p className="eyebrow mb-1">Welcome back</p>
              <h1 className="heading-display text-white text-3xl md:text-4xl">{firstName}</h1>
              <p className="text-gray-500 text-sm mt-1">
                <span className="text-gold font-mono">{tier}</span> · Member since{' '}
                {new Date(member.created_at).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <p className="heading-display text-lg text-right text-gray-400">
              <span className="text-white">Luck is optional.</span> <span className="text-gold">Effort isn&apos;t.</span>
            </p>
            <MemberSignOutButton />
          </div>
        </section>

        {/* STAT ROW */}
        <section className="grid grid-cols-3 gap-3 md:gap-4">
          <div className="card text-center py-5">
            <p className="stat-number text-gold text-3xl">{member.attended_count}</p>
            <p className="text-gray-500 text-xs mt-1 font-mono uppercase tracking-wide">Runs Attended</p>
          </div>
          <div className="card text-center py-5">
            <p className="stat-number text-white text-3xl">{streak}</p>
            <p className="text-gray-500 text-xs mt-1 font-mono uppercase tracking-wide">Current Streak</p>
          </div>
          <div className="card text-center py-5">
            <p className="stat-number text-white text-3xl">{tier}</p>
            <p className="text-gray-500 text-xs mt-1 font-mono uppercase tracking-wide">Tier</p>
          </div>
        </section>

        {/* MAIN GRID */}
        <div className="grid gap-8 lg:grid-cols-3">
          {/* MAIN COLUMN */}
          <div className="lg:col-span-2 space-y-10">
            <section>
              <h2 className="heading-display text-white text-xl mb-4">Upcoming Events</h2>
              <MemberEventsList
                member={member}
                events={eventsWithCounts}
                registrations={activeRegistrations}
              />
            </section>

            <section>
              <h2 className="heading-display text-white text-xl mb-4">Recent Activity</h2>
              {pastRegs.length === 0 ? (
                <div className="card text-center py-8">
                  <p className="text-gray-500">No registrations yet — join an event to get started.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pastRegs.map((reg) => (
                    <div key={reg.id} className="card flex items-center justify-between gap-3 flex-wrap py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-gold flex-shrink-0" />
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
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        {reg.attended && (
                          <span className="text-xs bg-green-900/30 text-green-400 border border-green-800/40 px-2.5 py-1 rounded-full">
                            Attended ✓
                          </span>
                        )}
                        <StatusBadge status={reg.status} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>

          {/* SIDE COLUMN */}
          <div className="space-y-6">
            {/* Weekly Challenge — placeholder, no backend yet */}
            <div className="card space-y-2 border-l-2 border-l-gold">
              <p className="eyebrow">Weekly Challenge</p>
              <h3 className="heading-display text-white text-lg">Coming Soon</h3>
              <p className="text-gray-500 text-sm leading-relaxed">
                Weekly challenges are on the way — a fresh target every week to keep the streak alive.
              </p>
            </div>

            {/* Community Stats */}
            <div className="card space-y-4">
              <p className="eyebrow">The Club</p>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <p className="stat-number text-white text-xl">{totalMembers ?? 0}</p>
                  <p className="text-gray-500 text-[10px] font-mono uppercase mt-1">Members</p>
                </div>
                <div>
                  <p className="stat-number text-white text-xl">{totalEvents ?? 0}</p>
                  <p className="text-gray-500 text-[10px] font-mono uppercase mt-1">Events</p>
                </div>
                <div>
                  <p className="stat-number text-white text-xl">{communityAttended}</p>
                  <p className="text-gray-500 text-[10px] font-mono uppercase mt-1">Runs Logged</p>
                </div>
              </div>
            </div>

            {/* Leaderboard */}
            <div className="card space-y-3">
              <p className="eyebrow">Leaderboard</p>
              <div className="space-y-2">
                {leaderboard.map((m, i) => (
                  <div
                    key={m.member_id}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg ${
                      m.member_id === member.member_id ? 'bg-gold/10 border border-gold/30' : ''
                    }`}
                  >
                    <span className="stat-number text-gray-500 text-sm w-4">{i + 1}</span>
                    <span className="text-sm text-white flex-1 truncate">
                      {m.name}
                      {m.member_id === member.member_id && <span className="text-gold"> (you)</span>}
                    </span>
                    <span className="stat-number text-gold text-sm">{m.attended_count}</span>
                  </div>
                ))}
                {leaderboard.length === 0 && (
                  <p className="text-gray-600 text-sm">No data yet.</p>
                )}
              </div>
            </div>

            {/* Motivational quote */}
            <div className="card space-y-2">
              <p className="eyebrow">Word From The Pack</p>
              <p className="text-gray-300 italic leading-relaxed text-sm">&ldquo;{featuredQuote.text}&rdquo;</p>
              {featuredQuote.name && (
                <p className="text-gold text-xs font-mono uppercase tracking-wide">— {featuredQuote.name}</p>
              )}
            </div>

            {/* Profile details */}
            <MemberProfileCard member={member} />
          </div>
        </div>
      </div>
    </main>
  )
}
