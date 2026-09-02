import Link from 'next/link'
import { createClient } from '@/lib/supabase-server'
import { EventPhoto } from '@/lib/types'
import GalleryMarquee from '@/components/GalleryMarquee'
import SiteHeader from '@/components/ui/SiteHeader'
import SiteFooter from '@/components/ui/SiteFooter'
import Reveal from '@/components/ui/Reveal'

interface EventWithPhotos {
  id: string
  title: string
  date: string
  event_photos: EventPhoto[]
}

export default async function GalleryPage() {
  const supabase = createClient()

  const { data: events } = await supabase
    .from('events')
    .select('id, title, date, event_photos(*)')
    .order('date', { ascending: false })

  const eventsWithPhotos: EventWithPhotos[] = ((events || []) as EventWithPhotos[]).filter(
    (e) => e.event_photos && e.event_photos.length > 0
  )

  const { data: settingsRows } = await supabase.from('site_settings').select('key, value')
  const settings: Record<string, string> = {}
  ;(settingsRows || []).forEach((r: { key: string; value: string }) => {
    settings[r.key] = r.value
  })

  return (
    <main className="min-h-screen bg-black">
      <SiteHeader>
        <Link href="/status" className="text-gray-400 hover:text-white text-sm transition-colors">Check Status</Link>
        <Link href="/register" className="btn-primary text-sm py-2 px-4 inline-block">Register</Link>
      </SiteHeader>

      {/* Header */}
      <Reveal>
        <section className="max-w-5xl mx-auto px-4 pt-12 pb-4">
          <h1 className="heading-display text-white text-4xl md:text-5xl mb-2">Run Gallery</h1>
          <p className="text-gray-400 text-lg">Every run, remembered.</p>
        </section>
      </Reveal>

      {/* Gallery content */}
      <section className="py-8">
        {eventsWithPhotos.length === 0 ? (
          <div className="max-w-5xl mx-auto px-4">
            <Reveal>
              <div className="card text-center py-20">
                <p className="text-gray-400 text-xl">Photos from our runs coming soon.</p>
                <p className="text-gray-600 text-sm mt-2">Check back after our next event!</p>
              </div>
            </Reveal>
          </div>
        ) : (
          <div className="space-y-14">
            {eventsWithPhotos.map((event, i) => (
              <Reveal key={event.id} delay={i === 0 ? 0 : 80}>
                <div>
                  <div className="flex items-center gap-3 mb-5 max-w-5xl mx-auto px-4">
                    <h2 className="text-white font-semibold text-xl">{event.title}</h2>
                    <span className="text-gray-500 text-sm">
                      ·{' '}
                      {new Date(event.date).toLocaleDateString('en-IN', {
                        weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
                      })}
                    </span>
                  </div>
                  <GalleryMarquee photos={event.event_photos} />
                </div>
              </Reveal>
            ))}
          </div>
        )}
      </section>

      <SiteFooter
        whatsappLink={settings['whatsapp_link']}
        instagramUrl={settings['instagram_url']}
        youtubeUrl={settings['youtube_url']}
      />
    </main>
  )
}
