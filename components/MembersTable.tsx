'use client'

import { useState, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import { Member } from '@/lib/types'
import MergeMembersModal from '@/components/MergeMembersModal'
import { resetMemberPassword } from '@/app/admin/members/actions'

interface Props {
  members: Member[]
}

const EXPERIENCE_COLORS: Record<string, string> = {
  'First timer': 'bg-blue-900/30 text-blue-400 border-blue-800/40',
  'Casual': 'bg-purple-900/30 text-purple-400 border-purple-800/40',
  'Regular': 'bg-gold/20 text-gold border-gold/30',
  'Competitive': 'bg-red-900/30 text-red-400 border-red-800/40',
}

export type DuplicateConfidence = 'phone' | 'possible'

// Same phone number is treated as certain — one person, re-registered.
// Same name is only a "possible" match: narrowed by requiring place and/or
// age to also line up, since common names alone produce false positives.
function isPossibleNameMatch(a: Member, b: Member): boolean {
  if (a.name.toLowerCase().trim() !== b.name.toLowerCase().trim()) return false
  const samePlace = a.place.toLowerCase().trim() === b.place.toLowerCase().trim()
  const closeAge = Math.abs(a.age - b.age) <= 1
  return samePlace || closeAge
}

/** Maps each member id to the set of ids it duplicate-matches, plus the strongest confidence found. */
function computeDuplicates(members: Member[]): Map<string, { matchIds: Set<string>; confidence: DuplicateConfidence }> {
  const result = new Map<string, { matchIds: Set<string>; confidence: DuplicateConfidence }>()

  const addMatch = (idA: string, idB: string, confidence: DuplicateConfidence) => {
    for (const [id, otherId] of [[idA, idB], [idB, idA]]) {
      const existing = result.get(id)
      if (existing) {
        existing.matchIds.add(otherId)
        if (confidence === 'phone') existing.confidence = 'phone'
      } else {
        result.set(id, { matchIds: new Set([otherId]), confidence })
      }
    }
  }

  const phoneMap: Record<string, string[]> = {}
  members.forEach((m) => {
    phoneMap[m.phone] = [...(phoneMap[m.phone] || []), m.id]
  })
  Object.values(phoneMap)
    .filter((ids) => ids.length > 1)
    .forEach((ids) => {
      for (let i = 0; i < ids.length; i++) {
        for (let j = i + 1; j < ids.length; j++) addMatch(ids[i], ids[j], 'phone')
      }
    })

  for (let i = 0; i < members.length; i++) {
    for (let j = i + 1; j < members.length; j++) {
      if (isPossibleNameMatch(members[i], members[j])) {
        addMatch(members[i].id, members[j].id, 'possible')
      }
    }
  }

  return result
}

export default function MembersTable({ members }: Props) {
  const searchParams = useSearchParams()
  const [search, setSearch] = useState(searchParams.get('q') || '')
  const [filterGender, setFilterGender] = useState<string>('All')
  const [filterExperience, setFilterExperience] = useState<string>('All')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [localMembers, setLocalMembers] = useState<Member[]>(members)
  const [mergeTarget, setMergeTarget] = useState<Member | null>(null)
  const [resetTarget, setResetTarget] = useState<string | null>(null)
  const [resetPassword, setResetPassword] = useState('')
  const [resetSaving, setResetSaving] = useState(false)
  const [resetError, setResetError] = useState('')
  const [resetSuccessId, setResetSuccessId] = useState<string | null>(null)

  const submitReset = async (memberId: string) => {
    setResetSaving(true)
    setResetError('')
    const result = await resetMemberPassword(memberId, resetPassword)
    setResetSaving(false)
    if (!result.ok) {
      setResetError(result.error)
      return
    }
    setResetTarget(null)
    setResetPassword('')
    setResetSuccessId(memberId)
    setTimeout(() => setResetSuccessId(null), 4000)
  }

  const duplicates = useMemo(() => computeDuplicates(localMembers), [localMembers])

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return localMembers.filter((m) => {
      const matchSearch = !q || m.name.toLowerCase().includes(q) || m.phone.includes(q) || m.member_id?.toLowerCase().includes(q)
      const matchGender = filterGender === 'All' || m.gender === filterGender
      const matchExp = filterExperience === 'All' || m.running_experience === filterExperience
      return matchSearch && matchGender && matchExp
    })
  }, [localMembers, search, filterGender, filterExperience])

  const exportCSV = () => {
    const header = 'name,member_id,phone,age,gender,place,occupation,running_experience,goals,attended_count,joined_date'
    const rows = filtered.map((m) =>
      [
        `"${m.name}"`,
        m.member_id,
        m.phone,
        m.age,
        m.gender,
        `"${m.place}"`,
        `"${m.occupation}"`,
        `"${m.running_experience}"`,
        `"${(m.goals || []).join('; ')}"`,
        m.attended_count,
        m.created_at,
      ].join(',')
    )
    const csv = [header, ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'tfrc-members.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-4">
      {mergeTarget && (
        <MergeMembersModal
          member={mergeTarget}
          candidates={localMembers.filter((m) => duplicates.get(mergeTarget.id)?.matchIds.has(m.id))}
          confidence={duplicates.get(mergeTarget.id)?.confidence ?? 'possible'}
          onClose={() => setMergeTarget(null)}
        />
      )}

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, phone, or member ID..."
          className="input-field w-full sm:w-72"
        />
        <select value={filterGender} onChange={(e) => setFilterGender(e.target.value)} className="input-field sm:w-auto">
          <option value="All">All Genders</option>
          <option value="Male">Male</option>
          <option value="Female">Female</option>
        </select>
        <select value={filterExperience} onChange={(e) => setFilterExperience(e.target.value)} className="input-field sm:w-auto">
          <option value="All">All Experience</option>
          <option value="First timer">First timer</option>
          <option value="Casual">Casual</option>
          <option value="Regular">Regular</option>
          <option value="Competitive">Competitive</option>
        </select>
        <button onClick={exportCSV} className="btn-secondary text-sm py-2 ml-auto">
          Export CSV
        </button>
      </div>

      <p className="text-gray-500 text-sm">{filtered.length} member{filtered.length !== 1 ? 's' : ''}</p>

      <div className="overflow-x-auto rounded-xl border border-white/10">
        <table className="w-full min-w-[900px] text-sm">
          <thead>
            <tr className="bg-white/[0.03] border-b border-white/10">
              {['Member ID', 'Name', 'Phone', 'Age / Gender / Place', 'Experience', 'Runs', 'Joined', 'Actions'].map((h) => (
                <th key={h} className="text-left text-gray-400 font-medium px-4 py-3 whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {filtered.map((member) => {
              const dup = duplicates.get(member.id)
              const isDuplicate = !!dup
              return (
                <>
                  <tr key={member.id} className={`hover:bg-white/5 transition-colors ${isDuplicate ? 'bg-yellow-900/10' : ''}`}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-gold font-bold text-xs tracking-wider bg-gold/10 border border-gold/30 px-2 py-1 rounded-lg">
                          {member.member_id}
                        </span>
                        {dup && (
                          <span
                            title={dup.confidence === 'phone' ? 'Same phone number as another member' : 'Same name, and place or age also matches'}
                            className={`text-xs px-1.5 py-0.5 rounded border ${
                              dup.confidence === 'phone'
                                ? 'bg-red-900/40 text-red-400 border-red-700/40'
                                : 'bg-yellow-900/40 text-yellow-400 border-yellow-700/40'
                            }`}
                          >
                            {dup.confidence === 'phone' ? 'DUP · same phone' : 'DUP · possible'}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setExpandedId(expandedId === member.id ? null : member.id)}
                        className="text-white font-medium hover:text-gold transition-colors text-left"
                      >
                        {member.name}
                        <span className="text-gray-600 ml-1 text-xs">{expandedId === member.id ? '▲' : '▼'}</span>
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <a
                        href={`https://wa.me/91${member.phone}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gold hover:underline"
                      >
                        {member.phone}
                      </a>
                    </td>
                    <td className="px-4 py-3 text-gray-300 text-xs">
                      {member.age}y · {member.gender} · {member.place}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${EXPERIENCE_COLORS[member.running_experience] || 'bg-white/10 text-gray-400 border-white/15'}`}>
                        {member.running_experience}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-300 text-center">{member.attended_count}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                      {new Date(member.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        {isDuplicate && (
                          <button
                            onClick={() => setMergeTarget(member)}
                            className="text-xs px-3 py-1.5 rounded-lg border border-yellow-700/40 text-yellow-400 hover:bg-yellow-900/20 transition-colors whitespace-nowrap"
                          >
                            Merge
                          </button>
                        )}
                        {resetSuccessId === member.member_id ? (
                          <span className="text-xs text-green-400 whitespace-nowrap">✓ Password reset</span>
                        ) : (
                          <button
                            onClick={() => { setResetTarget(member.member_id); setResetError(''); setResetPassword('') }}
                            className="text-xs px-3 py-1.5 rounded-lg border border-white/15 text-gray-400 hover:border-gold/40 hover:text-gold transition-colors whitespace-nowrap"
                          >
                            Reset Password
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                  {resetTarget === member.member_id && (
                    <tr className="bg-gold/[0.03] border-b border-white/10">
                      <td colSpan={8} className="px-6 py-4">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                          <p className="text-gray-300 text-sm whitespace-nowrap">
                            New password for <span className="text-gold font-mono">{member.member_id}</span>:
                          </p>
                          <input
                            type="text"
                            value={resetPassword}
                            onChange={(e) => setResetPassword(e.target.value)}
                            placeholder="At least 8 characters"
                            className="input-field text-sm py-1.5 w-full sm:w-56"
                          />
                          <button
                            onClick={() => submitReset(member.member_id)}
                            disabled={resetSaving}
                            className="btn-primary text-xs py-1.5 px-3 whitespace-nowrap"
                          >
                            {resetSaving ? 'Saving...' : 'Set Password'}
                          </button>
                          <button
                            onClick={() => setResetTarget(null)}
                            className="text-xs text-gray-500 hover:text-gray-300 whitespace-nowrap"
                          >
                            Cancel
                          </button>
                        </div>
                        {resetError && <p className="text-red-400 text-xs mt-2">{resetError}</p>}
                      </td>
                    </tr>
                  )}
                  {expandedId === member.id && (
                    <tr key={`${member.id}-exp`} className="bg-white/[0.04] border-b border-white/10">
                      <td colSpan={8} className="px-6 py-4">
                        <div className="grid md:grid-cols-3 gap-4 text-sm">
                          <div>
                            <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">Goals</p>
                            {member.goals && member.goals.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {member.goals.map((g) => (
                                  <span key={g} className="text-xs bg-white/10 text-gray-300 border border-white/15 px-2 py-0.5 rounded-full">{g}</span>
                                ))}
                              </div>
                            ) : <p className="text-gray-600">None</p>}
                          </div>
                          <div>
                            <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">Emergency Contact</p>
                            {member.emergency_contact_name || member.emergency_contact_phone ? (
                              <p className="text-gray-300">{member.emergency_contact_name}{member.emergency_contact_name && member.emergency_contact_phone ? ' · ' : ''}{member.emergency_contact_phone}</p>
                            ) : <p className="text-gray-600">Not provided</p>}
                          </div>
                          <div>
                            <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">Medical / Blood Group</p>
                            <p className="text-gray-300">{[member.medical_conditions, member.blood_group].filter(Boolean).join(' · ') || '—'}</p>
                          </div>
                          <div>
                            <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">Instagram</p>
                            <p className="text-gray-300">{member.instagram_handle || '—'}</p>
                          </div>
                          <div>
                            <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">Running Pace</p>
                            <p className="text-gray-300">{member.running_pace || '—'}</p>
                          </div>
                          <div>
                            <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">Training Days / Week</p>
                            <p className="text-gray-300">{member.weekly_training_days ?? '—'}</p>
                          </div>
                          <div>
                            <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">Occupation</p>
                            <p className="text-gray-300">{member.occupation}</p>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
