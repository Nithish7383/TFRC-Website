'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

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
    <div className="divide-y divide-white/[0.07] border border-white/10 rounded-2xl overflow-hidden
                    bg-ink-800/60 backdrop-blur-sm shadow-lift">
      {items.map((item, i) => {
        const isOpen = openIndex === i
        return (
          <div
            key={item.question}
            className={`relative transition-colors duration-400 ${
              isOpen ? 'bg-gold/[0.04]' : 'bg-transparent'
            }`}
          >
            {/* Gold spine marking the open row */}
            <motion.span
              aria-hidden="true"
              initial={false}
              animate={{ scaleY: isOpen ? 1 : 0, opacity: isOpen ? 1 : 0 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="absolute left-0 top-0 bottom-0 w-[2px] bg-gold origin-center"
            />

            <button
              onClick={() => setOpenIndex(isOpen ? null : i)}
              aria-expanded={isOpen}
              aria-controls={`faq-panel-${i}`}
              className="group w-full flex items-center justify-between gap-4 px-5 sm:px-6 py-5 text-left
                         transition-colors duration-300 hover:bg-white/[0.03]"
            >
              <span
                className={`font-medium text-sm sm:text-base transition-colors duration-300 ${
                  isOpen ? 'text-gold' : 'text-white group-hover:text-gold-light'
                }`}
              >
                {item.question}
              </span>

              {/* Plus that rotates into a minus */}
              <motion.span
                animate={{ rotate: isOpen ? 135 : 0 }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                className={`relative flex-shrink-0 w-7 h-7 rounded-full border flex items-center justify-center
                            transition-colors duration-300 ${
                              isOpen
                                ? 'border-gold/50 bg-gold/10 text-gold'
                                : 'border-white/15 text-gray-400 group-hover:border-gold/40 group-hover:text-gold'
                            }`}
              >
                <span className="absolute w-3 h-[1.5px] bg-current rounded-full" />
                <span className="absolute h-3 w-[1.5px] bg-current rounded-full" />
              </motion.span>
            </button>

            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  id={`faq-panel-${i}`}
                  key="content"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{
                    height: { duration: 0.4, ease: [0.16, 1, 0.3, 1] },
                    opacity: { duration: 0.25 },
                  }}
                  className="overflow-hidden"
                >
                  <motion.p
                    initial={{ y: -10 }}
                    animate={{ y: 0 }}
                    exit={{ y: -10 }}
                    transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                    className="text-gray-400 text-sm leading-relaxed px-5 sm:px-6 pb-5 pr-12"
                  >
                    {item.answer}
                  </motion.p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )
      })}
    </div>
  )
}
