'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase'
import { GalleryPhoto } from '@/lib/types'
import { uploadPhoto, deletePhotoFile } from '@/lib/photo-upload'

export default function HomepageGalleryManager() {
  const supabase = createClient()

  const [photos, setPhotos] = useState<GalleryPhoto[]>([])
  const [loading, setLoading] = useState(true)
  const [caption, setCaption] = useState('')
  const [displayOrder, setDisplayOrder] = useState(0)
  const [saving, setSaving] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const fetchPhotos = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('gallery_photos')
      .select('*')
      .order('display_order', { ascending: true })
    setPhotos((data || []) as GalleryPhoto[])
    setLoading(false)
  }

  useEffect(() => { fetchPhotos() }, [])

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    const file = fileInputRef.current?.files?.[0]
    if (!file) {
      setError('Please choose an image to upload.')
      return
    }
    setSaving(true)
    setError('')
    setSuccess('')

    const uploaded = await uploadPhoto(supabase, file, 'gallery')
    if ('error' in uploaded) {
      setSaving(false)
      setError(uploaded.error)
      return
    }

    const { error: insertError } = await supabase.from('gallery_photos').insert({
      image_url: uploaded.url,
      storage_path: uploaded.path,
      caption: caption.trim() || null,
      display_order: displayOrder,
    })

    setSaving(false)
    if (insertError) {
      setError('Failed to add photo. Please try again.')
      return
    }

    if (fileInputRef.current) fileInputRef.current.value = ''
    setCaption('')
    setDisplayOrder(0)
    setSuccess('Photo added.')
    fetchPhotos()
  }

  const handleDelete = async (photo: GalleryPhoto) => {
    if (deleteConfirm !== photo.id) {
      setDeleteConfirm(photo.id)
      return
    }
    await supabase.from('gallery_photos').delete().eq('id', photo.id)
    await deletePhotoFile(supabase, photo.storage_path)
    setDeleteConfirm(null)
    fetchPhotos()
  }

  return (
    <div className="space-y-6">
      {/* Add form */}
      <form onSubmit={handleAdd} className="space-y-4 border border-white/15 rounded-xl p-5">
        <h4 className="text-white font-medium">Add Photo</h4>
        <div>
          <label className="block text-gray-400 text-xs mb-1">Photo <span className="text-red-400">*</span></label>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            ref={fileInputRef}
            required
            className="input-field"
          />
          <p className="text-gray-600 text-xs mt-1">JPG, PNG, or WEBP — up to 5MB.</p>
        </div>
        <div>
          <label className="block text-gray-400 text-xs mb-1">Caption (optional)</label>
          <input
            type="text"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="e.g. Sunday 5K run — Vandiyur"
            className="input-field"
          />
        </div>
        <div>
          <label className="block text-gray-400 text-xs mb-1">Display Order</label>
          <input
            type="number"
            value={displayOrder}
            onChange={(e) => setDisplayOrder(parseInt(e.target.value) || 0)}
            className="input-field w-32"
          />
        </div>
        {error && <p className="text-red-400 text-sm">{error}</p>}
        {success && <p className="text-green-400 text-sm">{success}</p>}
        <button type="submit" disabled={saving} className="btn-primary">
          {saving ? 'Uploading...' : 'Add Photo'}
        </button>
      </form>

      {/* Photos list */}
      {loading ? (
        <p className="text-gray-500 text-sm">Loading...</p>
      ) : photos.length === 0 ? (
        <p className="text-gray-600 text-sm">No gallery photos yet.</p>
      ) : (
        <div className="space-y-3">
          {photos.map((photo) => (
            <div key={photo.id} className="flex items-center gap-4 border border-white/15 rounded-lg p-3">
              <img
                src={photo.image_url}
                alt={photo.caption ?? 'Gallery'}
                className="w-16 h-16 object-cover rounded-lg flex-shrink-0 bg-white/10"
              />
              <div className="flex-1 min-w-0">
                <p className="text-gray-300 text-sm truncate">{photo.caption || '—'}</p>
                <p className="text-gray-600 text-xs">Order: {photo.display_order}</p>
              </div>
              <button
                onClick={() => handleDelete(photo)}
                className={`text-xs px-3 py-1.5 rounded-lg border transition-colors whitespace-nowrap ${
                  deleteConfirm === photo.id
                    ? 'bg-red-900/50 border-red-700 text-red-300'
                    : 'border-white/15 text-gray-400 hover:border-red-700 hover:text-red-400'
                }`}
              >
                {deleteConfirm === photo.id ? 'Confirm delete?' : 'Delete'}
              </button>
              {deleteConfirm === photo.id && (
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="text-xs text-gray-500 hover:text-gray-300"
                >
                  Cancel
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
