'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { GOALS_OPTIONS } from '@/lib/constants'
import { registerMember } from '@/app/join/actions'
import SiteHeader from '@/components/ui/SiteHeader'
import Reveal from '@/components/ui/Reveal'

export default function MemberRegisterForm() {
  const router = useRouter()

  const [form, setForm] = useState({
    name: '',
    phone: '',
    age: '',
    gender: '',
    place: '',
    occupation: '',
    running_experience: '',
    goals: [] as string[],
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [existingMemberId, setExistingMemberId] = useState<string | null>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
    setError('')
  }

  const toggleGoal = (goal: string) => {
    setForm((prev) => ({
      ...prev,
      goals: prev.goals.includes(goal)
        ? prev.goals.filter((g) => g !== goal)
        : [...prev.goals, goal],
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.gender) { setError('Please select your gender.'); return }
    if (!form.running_experience) { setError('Please select your running experience.'); return }

    setLoading(true)
    setError('')
    setExistingMemberId(null)

    const result = await registerMember({
      name: form.name.trim(),
      phone: form.phone,
      age: parseInt(form.age),
      gender: form.gender,
      place: form.place.trim(),
      occupation: form.occupation.trim(),
      running_experience: form.running_experience,
      goals: form.goals,
      emergency_contact_name: null,
      emergency_contact_phone: null,
      medical_conditions: null,
      blood_group: null,
      instagram_handle: null,
      profile_photo_url: null,
      birthday: null,
      height: null,
      weight: null,
      running_pace: null,
      weekly_training_days: null,
      interests: [],
    })

    setLoading(false)

    if (!result.ok) {
      if (result.existingMemberId) setExistingMemberId(result.existingMemberId)
      setError(result.error)
      return
    }

    const params = new URLSearchParams({
      member_id: result.memberId,
      name: form.name.trim(),
    })
    router.push(`/join/welcome?${params.toString()}`)
    router.refresh()
  }

  return (
    <main className="min-h-screen bg-black">
      <SiteHeader />
      <div className="py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <Reveal>
          <div className="mb-8">
            <p className="eyebrow eyebrow-line mb-2">Join the movement</p>
            <h1 className="heading-display text-white text-4xl mb-2">Join The First Rule Club</h1>
            <p className="text-gray-400">Create your member profile to register for events.</p>
            <p className="text-gray-600 text-sm mt-2 font-mono">Step 1 of 1 — Member Registration</p>
          </div>
        </Reveal>

        <Reveal delay={100}>
        <form onSubmit={handleSubmit} className="card space-y-8">
          {/* Section 1 — Personal */}
          <div className="space-y-4">
            <h2 className="heading-display text-white text-xl border-b border-white/10 pb-3">Personal Details</h2>

            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">
                Full Name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                required
                placeholder="e.g. Priya Ramesh"
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">
                WhatsApp Number <span className="text-red-400">*</span>
              </label>
              <input
                type="tel"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                required
                placeholder="e.g. 9876543210"
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">
                Age <span className="text-red-400">*</span>
              </label>
              <input
                type="number"
                name="age"
                value={form.age}
                onChange={handleChange}
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
                    onClick={() => { setForm((p) => ({ ...p, gender: g })); setError('') }}
                    className={`option-tile flex-1 py-3 px-4 ${
                      form.gender === g ? 'option-tile-on' : 'option-tile-off'
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">
                Place <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                name="place"
                value={form.place}
                onChange={handleChange}
                required
                placeholder="Area / City"
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">
                Occupation <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                name="occupation"
                value={form.occupation}
                onChange={handleChange}
                required
                placeholder="e.g. Software Engineer, Student, Doctor"
                className="input-field"
              />
            </div>
          </div>

          {/* Section 2 — Running */}
          <div className="space-y-4">
            <h2 className="heading-display text-white text-xl border-b border-white/10 pb-3">Running Profile</h2>

            <div>
              <label className="block text-gray-300 text-sm font-medium mb-3">
                Running Experience <span className="text-red-400">*</span>
              </label>
              <div className="grid grid-cols-2 gap-3">
                {([
                  { value: 'First timer', label: 'First timer' },
                  { value: 'Casual', label: 'Casual (1–2/month)' },
                  { value: 'Regular', label: 'Regular (weekly)' },
                  { value: 'Competitive', label: 'Competitive' },
                ] as const).map(({ value, label }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => { setForm((p) => ({ ...p, running_experience: value })); setError('') }}
                    className={`option-tile py-3 px-4 text-left font-medium ${
                      form.running_experience === value ? 'option-tile-on' : 'option-tile-off'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-gray-300 text-sm font-medium mb-3">
                What brings you to TFRC? <span className="text-gray-500 font-normal">(select all that apply)</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                {GOALS_OPTIONS.map((goal) => (
                  <label
                    key={goal}
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer
                               transition-all duration-300 ease-out-expo ${
                      form.goals.includes(goal)
                        ? 'border-gold/60 bg-gold/10 shadow-gold-glow'
                        : 'border-white/10 hover:border-white/25 hover:bg-white/[0.03]'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={form.goals.includes(goal)}
                      onChange={() => toggleGoal(goal)}
                      className="accent-gold"
                    />
                    <span className="text-sm text-gray-300">{goal}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {existingMemberId && (
            <div className="bg-gold/10 border border-gold/40 rounded-xl p-5 space-y-3">
              <p className="text-gold font-semibold">
                You&apos;re already a TFRC member! Your ID is{' '}
                <span className="tracking-widest font-mono">{existingMemberId}</span>.
              </p>
              <Link href="/register" className="btn-primary inline-block">
                Register for an Event →
              </Link>
            </div>
          )}

          <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: [0, -6, 6, -4, 4, 0] }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="bg-red-900/20 border border-red-800/50 rounded-lg px-4 py-3 text-red-400 text-sm"
            >
              {error}
            </motion.div>
          )}
          </AnimatePresence>

          {!existingMemberId && (
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full text-center"
            >
              {loading ? 'Creating profile...' : 'Create My Profile →'}
            </button>
          )}
        </form>
        </Reveal>
      </div>
      </div>
    </main>
  )
}
