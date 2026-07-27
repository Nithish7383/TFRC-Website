import { RegistrationStatus } from '@/lib/types'

const CONFIG: Record<RegistrationStatus, { label: string; className: string }> = {
  pending: {
    label: '⏳ Pending',
    className: 'bg-white/5 text-gray-400 border-white/15',
  },
  selected: {
    label: '✓ Selected',
    className: 'bg-green-900/30 text-green-400 border-green-800/40',
  },
  rejected: {
    label: '✗ Not selected',
    className: 'bg-red-900/30 text-red-400 border-red-800/40',
  },
}

export default function StatusBadge({ status }: { status: RegistrationStatus }) {
  const cfg = CONFIG[status]
  return (
    <span className={`text-xs px-3 py-1.5 rounded-full border font-medium whitespace-nowrap ${cfg.className}`}>
      {cfg.label}
    </span>
  )
}
