import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase-server'
import { SiteSetting } from '@/lib/types'
import SiteSettingsForm from '@/components/SiteSettingsForm'
import AdminHeader from '@/components/ui/AdminHeader'

export default async function AdminSettingsPage() {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/admin/login')

  const { data: settingsRows } = await supabase
    .from('site_settings')
    .select('key, value, updated_at')

  const settings: SiteSetting[] = (settingsRows || []) as SiteSetting[]

  return (
    <main className="min-h-screen bg-black">
      <AdminHeader
        subtitle="Admin — Settings"
        email={user.email}
        links={[
          { href: '/admin', label: 'Dashboard' },
          { href: '/admin/members', label: 'Members' },
        ]}
      />

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center gap-3">
          <Link href="/admin" className="text-gray-500 hover:text-gray-300 text-sm">← Dashboard</Link>
        </div>
        <h2 className="heading-display text-white text-2xl">Site Settings</h2>
        <p className="text-gray-400 text-sm">Changes take effect immediately on the live site.</p>
        <SiteSettingsForm settings={settings} />
      </div>
    </main>
  )
}
