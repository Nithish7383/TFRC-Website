'use client'

import { motion, useScroll, useSpring } from 'framer-motion'

export default function ScrollProgressBar() {
  const { scrollYProgress } = useScroll()
  const scaleX = useSpring(scrollYProgress, { stiffness: 300, damping: 40, restDelta: 0.001 })

  return (
    <motion.div
      className="fixed top-0 left-0 right-0 h-[3px] origin-left z-[100]
                 bg-gradient-to-r from-gold-dark via-gold to-gold-lighter
                 shadow-[0_0_12px_rgba(200,164,53,0.6)]"
      style={{ scaleX }}
    />
  )
}
