import Link from 'next/link'

interface Props {
  children?: React.ReactNode
}

export default function SiteHeader({ children }: Props) {
  return (
    <nav className="border-b border-white/10 bg-black/80 px-4 py-3 sticky top-0 z-20 backdrop-blur-md">
      <div className="max-w-5xl mx-auto flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <img src="/firstruleclublogo.jpg" alt="TFRC" className="w-9 h-9 rounded-full object-cover" />
          <span className="font-display font-semibold tracking-wide text-white text-base hidden sm:block">
            The First Rule Club
          </span>
        </Link>
        <div className="flex items-center gap-3">
          {children ?? (
            <>
              <Link href="/gallery" className="text-gray-400 hover:text-white text-sm transition-colors">
                Gallery
              </Link>
              <Link
                href="/admin/login"
                className="text-xs text-gray-500 hover:text-gold border border-white/15 hover:border-gold/50 px-3 py-1.5 rounded-md transition-colors"
              >
                Admin
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
