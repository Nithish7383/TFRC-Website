'use client'

export default function ScrollToEventsButton() {
  return (
    <a
      href="#events"
      onClick={(e) => { e.preventDefault(); document.getElementById('events')?.scrollIntoView({ behavior: 'smooth' }) }}
      className="relative z-[1] btn-primary text-base px-9 py-4 inline-block"
    >
      See Events →
    </a>
  )
}
