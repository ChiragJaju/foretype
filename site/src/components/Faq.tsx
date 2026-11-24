import { AnimatePresence, motion } from 'motion/react'
import { Plus } from 'lucide-react'
import { useState } from 'react'
import { QUESTIONS } from '../lib/content'
import { Reveal } from './Reveal'

export function Faq() {
  const [open, setOpen] = useState(0)
  return (
    <section className="px-4 py-24 sm:px-6 sm:py-32">
      <div className="mx-auto grid max-w-[1240px] gap-10 lg:grid-cols-[1fr_1.6fr] lg:gap-16">
        <Reveal>
          <div className="eyebrow mb-4">Questions</div>
          <h2 className="display text-[36px] sm:text-[44px]">
            Fair things
            <span className="block text-ink-3">to ask first.</span>
          </h2>
        </Reveal>
        <Reveal delay={0.08}>
          <ul className="border-t border-line">
            {QUESTIONS.map((item, index) => {
              const isOpen = open === index
              return (
                <li key={item.q} className="border-b border-line">
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    onClick={() => setOpen(isOpen ? -1 : index)}
                    className="flex w-full items-center justify-between gap-6 py-5 text-left text-[17px] font-medium tracking-[-0.01em]"
                  >
                    {item.q}
                    <motion.span animate={{ rotate: isOpen ? 45 : 0 }} transition={{ type: 'spring', stiffness: 300, damping: 20 }}>
                      <Plus size={18} strokeWidth={1.6} />
                    </motion.span>
                  </button>
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                        className="overflow-hidden"
                      >
                        <p className="max-w-[620px] pb-6 text-[15px] leading-relaxed text-ink-2">{item.a}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </li>
              )
            })}
          </ul>
        </Reveal>
      </div>
    </section>
  )
}
