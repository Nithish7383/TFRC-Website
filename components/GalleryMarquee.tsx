import { EventPhoto } from '@/lib/types'

interface Props {
  photos: EventPhoto[]
}

function PhotoTile({ photo }: { photo: EventPhoto }) {
  return (
    <div className="flex-shrink-0 w-[220px] sm:w-[280px] md:w-[320px] space-y-1.5">
      <div
        className="group relative aspect-square overflow-hidden rounded-xl bg-white/[0.02] border border-white/10
                   shadow-lift transition-all duration-500 ease-out-expo
                   hover:border-gold/40 hover:shadow-gold-glow-lg"
      >
        <img
          src={photo.image_url}
          alt={photo.caption || 'Run photo'}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-[900ms] ease-out-expo group-hover:scale-[1.08]"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 rounded-xl ring-1 ring-inset ring-gold/0
                     transition-all duration-500 group-hover:ring-gold/25 pointer-events-none"
        />
      </div>
      <div className="flex items-center justify-between px-1">
        {photo.caption && (
          <p className="text-gray-400 text-xs truncate flex-1">{photo.caption}</p>
        )}
        {photo.instagram_post_url && (
          <a
            href={photo.instagram_post_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-500 hover:text-gold transition-colors ml-2 flex-shrink-0"
            title="View on Instagram"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
            </svg>
          </a>
        )}
      </div>
    </div>
  )
}

function Row({ photos, direction, speed }: { photos: EventPhoto[]; direction: 'left' | 'right'; speed: number }) {
  // Duplicated so the strip can loop seamlessly at translateX(-50%) — this is
  // what lets the row keep scrolling smoothly no matter how many photos exist.
  const doubled = [...photos, ...photos]

  return (
    <div
      className="marquee-row flex gap-4 w-max"
      style={{
        '--marquee-name': `marquee-${direction}`,
        '--marquee-duration': `${speed}s`,
      } as React.CSSProperties}
    >
      {doubled.map((photo, i) => (
        <PhotoTile key={`${photo.id}-${i}`} photo={photo} />
      ))}
    </div>
  )
}

// Roughly how many seconds a full loop should take per photo, so rows with
// more photos scroll for longer instead of speeding by.
const SECONDS_PER_PHOTO = 4.5
const MIN_LOOP_SECONDS = 20

export default function GalleryMarquee({ photos }: Props) {
  if (photos.length === 0) return null

  // Few photos read better as a single steady row; once there are enough,
  // split into two rows that drift in opposite directions.
  const splitThreshold = 6
  const singleRow = photos.length < splitThreshold

  const topRow = singleRow ? photos : photos.filter((_, i) => i % 2 === 0)
  const bottomRow = singleRow ? [] : photos.filter((_, i) => i % 2 === 1)

  const speedFor = (row: EventPhoto[]) => Math.max(MIN_LOOP_SECONDS, row.length * SECONDS_PER_PHOTO)

  return (
    <div className="relative space-y-4 overflow-hidden">
      <div className="absolute left-0 top-0 bottom-0 w-10 sm:w-16 bg-gradient-to-r from-black to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-10 sm:w-16 bg-gradient-to-l from-black to-transparent z-10 pointer-events-none" />

      <Row photos={topRow} direction="left" speed={speedFor(topRow)} />
      {bottomRow.length > 0 && (
        <Row photos={bottomRow} direction="right" speed={speedFor(bottomRow)} />
      )}
    </div>
  )
}
