'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

interface MemberResult {
  type: 'member'
  id: string
  member_id: string
  name: string
  phone: string
}

interface EventResult {
  type: 'event'
  id: string
  title: string
  date: string
}

type Result = MemberResult | EventResult

export default function AdminQuickSearch() {
  const router = useRouter()
  const supabase = createClient()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Result[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const search = useCallback(async (q: string) => {
    if (q.trim().length < 2) {
      setResults([])
      setLoading(false)
      return
    }

    const [{ data: members }, { data: events }] = await Promise.all([
      supabase
        .from('members')
        .select('id, member_id, name, phone')
        .or(`name.ilike.%${q}%,phone.ilike.%${q}%,member_id.ilike.%${q}%`)
        .limit(5),
      supabase
        .from('events')
        .select('id, title, date')
        .ilike('title', `%${q}%`)
        .order('date', { ascending: false })
        .limit(5),
    ])

    setResults([
      ...((members || []).map((m) => ({ type: 'member' as const, ...m }))),
      ...((events || []).map((e) => ({ type: 'event' as const, ...e }))),
    ])
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([])
      setLoading(false)
      return
    }
    setLoading(true)
    const id = setTimeout(() => search(query), 250)
    return () => clearTimeout(id)
  }, [query, search])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const goTo = (result: Result) => {
    setOpen(false)
    setQuery('')
    if (result.type === 'member') {
      router.push(`/admin/members?q=${encodeURIComponent(result.member_id)}`)
    } else {
      router.push(`/admin/event/${result.id}`)
    }
  }

  return (
    <div ref={containerRef} className="relative w-full max-w-sm">
      <input
        type="text"
        value={query}
        onChange={(e) => { setQuery(e.target.value); setOpen(true) }}
        onFocus={() => setOpen(true)}
        placeholder="Search members or events..."
        className="input-field text-sm py-2"
      />

      {open && query.trim().length >= 2 && (
        <div className="absolute z-30 mt-2 w-full bg-black border border-white/15 rounded-xl shadow-xl overflow-hidden max-h-80 overflow-y-auto">
          {loading ? (
            <p className="text-gray-500 text-sm px-4 py-3">Searching...</p>
          ) : results.length === 0 ? (
            <p className="text-gray-500 text-sm px-4 py-3">No matches for &ldquo;{query}&rdquo;</p>
          ) : (
            <div className="divide-y divide-white/10">
              {results.map((r) => (
                <button
                  key={`${r.type}-${r.id}`}
                  onClick={() => goTo(r)}
                  className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left hover:bg-white/5 transition-colors"
                >
                  {r.type === 'member' ? (
                    <>
                      <div className="min-w-0">
                        <p className="text-white text-sm font-medium truncate">{r.name}</p>
                        <p className="text-gray-500 text-xs">{r.phone}</p>
                      </div>
                      <span className="text-gold text-xs font-mono bg-gold/10 border border-gold/30 px-2 py-0.5 rounded-lg whitespace-nowrap">
                        {r.member_id}
                      </span>
                    </>
                  ) : (
                    <>
                      <div className="min-w-0">
                        <p className="text-white text-sm font-medium truncate">{r.title}</p>
                        <p className="text-gray-500 text-xs">
                          {new Date(r.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                      </div>
                      <span className="text-xs text-gray-500 bg-white/5 border border-white/10 px-2 py-0.5 rounded-lg whitespace-nowrap">
                        Event
                      </span>
                    </>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
