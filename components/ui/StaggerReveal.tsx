'use client'

import { motion, useReducedMotion, type Variants } from 'framer-motion'

interface Props {
  children: React.ReactNode
  className?: string
  /** Seconds between each child's entrance. */
  stagger?: number
  delay?: number
}

const container = (stagger: number, delay: number): Variants => ({
  hidden: {},
  visible: {
    transition: { staggerChildren: stagger, delayChildren: delay },
  },
})

/**
 * Wrap a list and give each direct child a staggered entrance. Children must
 * be <StaggerItem> (or any motion element declaring the same variant names).
 */
export default function StaggerReveal({
  children,
  className = '',
  stagger = 0.08,
  delay = 0,
}: Props) {
  return (
    <motion.div
      className={className}
      variants={container(stagger, delay)}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.1, margin: '0px 0px -60px 0px' }}
    >
      {children}
    </motion.div>
  )
}

export function StaggerItem({
  children,
  className = '',
}: {
  children: React.ReactNode
  className?: string
}) {
  const reduceMotion = useReducedMotion()

  const item: Variants = {
    hidden: { opacity: 0, y: reduceMotion ? 0 : 24 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: reduceMotion ? 0.2 : 0.6, ease: [0.16, 1, 0.3, 1] },
    },
  }

  return (
    <motion.div className={className} variants={item}>
      {children}
    </motion.div>
  )
}
