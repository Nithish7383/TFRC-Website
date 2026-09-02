'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase'
import { EventPhoto } from '@/lib/types'
import { uploadPhoto, deletePhotoFile } from '@/lib/photo-upload'

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
  const [uploadError, setUploadError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [form, setForm] = useState({
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
    const file = fileInputRef.current?.files?.[0]
    if (!file) {
      setUploadError('Please choose an image to upload.')
      return
    }
    setSaving(true)
    setUploadError('')

    const uploaded = await uploadPhoto(supabase, file, `events/${eventId}`)
    if ('error' in uploaded) {
      setSaving(false)
      setUploadError(uploaded.error)
      return
    }

    const { error: insertError } = await supabase.from('event_photos').insert({
      event_id: eventId,
      image_url: uploaded.url,
      storage_path: uploaded.path,
      caption: form.caption.trim() || null,
      instagram_post_url: form.instagram_post_url.trim() || null,
      display_order: parseInt(form.display_order) || 0,
    })

    setSaving(false)
    if (insertError) {
      setUploadError('Photo uploaded, but could not be saved. Please try again.')
      return
    }

    if (fileInputRef.current) fileInputRef.current.value = ''
    setForm({ caption: '', instagram_post_url: '', display_order: '0' })
    setAddOpen(false)
    fetchPhotos()
  }

  const handleDelete = async (photo: EventPhoto) => {
    if (confirmDelete !== photo.id) {
      setConfirmDelete(photo.id)
      return
    }
    const { error } = await supabase.from('event_photos').delete().eq('id', photo.id)
    if (error) {
      setUploadError('Failed to delete photo. Please try again.')
      setConfirmDelete(null)
      return
    }
    await deletePhotoFile(supabase, photo.storage_path)
    setConfirmDelete(null)
    fetchPhotos()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="text-white font-semibold text-lg">Photos</h3>
          <span className="text-xs bg-white/10 text-gray-400 border border-white/15 px-2 py-0.5 rounded-full">
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

      {uploadError && !addOpen && (
        <p className="text-red-400 text-sm">{uploadError}</p>
      )}

      {addOpen && (
        <form onSubmit={handleSave} className="card border-gold/20 bg-gold/5 space-y-3">
          <div>
            <label className="block text-gray-300 text-sm font-medium mb-1">Photo <span className="text-red-400">*</span></label>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              ref={fileInputRef}
              required
              className="input-field"
            />
            <p className="text-gray-500 text-xs mt-1">JPG, PNG, or WEBP — up to 5MB.</p>
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
          {uploadError && <p className="text-red-400 text-sm">{uploadError}</p>}
          <button type="submit" disabled={saving} className="btn-primary text-sm py-2">
            {saving ? 'Uploading...' : 'Save Photo'}
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
            <div key={photo.id} className="flex items-center gap-3 bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3">
              <img
                src={photo.image_url}
                alt={photo.caption || 'Photo'}
                className="w-14 h-14 object-cover rounded-lg flex-shrink-0 bg-white/10"
              />
              <div className="flex-1 min-w-0">
                <p className="text-gray-300 text-sm truncate">{photo.caption || <span className="text-gray-600 italic">No caption</span>}</p>
                {photo.instagram_post_url && (
                  <a
                    href={photo.instagram_post_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gold text-xs hover:underline"
                  >
                    Instagram post ↗
                  </a>
                )}
              </div>
              <button
                onClick={() => handleDelete(photo)}
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
