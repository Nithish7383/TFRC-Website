'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

interface Props {
  groupLink: string
  selectedUsers: { name: string; phone: string }[]
}

type CycleState = 'idle' | 'running' | 'paused' | 'done'

const COUNTDOWN_SECONDS = 6

export default function CopyWhatsAppButton({ groupLink, selectedUsers }: Props) {
  const [cycleState, setCycleState] = useState<CycleState>('idle')
  const [currentIndex, setCurrentIndex] = useState(0)
  const [sentSet, setSentSet] = useState<Set<string>>(new Set())
  const [countdown, setCountdown] = useState(COUNTDOWN_SECONDS)
  const [showContacts, setShowContacts] = useState(false)
  const [copied, setCopied] = useState(false)

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const isPausedRef = useRef(false)

  const messageTemplate = `Congrats! You are selected for this weekend run 🎉 Join here: ${groupLink}`

  const openWhatsApp = useCallback(
    (user: { name: string; phone: string }) => {
      const url = `https://wa.me/91${user.phone}?text=${encodeURIComponent(messageTemplate)}`
      window.open(url, '_blank')
    },
    [messageTemplate]
  )

  const clearTimer = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }

  const startCountdownFor = useCallback(
    (index: number) => {
      clearTimer()
      setCountdown(COUNTDOWN_SECONDS)

      let remaining = COUNTDOWN_SECONDS
      intervalRef.current = setInterval(() => {
        if (isPausedRef.current) return

        remaining -= 1
        setCountdown(remaining)

        if (remaining <= 0) {
          clearTimer()
          const next = index + 1
          if (next >= selectedUsers.length) {
            setCycleState('done')
          } else {
            setCurrentIndex(next)
            setSentSet((prev) => new Set(prev).add(selectedUsers[index].phone))
            openWhatsApp(selectedUsers[next])
            startCountdownFor(next)
          }
        }
      }, 1000)
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [selectedUsers, openWhatsApp]
  )

  const handleStart = () => {
    if (selectedUsers.length === 0) return
    setSentSet(new Set())
    setCurrentIndex(0)
    isPausedRef.current = false
    setCycleState('running')
    openWhatsApp(selectedUsers[0])
    startCountdownFor(0)
  }

  const handlePause = () => {
    isPausedRef.current = true
    setCycleState('paused')
  }

  const handleResume = () => {
    isPausedRef.current = false
    setCycleState('running')
  }

  const handleReset = () => {
    clearTimer()
    setCycleState('idle')
    setCurrentIndex(0)
    setSentSet(new Set())
    setCountdown(COUNTDOWN_SECONDS)
    isPausedRef.current = false
  }

  // Mark last runner as sent when done
  useEffect(() => {
    if (cycleState === 'done' && selectedUsers.length > 0) {
      setSentSet((prev) => {
        const next = new Set(prev)
        selectedUsers.forEach((u) => next.add(u.phone))
        return next
      })
    }
  }, [cycleState, selectedUsers])

  useEffect(() => () => clearTimer(), [])

  const copyMessage = async () => {
    await navigator.clipboard.writeText(messageTemplate)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  const currentUser = selectedUsers[currentIndex]
  const sentCount = cycleState === 'done' ? selectedUsers.length : currentIndex
  const progressPct =
    selectedUsers.length > 0 ? (sentCount / selectedUsers.length) * 100 : 0

  return (
    <div className="space-y-5">
      {/* Message preview + copy */}
      <div className="bg-gray-800/60 border border-gray-700 rounded-lg p-4 space-y-3">
        <p className="text-gray-400 text-xs font-medium uppercase tracking-wide">
          Message template
        </p>
        <p className="text-gray-200 text-sm">{messageTemplate}</p>
        <button
          onClick={copyMessage}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-colors ${
            copied
              ? 'bg-green-800/60 text-green-300 border border-green-700/50'
              : 'bg-gray-700 hover:bg-gray-600 text-gray-200 border border-gray-600'
          }`}
        >
          {copied ? (
            <>
              <CheckIcon className="w-3.5 h-3.5" />
              Copied!
            </>
          ) : (
            <>
              <ClipboardIcon className="w-3.5 h-3.5" />
              Copy message
            </>
          )}
        </button>
      </div>

      {/* Auto-cycle panel */}
      <div className="bg-gray-900 border border-gray-700 rounded-xl p-5 space-y-4">
        {/* Done state */}
        {cycleState === 'done' && (
          <div className="flex flex-col items-center gap-3 py-2">
            <div className="flex items-center gap-2 text-green-400 text-lg font-bold">
              <CheckCircleIcon className="w-6 h-6" />
              All done!
            </div>
            <p className="text-gray-400 text-sm text-center">
              WhatsApp opened for all {selectedUsers.length} runners.
            </p>
            <button
              onClick={handleReset}
              className="mt-1 px-5 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-200 text-sm font-semibold border border-gray-600 transition-colors"
            >
              Start over
            </button>
          </div>
        )}

        {/* Idle state */}
        {cycleState === 'idle' && (
          <button
            onClick={handleStart}
            disabled={selectedUsers.length === 0}
            className="w-full py-3 rounded-xl text-black font-bold text-sm tracking-wide transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ backgroundColor: '#C9A227' }}
          >
            Start Auto-cycle ({selectedUsers.length} runners)
          </button>
        )}

        {/* Running / paused state */}
        {(cycleState === 'running' || cycleState === 'paused') && (
          <div className="space-y-4">
            {/* Current runner info */}
            <div className="bg-gray-800/70 rounded-lg p-4 space-y-1">
              <p className="text-gray-400 text-xs uppercase tracking-wide font-medium">
                {cycleState === 'paused' ? 'Paused on' : 'Sending to'}
              </p>
              <p className="text-white font-semibold">{currentUser?.name}</p>
              <p className="text-gray-500 text-sm">{currentUser?.phone}</p>
            </div>

            {/* Countdown */}
            <div className="flex items-center gap-3">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold shrink-0"
                style={{
                  border: `3px solid ${cycleState === 'paused' ? '#4B5563' : '#C9A227'}`,
                  color: cycleState === 'paused' ? '#6B7280' : '#C9A227',
                }}
              >
                {countdown}
              </div>
              <p className="text-gray-400 text-sm">
                {cycleState === 'paused'
                  ? 'Timer paused'
                  : 'seconds until next runner opens'}
              </p>
            </div>

            {/* Controls */}
            <div className="flex flex-wrap gap-3">
              {cycleState === 'running' ? (
                <button
                  onClick={handlePause}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-200 text-sm font-semibold border border-gray-600 transition-colors"
                >
                  <PauseIcon className="w-4 h-4" />
                  Pause
                </button>
              ) : (
                <button
                  onClick={handleResume}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-black text-sm font-bold transition-colors"
                  style={{ backgroundColor: '#C9A227' }}
                >
                  <PlayIcon className="w-4 h-4" />
                  Resume
                </button>
              )}
              <button
                onClick={handleReset}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 text-sm font-semibold border border-gray-700 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Progress bar — shown whenever not idle */}
        {cycleState !== 'idle' && (
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs text-gray-400">
              <span>Progress</span>
              <span>
                {cycleState === 'done' ? selectedUsers.length : currentIndex} /{' '}
                {selectedUsers.length} sent
              </span>
            </div>
            <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${progressPct}%`,
                  backgroundColor: cycleState === 'done' ? '#22c55e' : '#C9A227',
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Collapsible contacts list */}
      <div className="border border-gray-700 rounded-xl overflow-hidden">
        <button
          onClick={() => setShowContacts(!showContacts)}
          className="w-full flex items-center justify-between px-4 py-3 bg-gray-900 hover:bg-gray-800 transition-colors text-sm font-medium text-gray-300"
        >
          <span>Contacts ({selectedUsers.length})</span>
          <ChevronIcon className={`w-4 h-4 transition-transform ${showContacts ? 'rotate-180' : ''}`} />
        </button>

        {showContacts && (
          <div className="divide-y divide-gray-800">
            {selectedUsers.map((user, idx) => {
              const isSent = sentSet.has(user.phone)
              const isCurrent =
                (cycleState === 'running' || cycleState === 'paused') &&
                idx === currentIndex
              return (
                <div
                  key={user.phone}
                  className={`flex items-center justify-between px-4 py-3 transition-colors ${
                    isCurrent ? 'bg-gray-800' : 'bg-gray-950'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {isSent ? (
                      <CheckIcon className="w-4 h-4 text-green-400 shrink-0" />
                    ) : (
                      <span className="w-4 h-4 shrink-0 rounded-full border border-gray-600" />
                    )}
                    <div className="min-w-0">
                      <p
                        className={`text-sm font-medium truncate ${
                          isSent ? 'text-gray-400' : 'text-white'
                        }`}
                      >
                        {user.name}
                      </p>
                      <p className="text-gray-500 text-xs">{user.phone}</p>
                    </div>
                  </div>
                  <a
                    href={`https://wa.me/91${user.phone}?text=${encodeURIComponent(messageTemplate)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-3 shrink-0 text-xs text-green-400 hover:text-green-300 border border-green-800/40 bg-green-900/20 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    Open
                  </a>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  )
}

function CheckCircleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}

function ClipboardIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
  )
}

function PauseIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
    </svg>
  )
}

function PlayIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M8 5v14l11-7z" />
    </svg>
  )
}

function ChevronIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  )
}
