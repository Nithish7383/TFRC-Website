import Link from 'next/link'
import SocialLinks from './SocialLinks'
import Reveal from './Reveal'
import { TFRC_LOCATION } from '@/lib/constants'

interface Props {
  whatsappLink?: string
  instagramUrl?: string
  youtubeUrl?: string
}

export default function SiteFooter({ whatsappLink, instagramUrl, youtubeUrl }: Props) {
  return (
    <footer
      id="contact"
      className="relative border-t border-white/10 pt-16 pb-6 px-4 text-center overflow-hidden"
    >
      {/* Ambient gold wash rising from the bottom edge */}
      <div className="glow-orb w-[520px] h-[300px] -bottom-40 left-1/2 -translate-x-1/2 opacity-70" />

      <Reveal>
        <div className="relative z-[1] flex flex-col items-center">
          <span className="relative mb-6 group">
            <span className="absolute -inset-2 rounded-full bg-gold/25 blur-xl animate-pulse-slow" />
            <img
              src="/firstruleclublogo.jpg"
              alt="TFRC"
              className="relative w-14 h-14 rounded-full object-cover ring-1 ring-gold/40
                         transition-transform duration-500 ease-out-expo hover:scale-110"
            />
          </span>

          <p className="heading-display text-gold-sheen text-2xl md:text-3xl mb-7">
            We don&apos;t talk about it.
          </p>

          <div className="mb-6">
            <SocialLinks
              whatsappLink={whatsappLink}
              instagramUrl={instagramUrl}
              youtubeUrl={youtubeUrl}
              variant="pill"
            />
          </div>

          <div className="rule-gold max-w-md mb-6" />

          <p className="text-gray-500 text-sm mb-3 font-mono tracking-wide">{TFRC_LOCATION}</p>

          <Link
            href="/join"
            className="btn-primary text-xs px-6 py-2.5 mb-6"
          >
            Join Free →
          </Link>

          <p className="text-gray-700 text-xs">
            © {new Date().getFullYear()} The First Rule Club. All rights reserved.
          </p>
        </div>
      </Reveal>

      {/* Oversized outlined wordmark anchoring the base of the page */}
      <p
        aria-hidden="true"
        className="heading-display text-stroke-gold select-none pointer-events-none
                   leading-none whitespace-nowrap mt-8"
        style={{ fontSize: 'clamp(48px, 13vw, 170px)' }}
      >
        THE FIRST RULE CLUB
      </p>
    </footer>
  )
}
