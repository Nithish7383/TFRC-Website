'use client'

import { useState } from 'react'

interface Props {
  photoUrl?: string | null
  name: string
  role: string
  bio: string
}

export default function FounderCard({ photoUrl, name, role, bio }: Props) {
  const [flipped, setFlipped] = useState(false)

  const toggle = () => setFlipped((f) => !f)
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      toggle()
    }
  }

  return (
    <div
      role="button"
      tabIndex={0}
      aria-pressed={flipped}
      aria-label={`${name}, ${role} — press to ${flipped ? 'show photo' : 'show bio'}`}
      onClick={toggle}
      onKeyDown={onKeyDown}
      className="relative aspect-[3/4] cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-gold rounded-xl"
      style={{ perspective: '1200px' }}
    >
      <div
        className="relative w-full h-full transition-transform duration-500 [transform-style:preserve-3d]"
        style={{ transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)' }}
      >
        {/* Front */}
        <div
          className="absolute inset-0 rounded-xl overflow-hidden border border-white/10 bg-white/[0.02] [backface-visibility:hidden]"
        >
          {photoUrl ? (
            <img src={photoUrl} alt={name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-white/5 to-black" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <p className="text-white font-semibold">{name}</p>
            <p className="text-gold text-xs font-mono uppercase tracking-wide">{role}</p>
          </div>
        </div>

        {/* Back */}
        <div
          className="absolute inset-0 rounded-xl border border-gold/30 bg-[#0A0A0A] p-5 flex flex-col justify-center [backface-visibility:hidden]"
          style={{ transform: 'rotateY(180deg)' }}
        >
          <p className="text-white font-semibold mb-1">{name}</p>
          <p className="text-gold text-xs font-mono uppercase tracking-wide mb-3">{role}</p>
          <p className="text-gray-300 text-sm leading-relaxed">{bio}</p>
        </div>
      </div>
    </div>
  )
}
