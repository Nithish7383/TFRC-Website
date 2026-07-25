import Link from 'next/link'
import { createClient } from '@/lib/supabase-server'
import { GalleryPhoto } from '@/lib/types'
import { TFRC_LOCATION } from '@/lib/constants'

export default async function LandingPage() {
  const supabase = createClient()

  const [
    { data: settingsRows },
    { count: memberCount },
    { data: galleryPhotos },
    { data: activeEvents },
  ] = await Promise.all([
    supabase.from('site_settings').select('key, value'),
    supabase.from('members').select('*', { count: 'exact', head: true }),
    supabase.from('gallery_photos').select('*').order('display_order', { ascending: true }),
    supabase.from('events').select('*').eq('is_active', true).order('date', { ascending: true }),
  ])

  const s: Record<string, string> = {}
  ;(settingsRows || []).forEach((r: { key: string; value: string }) => {
    s[r.key] = r.value
  })

  const photos: GalleryPhoto[] = (galleryPhotos || []) as GalleryPhoto[]
  const communityStatValue = s['community_stat_value'] || String(memberCount ?? '0')
  const whatsappLink = s['whatsapp_link'] || ''
  const instagramUrl = s['instagram_url'] || ''
  const youtubeUrl = s['youtube_url'] || ''
  const featuredActive = s['featured_event_active'] === 'true'
  const featuredName = s['featured_event_name'] || ''
  const featuredDate = s['featured_event_date'] || ''
  const featuredDesc = s['featured_event_desc'] || ''
  const featuredUrl = s['featured_event_url'] || ''
  const featuredBtn = s['featured_event_btn'] || 'Register Now'

  const quotes = [
    { text: s['quote_1_text'] || '', name: s['quote_1_name'] || '' },
    { text: s['quote_2_text'] || '', name: s['quote_2_name'] || '' },
    { text: s['quote_3_text'] || '', name: s['quote_3_name'] || '' },
  ].filter((q) => q.text)

  const showGallery = photos.length > 0
  const displayPhotos = photos.slice(0, 9)
  const hasMorePhotos = photos.length > 9

  return (
    <main className="min-h-screen bg-gray-950">

      {/* SECTION 1 — Sticky Nav */}
      <nav className="border-b border-gray-800 bg-gray-900/70 px-4 py-3 sticky top-0 z-10 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <img src="/firstruleclublogo.jpg" alt="TFRC" className="w-9 h-9 rounded-full object-cover" />
            <span className="text-white font-semibold text-sm hidden sm:block">The First Rule Club</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/gallery" className="text-gray-400 hover:text-white text-sm transition-colors">
              Gallery
            </Link>
            <Link href="/login" className="text-gray-400 hover:text-white text-sm transition-colors">
              Member Login
            </Link>
            <Link
              href="/admin/login"
              className="text-xs text-gray-500 hover:text-[#C9A227] border border-gray-700 hover:border-[#C9A227]/50 px-3 py-1.5 rounded-lg transition-colors"
            >
              Admin
            </Link>
          </div>
        </div>
      </nav>

      {/* SECTION 2 — Hero */}
      <section className="flex flex-col items-center justify-center text-center px-4 pt-20 pb-16 border-b border-gray-800">
        <div className="w-24 h-24 mb-6">
          <img src="/firstruleclublogo.jpg" alt="First Rule Club" className="w-24 h-24 rounded-full object-cover" />
        </div>
        <h1 className="text-3xl md:text-6xl font-bold text-white mb-4 leading-tight">
          Run with Madurai&apos;s community.
        </h1>
        <p className="text-gray-400 max-w-lg mx-auto mb-8 text-base md:text-lg">
          The First Rule Club — no entry fee, no ego. Just show up and run.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 items-center">
          <Link href="/join" className="btn-primary text-lg px-8 py-4 inline-block">
            Join as Member →
          </Link>
          <Link href="/login" className="btn-secondary text-base px-6 py-4 inline-block">
            Member Login →
          </Link>
        </div>
      </section>

      {/* SECTION 3 — Why We Started */}
      <section className="border-b border-gray-800 py-16 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="card border border-gray-700">
            <h2 className="text-xl font-bold text-white mb-4">Why we started</h2>
            <p className="text-gray-300 leading-relaxed">
              We started TFRC because running alone gets boring. Madurai needed a crew — not a club
              with fees and forms, but a group that just shows up every weekend and runs. That&apos;s still what we are.
            </p>
          </div>
        </div>
      </section>

      {/* SECTION 4 — What We Do */}
      <section className="border-b border-gray-800 bg-gray-900/30 py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-xl font-bold text-white mb-8 text-center">What we do</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            {[
              { icon: '🏃', label: 'Running', desc: 'Weekly group runs' },
              { icon: '⛰️', label: 'Treks', desc: 'Terrain challenges' },
              { icon: '🧘', label: 'Yoga', desc: 'Recovery sessions' },
              { icon: '⚽', label: 'Turf', desc: 'Team sports' },
              { icon: '🤝', label: 'Meetups', desc: 'Community events' },
            ].map(({ icon, label, desc }) => (
              <div key={label} className="card text-center py-5">
                <div className="text-3xl mb-2">{icon}</div>
                <p className="text-white font-semibold text-sm">{label}</p>
                <p className="text-gray-500 text-xs mt-1">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 5 — Gallery */}
      {showGallery && (
        <section className="border-b border-gray-800 py-16 px-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl font-bold text-white">Past Events</h2>
              {hasMorePhotos && (
                <Link href="/gallery" className="text-[#C9A227] hover:underline text-sm">
                  See more →
                </Link>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {displayPhotos.map((photo) => (
                <div key={photo.id} className="overflow-hidden rounded-xl border border-gray-800">
                  <img
                    src={photo.image_url}
                    alt={photo.caption ?? 'TFRC event'}
                    loading="lazy"
                    className="w-full h-48 object-cover"
                  />
                  {photo.caption && (
                    <p className="text-gray-400 text-xs px-3 py-2">{photo.caption}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* SECTION 6 — Social Proof Strip */}
      <section className="border-b border-gray-800 py-12 px-4 text-center">
        <p className="text-white text-3xl md:text-5xl font-bold mb-2">
          {communityStatValue}
        </p>
        <p className="text-gray-400 text-base mb-6">community members · {TFRC_LOCATION}</p>
        <div className="flex items-center justify-center gap-5 flex-wrap">
          {whatsappLink && (
            <a
              href={whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              className="text-green-400 hover:text-green-300 transition-colors flex items-center gap-2 text-sm"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              WhatsApp
            </a>
          )}
          {instagramUrl && (
            <a
              href={instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-pink-400 hover:text-pink-300 transition-colors flex items-center gap-2 text-sm"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
              </svg>
              Instagram
            </a>
          )}
          {youtubeUrl && (
            <a
              href={youtubeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-red-400 hover:text-red-300 transition-colors flex items-center gap-2 text-sm"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
              </svg>
              YouTube
            </a>
          )}
        </div>
      </section>

      {/* SECTION 7 — Featured Event Banner */}
      {featuredActive && featuredName && (
        <section className="border-b border-gray-800 py-16 px-4">
          <div className="max-w-3xl mx-auto">
            <div className="border-2 border-[#C9A227]/50 bg-[#C9A227]/5 rounded-2xl p-8 space-y-4">
              <div className="inline-block text-xs bg-[#C9A227]/20 text-[#C9A227] border border-[#C9A227]/30 px-3 py-1 rounded-full font-semibold uppercase tracking-wide">
                Featured Event
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-white">{featuredName}</h2>
              {featuredDate && (
                <p className="text-[#C9A227] font-medium">{featuredDate}</p>
              )}
              {featuredDesc && (
                <p className="text-gray-300">{featuredDesc}</p>
              )}
              {featuredUrl && (
                <a
                  href={featuredUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary inline-block"
                >
                  {featuredBtn}
                </a>
              )}
            </div>
          </div>
        </section>
      )}

      {/* SECTION 8 — Member Voices */}
      {quotes.length > 0 && (
        <section className="border-b border-gray-800 bg-gray-900/30 py-16 px-4">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-xl font-bold text-white mb-8 text-center">What members say</h2>
            <div className="grid gap-6 md:grid-cols-3">
              {quotes.map((q, i) => (
                <div key={i} className="card border border-gray-700 space-y-3">
                  <p className="text-gray-300 italic leading-relaxed">&ldquo;{q.text}&rdquo;</p>
                  {q.name && (
                    <p className="text-[#C9A227] text-sm font-medium">— {q.name}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* SECTION 9 — Footer */}
      <footer className="border-t border-gray-800 py-10 px-4 text-center text-gray-600 text-sm">
        <div className="flex items-center justify-center gap-5 mb-4 flex-wrap">
          {whatsappLink && (
            <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="text-green-500 hover:text-green-400 text-xs">
              WhatsApp
            </a>
          )}
          {instagramUrl && (
            <a href={instagramUrl} target="_blank" rel="noopener noreferrer" className="text-pink-400 hover:text-pink-300 text-xs">
              Instagram
            </a>
          )}
          {youtubeUrl && (
            <a href={youtubeUrl} target="_blank" rel="noopener noreferrer" className="text-red-400 hover:text-red-300 text-xs">
              YouTube
            </a>
          )}
        </div>
        <p className="text-gray-700 mb-2">{TFRC_LOCATION}</p>
        <Link href="/join" className="text-[#C9A227] hover:underline text-sm">
          Join free →
        </Link>
        <p className="mt-3 text-gray-800">
          © {new Date().getFullYear()} The First Rule Club. All rights reserved.
        </p>
      </footer>
    </main>
  )
}
