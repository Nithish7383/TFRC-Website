'use client'

import { Member } from '@/lib/types'
import Avatar from '@/components/ui/Avatar'

interface Props {
  member: Member
}

function formatMemberSince(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
}

export default function MemberProfileCard({ member }: Props) {
  return (
    <div className="card border-l-2 border-l-gold space-y-5">
      {/* Avatar + ID */}
      <div className="flex items-center gap-5">
        <Avatar name={member.name} size="md" />
        <div>
          <div className="stat-number text-gold text-2xl tracking-widest">
            {member.member_id}
          </div>
          <h2 className="text-white font-semibold text-lg">{member.name}</h2>
          <p className="text-gray-500 text-sm">Member since {formatMemberSince(member.created_at)}</p>
        </div>
      </div>

      {/* Badges row */}
      <div className="flex flex-wrap gap-2 items-center">
        <span className="text-xs bg-white/5 border border-white/10 text-gray-300 px-3 py-1 rounded-full">
          📍 {member.place}
        </span>
        <span className="text-xs bg-white/5 border border-white/10 text-gray-300 px-3 py-1 rounded-full">
          {member.running_experience}
        </span>
        {member.level === 2 && (
          <span className="text-xs bg-gold/20 border border-gold/40 text-gold px-3 py-1 rounded-full font-semibold">
            Level 2
          </span>
        )}
      </div>

      {/* Goals */}
      {member.goals && member.goals.length > 0 && (
        <div>
          <p className="text-gray-500 text-xs uppercase tracking-wide mb-2 font-mono">Goals</p>
          <div className="flex flex-wrap gap-2">
            {member.goals.map((g) => (
              <span
                key={g}
                className="text-xs bg-white/5 border border-white/10 text-gray-300 px-2.5 py-1 rounded-full"
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
