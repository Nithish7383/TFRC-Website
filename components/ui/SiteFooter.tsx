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
    <footer className="border-t border-white/10 py-12 px-4 text-center">
      <div className="eyebrow border border-gold/30 bg-gold/5 px-3 py-1.5 rounded-full mb-6">
        <span className="w-1.5 h-1.5 rounded-full bg-gold animate-pulse-slow" />
        Finish line
      </div>

      <div className="mb-5">
        <SocialLinks whatsappLink={whatsappLink} instagramUrl={instagramUrl} youtubeUrl={youtubeUrl} variant="text" />
      </div>

      <p className="text-gray-600 text-sm mb-2">{TFRC_LOCATION}</p>
      <Link href="/join" className="text-gold hover:underline text-sm">
        Join free →
      </Link>
      <p className="mt-4 text-gray-700 text-xs">
        © {new Date().getFullYear()} The First Rule Club. All rights reserved.
      </p>
    </footer>
  )
}
