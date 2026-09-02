'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase'
import { CommunityGroup } from '@/lib/types'
import { uploadPhoto, deletePhotoFile } from '@/lib/photo-upload'

const emptyForm = { name: '', description: '', group_link: '', display_order: '0' }

export default function CommunityGroupsManager() {
  const supabase = createClient()

  const [groups, setGroups] = useState<CommunityGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState(emptyForm)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const fetchGroups = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('community_groups')
      .select('*')
      .order('display_order', { ascending: true })
    setGroups((data || []) as CommunityGroup[])
    setLoading(false)
  }

  useEffect(() => { fetchGroups() }, [])

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    const file = fileInputRef.current?.files?.[0]
    if (!form.name.trim()) {
      setError('Please enter a group name.')
      return
    }
    setSaving(true)
    setError('')
    setSuccess('')

    let imageUrl: string | null = null
    let storagePath: string | null = null
    if (file) {
      const uploaded = await uploadPhoto(supabase, file, 'community-groups')
      if ('error' in uploaded) {
        setSaving(false)
        setError(uploaded.error)
        return
      }
      imageUrl = uploaded.url
      storagePath = uploaded.path
    }

    const { error: insertError } = await supabase.from('community_groups').insert({
      name: form.name.trim(),
      description: form.description.trim() || null,
      group_link: form.group_link.trim() || null,
      image_url: imageUrl,
      storage_path: storagePath,
      display_order: parseInt(form.display_order) || 0,
    })

    setSaving(false)
    if (insertError) {
      setError('Failed to add group. Please try again.')
      return
    }

    if (fileInputRef.current) fileInputRef.current.value = ''
    setForm(emptyForm)
    setSuccess('Group added.')
    fetchGroups()
  }

  const handleDelete = async (group: CommunityGroup) => {
    if (deleteConfirm !== group.id) {
      setDeleteConfirm(group.id)
      return
    }
    const { error: deleteError } = await supabase.from('community_groups').delete().eq('id', group.id)
    if (deleteError) {
      setError('Failed to delete group. Please try again.')
      setDeleteConfirm(null)
      return
    }
    await deletePhotoFile(supabase, group.storage_path)
    setDeleteConfirm(null)
    fetchGroups()
  }

  const startEdit = (group: CommunityGroup) => {
    setEditingId(group.id)
    setEditForm({
      name: group.name,
      description: group.description || '',
      group_link: group.group_link || '',
      display_order: String(group.display_order),
    })
  }

  const saveEdit = async (id: string) => {
    setError('')
    const { error: updateError } = await supabase
      .from('community_groups')
      .update({
        name: editForm.name.trim(),
        description: editForm.description.trim() || null,
        group_link: editForm.group_link.trim() || null,
        display_order: parseInt(editForm.display_order) || 0,
      })
      .eq('id', id)

    if (updateError) {
      setError('Failed to save changes. Please try again.')
      return
    }
    setEditingId(null)
    fetchGroups()
  }

  return (
    <div className="space-y-6">
      {/* Add form */}
      <form onSubmit={handleAdd} className="space-y-4 border border-white/15 rounded-xl p-5">
        <h4 className="text-white font-medium">Add Community Group</h4>
        <div>
          <label className="block text-gray-400 text-xs mb-1">Group Name <span className="text-red-400">*</span></label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            placeholder="e.g. Readers Circle"
            className="input-field"
          />
        </div>
        <div>
          <label className="block text-gray-400 text-xs mb-1">Description (optional)</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
            rows={2}
            placeholder="A short line about what this group does"
            className="input-field resize-none"
          />
        </div>
        <div>
          <label className="block text-gray-400 text-xs mb-1">Group Link (WhatsApp/Instagram, optional)</label>
          <input
            type="url"
            value={form.group_link}
            onChange={(e) => setForm((p) => ({ ...p, group_link: e.target.value }))}
            placeholder="https://chat.whatsapp.com/..."
            className="input-field"
          />
        </div>
        <div>
          <label className="block text-gray-400 text-xs mb-1">Photo (optional)</label>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            ref={fileInputRef}
            className="input-field"
          />
          <p className="text-gray-600 text-xs mt-1">JPG, PNG, or WEBP — up to 5MB.</p>
        </div>
        <div>
          <label className="block text-gray-400 text-xs mb-1">Display Order</label>
          <input
            type="number"
            value={form.display_order}
            onChange={(e) => setForm((p) => ({ ...p, display_order: e.target.value }))}
            className="input-field w-32"
          />
        </div>
        {error && <p className="text-red-400 text-sm">{error}</p>}
        {success && <p className="text-green-400 text-sm">{success}</p>}
        <button type="submit" disabled={saving} className="btn-primary">
          {saving ? 'Saving...' : 'Add Group'}
        </button>
      </form>

      {/* Groups list */}
      {loading ? (
        <p className="text-gray-500 text-sm">Loading...</p>
      ) : groups.length === 0 ? (
        <p className="text-gray-600 text-sm">No community groups yet.</p>
      ) : (
        <div className="space-y-3">
          {groups.map((group) => (
            <div key={group.id} className="border border-white/15 rounded-lg p-3">
              {editingId === group.id ? (
                <div className="space-y-3">
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))}
                    className="input-field"
                    placeholder="Group name"
                  />
                  <textarea
                    value={editForm.description}
                    onChange={(e) => setEditForm((p) => ({ ...p, description: e.target.value }))}
                    rows={2}
                    className="input-field resize-none"
                    placeholder="Description"
                  />
                  <input
                    type="url"
                    value={editForm.group_link}
                    onChange={(e) => setEditForm((p) => ({ ...p, group_link: e.target.value }))}
                    className="input-field"
                    placeholder="Group link"
                  />
                  <input
                    type="number"
                    value={editForm.display_order}
                    onChange={(e) => setEditForm((p) => ({ ...p, display_order: e.target.value }))}
                    className="input-field w-32"
                  />
                  <div className="flex gap-2">
                    <button onClick={() => saveEdit(group.id)} className="btn-primary text-sm py-2 px-4">Save</button>
                    <button onClick={() => setEditingId(null)} className="text-gray-500 hover:text-gray-300 text-sm px-2">Cancel</button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-4">
                  <img
                    src={group.image_url || '/firstruleclublogo.jpg'}
                    alt={group.name}
                    className="w-16 h-16 object-cover rounded-lg flex-shrink-0 bg-white/10"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-gray-300 text-sm truncate">{group.name}</p>
                    {group.description && <p className="text-gray-600 text-xs truncate">{group.description}</p>}
                    <p className="text-gray-600 text-xs">Order: {group.display_order}</p>
                  </div>
                  <button
                    onClick={() => startEdit(group)}
                    className="text-xs px-3 py-1.5 rounded-lg border border-white/15 text-gray-400 hover:border-gold/50 hover:text-gold transition-colors whitespace-nowrap"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(group)}
                    className={`text-xs px-3 py-1.5 rounded-lg border transition-colors whitespace-nowrap ${
                      deleteConfirm === group.id
                        ? 'bg-red-900/50 border-red-700 text-red-300'
                        : 'border-white/15 text-gray-400 hover:border-red-700 hover:text-red-400'
                    }`}
                  >
                    {deleteConfirm === group.id ? 'Confirm delete?' : 'Delete'}
                  </button>
                  {deleteConfirm === group.id && (
                    <button
                      onClick={() => setDeleteConfirm(null)}
                      className="text-xs text-gray-500 hover:text-gray-300"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
