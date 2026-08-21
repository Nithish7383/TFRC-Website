'use client'

import Link from 'next/link'
import { motion, useScroll, useMotionValueEvent } from 'framer-motion'
import { useState } from 'react'

interface Props {
  children?: React.ReactNode
}

export default function SiteHeader({ children }: Props) {
  const [scrolled, setScrolled] = useState(false)
  const { scrollY } = useScroll()
  useMotionValueEvent(scrollY, 'change', (y) => setScrolled(y > 20))

  return (
    <motion.nav
      initial={{ y: -60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className={`sticky top-0 z-30 px-4 py-3 backdrop-blur-xl transition-all duration-400 ease-out-expo ${
        scrolled
          ? 'bg-black/85 border-b border-gold/15 shadow-[0_8px_30px_-14px_rgba(0,0,0,0.9)]'
          : 'bg-black/50 border-b border-white/10'
      }`}
    >
      <div className="max-w-5xl mx-auto flex items-center justify-between gap-3">
        <Link href="/" className="group flex items-center gap-3 min-w-0">
          <span className="relative flex-shrink-0">
            <span className="absolute inset-0 rounded-full bg-gold/40 blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-400" />
            <img
              src="/firstruleclublogo.jpg"
              alt="TFRC"
              className="relative w-9 h-9 rounded-full object-cover ring-1 ring-gold/30
                         transition-transform duration-400 ease-out-expo group-hover:scale-105 group-hover:ring-gold/70"
            />
          </span>
          <span className="font-display font-semibold tracking-wide text-white text-base hidden sm:block truncate
                           transition-colors duration-300 group-hover:text-gold">
            The First Rule Club
          </span>
        </Link>

        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
          {children ?? (
            <>
              <Link
                href="/gallery"
                className="link-underline text-gray-400 hover:text-white text-sm"
              >
                Gallery
              </Link>
              <Link
                href="/admin/login"
                className="text-xs text-gray-500 border border-white/15 px-3 py-1.5 rounded-lg
                           transition-all duration-300 ease-out-expo
                           hover:text-gold hover:border-gold/50 hover:bg-gold/5"
              >
                Admin
              </Link>
            </>
          )}
        </div>
      </div>
    </motion.nav>
  )
}
