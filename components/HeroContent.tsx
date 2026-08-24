'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'

const container = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12, delayChildren: 0.3 } },
}

const item = {
  hidden: { opacity: 0, y: 26 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] as const },
  },
}

export default function HeroContent() {
  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="visible"
      className="relative z-[1] flex flex-col items-center"
    >
      <motion.span
        variants={item}
        className="eyebrow mb-5 bg-black/40 backdrop-blur-md border border-gold/20 rounded-full px-4 py-1.5"
      >
        Madurai&apos;s fitness movement
      </motion.span>

      <motion.h1
        variants={item}
        className="heading-display text-gold text-5xl md:text-8xl mb-5 max-w-5xl text-shadow-hero"
      >
        The First Rule Club
      </motion.h1>

      <motion.p
        variants={item}
        className="heading-display text-white text-lg md:text-xl mb-10 text-shadow-hero"
      >
        Remember the first rule.
      </motion.p>

      <motion.div variants={item}>
        <Link href="/join" className="btn-primary text-base px-9 py-4 group">
          <span>Join Now</span>
          <svg
            className="w-4 h-4 transition-transform duration-300 ease-out-expo group-hover:translate-x-1"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </motion.div>
    </motion.div>
  )
}
