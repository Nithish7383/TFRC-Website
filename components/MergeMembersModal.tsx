'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { Member } from '@/lib/types'

interface Props {
  member: Member
  allMembers: Member[]
  onClose: () => void
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function MergeMembersModal({ member, allMembers, onClose }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const [merging, setMerging] = useState(false)
  const [error, setError] = useState('')

  // Find the other duplicate: same phone or same normalized name
  const normalizedName = member.name.toLowerCase().trim()
  const other = allMembers.find(
    (m) =>
      m.id !== member.id &&
      (m.phone === member.phone || m.name.toLowerCase().trim() === normalizedName)
  )

  if (!other) {
    return (
      <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center px-4">
        <div className="card max-w-md w-full space-y-4">
          <p className="text-gray-400">Could not find a duplicate record to merge.</p>
          <button onClick={onClose} className="btn-secondary">Close</button>
        </div>
      </div>
    )
  }

  const handleKeep = async (keepMember: Member, deleteMember: Member) => {
    setMerging(true)
    setError('')

    // Transfer registrations by phone
    await supabase
      .from('registrations')
      .update({ phone: keepMember.phone })
      .eq('phone', deleteMember.phone)

    // Merge attended counts
    const newCount = keepMember.attended_count + deleteMember.attended_count
    const updatePayload: Record<string, unknown> = { attended_count: newCount }

    // Copy Level 2 fields if needed
    if (deleteMember.level === 2 && keepMember.level === 1) {
      updatePayload.level = 2
      if (deleteMember.instagram_handle) updatePayload.instagram_handle = deleteMember.instagram_handle
      if (deleteMember.running_pace) updatePayload.running_pace = deleteMember.running_pace
      if (deleteMember.weekly_training_days) updatePayload.weekly_training_days = deleteMember.weekly_training_days
      if (deleteMember.interests?.length) updatePayload.interests = deleteMember.interests
      if (deleteMember.height) updatePayload.height = deleteMember.height
      if (deleteMember.weight) updatePayload.weight = deleteMember.weight
      if (deleteMember.birthday) updatePayload.birthday = deleteMember.birthday
    }

    await supabase.from('members').update(updatePayload).eq('id', keepMember.id)
    await supabase.from('members').delete().eq('id', deleteMember.id)

    setMerging(false)
    onClose()
    router.refresh()
  }

  const MemberCol = ({ m, isKeep }: { m: Member; isKeep: boolean }) => (
    <div className={`flex-1 border rounded-xl p-4 space-y-3 ${isKeep ? 'border-gold/40 bg-gold/5' : 'border-white/15 bg-white/5'}`}>
      <div className="space-y-1">
        <p className="text-gold font-bold text-sm tracking-wider">{m.member_id}</p>
        <p className="text-white font-medium">{m.name}</p>
        <p className="text-gray-400 text-xs">{m.phone}</p>
        <p className="text-gray-400 text-xs">{m.place}</p>
        <p className="text-gray-400 text-xs">Runs: {m.attended_count}</p>
        <p className="text-gray-400 text-xs">Level {m.level}</p>
        <p className="text-gray-500 text-xs">Joined {formatDate(m.created_at)}</p>
      </div>
      <button
        onClick={() => handleKeep(m, m.id === member.id ? other : member)}
        disabled={merging}
        className="btn-primary w-full text-sm py-2"
      >
        {merging ? 'Merging...' : 'Keep this record'}
      </button>
    </div>
  )

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center px-4 py-8 overflow-y-auto">
      <div className="card max-w-2xl w-full space-y-6">
        <div className="flex items-start justify-between gap-3">
          <h2 className="text-white font-bold text-lg">Merge Duplicate Members</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-300 text-xl leading-none">✕</button>
        </div>

        <div className="bg-yellow-900/20 border border-yellow-800/40 rounded-lg px-4 py-3">
          <p className="text-yellow-300 text-sm">
            The other record will be <strong>deleted permanently</strong>.
            All registrations will be transferred to the kept record.
          </p>
        </div>

        <div className="flex gap-4 flex-col sm:flex-row">
          <MemberCol m={member} isKeep={false} />
          <MemberCol m={other} isKeep={false} />
        </div>

        {error && (
          <div className="bg-red-900/20 border border-red-800/50 rounded-lg px-4 py-3 text-red-400 text-sm">
            {error}
          </div>
        )}

        <button onClick={onClose} className="btn-secondary w-full">
          Cancel
        </button>
      </div>
    </div>
  )
}
