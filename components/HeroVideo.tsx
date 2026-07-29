import { GalleryPhoto } from '@/lib/types'
import HeroBackground from '@/components/HeroBackground'

interface Props {
  mobileVideoUrl: string
  desktopVideoUrl: string
  posterUrl: string
  photos: GalleryPhoto[]
}

/**
 * Full-bleed video hero. Falls back to the existing rotating-photo
 * HeroBackground when no video has been uploaded yet (see
 * SiteSettingsForm.tsx's "Hero Background Video" section) — real footage
 * files (/hero-mobile-portrait.mp4, /hero-desktop-landscape.mp4 as
 * originally sketched) are replaced here by admin-uploaded Storage URLs so
 * there's nothing to wire up by hand once the videos exist.
 */
export default function HeroVideo({ mobileVideoUrl, desktopVideoUrl, posterUrl, photos }: Props) {
  const hasVideo = Boolean(mobileVideoUrl || desktopVideoUrl)

  if (!hasVideo) {
    return <HeroBackground photos={photos} />
  }

  return (
    <div className="absolute inset-0 z-0 overflow-hidden">
      <video
        className="absolute inset-0 w-full h-full object-cover"
        autoPlay
        muted
        loop
        playsInline
        poster={posterUrl || undefined}
      >
        {mobileVideoUrl && <source src={mobileVideoUrl} media="(max-width: 767px)" />}
        {desktopVideoUrl && <source src={desktopVideoUrl} />}
      </video>

      {/* Dark gradient fading to solid black at the bottom so the section
          below (Events) blends in with no hard edge. */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(to bottom, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.45) 35%, rgba(0,0,0,0.7) 70%, rgba(0,0,0,1) 100%)',
        }}
      />
    </div>
  )
}
