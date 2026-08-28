import Link from 'next/link'
import { createClient } from '@/lib/supabase-server'
import { GalleryPhoto, Event } from '@/lib/types'
import SiteFooter from '@/components/ui/SiteFooter'
import SocialLinks from '@/components/ui/SocialLinks'
import Reveal from '@/components/ui/Reveal'
import StaggerReveal, { StaggerItem } from '@/components/ui/StaggerReveal'
import HeroVideo from '@/components/HeroVideo'
import HeroContent from '@/components/HeroContent'
import HomepageEventsSection from '@/components/HomepageEventsSection'
import WelcomeBackBanner from '@/components/WelcomeBackBanner'
import PillNav from '@/components/PillNav'
import PhotoMarquee from '@/components/PhotoMarquee'
import FAQAccordion from '@/components/FAQAccordion'
import ScrollProgressBar from '@/components/ScrollProgressBar'
import ScrollCue from '@/components/ScrollCue'

const FAQ_ITEMS = [
  {
    question: 'Do I need to pay anything to join?',
    answer: 'No. TFRC has no entry fee and no membership cost — it always stays free to join and run with us.',
  },
  {
    question: 'Do I need to be a fast runner to join?',
    answer: 'Not at all. We welcome every pace, from first-timers to competitive runners. No ego, just show up.',
  },
  {
    question: 'Do I need experience in martial arts or fitness to join?',
    answer: 'No experience needed — just show up. Our sessions welcome complete beginners alongside seasoned practitioners.',
  },
  {
    question: 'How do I register for an event?',
    answer: 'Become a member first (it takes a minute), then pick any upcoming event and register with your member phone number.',
  },
  {
    question: 'How do I stay updated on events?',
    answer: 'Join our WhatsApp group after registering — that\'s where meeting points, timing changes, and new events get posted first.',
  },
  {
    question: 'What kind of activities does TFRC run?',
    answer: 'Group runs, treks, yoga/recovery sessions, turf sports, and community meetups — something for every kind of mover.',
  },
]

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

  // Slots-left per event, for the poster cards' "closing_soon" CTA label.
  const eventsWithSlotsLeft = await Promise.all(
    ((activeEvents || []) as Event[]).map(async (event) => {
      const [{ count: maleCount }, { count: femaleCount }] = await Promise.all([
        supabase.from('registrations').select('*', { count: 'exact', head: true }).eq('event_id', event.id).eq('gender', 'Male'),
        supabase.from('registrations').select('*', { count: 'exact', head: true }).eq('event_id', event.id).eq('gender', 'Female'),
      ])
      const slotsLeft = Math.max(event.max_male - (maleCount ?? 0), 0) + Math.max(event.max_female - (femaleCount ?? 0), 0)
      return { ...event, slotsLeft }
    })
  )

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
  const featuredImageUrl = s['featured_event_image_url'] || ''
  // Hero video temporarily disabled — it was re-downloading from Supabase
  // Storage on every visit and blew through the free-tier egress cap,
  // taking the whole site down. Falls back to the photo background below.
  const heroVideoMobileUrl = ''
  const heroVideoDesktopUrl = ''

  const showGallery = photos.length > 0
  const displayPhotos = photos.slice(0, 9)
  const hasMorePhotos = photos.length > 9
  const heroPhotos = photos.slice(0, 6)

  return (
    <main className="min-h-screen bg-black">
      <ScrollProgressBar />
      <PillNav />
      <WelcomeBackBanner />

      {/* HERO */}
      <section id="home" className="relative flex flex-col items-center justify-center text-center px-4 pt-32 pb-24 overflow-hidden min-h-screen">
        <HeroVideo
          mobileVideoUrl={heroVideoMobileUrl}
          desktopVideoUrl={heroVideoDesktopUrl}
          posterUrl="/firstruleclublogo.jpg"
          photos={heroPhotos}
        />

        <HeroContent />
        <ScrollCue />
      </section>

      {/* FEATURED EVENT */}
      {featuredActive && featuredName && (
        <Reveal scale>
          <section className="py-16 px-4">
            <div className="max-w-3xl mx-auto">
              <div className="group relative border-2 border-gold/50 rounded-2xl p-8 overflow-hidden
                             shadow-gold-glow transition-all duration-500 ease-out-expo
                             hover:border-gold hover:shadow-gold-glow-lg">
                {featuredImageUrl ? (
                  <div className="absolute inset-0">
                    <img
                      src={featuredImageUrl}
                      alt=""
                      className="w-full h-full object-cover transition-transform duration-[1200ms] ease-out-expo group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/75 to-black/40" />
                  </div>
                ) : (
                  <div className="absolute inset-0 bg-gold/5" />
                )}

                <div className="relative z-[1]">
                  <div className="absolute -top-4 right-0 flex items-center gap-1.5 text-[10px] font-mono tracking-[0.2em] uppercase text-gold/70 px-4 py-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-gold animate-pulse-slow" />
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
            </div>
          </section>
        </Reveal>
      )}

      <HomepageEventsSection events={eventsWithSlotsLeft} whatsappLink={whatsappLink} />

      {/* GALLERY — infinite-scroll photo marquee */}
      {showGallery && (
        <Reveal>
          <section id="gallery" className="border-t border-white/10 py-20 md:py-28 scroll-mt-24">
            <div className="max-w-4xl mx-auto px-4 flex items-center justify-between mb-10">
              <div>
                <p className="eyebrow eyebrow-line mb-2">Race day</p>
                <h2 className="heading-display text-white text-3xl md:text-4xl">Our Community</h2>
              </div>
              {hasMorePhotos && (
                <Link href="/gallery" className="link-underline text-gold text-sm whitespace-nowrap">
                  See more →
                </Link>
              )}
            </div>
            <PhotoMarquee photos={displayPhotos} />
          </section>
        </Reveal>
      )}

      {/* SOCIAL LINKS — early touchpoint right after the hero */}
      <Reveal>
        <section className="border-t border-white/10 py-8 px-4">
          <div className="max-w-4xl mx-auto flex flex-col items-center gap-3">
            <p className="text-gray-600 text-xs font-mono uppercase tracking-[0.2em]">Follow along</p>
            <SocialLinks whatsappLink={whatsappLink} instagramUrl={instagramUrl} youtubeUrl={youtubeUrl} variant="pill" />
          </div>
        </section>
      </Reveal>

      {/* WHO WE ARE */}
      {photos[0] && (
        <Reveal scale>
          <section className="relative border-t border-white/10 py-24 md:py-32 px-4 overflow-hidden">
            <div className="absolute inset-0">
              <img
                src={photos[0].image_url}
                alt=""
                className="w-full h-full object-cover object-center scale-105"
              />
              <div className="absolute inset-0 bg-black/70" />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/40" />
            </div>
            <div className="relative z-[1] max-w-4xl mx-auto text-center">
              <p className="eyebrow mb-4 justify-center w-full">Who we are</p>
              <h2 className="heading-display text-white text-4xl md:text-6xl mb-6">
                More than a <span className="text-gold-sheen">run club.</span>
              </h2>
              <p className="text-gray-200 leading-relaxed text-base md:text-lg max-w-2xl mx-auto">
                We&apos;re building a culture where movement feels less like a workout and more like
                something you can&apos;t wait to show up for — sunrise runs, weekend treks, martial arts
                sessions, and a place to meet new people, network, and always find your community.
              </p>
            </div>
          </section>
        </Reveal>
      )}

      {/* WHY WE STARTED */}
      <section className="relative border-t border-white/10 py-20 md:py-28 px-4 overflow-hidden">
        <div className="glow-orb w-[380px] h-[380px] top-0 right-0 opacity-40" />
        <StaggerReveal className="relative max-w-2xl mx-auto text-center" stagger={0.12}>
          <StaggerItem>
            <p className="eyebrow mb-3 justify-center w-full">The why</p>
          </StaggerItem>
          <StaggerItem>
            <h2 className="heading-display text-white text-3xl md:text-4xl mb-6">
              Why we started
            </h2>
          </StaggerItem>
          <StaggerItem>
            <p className="text-gray-300 leading-relaxed text-base md:text-lg">
              We believe fitness isn&apos;t just about lifting weights or running miles. It&apos;s about
              building habits, creating memories, and surrounding yourself with people who inspire you
              to keep showing up.
            </p>
          </StaggerItem>
          <StaggerItem>
            <p className="text-gray-400 leading-relaxed mt-4">
              The First Rule Club exists to bring people into a healthier lifestyle through runs,
              treks, martial arts, and adventures — while building a network of people who push each
              other to grow. Because fitness is easier, more exciting, and far more rewarding when you
              do it together.
            </p>
          </StaggerItem>
        </StaggerReveal>
      </section>

      {/* JOIN CTA STRIP */}
      <Reveal>
        <section className="relative border-y border-white/10 bg-gold/[0.03] py-10 px-4 overflow-hidden">
          <div className="absolute inset-0 bg-gold-sheen opacity-[0.03]" />
          <div className="relative max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
            <div>
              <p className="text-white font-semibold text-lg">
                <span className="stat-number text-gold">{communityStatValue}</span> strong, and counting.
              </p>
              <p className="text-gray-500 text-sm mt-1">No entry fee, no ego — just show up.</p>
            </div>
            <Link href="/join" className="btn-primary whitespace-nowrap">
              Join as Member →
            </Link>
          </div>
        </section>
      </Reveal>

      {/* FAQ */}
      <Reveal>
        <section id="faq" className="border-t border-white/10 py-20 md:py-28 px-4 scroll-mt-24">
          <div className="max-w-2xl mx-auto">
            <p className="eyebrow mb-2 justify-center w-full">Questions</p>
            <h2 className="heading-display text-white text-3xl md:text-4xl mb-10 text-center">FAQ</h2>
            <FAQAccordion items={FAQ_ITEMS} />
          </div>
        </section>
      </Reveal>

      <SiteFooter whatsappLink={whatsappLink} instagramUrl={instagramUrl} youtubeUrl={youtubeUrl} />
    </main>
  )
}
