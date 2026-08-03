'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { Member } from '@/lib/types'
import { DuplicateConfidence } from '@/components/MembersTable'

interface Props {
  member: Member
  candidates: Member[]
  confidence: DuplicateConfidence
  onClose: () => void
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

function matchReason(a: Member, b: Member): string {
  const reasons: string[] = []
  if (a.phone === b.phone) reasons.push('same phone')
  if (a.name.toLowerCase().trim() === b.name.toLowerCase().trim()) {
    if (a.place.toLowerCase().trim() === b.place.toLowerCase().trim()) reasons.push('same name + place')
    else if (Math.abs(a.age - b.age) <= 1) reasons.push('same name + close age')
  }
  return reasons.join(', ') || 'possible match'
}

export default function MergeMembersModal({ member, candidates, confidence, onClose }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const [merging, setMerging] = useState(false)
  const [error, setError] = useState('')
  const [otherId, setOtherId] = useState(candidates[0]?.id ?? '')

  const other = candidates.find((c) => c.id === otherId) ?? candidates[0]

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

    const { error: transferError } = await supabase
      .from('registrations')
      .update({ phone: keepMember.phone })
      .eq('phone', deleteMember.phone)
    if (transferError) {
      setError('Failed to transfer registrations. Nothing was deleted — please try again.')
      setMerging(false)
      return
    }

    const newCount = keepMember.attended_count + deleteMember.attended_count
    const updatePayload: Record<string, unknown> = { attended_count: newCount }

    if (!keepMember.instagram_handle && deleteMember.instagram_handle) updatePayload.instagram_handle = deleteMember.instagram_handle
    if (!keepMember.running_pace && deleteMember.running_pace) updatePayload.running_pace = deleteMember.running_pace
    if (!keepMember.weekly_training_days && deleteMember.weekly_training_days) updatePayload.weekly_training_days = deleteMember.weekly_training_days
    if (!keepMember.interests?.length && deleteMember.interests?.length) updatePayload.interests = deleteMember.interests
    if (!keepMember.height && deleteMember.height) updatePayload.height = deleteMember.height
    if (!keepMember.weight && deleteMember.weight) updatePayload.weight = deleteMember.weight
    if (!keepMember.birthday && deleteMember.birthday) updatePayload.birthday = deleteMember.birthday

    const { error: updateError } = await supabase.from('members').update(updatePayload).eq('id', keepMember.id)
    if (updateError) {
      setError('Registrations were transferred, but the kept record could not be updated. Please review manually before retrying.')
      setMerging(false)
      return
    }

    const { error: deleteError } = await supabase.from('members').delete().eq('id', deleteMember.id)
    if (deleteError) {
      setError('Records were merged, but the duplicate record could not be deleted. Please remove it manually.')
      setMerging(false)
      return
    }

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
        <p className="text-gray-400 text-xs">{m.age}y · {m.place}</p>
        <p className="text-gray-400 text-xs">Runs: {m.attended_count}</p>
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

        {candidates.length > 1 && (
          <div>
            <label className="block text-gray-400 text-xs uppercase tracking-wide mb-2">
              {candidates.length} possible matches found — compare against:
            </label>
            <select
              value={otherId}
              onChange={(e) => setOtherId(e.target.value)}
              className="input-field"
            >
              {candidates.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.member_id} — {c.name} ({matchReason(member, c)})
                </option>
              ))}
            </select>
          </div>
        )}

        <div className={`rounded-lg px-4 py-3 border ${
          confidence === 'phone'
            ? 'bg-red-900/20 border-red-800/40'
            : 'bg-yellow-900/20 border-yellow-800/40'
        }`}>
          <p className={`text-sm ${confidence === 'phone' ? 'text-red-300' : 'text-yellow-300'}`}>
            Match reason: <strong>{matchReason(member, other)}</strong>.
            {confidence === 'possible' && ' This is not a certain match — double-check before merging.'}
          </p>
          <p className="text-yellow-300/80 text-sm mt-1">
            The other record will be <strong>deleted permanently</strong>. All registrations will be transferred to the kept record.
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
