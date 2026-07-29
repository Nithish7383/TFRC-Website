import Link from 'next/link'
import { createClient } from '@/lib/supabase-server'
import Avatar from '@/components/ui/Avatar'
import SiteHeader from '@/components/ui/SiteHeader'

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
        <div className="card space-y-6">
          <div className="mx-auto w-fit">
            <Avatar name={name} size="md" />
          </div>

          {/* Check icon */}
          <div className="w-14 h-14 bg-gold/20 border-2 border-gold/50 rounded-full flex items-center justify-center mx-auto -mt-2">
            <svg className="w-7 h-7 text-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <div className="stat-number text-4xl text-gold tracking-widest border-2 border-gold/40 rounded-xl px-8 py-4 inline-block">
            {member_id}
          </div>

          <div>
            <h1 className="heading-display text-white text-3xl mb-2">Welcome, {name}!</h1>
            <p className="text-gray-400">You&apos;re officially a member of The First Rule Club.</p>
            <p className="heading-display text-lg mt-2">
              <span className="text-white">Luck is optional.</span> <span className="text-gold">Effort isn&apos;t.</span>
            </p>
          </div>

          <div className="bg-white/[0.03] rounded-lg p-4 border border-white/10 text-left">
            <p className="text-gray-300 text-sm leading-relaxed">
              <span className="text-gold font-medium">Save your Member ID</span>
              <br />
              You&apos;ll need it to register for events. Screenshot this page or note it down.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            {/* Primary — go register for an event */}
            <Link
              href="/?welcome=1"
              className="btn-primary block text-center"
            >
              Browse Events →
            </Link>

            {/* WhatsApp — only if set */}
            {whatsappLink && (
              <a
                href={whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                className="block text-center bg-green-700 hover:bg-green-600 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
              >
                Join WhatsApp Community
              </a>
            )}

            {/* Instagram — only if set */}
            {instagramUrl && (
              <a
                href={instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary block text-center"
              >
                Follow on Instagram
              </a>
            )}
          </div>
        </div>
      </div>
      </div>
    </main>
  )
}
