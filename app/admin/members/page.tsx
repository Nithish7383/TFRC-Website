import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Suspense } from 'react'
import { createClient } from '@/lib/supabase-server'
import { Member } from '@/lib/types'
import MembersTable from '@/components/MembersTable'
import AdminHeader from '@/components/ui/AdminHeader'

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
    <main className="min-h-screen bg-black">
      <AdminHeader
        subtitle="Admin — Members"
        email={user.email}
        links={[
          { href: '/admin', label: 'Dashboard' },
          { href: '/admin/settings', label: 'Settings' },
        ]}
      />

      <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        <div className="flex items-center gap-3">
          <Link href="/admin" className="text-gray-500 hover:text-gray-300 text-sm">← Dashboard</Link>
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: 'Total Members', value: totalMembers, color: 'text-white' },
            { label: 'Avg Runs Attended', value: avgAttended, color: 'text-green-400' },
            { label: 'Duplicates', value: totalDuplicates, color: totalDuplicates > 0 ? 'text-yellow-400' : 'text-gray-600' },
          ].map(({ label, value, color }) => (
            <div key={label} className="card text-center">
              <p className={`text-2xl font-bold mb-1 ${color}`}>{value}</p>
              <p className="text-gray-500 text-xs">{label}</p>
            </div>
          ))}
        </div>

        <Suspense fallback={<p className="text-gray-500 text-sm">Loading members...</p>}>
          <MembersTable members={allMembers} />
        </Suspense>
      </div>
    </main>
  )
}
