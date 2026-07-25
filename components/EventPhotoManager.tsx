'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import { EventPhoto } from '@/lib/types'

interface Props {
  eventId: string
}

export default function EventPhotoManager({ eventId }: Props) {
  const supabase = createClient()

  const [photos, setPhotos] = useState<EventPhoto[]>([])
  const [loading, setLoading] = useState(true)
  const [addOpen, setAddOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [form, setForm] = useState({
    image_url: '',
    caption: '',
    instagram_post_url: '',
    display_order: '0',
  })

  const fetchPhotos = useCallback(async () => {
    const { data } = await supabase
      .from('event_photos')
      .select('*')
      .eq('event_id', eventId)
      .order('display_order', { ascending: true })
    setPhotos((data || []) as EventPhoto[])
    setLoading(false)
  }, [supabase, eventId])

  useEffect(() => {
    fetchPhotos()
  }, [fetchPhotos])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.image_url.trim()) return
    setSaving(true)

    await supabase.from('event_photos').insert({
      event_id: eventId,
      image_url: form.image_url.trim(),
      caption: form.caption.trim() || null,
      instagram_post_url: form.instagram_post_url.trim() || null,
      display_order: parseInt(form.display_order) || 0,
    })

    setForm({ image_url: '', caption: '', instagram_post_url: '', display_order: '0' })
    setSaving(false)
    setAddOpen(false)
    fetchPhotos()
  }

  const handleDelete = async (id: string) => {
    if (confirmDelete !== id) {
      setConfirmDelete(id)
      return
    }
    await supabase.from('event_photos').delete().eq('id', id)
    setConfirmDelete(null)
    fetchPhotos()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="text-white font-semibold text-lg">Photos</h3>
          <span className="text-xs bg-gray-800 text-gray-400 border border-gray-700 px-2 py-0.5 rounded-full">
            {photos.length}
          </span>
        </div>
        <button
          onClick={() => setAddOpen((o) => !o)}
          className="btn-secondary text-sm py-2"
        >
          {addOpen ? '× Cancel' : '+ Add Photo'}
        </button>
      </div>

      {addOpen && (
        <form onSubmit={handleSave} className="card border-[#C9A227]/20 bg-[#C9A227]/5 space-y-3">
          <div>
            <label className="block text-gray-300 text-sm font-medium mb-1">Image URL <span className="text-red-400">*</span></label>
            <input
              type="text"
              value={form.image_url}
              onChange={(e) => setForm((p) => ({ ...p, image_url: e.target.value }))}
              placeholder="https://..."
              required
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-gray-300 text-sm font-medium mb-1">Caption</label>
            <input
              type="text"
              value={form.caption}
              onChange={(e) => setForm((p) => ({ ...p, caption: e.target.value }))}
              placeholder="Optional caption"
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-gray-300 text-sm font-medium mb-1">Instagram Post URL</label>
            <input
              type="text"
              value={form.instagram_post_url}
              onChange={(e) => setForm((p) => ({ ...p, instagram_post_url: e.target.value }))}
              placeholder="https://instagram.com/p/..."
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-gray-300 text-sm font-medium mb-1">Display Order</label>
            <input
              type="number"
              value={form.display_order}
              onChange={(e) => setForm((p) => ({ ...p, display_order: e.target.value }))}
              className="input-field w-24"
            />
          </div>
          <button type="submit" disabled={saving} className="btn-primary text-sm py-2">
            {saving ? 'Saving...' : 'Save Photo'}
          </button>
        </form>
      )}

      {loading ? (
        <p className="text-gray-500 text-sm">Loading photos...</p>
      ) : photos.length === 0 ? (
        <p className="text-gray-600 text-sm">No photos yet. Add one above.</p>
      ) : (
        <div className="space-y-2">
          {photos.map((photo) => (
            <div key={photo.id} className="flex items-center gap-3 bg-gray-900 border border-gray-800 rounded-xl px-4 py-3">
              <img
                src={photo.image_url}
                alt={photo.caption || 'Photo'}
                className="w-14 h-14 object-cover rounded-lg flex-shrink-0 bg-gray-800"
              />
              <div className="flex-1 min-w-0">
                <p className="text-gray-300 text-sm truncate">{photo.caption || <span className="text-gray-600 italic">No caption</span>}</p>
                {photo.instagram_post_url && (
                  <a
                    href={photo.instagram_post_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#C9A227] text-xs hover:underline"
                  >
                    Instagram post ↗
                  </a>
                )}
              </div>
              <button
                onClick={() => handleDelete(photo.id)}
                className={`text-xs px-3 py-1.5 rounded-lg border transition-colors flex-shrink-0 ${
                  confirmDelete === photo.id
                    ? 'bg-red-800 text-white border-red-700'
                    : 'border-red-800/50 text-red-400 hover:bg-red-900/20'
                }`}
              >
                {confirmDelete === photo.id ? 'Confirm delete' : 'Delete'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
