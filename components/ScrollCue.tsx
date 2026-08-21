'use client'

import { motion } from 'framer-motion'

/** Small "scroll to explore" affordance pinned to the bottom of the hero. */
export default function ScrollCue() {
  return (
    <motion.button
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 1.4, duration: 0.8 }}
      onClick={() => document.getElementById('events')?.scrollIntoView({ behavior: 'smooth' })}
      aria-label="Scroll to explore"
      className="absolute bottom-8 left-1/2 -translate-x-1/2 z-[1] flex flex-col items-center gap-2
                 text-gray-400 hover:text-gold transition-colors duration-300"
    >
      <span className="text-[10px] font-mono uppercase tracking-[0.25em]">Explore</span>
      <span className="w-5 h-8 rounded-full border border-current flex items-start justify-center p-1.5">
        <motion.span
          className="w-1 h-1.5 rounded-full bg-current"
          animate={{ y: [0, 10, 0], opacity: [1, 0, 1] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
        />
      </span>
    </motion.button>
  )
}
