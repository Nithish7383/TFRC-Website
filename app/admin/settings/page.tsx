import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase-server'
import { SiteSetting } from '@/lib/types'
import AdminSignOutButton from '@/components/AdminSignOutButton'
import SiteSettingsForm from '@/components/SiteSettingsForm'

export default async function AdminSettingsPage() {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/admin/login')

  const { data: settingsRows } = await supabase
    .from('site_settings')
    .select('key, value, updated_at')

  const settings: SiteSetting[] = (settingsRows || []) as SiteSetting[]

  return (
    <main className="min-h-screen bg-gray-950">
      <header className="border-b border-gray-800 bg-gray-900/50 px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src="/firstruleclublogo.jpg" alt="TFRC" className="w-8 h-8 rounded-full object-cover" />
          <div>
            <h1 className="text-white font-semibold text-sm">The First Rule Club</h1>
            <p className="text-gray-500 text-xs">Admin — Settings</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/admin" className="text-gray-400 hover:text-white text-xs transition-colors">Dashboard</Link>
          <Link href="/admin/members" className="text-gray-400 hover:text-white text-xs transition-colors">Members</Link>
          <span className="text-gray-500 text-xs hidden md:block">{user.email}</span>
          <AdminSignOutButton />
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center gap-3">
          <Link href="/admin" className="text-gray-500 hover:text-gray-300 text-sm">← Dashboard</Link>
        </div>
        <h2 className="text-2xl font-bold text-white">Site Settings</h2>
        <p className="text-gray-400 text-sm">Changes take effect immediately on the live site.</p>
        <SiteSettingsForm settings={settings} />
      </div>
    </main>
  )
}
