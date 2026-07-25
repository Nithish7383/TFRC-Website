'use client'

import { Member } from '@/lib/types'

interface Props {
  member: Member
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0][0]?.toUpperCase() ?? '?'
  return ((parts[0][0] ?? '') + (parts[parts.length - 1][0] ?? '')).toUpperCase()
}

function formatMemberSince(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
}

export default function MemberProfileCard({ member }: Props) {
  const initials = getInitials(member.name)

  return (
    <div className="card border-l-4 border-l-[#C9A227] space-y-5">
      {/* Avatar + ID */}
      <div className="flex items-center gap-5">
        <div className="w-20 h-20 rounded-full bg-[#C9A227] flex items-center justify-center flex-shrink-0">
          <span className="text-black font-bold text-2xl">{initials}</span>
        </div>
        <div>
          <div className="text-[#C9A227] font-bold text-2xl tracking-widest">
            {member.member_id}
          </div>
          <h2 className="text-white font-semibold text-lg">{member.name}</h2>
          <p className="text-gray-500 text-sm">Member since {formatMemberSince(member.created_at)}</p>
        </div>
      </div>

      {/* Badges row */}
      <div className="flex flex-wrap gap-2 items-center">
        <span className="text-xs bg-gray-800 border border-gray-700 text-gray-300 px-3 py-1 rounded-full">
          📍 {member.place}
        </span>
        <span className="text-xs bg-gray-800 border border-gray-700 text-gray-300 px-3 py-1 rounded-full">
          {member.running_experience}
        </span>
        {member.level === 2 && (
          <span className="text-xs bg-[#C9A227]/20 border border-[#C9A227]/40 text-[#C9A227] px-3 py-1 rounded-full font-semibold">
            Level 2
          </span>
        )}
      </div>

      {/* Runs attended */}
      <div className="flex items-center gap-2 text-sm">
        <span className="text-gray-400">🏃</span>
        <span className="text-gray-300">
          Runs attended:{' '}
          <span className="text-white font-semibold">{member.attended_count}</span>
        </span>
      </div>

      {/* Goals */}
      {member.goals && member.goals.length > 0 && (
        <div>
          <p className="text-gray-500 text-xs uppercase tracking-wide mb-2">Goals</p>
          <div className="flex flex-wrap gap-2">
            {member.goals.map((g) => (
              <span
                key={g}
                className="text-xs bg-gray-800 border border-gray-700 text-gray-300 px-2.5 py-1 rounded-full"
              >
                {g}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
