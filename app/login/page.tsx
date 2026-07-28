'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { lookupMember, setFirstPassword, loginMember } from './actions'

type Stage = 'phone' | 'password' | 'set-password'

export default function LoginPage() {
  const router = useRouter()

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

    router.push(`/member/${result.memberId}`)
    router.refresh()
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

    router.push(`/member/${result.memberId}`)
    router.refresh()
  }

  const resetToPhone = () => {
    setStage('phone')
    setPassword('')
    setConfirmPassword('')
    setError('')
  }

  return (
    <main className="min-h-screen bg-black flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="card space-y-6">
          <div className="flex flex-col items-center gap-3">
            <img src="/firstruleclublogo.jpg" alt="TFRC" className="w-16 h-16 rounded-full object-cover" />
            <h1 className="heading-display text-white text-2xl">Member Login</h1>
            <p className="text-gray-400 text-sm text-center">
              {stage === 'phone' && 'Enter your WhatsApp number to continue.'}
              {stage === 'password' && 'Enter your password to access your dashboard.'}
              {stage === 'set-password' && 'First time logging in — set a password for your account.'}
            </p>
          </div>

          {stage === 'phone' && (
            <form onSubmit={handlePhoneSubmit} className="space-y-4">
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  WhatsApp Number
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => { setPhone(e.target.value); setError('') }}
                  placeholder="e.g. 9876543210"
                  required
                  className="input-field"
                  autoFocus
                />
              </div>

              {error && (
                <div className="space-y-3">
                  <div className="bg-red-900/20 border border-red-800/50 rounded-lg px-4 py-3 text-red-400 text-sm">
                    {error}
                  </div>
                  <Link href="/join" className="btn-primary block text-center w-full">
                    Join as Member →
                  </Link>
                </div>
              )}

              <button type="submit" disabled={loading} className="btn-primary w-full text-center">
                {loading ? 'Looking up...' : 'Continue →'}
              </button>
            </form>
          )}

          {stage === 'password' && (
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError('') }}
                  placeholder="••••••••"
                  required
                  className="input-field"
                  autoFocus
                />
              </div>

              {error && (
                <div className="bg-red-900/20 border border-red-800/50 rounded-lg px-4 py-3 text-red-400 text-sm">
                  {error}
                </div>
              )}

              <button type="submit" disabled={loading} className="btn-primary w-full text-center">
                {loading ? 'Signing in...' : 'Sign In →'}
              </button>

              <button
                type="button"
                onClick={resetToPhone}
                className="w-full text-center text-gray-500 text-xs hover:text-gray-300"
              >
                ← Use a different number
              </button>
            </form>
          )}

          {stage === 'set-password' && (
            <form onSubmit={handleSetPasswordSubmit} className="space-y-4">
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">New Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError('') }}
                  placeholder="At least 8 characters"
                  required
                  minLength={8}
                  className="input-field"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">Confirm Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => { setConfirmPassword(e.target.value); setError('') }}
                  placeholder="Re-enter password"
                  required
                  minLength={8}
                  className="input-field"
                />
              </div>

              {error && (
                <div className="bg-red-900/20 border border-red-800/50 rounded-lg px-4 py-3 text-red-400 text-sm">
                  {error}
                </div>
              )}

              <button type="submit" disabled={loading} className="btn-primary w-full text-center">
                {loading ? 'Setting password...' : 'Set Password & Continue →'}
              </button>

              <button
                type="button"
                onClick={resetToPhone}
                className="w-full text-center text-gray-500 text-xs hover:text-gray-300"
              >
                ← Use a different number
              </button>
            </form>
          )}

          <p className="text-center text-gray-600 text-xs">
            Not a member?{' '}
            <Link href="/join" className="text-gold hover:underline">
              Join free →
            </Link>
          </p>
        </div>
      </div>
    </main>
  )
}
