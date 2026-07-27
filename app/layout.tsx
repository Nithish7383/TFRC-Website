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

export const metadata: Metadata = {
  title: 'The First Rule Club — Luck Is Optional. Effort Isn\'t.',
  description: 'The First Rule Club — a Madurai running movement built on discipline, consistency, and showing up. Join for free.',
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
