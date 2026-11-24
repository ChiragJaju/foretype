import { LayoutGroup, motion, useInView } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { rank, type Candidate } from '../lib/predict'

const ADDRESSES: Candidate[] = [
  { text: 'Alder House, 14 Alder Lane, Brooklyn, NY 11201', prior: 0.6, tag: 'Home' },
  { text: 'Foundry Works, Floor 3, 88 Mission St, San Francisco', prior: 0.3, tag: 'Office' },
  { text: '27 Fernhill Road, Austin, TX 78704', prior: 0.1, tag: 'Parents' },
]

const TYPED_SEQUENCE = ['', 'A', '', 'F', 'Fo', '', '2']
const STEP_MS = 1500

export function MemoryB() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref)
  const [step, setStep] = useState(0)
  useEffect(() => {
    if (!inView || matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const timer = setInterval(() => setStep((index) => (index + 1) % TYPED_SEQUENCE.length), STEP_MS)
    return () => clearInterval(timer)
  }, [inView])
  const typed = TYPED_SEQUENCE[step]
  const ranked = rank(typed, ADDRESSES)

  return (
    <section id="memory" className="px-5 py-28 sm:px-10 sm:py-40">
      <div className="mx-auto grid max-w-[1440px] gap-12 lg:grid-cols-[1fr_1.3fr] lg:gap-20">
        <div>
          <span className="label">Memory</span>
          <h2 className="serif mt-5 text-[52px] sm:text-[80px]">
            Your answers, <em className="italic">remembered.</em>
          </h2>
          <p className="mt-6 max-w-[440px] text-[16.5px] leading-relaxed text-ink-2">
            Addresses, links, sign-offs, order numbers. Stored on your Mac, encrypted. The default comes first; one letter that
            disagrees swaps it. That is a prefix match, not a model call, so it is instant.
          </p>
        </div>

        <div ref={ref} className="min-w-0">
          <div className="flex items-baseline gap-3 border-b border-line-2 pb-4 font-mono text-[15px] sm:text-[18px]">
            <span className="text-ink-3">Ship to:</span>
            <span>
              {typed}
              <span className="caret-b" />
            </span>
            <span className="ml-auto label">keystroke {typed.length}</span>
          </div>
          <LayoutGroup>
            <ol>
              {ranked.map((item, position) => {
                const top = position === 0 && item.matches
                return (
                  <motion.li
                    layout
                    key={item.text}
                    transition={{ type: 'spring', stiffness: 380, damping: 34 }}
                    className={`grid grid-cols-[72px_1fr_auto] items-baseline gap-4 border-b border-line py-5 ${item.matches ? '' : 'opacity-35'}`}
                  >
                    <span className="label">{item.tag}</span>
                    <span className="min-w-0 font-serif text-[24px] leading-tight sm:text-[32px]">
                      <span className={top ? 'marker' : ''}>
                        <span className="text-ink">{item.text.slice(0, typed.length)}</span>
                        <span className={top ? 'text-ink' : 'text-ink-2'}>{item.text.slice(typed.length)}</span>
                      </span>
                    </span>
                    <span className="font-mono text-[12px] text-ink-3">{top ? '⇥ tab' : `${Math.round(item.score * 100)}%`}</span>
                  </motion.li>
                )
              })}
            </ol>
          </LayoutGroup>
        </div>
      </div>
    </section>
  )
}
