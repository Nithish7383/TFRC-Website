import { getInitials } from '@/lib/utils'

interface Props {
  name: string
  size?: 'sm' | 'md' | 'lg'
}

const SIZES = {
  sm: 'w-12 h-12 text-base',
  md: 'w-20 h-20 text-2xl',
  lg: 'w-24 h-24 text-3xl',
}

export default function Avatar({ name, size = 'md' }: Props) {
  return (
    <div className={`${SIZES[size]} rounded-full bg-gold flex items-center justify-center flex-shrink-0`}>
      <span className="text-black font-display font-bold">{getInitials(name)}</span>
    </div>
  )
}
