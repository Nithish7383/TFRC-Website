'use client'

import { useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase'
import { Registration, RegistrationStatus } from '@/lib/types'
import { useRouter } from 'next/navigation'

interface Props {
  registrations: Registration[]
  eventId: string
  eventTitle?: string
  maxParticipants?: number
}

const EXPERIENCE_COLORS: Record<string, string> = {
  'First timer': 'bg-blue-900/30 text-blue-400 border-blue-800/40',
  'Casual (1–2 runs/month)': 'bg-purple-900/30 text-purple-400 border-purple-800/40',
  'Regular (weekly)': 'bg-gold/20 text-gold border-gold/30',
  'Competitive': 'bg-red-900/30 text-red-400 border-red-800/40',
}

export default function RegistrationTable({ registrations, eventId, eventTitle = 'registrations', maxParticipants = 30 }: Props) {
  const supabase = createClient()
  const router = useRouter()

  const [search, setSearch] = useState('')
  const [updating, setUpdating] = useState<string | null>(null)
  const [checked, setChecked] = useState<Set<string>>(new Set())
  const [bulkUpdating, setBulkUpdating] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null)
  const [noteValues, setNoteValues] = useState<Record<string, string>>({})
  const [savingNote, setSavingNote] = useState<string | null>(null)
  const [autoSelectOpen, setAutoSelectOpen] = useState(false)
  const [autoSelectMode, setAutoSelectMode] = useState<'first' | 'gender' | 'experience'>('first')
  const [autoSelecting, setAutoSelecting] = useState(false)
  const [localRegs, setLocalRegs] = useState<Registration[]>(registrations)

  // Keep local state in sync with server props on refresh
  useMemo(() => { setLocalRegs(registrations) }, [registrations])

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    if (!q) return localRegs
    return localRegs.filter(
      (r) => r.name.toLowerCase().includes(q) || r.phone.includes(q)
    )
  }, [search, localRegs])

  const allChecked = filtered.length > 0 && filtered.every((r) => checked.has(r.id))

  const toggleAll = () => {
    if (allChecked) {
      setChecked((prev) => { const n = new Set(prev); filtered.forEach((r) => n.delete(r.id)); return n })
    } else {
      setChecked((prev) => { const n = new Set(prev); filtered.forEach((r) => n.add(r.id)); return n })
    }
  }

  const toggleOne = (id: string) => {
    setChecked((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })
  }

  const updateStatus = async (id: string, status: RegistrationStatus) => {
    setUpdating(id)
    await supabase.from('registrations').update({ status }).eq('id', id)
    setLocalRegs((prev) => prev.map((r) => r.id === id ? { ...r, status } : r))
    setUpdating(null)
  }

  const bulkUpdateStatus = async (status: RegistrationStatus) => {
    setBulkUpdating(true)
    const ids = Array.from(checked)
    await supabase.from('registrations').update({ status }).in('id', ids)
    setLocalRegs((prev) => prev.map((r) => checked.has(r.id) ? { ...r, status } : r))
    setChecked(new Set())
    setBulkUpdating(false)
  }

  const toggleAttended = async (id: string, current: boolean) => {
    await supabase.from('registrations').update({ attended: !current }).eq('id', id)
    setLocalRegs((prev) => prev.map((r) => r.id === id ? { ...r, attended: !current } : r))

    const reg = localRegs.find((r) => r.id === id)
    if (!reg) return

    const { data: existingMember } = await supabase
      .from('members')
      .select('id, attended_count')
      .eq('phone', reg.phone)
      .maybeSingle()

    if (!current) {
      // toggling to TRUE — increment or create member
      if (existingMember) {
        await supabase
          .from('members')
          .update({ attended_count: existingMember.attended_count + 1 })
          .eq('id', existingMember.id)
      } else {
        await supabase.from('members').insert({
          name: reg.name,
          phone: reg.phone,
          age: reg.age,
          gender: reg.gender,
          place: reg.place,
          occupation: reg.occupation,
          running_experience: reg.running_experience || 'First timer',
          goals: [],
          attended_count: 1,
          level: 1,
        })
      }
    } else {
      // toggling to FALSE — decrement
      if (existingMember && existingMember.attended_count > 0) {
        await supabase
          .from('members')
          .update({ attended_count: existingMember.attended_count - 1 })
          .eq('id', existingMember.id)
      }
    }
  }

  const saveNote = async (id: string) => {
    setSavingNote(id)
    const note = noteValues[id] ?? ''
    await supabase.from('registrations').update({ admin_notes: note || null }).eq('id', id)
    setLocalRegs((prev) => prev.map((r) => r.id === id ? { ...r, admin_notes: note || null } : r))
    setSavingNote(null)
    setEditingNoteId(null)
  }

  const handleAutoSelect = async () => {
    setAutoSelecting(true)
    const pending = localRegs.filter((r) => r.status !== 'selected')
    let toSelect: Registration[] = []

    if (autoSelectMode === 'first') {
      toSelect = [...pending]
        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
        .slice(0, maxParticipants)
    } else if (autoSelectMode === 'gender') {
      const males = pending.filter((r) => r.gender === 'Male').sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
      const females = pending.filter((r) => r.gender === 'Female').sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
      const half = Math.floor(maxParticipants / 2)
      toSelect = [...males.slice(0, half), ...females.slice(0, half)].slice(0, maxParticipants)
    } else {
      const groups: Record<string, Registration[]> = {}
      pending.forEach((r) => {
        const key = r.running_experience || 'Unknown'
        if (!groups[key]) groups[key] = []
        groups[key].push(r)
      })
      const keys = Object.keys(groups)
      const perGroup = Math.ceil(maxParticipants / Math.max(keys.length, 1))
      keys.forEach((k) => { toSelect.push(...groups[k].slice(0, perGroup)) })
      toSelect = toSelect.slice(0, maxParticipants)
    }

    const ids = toSelect.map((r) => r.id)
    if (ids.length) {
      await supabase.from('registrations').update({ status: 'selected' }).in('id', ids)
      setLocalRegs((prev) => prev.map((r) => ids.includes(r.id) ? { ...r, status: 'selected' } : r))
    }
    setAutoSelecting(false)
    setAutoSelectOpen(false)
  }

  const exportCSV = () => {
    const cols = ['name', 'age', 'gender', 'place', 'phone', 'occupation', 'running_experience', 'status', 'attended', 'registered_at']
    const header = cols.join(',')
    const rows = filtered.map((r) =>
      [
        `"${r.name}"`,
        r.age,
        r.gender,
        `"${r.place}"`,
        r.phone,
        `"${r.occupation}"`,
        `"${r.running_experience || ''}"`,
        r.status,
        r.attended ? 'true' : 'false',
        r.created_at,
      ].join(',')
    )
    const csv = [header, ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${eventTitle.replace(/\s+/g, '-').toLowerCase()}-registrations.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (localRegs.length === 0) {
    return (
      <div className="card text-center py-12 text-gray-500">
        No registrations found.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or phone..."
          className="input-field w-full sm:w-64"
        />
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setAutoSelectOpen(!autoSelectOpen)}
            className="btn-secondary text-sm py-2"
          >
            Auto-select runners
          </button>
          <button onClick={exportCSV} className="btn-secondary text-sm py-2">
            Export CSV
          </button>
        </div>
      </div>

      {/* Auto-select panel */}
      {autoSelectOpen && (
        <div className="card border-gold/30 bg-gold/5 space-y-3">
          <p className="text-white font-medium text-sm">Auto-select up to {maxParticipants} runners</p>
          <div className="flex flex-wrap gap-2">
            {([
              { key: 'first', label: 'First registered' },
              { key: 'gender', label: 'Gender balanced' },
              { key: 'experience', label: 'Experience mix' },
            ] as const).map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setAutoSelectMode(key)}
                className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${
                  autoSelectMode === key
                    ? 'bg-gold text-black border-gold'
                    : 'border-white/15 text-gray-400 hover:border-white/30'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleAutoSelect}
              disabled={autoSelecting}
              className="btn-primary text-sm py-2"
            >
              {autoSelecting ? 'Selecting...' : 'Confirm auto-select'}
            </button>
            <button
              onClick={() => setAutoSelectOpen(false)}
              className="btn-secondary text-sm py-2"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Bulk action bar */}
      {checked.size > 0 && (
        <div className="flex flex-wrap items-center gap-3 bg-white/[0.03] border border-white/15 rounded-xl px-4 py-3">
          <span className="text-gray-400 text-sm">{checked.size} selected</span>
          <span className="text-gray-700 hidden sm:block">|</span>
          <span className="text-gray-400 text-sm">Mark as:</span>
          {(['selected', 'rejected', 'pending'] as RegistrationStatus[]).map((s) => (
            <button
              key={s}
              onClick={() => bulkUpdateStatus(s)}
              disabled={bulkUpdating}
              className={`text-xs px-3 py-1.5 rounded-lg border capitalize transition-colors ${
                s === 'selected' ? 'border-green-800/50 text-green-400 hover:bg-green-900/20' :
                s === 'rejected' ? 'border-red-800/50 text-red-400 hover:bg-red-900/20' :
                'border-white/15 text-gray-400 hover:bg-white/10'
              }`}
            >
              {bulkUpdating ? '...' : s}
            </button>
          ))}
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-white/10">
        <table className="w-full min-w-[800px] text-sm">
          <thead>
            <tr className="bg-white/[0.03] border-b border-white/10">
              <th className="px-3 py-3">
                <input
                  type="checkbox"
                  checked={allChecked}
                  onChange={toggleAll}
                  className="accent-gold"
                />
              </th>
              {['Name', 'Age', 'Gender', 'Place', 'Phone', 'Experience', 'Status', 'Attended', 'Notes', 'Actions'].map((h) => (
                <th key={h} className="text-left text-gray-400 font-medium px-4 py-3 whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {filtered.map((reg) => (
              <>
                <tr
                  key={reg.id}
                  className={`transition-colors hover:bg-white/5 ${
                    reg.status === 'selected' ? 'bg-green-900/10' :
                    reg.status === 'rejected' ? 'bg-red-900/10' : ''
                  }`}
                >
                  <td className="px-3 py-3">
                    <input
                      type="checkbox"
                      checked={checked.has(reg.id)}
                      onChange={() => toggleOne(reg.id)}
                      className="accent-gold"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => setExpandedId(expandedId === reg.id ? null : reg.id)}
                      className="text-white font-medium hover:text-gold transition-colors text-left whitespace-nowrap"
                    >
                      {reg.name}
                      <span className="text-gray-600 ml-1 text-xs">{expandedId === reg.id ? '▲' : '▼'}</span>
                    </button>
                  </td>
                  <td className="px-4 py-3 text-gray-300">{reg.age}</td>
                  <td className="px-4 py-3 text-gray-300">{reg.gender}</td>
                  <td className="px-4 py-3 text-gray-300 max-w-[120px] truncate">{reg.place}</td>
                  <td className="px-4 py-3 text-gray-300 whitespace-nowrap">
                    <a
                      href={`https://wa.me/91${reg.phone}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gold hover:underline"
                    >
                      {reg.phone}
                    </a>
                  </td>
                  <td className="px-4 py-3">
                    {reg.running_experience ? (
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${EXPERIENCE_COLORS[reg.running_experience] || 'bg-white/10 text-gray-400 border-white/15'}`}>
                        {reg.running_experience}
                      </span>
                    ) : <span className="text-gray-600 text-xs">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={reg.status} />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={!!reg.attended}
                      onChange={() => toggleAttended(reg.id, !!reg.attended)}
                      className="accent-green-500"
                      title="Mark attended"
                    />
                  </td>
                  <td className="px-4 py-3 max-w-[140px]">
                    {editingNoteId === reg.id ? (
                      <div className="flex flex-col gap-1">
                        <textarea
                          value={noteValues[reg.id] ?? reg.admin_notes ?? ''}
                          onChange={(e) => setNoteValues((p) => ({ ...p, [reg.id]: e.target.value }))}
                          rows={2}
                          className="input-field text-xs resize-none w-32"
                          autoFocus
                        />
                        <div className="flex gap-1">
                          <button onClick={() => saveNote(reg.id)} disabled={savingNote === reg.id} className="text-xs text-green-400 hover:text-green-300">
                            {savingNote === reg.id ? '...' : 'Save'}
                          </button>
                          <button onClick={() => setEditingNoteId(null)} className="text-xs text-gray-500 hover:text-gray-300">Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setEditingNoteId(reg.id)
                          setNoteValues((p) => ({ ...p, [reg.id]: reg.admin_notes ?? '' }))
                        }}
                        className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-300 transition-colors text-left"
                      >
                        <span className="truncate max-w-[100px]">{reg.admin_notes || 'Add note'}</span>
                        <span className="text-gray-600">✏️</span>
                      </button>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1.5">
                      {reg.status !== 'selected' && (
                        <button onClick={() => updateStatus(reg.id, 'selected')} disabled={updating === reg.id} className="btn-success text-xs py-1 px-2">
                          {updating === reg.id ? '...' : 'Select'}
                        </button>
                      )}
                      {reg.status !== 'rejected' && (
                        <button onClick={() => updateStatus(reg.id, 'rejected')} disabled={updating === reg.id} className="btn-danger text-xs py-1 px-2">
                          {updating === reg.id ? '...' : 'Reject'}
                        </button>
                      )}
                      {reg.status !== 'pending' && (
                        <button onClick={() => updateStatus(reg.id, 'pending')} disabled={updating === reg.id} className="btn-secondary text-xs py-1 px-2">
                          Reset
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
                {expandedId === reg.id && (
                  <tr key={`${reg.id}-exp`} className="bg-white/[0.04] border-b border-white/10">
                    <td colSpan={11} className="px-6 py-4">
                      <div className="grid md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">Reason for joining</p>
                          <p className="text-gray-300">{reg.reason || '—'}</p>
                        </div>
                        <div>
                          <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">Emergency Contact</p>
                          {reg.emergency_contact_name || reg.emergency_contact_phone ? (
                            <p className="text-gray-300">
                              {reg.emergency_contact_name}{reg.emergency_contact_name && reg.emergency_contact_phone ? ' · ' : ''}{reg.emergency_contact_phone}
                            </p>
                          ) : (
                            <p className="text-gray-600">Not provided</p>
                          )}
                        </div>
                        <div>
                          <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">Occupation</p>
                          <p className="text-gray-300">{reg.occupation}</p>
                        </div>
                        <div>
                          <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">Registered at</p>
                          <p className="text-gray-300">{new Date(reg.created_at).toLocaleString('en-IN')}</p>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: RegistrationStatus }) {
  const styles: Record<RegistrationStatus, string> = {
    pending: 'bg-yellow-900/30 text-yellow-400 border-yellow-800/40',
    selected: 'bg-green-900/30 text-green-400 border-green-800/40',
    rejected: 'bg-red-900/30 text-red-400 border-red-800/40',
  }
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full border capitalize ${styles[status]}`}>
      {status}
    </span>
  )
}
