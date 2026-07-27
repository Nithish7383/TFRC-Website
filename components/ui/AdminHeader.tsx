import Link from 'next/link'
import AdminSignOutButton from '@/components/AdminSignOutButton'

interface Props {
  subtitle: string
  email?: string
  links: { href: string; label: string }[]
}

export default function AdminHeader({ subtitle, email, links }: Props) {
  return (
    <header className="border-b border-white/10 bg-white/[0.02] px-4 py-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <img src="/firstruleclublogo.jpg" alt="TFRC" className="w-8 h-8 rounded-full object-cover" />
        <div>
          <h1 className="wordmark text-white text-sm">The First Rule Club</h1>
          <p className="text-gray-500 text-xs">{subtitle}</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        {links.map((link) => (
          <Link key={link.href} href={link.href} className="text-gray-400 hover:text-white text-xs transition-colors">
            {link.label}
          </Link>
        ))}
        {email && <span className="text-gray-500 text-xs hidden md:block">{email}</span>}
        <AdminSignOutButton />
      </div>
    </header>
  )
}
