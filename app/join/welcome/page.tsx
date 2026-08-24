import { createClient } from '@/lib/supabase-server'
import SiteHeader from '@/components/ui/SiteHeader'
import WelcomeCard from '@/components/WelcomeCard'

export default async function JoinWelcomePage({
  searchParams,
}: {
  searchParams: { member_id?: string; name?: string }
}) {
  const member_id = searchParams.member_id || 'TFRC0001'
  const name = searchParams.name || 'Runner'

  const supabase = createClient()
  const { data: settingsRows } = await supabase.from('site_settings').select('key, value')
  const settings: Record<string, string> = {}
  ;(settingsRows || []).forEach((r: { key: string; value: string }) => {
    settings[r.key] = r.value
  })

  const whatsappLink = settings['whatsapp_link'] || ''
  const instagramUrl = settings['instagram_url'] || ''

  return (
    <main className="min-h-screen bg-black">
      <SiteHeader />
      <div className="flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full text-center">
        <WelcomeCard
          name={name}
          memberId={member_id}
          whatsappLink={whatsappLink}
          instagramUrl={instagramUrl}
        />
      </div>
      </div>
    </main>
  )
}
