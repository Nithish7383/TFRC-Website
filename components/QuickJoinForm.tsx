'use client'

import { useState } from 'react'
import { registerMemberQuick } from '@/app/join/actions'

export interface QuickJoinedMember {
  member_id: string
  name: string
  age: number
  gender: 'Male' | 'Female'
}

interface Props {
  phone: string
  onJoined: (member: QuickJoinedMember) => void | Promise<void>
  onCancel: () => void
  submitLabel?: string
}

/**
 * The short "first time here?" form shown when a phone number isn't a
 * member yet. Creating the membership and registering for the event happen
 * in one go — the caller continues with the event registration in onJoined.
 */
export default function QuickJoinForm({ phone, onJoined, onCancel, submitLabel = 'Join & Register →' }: Props) {
  const [name, setName] = useState('')
  const [age, setAge] = useState('')
  const [gender, setGender] = useState<'Male' | 'Female' | ''>('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!gender) { setError('Please select your gender.'); return }
    setLoading(true)
    setError('')

    const result = await registerMemberQuick({ name, phone, age: parseInt(age), gender })

    if (!result.ok) {
      setLoading(false)
      setError(
        result.existingMemberId
          ? 'This number is already a TFRC member — go back and continue with it.'
          : result.error
      )
      return
    }

    await onJoined({ member_id: result.memberId, name: name.trim(), age: parseInt(age), gender })
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <p className="text-white font-semibold text-lg">New here? Welcome.</p>
        <p className="text-gray-400 text-sm mt-1">
          Add a few details and you&apos;ll be a TFRC member right away — no long form. Joining is free.
        </p>
      </div>

      <div>
        <label className="block text-gray-300 text-sm font-medium mb-2">
          Full Name <span className="text-red-400">*</span>
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => { setName(e.target.value); setError('') }}
          required
          autoFocus
          placeholder="e.g. Priya Ramesh"
          className="input-field"
        />
      </div>

      <div>
        <label className="block text-gray-300 text-sm font-medium mb-2">
          Age <span className="text-red-400">*</span>
        </label>
        <input
          type="number"
          value={age}
          onChange={(e) => { setAge(e.target.value); setError('') }}
          required
          min="10"
          max="80"
          placeholder="e.g. 28"
          className="input-field"
        />
      </div>

      <div>
        <label className="block text-gray-300 text-sm font-medium mb-2">
          Gender <span className="text-red-400">*</span>
        </label>
        <div className="flex gap-3">
          {(['Male', 'Female'] as const).map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => { setGender(g); setError('') }}
              className={`option-tile flex-1 py-3 px-4 ${gender === g ? 'option-tile-on' : 'option-tile-off'}`}
            >
              {g}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="bg-red-900/20 border border-red-800/50 rounded-lg px-4 py-3 text-red-400 text-sm">
          {error}
        </div>
      )}

      <button type="submit" disabled={loading} className="btn-primary w-full text-center">
        {loading ? 'Joining...' : submitLabel}
      </button>
      <button type="button" onClick={onCancel} disabled={loading} className="text-gray-500 hover:text-gray-300 text-sm w-full text-center">
        Use a different number
      </button>
    </form>
  )
}
