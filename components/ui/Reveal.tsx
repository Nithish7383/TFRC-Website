'use client'

import { motion, useReducedMotion, type Variants } from 'framer-motion'

type Direction = 'up' | 'down' | 'left' | 'right' | 'none'

interface Props {
  children: React.ReactNode
  className?: string
  /** Delay in milliseconds before the reveal starts. */
  delay?: number
  direction?: Direction
  /** Travel distance in px for the entrance offset. */
  distance?: number
  /** Adds a slight scale-up, good for cards and imagery. */
  scale?: boolean
  /** Fire every time it enters the viewport instead of just the first. */
  repeat?: boolean
}

const OFFSETS: Record<Direction, { x: number; y: number }> = {
  up: { x: 0, y: 1 },
  down: { x: 0, y: -1 },
  left: { x: 1, y: 0 },
  right: { x: -1, y: 0 },
  none: { x: 0, y: 0 },
}

export default function Reveal({
  children,
  className = '',
  delay = 0,
  direction = 'up',
  distance = 28,
  scale = false,
  repeat = false,
}: Props) {
  const reduceMotion = useReducedMotion()
  const axis = OFFSETS[direction]

  // With reduced motion we still fade, but never translate or scale.
  const variants: Variants = {
    hidden: {
      opacity: 0,
      x: reduceMotion ? 0 : axis.x * distance,
      y: reduceMotion ? 0 : axis.y * distance,
      scale: reduceMotion || !scale ? 1 : 0.96,
    },
    visible: {
      opacity: 1,
      x: 0,
      y: 0,
      scale: 1,
      transition: {
        duration: reduceMotion ? 0.2 : 0.7,
        delay: delay / 1000,
        ease: [0.16, 1, 0.3, 1],
      },
    },
  }

  return (
    <motion.div
      className={className}
      variants={variants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: !repeat, amount: 0.15, margin: '0px 0px -80px 0px' }}
    >
      {children}
    </motion.div>
  )
}
