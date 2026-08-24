'use client'

import { useState } from 'react'
import Link from 'next/link'
import { AnimatePresence, motion } from 'framer-motion'
import { createClient } from '@/lib/supabase'
import { RegistrationStatus } from '@/lib/types'
import StatusBadge from '@/components/ui/StatusBadge'
import SiteHeader from '@/components/ui/SiteHeader'
import Reveal from '@/components/ui/Reveal'
import StaggerReveal, { StaggerItem } from '@/components/ui/StaggerReveal'

interface RegResult {
  id: string
  status: RegistrationStatus
  created_at: string
  events: {
    title: string
    date: string
    group_link: string | null
  }
}

export default function StatusPage() {
  const supabase = createClient()
  const [phone, setPhone] = useState('')
  const [results, setResults] = useState<RegResult[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)

  const handleCheck = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!phone.trim()) return
    setLoading(true)
    setSearched(false)

    const { data } = await supabase
      .from('registrations')
      .select('id, status, created_at, events(title, date, group_link)')
      .eq('phone', phone.trim())
      .order('created_at', { ascending: false })

    setResults((data as unknown as RegResult[]) || [])
    setLoading(false)
    setSearched(true)
  }

  return (
    <main className="min-h-screen bg-black">
      <SiteHeader />
      <div className="py-12 px-4">
      <div className="max-w-xl mx-auto">
        <Reveal>
          <div className="text-center mb-10">
            <p className="eyebrow mb-2 justify-center w-full">Track your run</p>
            <h1 className="heading-display text-white text-4xl mb-2">Check Registration Status</h1>
            <p className="text-gray-400">Enter your WhatsApp number to see your registration status.</p>
          </div>
        </Reveal>

        <Reveal delay={80}>
          <form onSubmit={handleCheck} className="card flex flex-col sm:flex-row gap-3 mb-8">
            <input
              type="tel"
              value={phone}
              onChange={(e) => { setPhone(e.target.value); setSearched(false) }}
              placeholder="e.g. 9876543210"
              required
              className="input-field flex-1"
            />
            <button type="submit" disabled={loading} className="btn-primary whitespace-nowrap">
              {loading ? 'Checking...' : 'Check Status'}
            </button>
          </form>
        </Reveal>

        <AnimatePresence mode="wait">
          {searched && results !== null && (
            results.length === 0 ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className="card text-center py-10"
              >
                <p className="text-gray-400">No registration found for this number.</p>
                <p className="text-gray-600 text-sm mt-2">Double-check the number you used when registering.</p>
              </motion.div>
            ) : (
              <StaggerReveal key="results" className="space-y-4" stagger={0.08}>
                {results.map((reg) => (
                  <StaggerItem key={reg.id}>
                    <StatusCard reg={reg} />
                  </StaggerItem>
                ))}
              </StaggerReveal>
            )
          )}
        </AnimatePresence>
      </div>
      </div>
    </main>
  )
}

function StatusCard({ reg }: { reg: RegResult }) {
  const eventDate = new Date(reg.events.date)
  const now = new Date()
  const daysUntil = Math.ceil((eventDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

  const formattedDate = eventDate.toLocaleDateString('en-IN', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
  })

  const messageConfig: Record<RegistrationStatus, { message: string; messageColor: string }> = {
    pending: {
      message: 'Your registration is under review. We will notify you soon.',
      messageColor: 'text-yellow-400',
    },
    selected: {
      message: 'Congratulations! You have been selected for this event.',
      messageColor: 'text-green-400',
    },
    rejected: {
      message: "You weren't selected this time — spots are limited.",
      messageColor: 'text-red-400',
    },
  }

  const cfg = messageConfig[reg.status]

  return (
    <div className="card-interactive space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-white font-semibold">{reg.events.title}</p>
          <p className="text-gray-500 text-sm">{formattedDate}</p>
        </div>
        <StatusBadge status={reg.status} />
      </div>

      <p className={`text-sm ${cfg.messageColor}`}>{cfg.message}</p>

      {reg.status === 'pending' && (
        <div className="bg-white/[0.03] border border-white/10 rounded-lg px-4 py-3 space-y-1">
          {eventDate > now && (
            <p className="text-white text-sm font-medium">Event: {formattedDate}</p>
          )}
          <p className="text-gray-400 text-sm">
            Check back 48 hours before the event. Selected runners are notified via WhatsApp.
          </p>
        </div>
      )}

      {reg.status === 'rejected' && (
        <Link
          href="/register"
          className="group/link flex items-center justify-center gap-1.5 btn-primary text-sm py-2.5 mt-1"
        >
          Register for our next event
          <span className="transition-transform duration-300 ease-out-expo group-hover/link:translate-x-1">→</span>
        </Link>
      )}

      {reg.status === 'selected' && (
        reg.events.group_link ? (
          <a
            href={reg.events.group_link}
            target="_blank"
            rel="noopener noreferrer"
            className="group/link flex items-center gap-2 bg-green-700 hover:bg-green-600 text-white font-semibold px-5 py-3 rounded-lg
                       transition-all duration-300 ease-out-expo hover:-translate-y-0.5 hover:shadow-lift w-full justify-center mt-3"
          >
            Join WhatsApp Group
            <span className="transition-transform duration-300 ease-out-expo group-hover/link:translate-x-1">→</span>
          </a>
        ) : (
          <div className="bg-white/[0.03] border border-white/10 rounded-lg px-4 py-3">
            {daysUntil > 0 ? (
              <p className="text-sm text-gray-400">
                Event in <span className="text-white font-semibold">{daysUntil} day{daysUntil !== 1 ? 's' : ''}</span> — your WhatsApp group link will be shared closer to the date.
              </p>
            ) : (
              <p className="text-sm text-gray-500">The WhatsApp group link will be shared soon. Check back here!</p>
            )}
          </div>
        )
      )}
    </div>
  )
}
