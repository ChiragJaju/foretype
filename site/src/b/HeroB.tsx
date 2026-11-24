import { LayoutGroup, motion, useInView } from 'motion/react'
import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { ghostFor, rank, type Candidate } from '../lib/predict'
import { keyLabelFor } from './clusterKeys'

const KeyCluster = lazy(() => import('./KeyCluster'))

const ANSWERS: Candidate[] = [
  { text: 'Yes — see you at 8.', prior: 0.62, tag: 'yes' },
  { text: "No, Thursday's packed. Friday?", prior: 0.27, tag: 'no' },
  { text: 'Maybe — let me check tonight.', prior: 0.11, tag: 'maybe' },
]

// Until the visitor touches the field, it demonstrates itself: type "N", then Tab.
const AUTOPLAY: { at: number; value: string; key?: string }[] = [
  { at: 2200, value: 'N', key: 'N' },
  { at: 3800, value: ANSWERS[1].text, key: 'Tab' },
  { at: 6600, value: '' },
  { at: 8400, value: '' },
]
const AUTOPLAY_LOOP_MS = 8400

function useAutoplay(enabled: boolean, onStep: (value: string, key?: string) => void) {
  const stepRef = useRef(onStep)
  useEffect(() => {
    stepRef.current = onStep
  })
  useEffect(() => {
    if (!enabled) return
    let timers: number[] = []
    const run = () => {
      timers = AUTOPLAY.map((step) => window.setTimeout(() => stepRef.current(step.value, step.key), step.at))
      timers.push(window.setTimeout(run, AUTOPLAY_LOOP_MS))
    }
    run()
    return () => timers.forEach(clearTimeout)
  }, [enabled])
}

export function HeroB() {
  const [value, setValue] = useState('')
  const [touched, setTouched] = useState(false)
  const [pulse, setPulse] = useState({ label: '', at: 0 })
  const sceneRef = useRef<HTMLDivElement>(null)
  const sceneVisible = useInView(sceneRef)
  const reducedMotion = typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches
  const ghost = ghostFor(value, ANSWERS)
  const ranked = rank(value, ANSWERS)

  const press = (key: string) => setPulse({ label: keyLabelFor(key), at: performance.now() })
  useAutoplay(!touched && !reducedMotion, (next, key) => {
    setValue(next)
    if (key) press(key)
  })

  const onKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    setTouched(true)
    if (event.key === 'Enter') event.preventDefault()
    if (event.key === 'Tab' && ghost) {
      event.preventDefault()
      setValue(value + ghost)
    }
    press(event.key)
  }

  const fieldText = 'font-serif text-[44px] leading-[1.05] tracking-[-0.02em] sm:text-[64px] lg:text-[76px]'

  return (
    <section id="top" className="relative px-5 pt-28 pb-16 sm:px-10 sm:pt-36">
      <div className="mx-auto grid max-w-[1440px] gap-10 lg:grid-cols-[1.3fr_1fr] lg:gap-6">
        <div className="min-w-0">
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
            className="label mb-8 flex flex-wrap items-center gap-x-3 gap-y-1"
          >
            <span>Foretype · macOS</span>
            <span className="h-px w-8 bg-line-2" />
            <span>Local-first</span>
            <span className="h-px w-8 bg-line-2" />
            <span>Open source</span>
          </motion.p>

          <h1 className="serif text-[60px] sm:text-[104px] lg:text-[132px]">
            {['Answers', 'before'].map((word, index) => (
              <motion.span
                key={word}
                className="mr-[0.22em] inline-block"
                initial={{ opacity: 0, y: '0.35em', filter: 'blur(8px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                transition={{ duration: 0.9, delay: 0.1 + index * 0.08, ease: [0.22, 1, 0.36, 1] }}
              >
                {word}
              </motion.span>
            ))}
            <br />
            <motion.em
              className="marker inline-block italic"
              initial={{ opacity: 0, '--marker': '0%' }}
              animate={{ opacity: 1, '--marker': '100%' }}
              transition={{ duration: 1.1, delay: 0.45, ease: [0.22, 1, 0.36, 1] }}
            >
              you type them.
            </motion.em>
          </h1>

          <p className="mt-8 max-w-[520px] text-[17px] leading-relaxed text-ink-2">
            Foretype reads the question on your screen and writes the answer before you do. Each key you press re-ranks it.
            Tab takes it. Nothing leaves your Mac.
          </p>
        </div>

        <div ref={sceneRef} className="relative h-[340px] sm:h-[460px] lg:h-auto" data-cursor-label="tilt">
          <Suspense fallback={null}>
            <KeyCluster pulse={pulse} active={sceneVisible} />
          </Suspense>
        </div>
      </div>

      <div className="mx-auto mt-14 max-w-[1440px] border-t border-line pt-8">
        <div className="grid gap-8 lg:grid-cols-[1.3fr_1fr] lg:gap-6">
          <div className="min-w-0">
            <div className="label mb-3 flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-hl shadow-[0_0_8px_var(--hl)]" />
              Live · Maya in Mail asks
            </div>
            <p className="mb-5 text-[19px] text-ink">
              “Are you free for dinner <span className="marker">Thursday at 8</span>?”
            </p>
            <label className="relative block" data-cursor="text">
              <span className="sr-only">Your answer</span>
              <span aria-hidden className={`${fieldText} pointer-events-none absolute inset-0 break-words whitespace-pre-wrap text-transparent`}>
                {value}
                <span className="text-ghost italic">{ghost}</span>
              </span>
              <textarea
                value={value}
                rows={2}
                spellCheck={false}
                onFocus={() => setTouched(true)}
                onKeyDown={onKeyDown}
                onChange={(event) => setValue(event.target.value)}
                className={`${fieldText} relative block w-full resize-none bg-transparent text-ink caret-[var(--ink)] outline-none dark:caret-[var(--hl)]`}
              />
            </label>
            <p className="mt-2 flex flex-wrap items-center gap-2 text-[13.5px] text-ink-2">
              <span className="kbd">tab</span> to take it
              <span className="text-ink-3">·</span>
              type <span className="kbd">n</span> to change your mind
              <span className="text-ink-3">·</span>
              <button type="button" className="underline decoration-line-2 underline-offset-4 hover:decoration-ink" onClick={() => setValue('')}>
                clear
              </button>
            </p>
          </div>

          <LayoutGroup>
            <ol className="min-w-0 self-end font-mono text-[12px]">
              {ranked.map((item, position) => (
                <motion.li
                  layout
                  key={item.text}
                  transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                  className={`flex items-center gap-4 border-b border-line py-2.5 ${item.matches ? 'text-ink' : 'text-ink-3 line-through'}`}
                >
                  <span className="w-6 text-ink-3">0{position + 1}</span>
                  <span className="min-w-0 flex-1 truncate font-sans text-[14px]">{item.text}</span>
                  <span className="relative h-1.5 w-20 overflow-hidden rounded-full bg-bg-3">
                    <motion.span
                      className="absolute inset-y-0 left-0 rounded-full bg-ink dark:bg-hl"
                      animate={{ width: `${Math.round(item.score * 100)}%` }}
                      transition={{ type: 'spring', stiffness: 220, damping: 30 }}
                    />
                  </span>
                  <span className="w-9 text-right">{Math.round(item.score * 100)}%</span>
                </motion.li>
              ))}
            </ol>
          </LayoutGroup>
        </div>
      </div>
    </section>
  )
}
