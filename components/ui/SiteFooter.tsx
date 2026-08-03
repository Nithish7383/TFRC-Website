import Link from 'next/link'
import SocialLinks from './SocialLinks'
import { TFRC_LOCATION } from '@/lib/constants'

interface Props {
  whatsappLink?: string
  instagramUrl?: string
  youtubeUrl?: string
}

export default function SiteFooter({ whatsappLink, instagramUrl, youtubeUrl }: Props) {
  return (
    <footer id="contact" className="relative border-t border-white/10 pt-12 pb-6 px-4 text-center scroll-mt-24 overflow-hidden">
      <img src="/firstruleclublogo.jpg" alt="TFRC" className="relative z-[1] w-12 h-12 rounded-full object-cover mx-auto mb-6 border border-gold/30" />

      <div className="relative z-[1] mb-5">
        <SocialLinks whatsappLink={whatsappLink} instagramUrl={instagramUrl} youtubeUrl={youtubeUrl} variant="text" />
      </div>

      <p className="relative z-[1] text-gray-600 text-sm mb-2">{TFRC_LOCATION}</p>
      <Link href="/join" className="relative z-[1] text-gold hover:underline text-sm">
        Join free →
      </Link>
      <p className="relative z-[1] mt-4 text-gray-700 text-xs mb-2">
        © {new Date().getFullYear()} The First Rule Club. All rights reserved.
      </p>

      <p
        aria-hidden="true"
        className="heading-display select-none pointer-events-none leading-none whitespace-nowrap text-transparent mt-4"
        style={{
          fontSize: 'clamp(48px, 13vw, 160px)',
          WebkitTextStroke: '1px rgba(200, 164, 53, 0.15)',
        }}
      >
        THE FIRST RULE CLUB
      </p>
    </footer>
  )
}
