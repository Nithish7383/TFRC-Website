interface Props {
  name: string
  perks: string[]
  unlocked: boolean
  unlockHint?: string
}

export default function TierCard({ name, perks, unlocked, unlockHint = 'Attend a run to reveal this tier' }: Props) {
  return (
    <div className="relative card overflow-hidden">
      <div className={unlocked ? '' : 'blur-sm select-none pointer-events-none'} aria-hidden={!unlocked}>
        <p className="eyebrow mb-2">{unlocked ? 'Unlocked' : 'Tier'}</p>
        <h3 className="heading-display text-white text-xl mb-4">{name}</h3>
        <ul className="space-y-2">
          {perks.map((perk) => (
            <li key={perk} className="text-gray-300 text-sm flex items-start gap-2">
              <span className="text-gold mt-0.5">✓</span>
              {perk}
            </li>
          ))}
        </ul>
      </div>

      {!unlocked && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 bg-black/40">
          <svg className="w-6 h-6 text-gold mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <p className="text-white font-semibold text-sm mb-1">{name}</p>
          <p className="text-gray-400 text-xs">{unlockHint}</p>
        </div>
      )}
    </div>
  )
}
