'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

export default function AdminSignOutButton() {
  const router = useRouter()
  const supabase = createClient()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/admin/login')
    router.refresh()
  }

  return (
    <button
      onClick={handleSignOut}
      className="text-xs text-gray-500 hover:text-red-400 transition-colors px-3 py-1.5 rounded border border-gray-800 hover:border-red-900/50"
    >
      Sign out
    </button>
  )
}
