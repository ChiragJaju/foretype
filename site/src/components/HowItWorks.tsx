import { AnimatePresence, motion, useInView } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { PinnedPanels } from './PinnedPanels'

function useTicker(steps: number, intervalMs: number) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref)
  const [step, setStep] = useState(0)
  useEffect(() => {
    if (!inView || matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const timer = setInterval(() => setStep((current) => (current + 1) % steps), intervalMs)
    return () => clearInterval(timer)
  }, [inView, steps, intervalMs])
  return { ref, step }
}

const AX_TREE = [
  { depth: 0, role: 'AXWindow', value: 'Mail' },
  { depth: 1, role: 'AXStaticText', value: 'From: Maya Chen' },
  { depth: 1, role: 'AXStaticText', value: '“Free for dinner Thursday at 8?”' },
  { depth: 1, role: 'AXStaticText', value: '“Which address for the invite?”' },
  { depth: 1, role: 'AXTextArea', value: 'focused · caret 0' },
]

function ReadVisual() {
  const { ref, step } = useTicker(AX_TREE.length + 2, 650)
  return (
    <div ref={ref} className="space-y-1 font-mono text-[11.5px]">
      {AX_TREE.map((node, index) => {
        const read = index < step
        return (
          <div
            key={node.role + index}
            className={`flex gap-2 rounded px-2 py-1 transition-colors duration-300 ${read ? 'bg-accent-soft text-ink' : 'text-ink-3'}`}
            style={{ paddingLeft: 8 + node.depth * 16 }}
          >
            <span className={read ? 'text-accent' : ''}>{node.role}</span>
            <span className="truncate">{node.value}</span>
          </div>
        )
      })}
    </div>
  )
}

const DRAFT = 'Yes! Thursday at 8 works.'
const DRAFT_TARGET_MS = 142

function DraftVisual() {
  const { ref, step } = useTicker(DRAFT.length + 14, 70)
  const shown = Math.min(step, DRAFT.length)
  const elapsed = Math.round((shown / DRAFT.length) * DRAFT_TARGET_MS)
  return (
    <div ref={ref}>
      <div className="rounded-lg border border-line bg-bg px-3 py-3 text-[14px]">
        <span className="caret" />
        <span className="text-ghost">{DRAFT.slice(0, shown)}</span>
      </div>
      <div className="mt-3 flex items-center justify-between font-mono text-[11px] text-ink-3">
        <span>on-device · ~1.5B params</span>
        <span className="text-accent">{elapsed} ms</span>
      </div>
      <div className="mt-2 h-1 overflow-hidden rounded-full bg-bg-3">
        <div
          className="h-full rounded-full bg-accent transition-[width] duration-75"
          style={{ width: `${(shown / DRAFT.length) * 100}%` }}
        />
      </div>
    </div>
  )
}

const BRANCHES = [
  { key: 'Y', typed: 'Y', ghost: 'es! Thursday at 8 works.' },
  { key: 'N', typed: 'N', ghost: "o, Thursday's packed." },
  { key: 'F', typed: 'F', ghost: 'oundry Works, 88 Mission St' },
  { key: 'A', typed: 'A', ghost: 'lder House, 14 Alder Lane' },
]

function FollowVisual() {
  const { ref, step } = useTicker(BRANCHES.length, 1500)
  const branch = BRANCHES[step]
  return (
    <div ref={ref}>
      <div className="flex gap-1.5">
        {BRANCHES.map((item) => (
          <span key={item.key} className="keycap" data-pressed={item.key === branch.key}>
            {item.key}
          </span>
        ))}
      </div>
      <div className="mt-4 overflow-hidden rounded-lg border border-line bg-bg px-3 py-3 text-[14px] whitespace-nowrap">
        <AnimatePresence mode="wait">
          <motion.span
            key={branch.key}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            className="inline-block"
          >
            {branch.typed}
            <span className="caret" />
            <span className="text-ghost">{branch.ghost}</span>
          </motion.span>
        </AnimatePresence>
      </div>
    </div>
  )
}

const STEPS = [
  {
    lead: 'It reads',
    rest: 'the question.',
    body: 'When you click into a field, Foretype asks macOS what surrounds it through the Accessibility API: the question, the thread, the form labels. Real text, not screenshots.',
    visual: <ReadVisual />,
  },
  {
    lead: 'It drafts',
    rest: 'the answer.',
    body: 'A small language model on your Mac writes what you were about to say, in your voice, before your first key. No server round trip.',
    visual: <DraftVisual />,
  },
  {
    lead: 'It follows',
    rest: 'your keys.',
    body: 'Every key re-ranks the guesses. Type N and yes becomes no. Type F and Home becomes Office. Tab takes it; keep typing to ignore it.',
    visual: <FollowVisual />,
  },
]

export function HowItWorks() {
  return (
    <PinnedPanels
      id="how"
      count={STEPS.length}
      header={(active, wide) => (
        <div className="mx-auto flex max-w-[1240px] items-center justify-between gap-6 px-4 pt-28 sm:px-6">
          <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
            <span className="eyebrow">How it works</span>
            <span className="text-[14px] text-ink-2">Three things happen before your first key.</span>
          </div>
          {wide && (
            <div className="flex items-center gap-2">
              {STEPS.map((step, index) => (
                <span
                  key={step.lead}
                  className={`h-1.5 rounded-full transition-all duration-500 ${index === active ? 'w-10 bg-accent' : 'w-5 bg-line-2'}`}
                />
              ))}
            </div>
          )}
        </div>
      )}
      panel={(index, active) => {
        const step = STEPS[index]
        return (
          <div className="mx-auto grid h-full max-w-[1240px] content-center items-center gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[1fr_1fr] lg:gap-16 lg:py-0">
            <div>
              <div className="text-[110px] leading-[0.85] font-medium tracking-[-0.06em] text-ghost sm:text-[168px]">0{index + 1}</div>
              <h2 className="display mt-6 text-[40px] sm:text-[60px]">
                {step.lead}
                <span className="block text-ink-3">{step.rest}</span>
              </h2>
              <p className="mt-5 max-w-[440px] text-[16px] leading-relaxed text-ink-2">{step.body}</p>
            </div>
            <motion.div
              animate={{ opacity: active ? 1 : 0.3, y: active ? 0 : 24, scale: active ? 1 : 0.96 }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className="rounded-2xl bg-bg-2 p-6 shadow-screen sm:p-8 lg:[zoom:1.2]"
            >
              {step.visual}
            </motion.div>
          </div>
        )
      }}
    />
  )
}
