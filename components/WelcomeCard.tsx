'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import Avatar from '@/components/ui/Avatar'

interface Props {
  name: string
  memberId: string
  whatsappLink: string
  instagramUrl: string
}

const EASE = [0.16, 1, 0.3, 1] as const

export default function WelcomeCard({ name, memberId, whatsappLink, instagramUrl }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.7, ease: EASE }}
      className="card space-y-6 relative overflow-hidden"
    >
      <div className="glow-orb w-[280px] h-[180px] -top-24 left-1/2 -translate-x-1/2 opacity-60" />

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1, ease: EASE }}
        className="relative z-[1] mx-auto w-fit"
      >
        <Avatar name={name} size="md" />
      </motion.div>

      {/* Check icon — springs in after the avatar settles */}
      <motion.div
        initial={{ opacity: 0, scale: 0.4 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, delay: 0.25, ease: 'backOut' }}
        className="relative z-[1] w-14 h-14 bg-gold/20 border-2 border-gold/50 rounded-full flex items-center justify-center mx-auto -mt-2"
      >
        <svg className="w-7 h-7 text-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.35, ease: EASE }}
        className="relative z-[1] stat-number text-4xl text-gold tracking-widest border-2 border-gold/40 rounded-xl px-8 py-4 inline-block shadow-gold-glow"
      >
        {memberId}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.45, ease: EASE }}
        className="relative z-[1]"
      >
        <h1 className="heading-display text-white text-3xl mb-2">Welcome, {name}!</h1>
        <p className="text-gray-400">You&apos;re officially a member of The First Rule Club.</p>
        <p className="heading-display text-lg mt-2">
          <span className="text-white">Luck is optional.</span>{' '}
          <span className="text-gold-sheen">Effort isn&apos;t.</span>
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.55, ease: EASE }}
        className="relative z-[1] bg-white/[0.03] rounded-lg p-4 border border-white/10 text-left"
      >
        <p className="text-gray-300 text-sm leading-relaxed">
          <span className="text-gold font-medium">Save your Member ID</span>
          <br />
          You&apos;ll need it to register for events. Screenshot this page or note it down.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.65, ease: EASE }}
        className="relative z-[1] flex flex-col gap-3"
      >
        {/* Primary — go register for an event */}
        <Link href="/?welcome=1" className="btn-primary block text-center">
          Browse Events →
        </Link>

        {/* WhatsApp — only if set */}
        {whatsappLink && (
          <a
            href={whatsappLink}
            target="_blank"
            rel="noopener noreferrer"
            className="block text-center bg-green-700 hover:bg-green-600 text-white font-semibold px-6 py-3 rounded-lg
                       transition-all duration-300 ease-out-expo hover:-translate-y-0.5 hover:shadow-lift"
          >
            Join WhatsApp Community
          </a>
        )}

        {/* Instagram — only if set */}
        {instagramUrl && (
          <a
            href={instagramUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary block text-center"
          >
            Follow on Instagram
          </a>
        )}
      </motion.div>
    </motion.div>
  )
}
