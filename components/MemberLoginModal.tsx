'use client'

import { useState } from 'react'
import { lookupMember, setFirstPassword, loginMember } from '@/app/login/actions'

type Stage = 'phone' | 'password' | 'set-password'

interface Props {
  onClose: () => void
  onSuccess: () => void
  whatsappLink?: string
}

export default function MemberLoginModal({ onClose, onSuccess, whatsappLink }: Props) {
  const [stage, setStage] = useState<Stage>('phone')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!phone.trim()) return
    setLoading(true)
    setError('')

    const result = await lookupMember(phone)
    setLoading(false)

    if (result.status === 'not_found') {
      setError('No account found for this number.')
      return
    }

    setStage(result.status === 'needs_password' ? 'set-password' : 'password')
  }

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const result = await loginMember(phone, password)
    setLoading(false)

    if (!result.ok) {
      setError(result.error)
      return
    }

    onSuccess()
  }

  const handleSetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }
    setLoading(true)
    setError('')

    const result = await setFirstPassword(phone, password)
    setLoading(false)

    if (!result.ok) {
      setError(result.error)
      return
    }

    onSuccess()
  }

  const resetToPhone = () => {
    setStage('phone')
    setPassword('')
    setConfirmPassword('')
    setError('')
  }

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center px-4" onClick={onClose}>
      <div className="card max-w-sm w-full space-y-5" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between">
          <div>
            <h2 className="heading-display text-white text-xl">Member Login</h2>
            <p className="text-gray-400 text-sm mt-1">
              {stage === 'phone' && 'Enter your WhatsApp number to continue.'}
              {stage === 'password' && 'Enter your password.'}
              {stage === 'set-password' && 'First time logging in — set a password.'}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-300 text-xl leading-none">✕</button>
        </div>

        {stage === 'phone' && (
          <form onSubmit={handlePhoneSubmit} className="space-y-4">
            <input
              type="tel"
              value={phone}
              onChange={(e) => { setPhone(e.target.value); setError('') }}
              placeholder="e.g. 9876543210"
              required
              className="input-field"
              autoFocus
            />
            {error && (
              <div className="bg-red-900/20 border border-red-800/50 rounded-lg px-4 py-3 text-red-400 text-sm">
                {error}
              </div>
            )}
            <button type="submit" disabled={loading} className="btn-primary w-full text-center">
              {loading ? 'Looking up...' : 'Continue →'}
            </button>
          </form>
        )}

        {stage === 'password' && (
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <input
              type="password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError('') }}
              placeholder="••••••••"
              required
              className="input-field"
              autoFocus
            />
            {error && (
              <div className="bg-red-900/20 border border-red-800/50 rounded-lg px-4 py-3 text-red-400 text-sm">
                {error}
              </div>
            )}
            <button type="submit" disabled={loading} className="btn-primary w-full text-center">
              {loading ? 'Signing in...' : 'Sign In →'}
            </button>
            <div className="flex items-center justify-between text-xs">
              <button type="button" onClick={resetToPhone} className="text-gray-500 hover:text-gray-300">
                ← Use a different number
              </button>
              {whatsappLink ? (
                <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="text-gold hover:underline">
                  Forgot password?
                </a>
              ) : (
                <span className="text-gray-600">Forgot password? Contact an admin.</span>
              )}
            </div>
          </form>
        )}

        {stage === 'set-password' && (
          <form onSubmit={handleSetPasswordSubmit} className="space-y-4">
            <input
              type="password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError('') }}
              placeholder="New password — at least 8 characters"
              required
              minLength={8}
              className="input-field"
              autoFocus
            />
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => { setConfirmPassword(e.target.value); setError('') }}
              placeholder="Re-enter password"
              required
              minLength={8}
              className="input-field"
            />
            {error && (
              <div className="bg-red-900/20 border border-red-800/50 rounded-lg px-4 py-3 text-red-400 text-sm">
                {error}
              </div>
            )}
            <button type="submit" disabled={loading} className="btn-primary w-full text-center">
              {loading ? 'Setting password...' : 'Set Password & Continue →'}
            </button>
            <button type="button" onClick={resetToPhone} className="w-full text-center text-gray-500 text-xs hover:text-gray-300">
              ← Use a different number
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
