'use client'

import { useState, useEffect, useRef } from 'react'

const LINKS = [
  { id: 'home', label: 'Home' },
  { id: 'events', label: 'Events' },
  { id: 'gallery', label: 'Gallery' },
  { id: 'contact', label: 'Contact' },
]

export default function PillNav() {
  const [active, setActive] = useState('home')
  const clickScrollRef = useRef(false)

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

  const handleClick = (id: string) => {
    setActive(id)
    clickScrollRef.current = true
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
    setTimeout(() => { clickScrollRef.current = false }, 1000)
  }

  return (
    <nav className="fixed top-4 left-1/2 -translate-x-1/2 z-30">
      <div className="flex items-center gap-3 sm:gap-5 rounded-full border border-white/10 bg-black/70 backdrop-blur-md px-5 py-2 shadow-lg shadow-black/40">
        <button
          onClick={() => handleClick('home')}
          className="wordmark text-gold text-base flex-shrink-0"
        >
          TFRC
        </button>

        <div className="hidden sm:flex items-center gap-1">
          {LINKS.map((link) => (
            <button
              key={link.id}
              onClick={() => handleClick(link.id)}
              className={`text-sm px-3 py-1.5 rounded-full transition-colors whitespace-nowrap ${
                active === link.id
                  ? 'bg-white text-black font-medium'
                  : 'text-gray-300 hover:text-white'
              }`}
            >
              {link.label}
            </button>
          ))}
        </div>
      </div>
    </nav>
  )
}
