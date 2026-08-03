'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { GOALS_OPTIONS, INTERESTS_OPTIONS } from '@/lib/constants'
import { registerMember } from '@/app/join/actions'
import SiteHeader from '@/components/ui/SiteHeader'

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-', 'Unknown']

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
    emergency_contact_name: '',
    emergency_contact_phone: '',
    medical_conditions: '',
    blood_group: '',
    instagram_handle: '',
    profile_photo_url: '',
    birthday: '',
    height: '',
    weight: '',
    running_pace: '',
    weekly_training_days: '',
    interests: [] as string[],
  })
  const [safetyOpen, setSafetyOpen] = useState(false)
  const [moreOpen, setMoreOpen] = useState(false)
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

  const toggleInterest = (interest: string) => {
    setForm((prev) => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter((i) => i !== interest)
        : [...prev.interests, interest],
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
      emergency_contact_name: form.emergency_contact_name.trim() || null,
      emergency_contact_phone: form.emergency_contact_phone.trim() || null,
      medical_conditions: form.medical_conditions.trim() || null,
      blood_group: form.blood_group || null,
      instagram_handle: form.instagram_handle.trim() || null,
      profile_photo_url: form.profile_photo_url.trim() || null,
      birthday: form.birthday || null,
      height: form.height ? parseFloat(form.height) : null,
      weight: form.weight ? parseFloat(form.weight) : null,
      running_pace: form.running_pace.trim() || null,
      weekly_training_days: form.weekly_training_days ? parseInt(form.weekly_training_days) : null,
      interests: form.interests,
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
        <div className="mb-8">
          <p className="eyebrow mb-2">Join the movement</p>
          <h1 className="heading-display text-white text-4xl mb-2">Join The First Rule Club</h1>
          <p className="text-gray-400">Create your member profile to register for events.</p>
          <p className="text-gray-600 text-sm mt-2 font-mono">Step 1 of 1 — Member Registration</p>
        </div>

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
                    className={`flex-1 py-3 px-4 rounded-xl border-2 text-sm font-semibold transition-all ${
                      form.gender === g
                        ? 'border-gold text-gold bg-gold/10'
                        : 'border-white/15 text-gray-400 hover:border-white/30'
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
                    className={`py-3 px-4 rounded-xl border-2 text-sm font-medium transition-all text-left ${
                      form.running_experience === value
                        ? 'border-gold text-gold bg-gold/10'
                        : 'border-white/15 text-gray-400 hover:border-white/30'
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
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                      form.goals.includes(goal)
                        ? 'border-gold/60 bg-gold/10'
                        : 'border-white/10 hover:border-white/25'
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

          {/* Section 4 — Safety (accordion) */}
          <div className="border border-white/10 rounded-xl overflow-hidden">
            <button
              type="button"
              onClick={() => setSafetyOpen((o) => !o)}
              className="w-full flex items-center justify-between px-5 py-4 text-left bg-white/[0.03] hover:bg-white/[0.06] transition-colors"
            >
              <span className="flex items-center gap-2 text-gray-300 text-sm font-medium">
                Safety info
                <span className="text-[10px] font-mono uppercase tracking-wide text-gray-500 border border-white/15 rounded-full px-2 py-0.5">Optional</span>
              </span>
              <span className="text-gray-500 text-lg">{safetyOpen ? '▲' : '▼'}</span>
            </button>

            {safetyOpen && (
              <div className="px-5 pb-5 pt-4 space-y-4 bg-white/[0.015]">
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">Emergency Contact Name</label>
                  <input
                    type="text"
                    name="emergency_contact_name"
                    value={form.emergency_contact_name}
                    onChange={handleChange}
                    placeholder="e.g. Ramesh Kumar"
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">Emergency Contact Phone</label>
                  <input
                    type="tel"
                    name="emergency_contact_phone"
                    value={form.emergency_contact_phone}
                    onChange={handleChange}
                    placeholder="e.g. 9876543210"
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">Medical Conditions</label>
                  <textarea
                    name="medical_conditions"
                    value={form.medical_conditions}
                    onChange={handleChange}
                    rows={3}
                    placeholder="Any conditions we should know about"
                    className="input-field resize-none"
                  />
                </div>
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">Blood Group</label>
                  <select
                    name="blood_group"
                    value={form.blood_group}
                    onChange={handleChange}
                    className="input-field"
                  >
                    <option value="">— Select —</option>
                    {BLOOD_GROUPS.map((bg) => (
                      <option key={bg} value={bg}>{bg}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Section 5 — Extended Profile (accordion) */}
          <div className="border border-white/10 rounded-xl overflow-hidden">
            <button
              type="button"
              onClick={() => setMoreOpen((o) => !o)}
              className="w-full flex items-center justify-between px-5 py-4 text-left bg-white/[0.03] hover:bg-white/[0.06] transition-colors"
            >
              <span className="flex items-center gap-2 text-gray-300 text-sm font-medium">
                Tell us more
                <span className="text-[10px] font-mono uppercase tracking-wide text-gray-500 border border-white/15 rounded-full px-2 py-0.5">Optional</span>
              </span>
              <span className="text-gray-500 text-lg">{moreOpen ? '▲' : '▼'}</span>
            </button>

            {moreOpen && (
              <div className="px-5 pb-5 pt-4 space-y-4 bg-white/[0.015]">
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">Instagram Handle</label>
                  <input
                    type="text"
                    name="instagram_handle"
                    value={form.instagram_handle}
                    onChange={handleChange}
                    placeholder="@yourhandle"
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">Profile Photo URL</label>
                  <input
                    type="text"
                    name="profile_photo_url"
                    value={form.profile_photo_url}
                    onChange={handleChange}
                    placeholder="https://..."
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">Birthday</label>
                  <input
                    type="date"
                    name="birthday"
                    value={form.birthday}
                    onChange={handleChange}
                    className="input-field"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-300 text-sm font-medium mb-2">Height (cm)</label>
                    <input
                      type="number"
                      name="height"
                      value={form.height}
                      onChange={handleChange}
                      placeholder="e.g. 170"
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-300 text-sm font-medium mb-2">Weight (kg)</label>
                    <input
                      type="number"
                      name="weight"
                      value={form.weight}
                      onChange={handleChange}
                      placeholder="e.g. 65"
                      className="input-field"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">Running Pace</label>
                  <input
                    type="text"
                    name="running_pace"
                    value={form.running_pace}
                    onChange={handleChange}
                    placeholder="e.g. 6:30 min/km"
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">Weekly Training Days (1–7)</label>
                  <input
                    type="number"
                    name="weekly_training_days"
                    value={form.weekly_training_days}
                    onChange={handleChange}
                    min="1"
                    max="7"
                    placeholder="e.g. 4"
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-3">Interests</label>
                  <div className="grid grid-cols-2 gap-2">
                    {INTERESTS_OPTIONS.map((interest) => (
                      <label
                        key={interest}
                        className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                          form.interests.includes(interest)
                            ? 'border-gold/60 bg-gold/10'
                            : 'border-white/10 hover:border-white/25'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={form.interests.includes(interest)}
                          onChange={() => toggleInterest(interest)}
                          className="accent-gold"
                        />
                        <span className="text-sm text-gray-300">{interest}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}
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

          {error && (
            <div className="bg-red-900/20 border border-red-800/50 rounded-lg px-4 py-3 text-red-400 text-sm">
              {error}
            </div>
          )}

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
      </div>
      </div>
    </main>
  )
}
