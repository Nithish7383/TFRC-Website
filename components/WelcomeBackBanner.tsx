'use client'

import { useState, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

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

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="relative overflow-hidden bg-green-900/20 border-b border-green-800/40"
        >
          <div className="px-4 py-2.5 text-center text-sm text-green-400 relative">
            ✓ You&apos;re a member — tap Register on any event below to sign up.
            <button
              onClick={() => setVisible(false)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-green-400/60
                         transition-all duration-200 hover:text-green-300 hover:scale-110 active:scale-90"
              aria-label="Dismiss"
            >
              ✕
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
