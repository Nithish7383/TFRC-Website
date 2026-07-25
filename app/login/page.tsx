'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import { normalizePhone } from '@/lib/constants'

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()

  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!phone.trim()) return
    setLoading(true)
    setError('')

    const normalized = normalizePhone(phone)

    const { data } = await supabase
      .from('members')
      .select('member_id')
      .eq('phone', normalized)
      .maybeSingle()

    setLoading(false)

    if (!data) {
      setError('No account found for this number.')
      return
    }

    router.push(`/member/${data.member_id}`)
  }

  return (
    <main className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="card space-y-6">
          <div className="flex flex-col items-center gap-3">
            <img src="/firstruleclublogo.jpg" alt="TFRC" className="w-16 h-16 rounded-full object-cover" />
            <h1 className="text-2xl font-bold text-white">Member Login</h1>
            <p className="text-gray-400 text-sm text-center">
              Enter your WhatsApp number to access your profile.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
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
              />
            </div>

            {error && (
              <div className="space-y-3">
                <div className="bg-red-900/20 border border-red-800/50 rounded-lg px-4 py-3 text-red-400 text-sm">
                  {error}
                </div>
                <Link
                  href="/join"
                  className="btn-primary block text-center w-full"
                >
                  Join as Member →
                </Link>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full text-center"
            >
              {loading ? 'Looking up...' : 'Continue →'}
            </button>
          </form>

          <p className="text-center text-gray-600 text-xs">
            Not a member?{' '}
            <Link href="/join" className="text-[#C9A227] hover:underline">
              Join free →
            </Link>
          </p>
        </div>
      </div>
    </main>
  )
}
