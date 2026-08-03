import { GalleryPhoto } from '@/lib/types'

interface Props {
  photos: GalleryPhoto[]
}

function Row({ photos, direction }: { photos: GalleryPhoto[]; direction: 'left' | 'right' }) {
  // Duplicated so the strip can loop seamlessly at translateX(-50%).
  const doubled = [...photos, ...photos]

  return (
    <div className="flex gap-4 w-max" style={{ animation: `marquee-${direction} 40s linear infinite` }}>
      {doubled.map((photo, i) => (
        <div
          key={`${photo.id}-${i}`}
          className="flex-shrink-0 w-[220px] sm:w-[300px] md:w-[380px] h-[150px] sm:h-[190px] md:h-[240px] rounded-xl overflow-hidden border border-white/10"
        >
          <img
            src={photo.image_url}
            alt={photo.caption ?? 'TFRC crew'}
            loading="lazy"
            className="w-full h-full object-cover"
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
