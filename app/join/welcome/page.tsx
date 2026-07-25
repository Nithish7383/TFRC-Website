import Link from 'next/link'
import { createClient } from '@/lib/supabase-server'

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0][0]?.toUpperCase() ?? '?'
  return ((parts[0][0] ?? '') + (parts[parts.length - 1][0] ?? '')).toUpperCase()
}

export default async function JoinWelcomePage({
  searchParams,
}: {
  searchParams: { member_id?: string; name?: string }
}) {
  const member_id = searchParams.member_id || 'TFRC0001'
  const name = searchParams.name || 'Runner'
  const initials = getInitials(name)

  const supabase = createClient()
  const { data: settingsRows } = await supabase.from('site_settings').select('key, value')
  const settings: Record<string, string> = {}
  ;(settingsRows || []).forEach((r: { key: string; value: string }) => {
    settings[r.key] = r.value
  })

  const whatsappLink = settings['whatsapp_link'] || ''
  const instagramUrl = settings['instagram_url'] || ''

  return (
    <main className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="card space-y-6">
          {/* Gold initials avatar */}
          <div className="w-20 h-20 rounded-full bg-[#C9A227] flex items-center justify-center mx-auto">
            <span className="text-black font-bold text-2xl">{initials}</span>
          </div>

          {/* Check icon */}
          <div className="w-14 h-14 bg-[#C9A227]/20 border-2 border-[#C9A227]/50 rounded-full flex items-center justify-center mx-auto -mt-2">
            <svg className="w-7 h-7 text-[#C9A227]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <div className="text-4xl font-bold text-[#C9A227] tracking-widest border-2 border-[#C9A227]/40 rounded-xl px-8 py-4 inline-block">
            {member_id}
          </div>

          <div>
            <h1 className="text-2xl font-bold text-white mb-2">Welcome, {name}!</h1>
            <p className="text-gray-400">You&apos;re officially a member of The First Rule Club.</p>
          </div>

          <div className="bg-gray-800/60 rounded-lg p-4 border border-gray-700/50 text-left">
            <p className="text-gray-300 text-sm leading-relaxed">
              <span className="text-[#C9A227] font-medium">Save your Member ID</span>
              <br />
              You&apos;ll need it to register for events. Screenshot this page or note it down.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            {/* Primary — view profile */}
            <Link
              href={`/member/${member_id}`}
              className="btn-primary block text-center"
            >
              View Your Profile →
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
    </main>
  )
}
