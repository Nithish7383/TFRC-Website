'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from 'framer-motion'

const LINKS = [
  { id: 'home', label: 'Home' },
  { id: 'events', label: 'Events' },
  { id: 'gallery', label: 'Gallery' },
  { id: 'contact', label: 'Contact' },
]

export default function PillNav() {
  const [active, setActive] = useState('home')
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const clickScrollRef = useRef(false)

  const { scrollY } = useScroll()
  useMotionValueEvent(scrollY, 'change', (y) => setScrolled(y > 40))

  useEffect(() => {
    const sections = LINKS.map((l) => document.getElementById(l.id)).filter(Boolean) as HTMLElement[]
    if (sections.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        // Ignore scroll-spy updates while a click-triggered smooth scroll is
        // still in flight, so clicking "Contact" doesn't briefly flash
        // "About" active as the viewport passes through it.
        if (clickScrollRef.current) return
        const visible = entries.filter((e) => e.isIntersecting)
        if (visible.length > 0) {
          setActive(visible[0].target.id)
        }
      },
      { rootMargin: '-40% 0px -55% 0px', threshold: 0 }
    )

    sections.forEach((s) => observer.observe(s))
    return () => observer.disconnect()
  }, [])

  // Close the mobile sheet on Escape.
  useEffect(() => {
    if (!menuOpen) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setMenuOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [menuOpen])

  const handleClick = (id: string) => {
    setActive(id)
    setMenuOpen(false)
    clickScrollRef.current = true
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
    setTimeout(() => { clickScrollRef.current = false }, 1000)
  }

  return (
    <>
      <motion.nav
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
        className="fixed top-4 left-1/2 -translate-x-1/2 z-40 px-4 w-full sm:w-auto flex justify-center"
      >
        <motion.div
          animate={{
            backgroundColor: scrolled ? 'rgba(0,0,0,0.82)' : 'rgba(0,0,0,0.55)',
            borderColor: scrolled ? 'rgba(200,164,53,0.28)' : 'rgba(255,255,255,0.10)',
            boxShadow: scrolled
              ? '0 10px 40px -12px rgba(0,0,0,0.9), 0 0 0 1px rgba(200,164,53,0.10)'
              : '0 8px 30px -14px rgba(0,0,0,0.8)',
          }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="flex items-center gap-2 sm:gap-4 rounded-full border backdrop-blur-xl px-4 sm:px-5 py-2"
        >
          <button
            onClick={() => handleClick('home')}
            className="wordmark text-gold text-base flex-shrink-0 px-1 transition-transform duration-300 hover:scale-105"
          >
            TFRC
          </button>

          <span className="hidden sm:block w-px h-5 bg-white/10" />

          {/* Desktop links — the active pill slides between items */}
          <div className="hidden sm:flex items-center gap-1">
            {LINKS.map((link) => {
              const isActive = active === link.id
              return (
                <button
                  key={link.id}
                  onClick={() => handleClick(link.id)}
                  className={`relative text-sm px-3.5 py-1.5 rounded-full whitespace-nowrap transition-colors duration-300 ${
                    isActive ? 'text-black' : 'text-gray-300 hover:text-white'
                  }`}
                >
                  {isActive && (
                    <motion.span
                      layoutId="nav-pill"
                      className="absolute inset-0 rounded-full bg-gradient-to-b from-white to-gray-200"
                      transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                    />
                  )}
                  <span className="relative z-[1] font-medium">{link.label}</span>
                </button>
              )
            })}
          </div>

          <Link
            href="/join"
            className="hidden sm:inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide
                       bg-gold text-black rounded-full px-4 py-1.5 transition-all duration-300
                       hover:bg-gold-light hover:shadow-gold-glow hover:scale-[1.04] active:scale-95"
          >
            Join
          </Link>

          {/* Mobile trigger */}
          <button
            onClick={() => setMenuOpen((o) => !o)}
            aria-label="Toggle navigation menu"
            aria-expanded={menuOpen}
            className="sm:hidden ml-auto w-9 h-9 rounded-full flex flex-col items-center justify-center gap-[5px]
                       border border-white/15 active:scale-95 transition-transform"
          >
            <motion.span
              animate={menuOpen ? { rotate: 45, y: 3.5 } : { rotate: 0, y: 0 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="block w-4 h-[1.5px] bg-white rounded-full"
            />
            <motion.span
              animate={menuOpen ? { rotate: -45, y: -3.5 } : { rotate: 0, y: 0 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="block w-4 h-[1.5px] bg-white rounded-full"
            />
          </button>
        </motion.div>
      </motion.nav>

      {/* Mobile sheet */}
      <AnimatePresence>
        {menuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              onClick={() => setMenuOpen(false)}
              className="fixed inset-0 z-30 bg-black/70 backdrop-blur-sm sm:hidden"
            />
            <motion.div
              initial={{ opacity: 0, y: -16, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -12, scale: 0.97 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="fixed top-20 left-4 right-4 z-40 sm:hidden glass rounded-2xl p-3 shadow-lift"
            >
              <div className="flex flex-col">
                {LINKS.map((link, i) => (
                  <motion.button
                    key={link.id}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.05 + i * 0.05, duration: 0.3 }}
                    onClick={() => handleClick(link.id)}
                    className={`flex items-center justify-between px-4 py-3 rounded-xl text-left transition-colors ${
                      active === link.id
                        ? 'text-gold bg-gold/10'
                        : 'text-gray-300 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <span className="font-medium">{link.label}</span>
                    {active === link.id && <span className="w-1.5 h-1.5 rounded-full bg-gold" />}
                  </motion.button>
                ))}

                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25, duration: 0.3 }}
                  className="pt-2 mt-2 border-t border-white/10"
                >
                  <Link
                    href="/join"
                    onClick={() => setMenuOpen(false)}
                    className="btn-primary w-full"
                  >
                    Join Now →
                  </Link>
                </motion.div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
