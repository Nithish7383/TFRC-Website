import Link from 'next/link'
import { createClient } from '@/lib/supabase-server'
import { EventPhoto } from '@/lib/types'
import GalleryGrid from '@/components/GalleryGrid'
import SiteHeader from '@/components/ui/SiteHeader'
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

  return (
    <main className="min-h-screen bg-black">
      <SiteHeader>
        <Link href="/status" className="text-gray-400 hover:text-white text-sm transition-colors">Check Status</Link>
        <Link href="/register" className="btn-primary text-sm py-2 px-4 inline-block">Register</Link>
      </SiteHeader>

      {/* Header */}
      <section className="max-w-5xl mx-auto px-4 pt-12 pb-4">
        <p className="eyebrow mb-2">Race day</p>
        <h1 className="heading-display text-white text-5xl mb-2">Run Gallery</h1>
        <p className="text-gray-400 text-lg">Every run, remembered.</p>
      </section>

      {/* Gallery content */}
      <section className="max-w-5xl mx-auto px-4 py-8">
        {eventsWithPhotos.length === 0 ? (
          <div className="card text-center py-20">
            <p className="text-gray-400 text-xl">Photos from our runs coming soon.</p>
            <p className="text-gray-600 text-sm mt-2">Check back after our next event!</p>
          </div>
        ) : (
          <div className="space-y-14">
            {eventsWithPhotos.map((event) => (
              <Reveal key={event.id}>
                <div>
                  <div className="flex items-center gap-3 mb-5">
                    <h2 className="text-white font-semibold text-xl">{event.title}</h2>
                    <span className="text-gray-500 text-sm">
                      ·{' '}
                      {new Date(event.date).toLocaleDateString('en-IN', {
                        weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
                      })}
                    </span>
                  </div>
                  <GalleryGrid photos={event.event_photos} />
                </div>
              </Reveal>
            ))}
          </div>
        )}
      </section>

      {/* Footer */}
      <footer className="text-center py-8 text-gray-600 text-sm border-t border-white/10 mt-12">
        <div className="flex items-center justify-center gap-4 mb-2">
          <Link href="/" className="hover:text-gray-400 transition-colors">Home</Link>
          <Link href="/status" className="hover:text-gray-400 transition-colors">Check Status</Link>
          <Link href="/register" className="hover:text-gray-400 transition-colors">Register</Link>
        </div>
        © {new Date().getFullYear()} The First Rule Club
      </footer>
    </main>
  )
}
