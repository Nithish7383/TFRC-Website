'use client'

import { useState } from 'react'
import { registerForEvent } from '@/app/register/session-actions'

interface Props {
  eventId: string
  eventTitle: string
  memberFirstName: string
  onClose: () => void
  onRegistered: () => void
}

export default function ConfirmRegisterCard({ eventId, eventTitle, memberFirstName, onClose, onRegistered }: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleConfirm = async () => {
    setLoading(true)
    setError('')

    const result = await registerForEvent(eventId, 'Registered via homepage')

    setLoading(false)

    if (!result.ok) {
      setError(result.error)
      return
    }

    setSuccess(true)
    onRegistered()
  }

  if (success) {
    return (
      <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center px-4" onClick={onClose}>
        <div className="card max-w-sm w-full space-y-4 text-center" onClick={(e) => e.stopPropagation()}>
          <div className="w-14 h-14 bg-green-900/40 border-2 border-green-700/50 rounded-full flex items-center justify-center mx-auto">
            <svg className="w-7 h-7 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="heading-display text-white text-xl">You&apos;re registered!</h2>
          <p className="text-gray-400 text-sm">
            You&apos;ll be notified on WhatsApp if you&apos;re selected for {eventTitle}.
          </p>
          <button onClick={onClose} className="btn-primary w-full text-center">
            Done
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center px-4" onClick={onClose}>
      <div className="card max-w-sm w-full space-y-5 text-center" onClick={(e) => e.stopPropagation()}>
        <div>
          <p className="eyebrow mb-2 justify-center w-full">Confirm</p>
          <h2 className="heading-display text-white text-xl">
            Register {memberFirstName} for {eventTitle}?
          </h2>
        </div>

        {error && (
          <div className="bg-red-900/20 border border-red-800/50 rounded-lg px-4 py-3 text-red-400 text-sm">
            {error}
          </div>
        )}

        <div className="flex flex-col gap-3">
          <button onClick={handleConfirm} disabled={loading} className="btn-primary w-full text-center">
            {loading ? 'Registering...' : 'Confirm Registration →'}
          </button>
          <button onClick={onClose} className="btn-secondary w-full text-center">
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
