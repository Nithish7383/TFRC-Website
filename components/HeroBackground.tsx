'use client'

import { useState, useEffect } from 'react'
import { GalleryPhoto } from '@/lib/types'

interface Props {
  photos: GalleryPhoto[]
}

const ROTATE_MS = 6000

export default function HeroBackground({ photos }: Props) {
  const [index, setIndex] = useState(0)
  const [reducedMotion, setReducedMotion] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReducedMotion(mq.matches)
    const onChange = () => setReducedMotion(mq.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  useEffect(() => {
    if (photos.length <= 1 || reducedMotion) return
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % photos.length)
    }, ROTATE_MS)
    return () => clearInterval(id)
  }, [photos.length, reducedMotion])

  if (photos.length === 0) return null

  return (
    <div className="absolute inset-0 z-0 overflow-hidden">
      {photos.map((photo, i) => (
        <img
          key={photo.id}
          src={photo.image_url}
          alt=""
          loading={i === 0 ? 'eager' : 'lazy'}
          className={`absolute inset-0 w-full h-full object-cover ${
            reducedMotion ? '' : 'transition-opacity duration-[1200ms] ease-in-out'
          } ${i === index ? 'opacity-100' : 'opacity-0'}`}
        />
      ))}
      {/* Overlay: light at the top so faces/energy in the photo read through,
          easing progressively darker toward the bottom third where the
          content (headline, tagline, CTA) actually sits — text-shadow on
          the copy is the backstop so this can stay light without risking
          legibility. */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(to bottom, rgba(0,0,0,0.22) 0%, rgba(0,0,0,0.4) 40%, rgba(0,0,0,0.55) 65%, rgba(0,0,0,0.8) 100%)',
        }}
      />
    </div>
  )
}
