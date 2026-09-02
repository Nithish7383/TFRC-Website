'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { Event } from '@/lib/types'

interface Props {
  event: Event
}

export default function CloneEventButton({ event }: Props) {
  const supabase = createClient()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState(false)

  const handleClone = async () => {
    setLoading(true)
    setError(false)
    const { error: insertError } = await supabase.from('events').insert({
      title: event.title,
      date: null,
      max_male: event.max_male,
      max_female: event.max_female,
      group_link: event.group_link,
      is_active: false,
      distance: event.distance || null,
      pace_group: event.pace_group || null,
      meeting_point_url: event.meeting_point_url || null,
      registration_deadline: null,
      is_paid: event.is_paid,
      price_inr: event.price_inr,
    })
    setLoading(false)
    if (insertError) {
      setError(true)
      setTimeout(() => setError(false), 2500)
      return
    }
    setDone(true)
    setTimeout(() => { setDone(false); router.refresh() }, 1500)
  }

  return (
    <button
      onClick={handleClone}
      disabled={loading || done}
      title={error ? 'Clone failed — please try again.' : undefined}
      className={`text-sm py-2 px-3 rounded-lg border transition-colors ${
        done
          ? 'border-green-800/40 text-green-400'
          : error
          ? 'border-red-800/40 text-red-400'
          : 'border-white/15 text-gray-400 hover:text-gold hover:border-gold/40'
      }`}
    >
      {done ? '✓ Cloned' : error ? '✕ Failed' : loading ? '...' : 'Clone'}
    </button>
  )
}
