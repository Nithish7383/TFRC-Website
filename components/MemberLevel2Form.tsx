'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { INTERESTS_OPTIONS } from '@/lib/constants'
import { Member } from '@/lib/types'

export default function MemberLevel2Form() {
  const supabase = createClient()

  const [phone, setPhone] = useState('')
  const [member, setMember] = useState<Member | null>(null)
  const [looking, setLooking] = useState(false)
  const [lookupDone, setLookupDone] = useState(false)
  const [lookupError, setLookupError] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [saveError, setSaveError] = useState('')

  const [form, setForm] = useState({
    instagram_handle: '',
    profile_photo_url: '',
    birthday: '',
    height: '',
    weight: '',
    running_pace: '',
    weekly_training_days: '',
    interests: [] as string[],
  })

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!phone.trim()) return
    setLooking(true)
    setLookupError('')

    const { data } = await supabase
      .from('members')
      .select('*')
      .eq('phone', phone.trim())
      .maybeSingle()

    setLooking(false)
    setLookupDone(true)

    if (!data) {
      setLookupError('No member found for this number.')
      return
    }

    setMember(data as Member)

    if (data.level === 2) {
      setForm({
        instagram_handle: data.instagram_handle || '',
        profile_photo_url: data.profile_photo_url || '',
        birthday: data.birthday || '',
        height: data.height ? String(data.height) : '',
        weight: data.weight ? String(data.weight) : '',
        running_pace: data.running_pace || '',
        weekly_training_days: data.weekly_training_days ? String(data.weekly_training_days) : '',
        interests: data.interests || [],
      })
    }
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
    if (!member) return
    setSaving(true)
    setSaveError('')

    const { error } = await supabase
      .from('members')
      .update({
        instagram_handle: form.instagram_handle.trim() || null,
        profile_photo_url: form.profile_photo_url.trim() || null,
        birthday: form.birthday || null,
        height: form.height ? parseFloat(form.height) : null,
        weight: form.weight ? parseFloat(form.weight) : null,
        running_pace: form.running_pace.trim() || null,
        weekly_training_days: form.weekly_training_days ? parseInt(form.weekly_training_days) : null,
        interests: form.interests,
      })
      .eq('phone', phone.trim())

    setSaving(false)
    if (error) {
      setSaveError('Something went wrong. Please try again.')
    } else {
      setSaved(true)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <a href="/" className="text-gray-500 text-sm hover:text-gray-300 inline-block mb-6">
          ← Home
        </a>
        <h1 className="text-3xl font-bold text-white mb-2">Level 2 Profile</h1>
        <p className="text-gray-400">Complete your runner profile after your first few events.</p>
      </div>

      {/* Phone lookup */}
      {!member && (
        <form onSubmit={handleLookup} className="card flex flex-col sm:flex-row gap-3 mb-6">
          <input
            type="tel"
            value={phone}
            onChange={(e) => { setPhone(e.target.value); setLookupDone(false); setLookupError('') }}
            placeholder="Enter your WhatsApp number"
            required
            className="input-field flex-1"
          />
          <button type="submit" disabled={looking} className="btn-primary whitespace-nowrap">
            {looking ? 'Looking up...' : 'Find my profile'}
          </button>
        </form>
      )}

      {lookupDone && lookupError && (
        <div className="card text-center py-8">
          <p className="text-red-400 mb-3">{lookupError}</p>
          <a href="/join" className="btn-primary inline-block">Join first at /join</a>
        </div>
      )}

      {member && member.level === 1 && (
        <div className="card text-center py-8 border-yellow-800/30 bg-yellow-900/10">
          <p className="text-yellow-400 text-lg font-semibold mb-2">Level 2 not yet unlocked</p>
          <p className="text-gray-400 text-sm">
            Complete 2–3 runs and ask your admin to unlock Level 2 for your account.
          </p>
          <p className="text-gray-600 text-xs mt-3">Member: {member.member_id}</p>
        </div>
      )}

      {member && member.level === 2 && saved && (
        <div className="card text-center py-8 border-green-800/30 bg-green-900/10">
          <p className="text-green-400 text-xl font-semibold mb-2">Profile complete!</p>
          <p className="text-gray-300">Welcome to Level 2, {member.name}.</p>
        </div>
      )}

      {member && member.level === 2 && !saved && (
        <form onSubmit={handleSubmit} className="card space-y-5">
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="text-white font-semibold">{member.name}</p>
              <p className="text-[#C9A227] text-sm">{member.member_id}</p>
            </div>
            <span className="text-xs bg-[#C9A227]/20 text-[#C9A227] border border-[#C9A227]/30 px-2 py-1 rounded-full">
              Level 2
            </span>
          </div>

          <div>
            <label className="block text-gray-300 text-sm font-medium mb-2">Instagram Handle</label>
            <input type="text" name="instagram_handle" value={form.instagram_handle} onChange={handleChange} placeholder="@yourhandle" className="input-field" />
          </div>
          <div>
            <label className="block text-gray-300 text-sm font-medium mb-2">Profile Photo URL</label>
            <input type="text" name="profile_photo_url" value={form.profile_photo_url} onChange={handleChange} placeholder="https://..." className="input-field" />
          </div>
          <div>
            <label className="block text-gray-300 text-sm font-medium mb-2">Birthday</label>
            <input type="date" name="birthday" value={form.birthday} onChange={handleChange} className="input-field" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">Height (cm)</label>
              <input type="number" name="height" value={form.height} onChange={handleChange} placeholder="e.g. 170" className="input-field" />
            </div>
            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">Weight (kg)</label>
              <input type="number" name="weight" value={form.weight} onChange={handleChange} placeholder="e.g. 65" className="input-field" />
            </div>
          </div>
          <div>
            <label className="block text-gray-300 text-sm font-medium mb-2">Running Pace</label>
            <input type="text" name="running_pace" value={form.running_pace} onChange={handleChange} placeholder="e.g. 6:30 min/km" className="input-field" />
          </div>
          <div>
            <label className="block text-gray-300 text-sm font-medium mb-2">Weekly Training Days (1–7)</label>
            <input type="number" name="weekly_training_days" value={form.weekly_training_days} onChange={handleChange} min="1" max="7" placeholder="e.g. 4" className="input-field" />
          </div>

          <div>
            <label className="block text-gray-300 text-sm font-medium mb-3">Interests</label>
            <div className="grid grid-cols-2 gap-2">
              {INTERESTS_OPTIONS.map((interest) => (
                <label
                  key={interest}
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                    form.interests.includes(interest)
                      ? 'border-[#C9A227]/60 bg-[#C9A227]/10'
                      : 'border-gray-700 hover:border-gray-600'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={form.interests.includes(interest)}
                    onChange={() => toggleInterest(interest)}
                    className="accent-[#C9A227]"
                  />
                  <span className="text-sm text-gray-300">{interest}</span>
                </label>
              ))}
            </div>
          </div>

          {saveError && (
            <div className="bg-red-900/20 border border-red-800/50 rounded-lg px-4 py-3 text-red-400 text-sm">
              {saveError}
            </div>
          )}

          <button type="submit" disabled={saving} className="btn-primary w-full">
            {saving ? 'Saving...' : 'Complete Level 2 Profile →'}
          </button>
        </form>
      )}
    </div>
  )
}
