'use client'

import { useState } from 'react'

interface FAQItem {
  question: string
  answer: string
}

interface Props {
  items: FAQItem[]
}

export default function FAQAccordion({ items }: Props) {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  return (
    <div className="divide-y divide-white/10 border border-white/10 rounded-xl overflow-hidden">
      {items.map((item, i) => {
        const isOpen = openIndex === i
        return (
          <div key={item.question} className="bg-white/[0.02]">
            <button
              onClick={() => setOpenIndex(isOpen ? null : i)}
              aria-expanded={isOpen}
              aria-controls={`faq-panel-${i}`}
              className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left hover:bg-white/[0.03] transition-colors"
            >
              <span className="text-white font-medium text-sm">{item.question}</span>
              <span className={`text-gold text-lg leading-none flex-shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-45' : ''}`}>
                +
              </span>
            </button>
            <div
              id={`faq-panel-${i}`}
              className="grid transition-[grid-template-rows] duration-300 ease-out"
              style={{ gridTemplateRows: isOpen ? '1fr' : '0fr' }}
            >
              <div className="overflow-hidden">
                <p className="text-gray-400 text-sm leading-relaxed px-5 pb-4">{item.answer}</p>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
