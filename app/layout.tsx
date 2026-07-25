import type { Metadata } from 'next'
import { Space_Grotesk } from 'next/font/google'
import './globals.css'

const spaceGrotesk = Space_Grotesk({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'The First Rule Club — Running Events',
  description: 'Register for The First Rule Club running events',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${spaceGrotesk.className} bg-gray-950 text-white min-h-screen`}>
        {children}
      </body>
    </html>
  )
}
