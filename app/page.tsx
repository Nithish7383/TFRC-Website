import Link from 'next/link'
import { createClient } from '@/lib/supabase-server'
import { GalleryPhoto } from '@/lib/types'
import { TFRC_LOCATION } from '@/lib/constants'
import SiteHeader from '@/components/ui/SiteHeader'
import SiteFooter from '@/components/ui/SiteFooter'
import SocialLinks from '@/components/ui/SocialLinks'
import Reveal from '@/components/ui/Reveal'
import HeroBackground from '@/components/HeroBackground'

const ACTIVITY_ICONS: Record<string, JSX.Element> = {
  Running: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="w-6 h-6">
      <circle cx="16" cy="5" r="1.8" fill="currentColor" stroke="none" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l2.5-5 2-2-1-4M7 13l3-2 2.5 2.5L17 12l3 1M11 9l2-2.5 3 1" />
    </svg>
  ),
  Treks: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="w-6 h-6">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 18l5-9 3 5 2-3 5 7H3z" />
      <circle cx="17" cy="6" r="1.5" />
    </svg>
  ),
  Yoga: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="w-6 h-6">
      <circle cx="12" cy="5" r="1.8" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4M12 12l-6 6M12 12l6 6M8 12h8" />
    </svg>
  ),
  Turf: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="w-6 h-6">
      <circle cx="12" cy="12" r="8" />
      <path strokeLinecap="round" d="M12 4v4l3 2-1 4h-4l-1-4 3-2z" />
    </svg>
  ),
  Meetups: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="w-6 h-6">
      <circle cx="9" cy="8" r="2.2" />
      <circle cx="17" cy="9" r="1.8" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 19c0-2.8 2.2-5 5-5s5 2.2 5 5M15 19c0-2-1.3-3.8-3-4.5M15 12.5c1.7 0 3 1.3 3 3v.5" />
    </svg>
  ),
}

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
  const heroPhotos = photos.slice(0, 6)

  const activities = [
    { label: 'Running', desc: 'Weekly group runs' },
    { label: 'Treks', desc: 'Terrain challenges' },
    { label: 'Yoga', desc: 'Recovery sessions' },
    { label: 'Turf', desc: 'Team sports' },
    { label: 'Meetups', desc: 'Community events' },
  ]

  return (
    <main className="min-h-screen bg-black">
      <SiteHeader />

      {/* HERO */}
      <section className="relative flex flex-col items-center justify-center text-center px-4 pt-20 pb-24 overflow-hidden">
        <HeroBackground photos={heroPhotos} />

        <svg
          className="absolute inset-x-0 top-[58%] w-full h-28 opacity-[0.08] pointer-events-none z-[1]"
          viewBox="0 0 800 100"
          preserveAspectRatio="none"
        >
          <path
            d="M0,55 C120,15 200,90 320,50 C440,10 520,85 640,45 C700,25 750,55 800,40"
            stroke="#C8A435"
            strokeWidth="2"
            strokeDasharray="7 11"
            strokeLinecap="round"
            fill="none"
          />
        </svg>

        <div className="eyebrow relative z-[1] border border-gold/30 bg-gold/5 px-3 py-1.5 rounded-full mb-8">
          <span className="w-1.5 h-1.5 rounded-full bg-gold animate-pulse-slow" />
          Start line · {TFRC_LOCATION}
        </div>

        <div className="w-24 h-24 mb-7 relative z-[1]">
          <img
            src="/firstruleclublogo.jpg"
            alt="First Rule Club"
            className="w-24 h-24 rounded-full object-cover ring-2 ring-gold/25"
          />
        </div>

        <h1
          className="heading-display relative z-[1] text-white text-5xl md:text-7xl mb-5 max-w-4xl [text-shadow:0_2px_10px_rgba(0,0,0,0.55)]"
        >
          We don&apos;t talk about it.
        </h1>

        <p
          className="heading-display relative z-[1] text-gold text-2xl md:text-3xl mb-8 max-w-2xl [text-shadow:0_2px_8px_rgba(0,0,0,0.55)]"
        >
          Remember the first rule.
        </p>

        <p className="relative z-[1] text-gray-400 max-w-lg mx-auto mb-10 text-base md:text-lg">
          The First Rule Club — no entry fee, no ego. Just show up and run.
        </p>

        <div className="relative z-[1] flex flex-col sm:flex-row gap-3 items-center">
          <Link href="/join" className="btn-primary text-base px-9 py-4 inline-block">
            Join as Member →
          </Link>
          <Link href="/login" className="btn-secondary text-base px-7 py-4 inline-block">
            Member Login
          </Link>
        </div>
      </section>

      {/* FEATURED EVENT */}
      {featuredActive && featuredName && (
        <Reveal>
          <section className="py-16 px-4">
            <div className="max-w-3xl mx-auto">
              <div className="relative border-2 border-gold/50 bg-gold/5 rounded-2xl p-8 overflow-hidden">
                <div className="absolute top-0 right-0 text-[10px] font-mono tracking-[0.2em] uppercase text-gold/60 px-4 py-2">
                  Entry open
                </div>
                <div className="inline-block text-xs bg-gold/20 text-gold border border-gold/30 px-3 py-1 rounded-full font-semibold uppercase tracking-wide mb-4">
                  Featured Event
                </div>
                <h2 className="heading-display text-white text-3xl md:text-4xl mb-2">{featuredName}</h2>
                {featuredDate && (
                  <p className="text-gold font-mono font-medium mb-3">{featuredDate}</p>
                )}
                {featuredDesc && (
                  <p className="text-gray-300 mb-5">{featuredDesc}</p>
                )}
                {featuredUrl && (
                  <a href={featuredUrl} target="_blank" rel="noopener noreferrer" className="btn-primary inline-block">
                    {featuredBtn}
                  </a>
                )}
              </div>
            </div>
          </section>
        </Reveal>
      )}

      {/* SOCIAL LINKS — early touchpoint right after the hero */}
      <section className="border-t border-white/10 py-8 px-4">
        <div className="max-w-4xl mx-auto flex flex-col items-center gap-3">
          <p className="text-gray-600 text-xs font-mono uppercase tracking-[0.2em]">Follow along</p>
          <SocialLinks whatsappLink={whatsappLink} instagramUrl={instagramUrl} youtubeUrl={youtubeUrl} variant="pill" />
        </div>
      </section>

      {/* WHY WE STARTED */}
      <Reveal>
        <section className="border-t border-white/10 py-16 px-4">
          <div className="max-w-2xl mx-auto">
            <div className="card border-l-2 border-l-gold">
              <p className="eyebrow mb-3">The why</p>
              <h2 className="heading-display text-white text-2xl mb-4">Why we started</h2>
              <p className="text-gray-300 leading-relaxed">
                We believe fitness isn&apos;t just about lifting weights or running miles. It&apos;s about
                building habits, creating memories, and surrounding yourself with people who inspire you
                to keep showing up. The First Rule Club exists to bring people into a healthier lifestyle
                through workouts, treks, sports, adventures, and meaningful connections. Because fitness
                is easier, more exciting, and far more rewarding when you do it together.
              </p>
            </div>
          </div>
        </section>
      </Reveal>

      {/* WHAT WE DO */}
      <Reveal>
        <section className="border-t border-white/10 bg-white/[0.02] py-16 px-4">
          <div className="max-w-4xl mx-auto">
            <p className="eyebrow mb-2 justify-center w-full">On the schedule</p>
            <h2 className="heading-display text-white text-2xl mb-8 text-center">What we do</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
              {activities.map(({ label, desc }) => (
                <div
                  key={label}
                  className="group bg-white/[0.02] border border-white/10 hover:border-gold/40 rounded-2xl px-4 py-6 text-center transition-colors"
                >
                  <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-white/5 border border-white/10 group-hover:border-gold/50 flex items-center justify-center text-gray-300 group-hover:text-gold transition-colors">
                    {ACTIVITY_ICONS[label]}
                  </div>
                  <p className="text-white font-mono font-semibold text-xs tracking-wide uppercase">
                    {label}
                  </p>
                  <p className="text-gray-500 text-xs mt-1">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </Reveal>

      {/* GALLERY */}
      {showGallery && (
        <Reveal>
          <section className="border-t border-white/10 py-16 px-4">
            <div className="max-w-4xl mx-auto">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <p className="eyebrow mb-2">Race day</p>
                  <h2 className="heading-display text-white text-2xl">Past Events</h2>
                </div>
                {hasMorePhotos && (
                  <Link href="/gallery" className="text-gold hover:underline text-sm">
                    See more →
                  </Link>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {displayPhotos.map((photo) => (
                  <div key={photo.id} className="group overflow-hidden rounded-xl border border-white/10 hover:border-gold/30 transition-colors">
                    <img
                      src={photo.image_url}
                      alt={photo.caption ?? 'TFRC event'}
                      loading="lazy"
                      className="w-full h-64 md:h-72 object-cover group-hover:scale-[1.03] transition-transform duration-300"
                    />
                    {photo.caption && (
                      <p className="text-gray-400 text-xs px-3 py-2">{photo.caption}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </section>
        </Reveal>
      )}

      {/* SOCIAL PROOF / BIB TAG STRIP */}
      <section className="border-y border-white/10 py-10 px-4">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="border-2 border-gold rounded-lg px-4 py-2 text-center min-w-[92px]">
              <p className="stat-number text-white text-2xl leading-none">{communityStatValue}</p>
              <p className="text-gold text-[9px] font-mono tracking-[0.2em] uppercase mt-1">Members</p>
            </div>
            <p className="text-gray-500 text-sm">Runners on the roster · {TFRC_LOCATION}</p>
          </div>

          <SocialLinks whatsappLink={whatsappLink} instagramUrl={instagramUrl} youtubeUrl={youtubeUrl} variant="pill" />
        </div>
      </section>

      {/* MEMBER VOICES */}
      {quotes.length > 0 && (
        <Reveal>
          <section className="border-t border-white/10 bg-white/[0.02] py-16 px-4">
            <div className="max-w-5xl mx-auto">
              <p className="eyebrow mb-2 justify-center w-full">From the pack</p>
              <h2 className="heading-display text-white text-2xl mb-8 text-center">What members say</h2>
              <div className="grid gap-6 md:grid-cols-3">
                {quotes.map((q, i) => (
                  <div key={i} className="card space-y-3">
                    <p className="text-gray-300 italic leading-relaxed">&ldquo;{q.text}&rdquo;</p>
                    {q.name && (
                      <p className="text-gold text-xs font-mono font-medium tracking-wide uppercase">
                        — {q.name}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </section>
        </Reveal>
      )}

      <SiteFooter whatsappLink={whatsappLink} instagramUrl={instagramUrl} youtubeUrl={youtubeUrl} />
    </main>
  )
}
