import { GalleryPhoto } from '@/lib/types'

interface Props {
  photos: GalleryPhoto[]
}

// Seconds of travel per photo — fixed regardless of row length, so a row
// with fewer photos doesn't linger just because the loop still has to
// finish a full cycle; a row with more photos takes proportionally longer,
// but each photo passes by at the same speed either way.
const SECONDS_PER_PHOTO = 1.6
const MIN_DURATION_S = 8

function Row({ photos, direction }: { photos: GalleryPhoto[]; direction: 'left' | 'right' }) {
  // Duplicated so the strip can loop seamlessly at translateX(-50%).
  const doubled = [...photos, ...photos]
  const duration = Math.max(MIN_DURATION_S, photos.length * SECONDS_PER_PHOTO)

  return (
    <div
      className="marquee-row group/row flex gap-4 w-max"
      style={{
        '--marquee-name': `marquee-${direction}`,
        '--marquee-duration': `${duration}s`,
      } as React.CSSProperties}
    >
      {doubled.map((photo, i) => (
        <div
          key={`${photo.id}-${i}`}
          className="flex-shrink-0 w-[220px] sm:w-[300px] md:w-[380px] h-[150px] sm:h-[190px] md:h-[240px]
                     rounded-xl overflow-hidden border border-white/10 relative
                     transition-all duration-500 ease-out-expo
                     hover:!scale-[1.03] hover:z-10 hover:border-gold/40 hover:shadow-gold-glow"
        >
          <img
            src={photo.image_url}
            alt={photo.caption ?? 'TFRC crew'}
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-700 ease-out-expo hover:scale-110"
          />
        </div>
      ))}
    </div>
  )
}

export default function PhotoMarquee({ photos }: Props) {
  if (photos.length === 0) return null

  const mid = Math.ceil(photos.length / 2)
  const topRow = photos.slice(0, mid)
  const bottomRow = photos.slice(mid).length > 0 ? photos.slice(mid) : photos

  return (
    <div className="relative space-y-4 overflow-hidden">
      <div className="absolute left-0 top-0 bottom-0 w-16 sm:w-24 bg-gradient-to-r from-black to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-16 sm:w-24 bg-gradient-to-l from-black to-transparent z-10 pointer-events-none" />

      <Row photos={topRow} direction="left" />
      <Row photos={bottomRow} direction="right" />
    </div>
  )
}
