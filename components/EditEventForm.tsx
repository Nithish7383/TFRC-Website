'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { Event } from '@/lib/types'

interface Props {
  event: Event
  onClose: () => void
}

export default function EditEventForm({ event, onClose }: Props) {
  const router = useRouter()
  const supabase = createClient()

  const [form, setForm] = useState({
    title: event.title,
    date: event.date ? event.date.split('T')[0] : '',
    max_male: String(event.max_male),
    max_female: String(event.max_female),
    group_link: event.group_link || '',
    registration_deadline: event.registration_deadline
      ? event.registration_deadline.slice(0, 16)
      : '',
    meeting_point_url: event.meeting_point_url || '',
    distance: event.distance || '',
    pace_group: event.pace_group || '',
    cover_image_url: event.cover_image_url || '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
    setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error: updateError } = await supabase
      .from('events')
      .update({
        title: form.title.trim(),
        date: form.date,
        max_male: parseInt(form.max_male),
        max_female: parseInt(form.max_female),
        group_link: form.group_link.trim() || null,
        registration_deadline: form.registration_deadline || null,
        meeting_point_url: form.meeting_point_url.trim() || null,
        distance: form.distance.trim() || null,
        pace_group: form.pace_group.trim() || null,
        cover_image_url: form.cover_image_url.trim() || null,
      })
      .eq('id', event.id)

    if (updateError) {
      setError('Failed to update event. Please try again.')
      setLoading(false)
      return
    }

    setLoading(false)
    router.refresh()
    onClose()
  }

  return (
    <div className="card border-[#C9A227]/30 bg-[#C9A227]/5 mt-2">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-semibold">Edit Event</h3>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-300 text-xl leading-none px-1"
        >
          ×
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className="block text-gray-300 text-sm font-medium mb-2">
              Event Title <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              name="title"
              value={form.title}
              onChange={handleChange}
              required
              className="input-field"
            />
          </div>

          <div>
            <label className="block text-gray-300 text-sm font-medium mb-2">
              Event Date <span className="text-red-400">*</span>
            </label>
            <input
              type="date"
              name="date"
              value={form.date}
              onChange={handleChange}
              required
              className="input-field"
            />
          </div>

          <div>
            <label className="block text-gray-300 text-sm font-medium mb-2">
              Max Male Slots <span className="text-red-400">*</span>
            </label>
            <input
              type="number"
              name="max_male"
              value={form.max_male}
              onChange={handleChange}
              required
              min="1"
              max="500"
              className="input-field"
            />
          </div>

          <div>
            <label className="block text-gray-300 text-sm font-medium mb-2">
              Max Female Slots <span className="text-red-400">*</span>
            </label>
            <input
              type="number"
              name="max_female"
              value={form.max_female}
              onChange={handleChange}
              required
              min="1"
              max="500"
              className="input-field"
            />
          </div>

          <div>
            <label className="block text-gray-300 text-sm font-medium mb-2">Distance</label>
            <input
              type="text"
              name="distance"
              value={form.distance}
              onChange={handleChange}
              placeholder="e.g. 5K, 10K, Half Marathon"
              className="input-field"
            />
          </div>

          <div>
            <label className="block text-gray-300 text-sm font-medium mb-2">Pace Group</label>
            <input
              type="text"
              name="pace_group"
              value={form.pace_group}
              onChange={handleChange}
              placeholder="e.g. Beginner / All pace welcome"
              className="input-field"
            />
          </div>

          <div>
            <label className="block text-gray-300 text-sm font-medium mb-2">
              Registration Deadline
            </label>
            <input
              type="datetime-local"
              name="registration_deadline"
              value={form.registration_deadline}
              onChange={handleChange}
              className="input-field"
            />
          </div>

          <div>
            <label className="block text-gray-300 text-sm font-medium mb-2">
              Meeting Point URL
            </label>
            <input
              type="text"
              name="meeting_point_url"
              value={form.meeting_point_url}
              onChange={handleChange}
              placeholder="https://maps.google.com/..."
              className="input-field"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-gray-300 text-sm font-medium mb-2">
              WhatsApp Group Link
            </label>
            <input
              type="url"
              name="group_link"
              value={form.group_link}
              onChange={handleChange}
              placeholder="https://chat.whatsapp.com/..."
              className="input-field"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-gray-300 text-sm font-medium mb-2">
              Cover Image URL (optional)
            </label>
            <input
              type="text"
              name="cover_image_url"
              value={form.cover_image_url}
              onChange={handleChange}
              placeholder="https://... — used as event thumbnail"
              className="input-field"
            />
          </div>
        </div>

        {error && (
          <p className="mt-4 text-red-400 text-sm bg-red-900/20 border border-red-800/40 rounded-lg px-4 py-2">
            {error}
          </p>
        )}

        <div className="flex flex-wrap gap-3 mt-5">
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
          <button type="button" onClick={onClose} className="btn-secondary">
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
