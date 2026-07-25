import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase-server'
import { Member } from '@/lib/types'
import AdminSignOutButton from '@/components/AdminSignOutButton'
import MembersTable from '@/components/MembersTable'

export default async function AdminMembersPage() {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/admin/login')

  const { data: members } = await supabase
    .from('members')
    .select('*')
    .order('member_number', { ascending: true })

  const allMembers: Member[] = (members || []) as Member[]

  const totalMembers = allMembers.length
  const level1Count = allMembers.filter((m) => m.level === 1).length
  const level2Count = allMembers.filter((m) => m.level === 2).length
  const avgAttended = totalMembers > 0
    ? (allMembers.reduce((sum, m) => sum + m.attended_count, 0) / totalMembers).toFixed(1)
    : '0'

  // Duplicate detection for stats display
  const phoneMap: Record<string, number> = {}
  const nameMap: Record<string, number> = {}
  allMembers.forEach((m) => {
    phoneMap[m.phone] = (phoneMap[m.phone] || 0) + 1
    const norm = m.name.toLowerCase().trim()
    nameMap[norm] = (nameMap[norm] || 0) + 1
  })
  const dupPhoneCount = Object.values(phoneMap).filter((c) => c > 1).length
  const dupNameCount = Object.values(nameMap).filter((c) => c > 1).length
  const totalDuplicates = dupPhoneCount + dupNameCount

  return (
    <main className="min-h-screen bg-gray-950">
      <header className="border-b border-gray-800 bg-gray-900/50 px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src="/firstruleclublogo.jpg" alt="TFRC" className="w-8 h-8 rounded-full object-cover" />
          <div>
            <h1 className="text-white font-semibold text-sm">The First Rule Club</h1>
            <p className="text-gray-500 text-xs">Admin — Members</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/admin" className="text-gray-400 hover:text-white text-xs transition-colors">Dashboard</Link>
          <Link href="/admin/settings" className="text-gray-400 hover:text-white text-xs transition-colors">Settings</Link>
          <span className="text-gray-500 text-xs hidden md:block">{user.email}</span>
          <AdminSignOutButton />
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        <div className="flex items-center gap-3">
          <Link href="/admin" className="text-gray-500 hover:text-gray-300 text-sm">← Dashboard</Link>
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            { label: 'Total Members', value: totalMembers, color: 'text-white' },
            { label: 'Level 1', value: level1Count, color: 'text-gray-400' },
            { label: 'Level 2', value: level2Count, color: 'text-[#C9A227]' },
            { label: 'Avg Runs Attended', value: avgAttended, color: 'text-green-400' },
            { label: 'Duplicates', value: totalDuplicates, color: totalDuplicates > 0 ? 'text-yellow-400' : 'text-gray-600' },
          ].map(({ label, value, color }) => (
            <div key={label} className="card text-center">
              <p className={`text-2xl font-bold mb-1 ${color}`}>{value}</p>
              <p className="text-gray-500 text-xs">{label}</p>
            </div>
          ))}
        </div>

        <MembersTable members={allMembers} />
      </div>
    </main>
  )
}
