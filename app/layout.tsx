import type { Metadata } from 'next'
import { Space_Grotesk, Oswald, JetBrains_Mono } from 'next/font/google'
import './globals.css'

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-sans',
})

const oswald = Oswald({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--font-display',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  variable: '--font-mono',
})

const SITE_URL = 'https://thefirstruleclub.vercel.app'
const SITE_TITLE = 'The First Rule Club | Madurai'
const SITE_DESCRIPTION = 'The First Rule Club is a community in Madurai for people who want to live more. Runs, treks, sports, fitness, Fight Club, meetups and experiences that bring people together.'
const INSTAGRAM_URL = 'https://www.instagram.com/thefirstruleclub'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: SITE_TITLE,
  description: SITE_DESCRIPTION,
  applicationName: 'The First Rule Club',
  // './' resolves to each page's own URL, so subpages don't canonicalize to the homepage
  alternates: { canonical: './' },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 },
  },
  openGraph: {
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    siteName: 'The First Rule Club',
    images: [{ url: '/firstruleclublogo.jpg', width: 800, height: 800, alt: 'The First Rule Club logo' }],
    locale: 'en_IN',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: ['/firstruleclublogo.jpg'],
  },
}

const organizationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  '@id': `${SITE_URL}/#organization`,
  name: 'The First Rule Club',
  alternateName: 'TFRC',
  url: SITE_URL,
  logo: `${SITE_URL}/firstruleclublogo.jpg`,
  description: SITE_DESCRIPTION,
  slogan: 'For people who want to live more.',
  areaServed: {
    '@type': 'City',
    name: 'Madurai',
    containedInPlace: { '@type': 'AdministrativeArea', name: 'Tamil Nadu, India' },
  },
  sameAs: [INSTAGRAM_URL],
}

const websiteJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  '@id': `${SITE_URL}/#website`,
  name: 'The First Rule Club',
  url: SITE_URL,
  inLanguage: 'en-IN',
  publisher: { '@id': `${SITE_URL}/#organization` },
}

// Escape "<" so content can never close the script tag early
const toJsonLd = (data: object) => JSON.stringify(data).replace(/</g, '\\u003c')

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body
        className={`${spaceGrotesk.variable} ${oswald.variable} ${jetbrainsMono.variable} font-sans bg-black text-white min-h-screen`}
      >
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: toJsonLd(organizationJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: toJsonLd(websiteJsonLd) }}
        />
        {children}
      </body>
    </html>
  )
}
