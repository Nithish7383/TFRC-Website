'use client'

import { useState, useEffect } from 'react'

/**
 * Tiny visible acknowledgment that signup just succeeded — without it,
 * landing on "/" after joining looks identical to a first-time visit. Reads
 * a one-time `?welcome=1` query param (set by app/join/welcome/page.tsx)
 * and strips it from the URL so refreshing or sharing the link doesn't
 * repeat the banner.
 */
export default function WelcomeBackBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('welcome') !== '1') return

    setVisible(true)
    params.delete('welcome')
    const newSearch = params.toString()
    window.history.replaceState({}, '', window.location.pathname + (newSearch ? `?${newSearch}` : ''))
  }, [])

  if (!visible) return null

  return (
    <div className="bg-green-900/20 border-b border-green-800/40 px-4 py-2.5 text-center text-sm text-green-400 relative">
      ✓ You&apos;re a member — tap Register on any event below to sign up.
      <button
        onClick={() => setVisible(false)}
        className="absolute right-4 top-1/2 -translate-y-1/2 text-green-400/60 hover:text-green-400"
        aria-label="Dismiss"
      >
        ✕
      </button>
    </div>
  )
}
