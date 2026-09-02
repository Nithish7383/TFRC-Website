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
const SITE_TITLE = 'The First Rule Club — We Don\'t Talk About It.'
const SITE_DESCRIPTION = 'The First Rule Club — Madurai\'s fitness community for runs, treks, and martial arts. Meet new people, build discipline, and grow — together. Join for free.'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: SITE_TITLE,
  description: SITE_DESCRIPTION,
  openGraph: {
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    siteName: 'The First Rule Club',
    images: [{ url: '/firstruleclublogo.jpg', width: 800, height: 800 }],
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
        {children}
      </body>
    </html>
  )
}
