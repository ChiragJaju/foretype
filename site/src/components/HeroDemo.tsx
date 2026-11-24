import { AnimatePresence, LayoutGroup, motion, useInView } from 'motion/react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { ghostFor, rank, type Candidate } from '../lib/predict'

const REPLY_CANDIDATES: Candidate[] = [
  { text: 'Yes! Thursday at 8 works. See you there.', prior: 0.62, tag: 'yes' },
  { text: "No, Thursday's packed. Could we do Friday?", prior: 0.27, tag: 'no' },
  { text: 'Maybe. Let me check and confirm tonight.', prior: 0.11, tag: 'maybe' },
]

const ADDRESS_LEAD = 'Send the invite to '
const ADDRESS_CANDIDATES: Candidate[] = [
  { text: 'Alder House, 14 Alder Lane, Brooklyn.', prior: 0.7, tag: 'Home' },
  { text: 'Foundry Works, 88 Mission St, SF.', prior: 0.22, tag: 'Office' },
  { text: '27 Fernhill Road, Austin.', prior: 0.08, tag: 'Parents' },
]

type Frame = {
  line1: string
  line2: string
  active: 0 | 1 | 2
  showGhost: boolean
  highlight: boolean
  pressed: string
  note: string
  keystrokes: number
  durationMs: number
}

const TYPE_MS_PER_CHAR = 38

function buildFrames(): Frame[] {
  const reply = REPLY_CANDIDATES[1].text
  const address = ADDRESS_CANDIDATES[1].text
  const base: Frame = {
    line1: '',
    line2: '',
    active: 0,
    showGhost: false,
    highlight: false,
    pressed: '',
    note: '',
    keystrokes: 0,
    durationMs: 900,
  }
  const frames: Frame[] = [
    { ...base, note: 'Waiting for a text field', durationMs: 1000 },
    { ...base, active: 1, highlight: true, note: 'Reads the thread via Accessibility · no screenshots', durationMs: 1300 },
    { ...base, active: 1, highlight: true, showGhost: true, note: 'Answer predicted on-device · 142 ms', durationMs: 1700 },
    { ...base, active: 1, line1: 'N', showGhost: true, pressed: 'N', keystrokes: 1, note: 'Re-ranked on “N” → no', durationMs: 1600 },
    { ...base, active: 1, line1: reply, pressed: 'Tab', keystrokes: 2, note: 'Tab to accept', durationMs: 900 },
  ]
  // The lead-in line is typed by hand, so it counts as keystrokes.
  for (let length = 1; length <= ADDRESS_LEAD.length; length += 1) {
    frames.push({
      ...base,
      active: 2,
      line1: reply,
      line2: ADDRESS_LEAD.slice(0, length),
      keystrokes: 2 + length,
      note: 'Typing…',
      durationMs: TYPE_MS_PER_CHAR,
    })
  }
  const afterLead = 2 + ADDRESS_LEAD.length
  frames.push(
    {
      ...base,
      active: 2,
      line1: reply,
      line2: ADDRESS_LEAD,
      showGhost: true,
      keystrokes: afterLead,
      note: 'From your memory · Home',
      durationMs: 1600,
    },
    {
      ...base,
      active: 2,
      line1: reply,
      line2: `${ADDRESS_LEAD}F`,
      showGhost: true,
      pressed: 'F',
      keystrokes: afterLead + 1,
      note: 'Re-ranked on “F” → Office',
      durationMs: 1600,
    },
    {
      ...base,
      active: 2,
      line1: reply,
      line2: `${ADDRESS_LEAD}${address}`,
      pressed: 'Tab',
      keystrokes: afterLead + 2,
      note: 'Accepted · written on your Mac',
      durationMs: 2600,
    },
  )
  return frames
}

const FRAMES = buildFrames()
const FINAL_FRAME = FRAMES[FRAMES.length - 1]

function useDemoFrame(running: boolean) {
  const [index, setIndex] = useState(0)
  useEffect(() => {
    if (!running) return
    const timer = setTimeout(() => setIndex((current) => (current + 1) % FRAMES.length), FRAMES[index].durationMs)
    return () => clearTimeout(timer)
  }, [index, running])
  return FRAMES[index]
}

function Candidates({ frame }: { frame: Frame }) {
  const onAddress = frame.active === 2
  const typed = onAddress ? frame.line2.slice(ADDRESS_LEAD.length) : frame.line1
  const ranked = rank(typed, onAddress ? ADDRESS_CANDIDATES : REPLY_CANDIDATES)
  return (
    <div className="w-[268px] rounded-xl bg-bg-2/95 p-3 shadow-screen backdrop-blur">
      <div className="mb-2 flex items-center justify-between font-mono text-[10.5px] tracking-wider text-ink-3 uppercase">
        <span>{onAddress ? 'Memory · addresses' : 'Candidates'}</span>
        <span>typed “{typed.slice(-6) || '∅'}”</span>
      </div>
      <LayoutGroup>
        <ul className="space-y-1.5">
          {ranked.map((item, position) => (
            <motion.li
              layout
              key={item.text}
              transition={{ type: 'spring', stiffness: 420, damping: 34 }}
              className={`relative overflow-hidden rounded-md px-2 py-1.5 text-[11.5px] leading-snug ${item.matches ? 'text-ink' : 'text-ink-3 line-through decoration-line-2'}`}
            >
              <motion.span
                className="absolute inset-y-0 left-0 bg-accent-soft"
                animate={{ width: `${Math.round(item.score * 100)}%` }}
                transition={{ type: 'spring', stiffness: 200, damping: 30 }}
              />
              <span className="relative flex items-center justify-between gap-2">
                <span className="truncate">{onAddress ? item.tag : item.text}</span>
                <span className={`font-mono text-[10px] ${position === 0 && item.matches ? 'text-accent' : 'text-ink-3'}`}>
                  {Math.round(item.score * 100)}%
                </span>
              </span>
            </motion.li>
          ))}
        </ul>
      </LayoutGroup>
    </div>
  )
}

function ComposerLine({ text, ghost, active }: { text: string; ghost: string; active: boolean }) {
  return (
    <p className="min-h-[1.6em]">
      <span>{text}</span>
      {active && <span className="caret" />}
      <AnimatePresence mode="popLayout">
        {active && ghost && (
          <motion.span
            key={ghost}
            initial={{ opacity: 0, filter: 'blur(3px)' }}
            animate={{ opacity: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="text-ghost"
          >
            {ghost}
            <span className="keycap ml-1.5 !h-[18px] !min-w-0 !px-1.5 !text-[10px] align-middle">tab</span>
          </motion.span>
        )}
      </AnimatePresence>
    </p>
  )
}

export function HeroDemo() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { margin: '-10% 0px' })
  const reducedMotion = useMemo(() => matchMedia('(prefers-reduced-motion: reduce)').matches, [])
  const liveFrame = useDemoFrame(inView && !reducedMotion)
  const frame = reducedMotion ? FINAL_FRAME : liveFrame

  const ghost1 = frame.active === 1 && frame.showGhost ? ghostFor(frame.line1, REPLY_CANDIDATES) : ''
  const ghost2 = frame.active === 2 && frame.showGhost ? ghostFor(frame.line2.slice(ADDRESS_LEAD.length), ADDRESS_CANDIDATES) : ''
  const charactersWritten = frame.line1.length + frame.line2.length

  return (
    <div ref={ref} className="relative mx-auto w-full max-w-[1120px]" data-cursor-label="live demo">
      {/* Wallpaper: daylight paper in light mode, a night sky in dark mode. */}
      <div className="relative overflow-hidden rounded-[22px] p-3 shadow-ring sm:p-8 md:p-12">
        <div className="absolute inset-0 bg-[radial-gradient(120%_80%_at_15%_0%,#f9e3c8_0%,transparent_55%),radial-gradient(90%_70%_at_100%_100%,#d8def9_0%,transparent_60%),linear-gradient(180deg,#f3efe8,#ece8f3)] transition-opacity duration-700 dark:opacity-0" />
        <div className="absolute inset-0 opacity-0 transition-opacity duration-700 dark:opacity-100 bg-[radial-gradient(70%_60%_at_85%_10%,rgba(125,140,255,0.28)_0%,transparent_60%),radial-gradient(60%_50%_at_10%_100%,rgba(255,170,120,0.12)_0%,transparent_60%),linear-gradient(180deg,#0f1020,#0b0b0d)]">
          <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.55)_1px,transparent_1px)] [background-size:60px_60px] opacity-40" />
          <div className="absolute top-[12%] right-[14%] h-14 w-14 rounded-full bg-[#f2f0ec] shadow-[0_0_60px_20px_rgba(242,240,236,0.18)]" />
        </div>

        <div className="relative mx-auto max-w-[860px] overflow-hidden rounded-xl bg-bg-2 shadow-screen">
          <div className="flex h-10 items-center gap-2 border-b border-line px-4">
            <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
            <span className="h-3 w-3 rounded-full bg-[#febc2e]" />
            <span className="h-3 w-3 rounded-full bg-[#28c840]" />
            <span className="ml-3 truncate text-[12.5px] text-ink-2">Mail — Re: Dinner on Thursday?</span>
          </div>
          <div className="flex text-left">
            <aside className="hidden w-[200px] shrink-0 border-r border-line p-3 md:block">
              {['Maya Chen', 'Linear', 'Ravi from Stripe', 'Mom'].map((sender, position) => (
                <div key={sender} className={`mb-1 rounded-lg px-2.5 py-2 ${position === 0 ? 'bg-accent-soft' : ''}`}>
                  <div className="text-[12.5px] font-medium">{sender}</div>
                  <div className="truncate text-[11.5px] text-ink-3">
                    {['Dinner on Thursday?', 'Issue ENG-212 assigned', 'Your invoice is ready', 'Call me when free'][position]}
                  </div>
                </div>
              ))}
            </aside>
            <div className="min-w-0 flex-1 p-4 sm:p-6">
              <div className="mb-1 flex items-center gap-2 text-[13px]">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#f4c9a8] text-[12px] font-medium text-[#5a3a22]">
                  M
                </span>
                <span className="font-medium">Maya Chen</span>
                <span className="text-ink-3">· 9:41 AM</span>
              </div>
              <p className="mt-3 text-[14px] leading-relaxed text-ink-2 sm:text-[15px]">
                Hey!{' '}
                <span className={`rounded px-0.5 transition-colors duration-500 ${frame.highlight ? 'bg-accent-soft text-ink' : ''}`}>
                  Are you free for dinner Thursday at 8?
                </span>{' '}
                Also,{' '}
                <span className={`rounded px-0.5 transition-colors duration-500 ${frame.highlight ? 'bg-accent-soft text-ink' : ''}`}>
                  which address should I send the invite to?
                </span>
              </p>
              <div className="mt-5 min-h-[112px] rounded-lg border border-line bg-bg p-3.5 text-[14px] leading-relaxed sm:text-[15px]">
                <ComposerLine text={frame.line1} ghost={ghost1} active={frame.active === 1} />
                <ComposerLine text={frame.line2} ghost={ghost2} active={frame.active === 2} />
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between gap-3 border-t border-line px-4 py-2 font-mono text-[11px] text-ink-3">
            <span className="flex min-w-0 items-center gap-2">
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-accent shadow-[0_0_8px_var(--accent)]" />
              <span className="truncate">Foretype · {frame.note}</span>
            </span>
            <span className="hidden shrink-0 sm:inline">0 bytes sent</span>
          </div>
        </div>
      </div>
      <div className="pointer-events-none absolute -right-4 bottom-16 z-10 hidden lg:block xl:-right-10">
        <Candidates frame={frame} />
      </div>
      <div className="pointer-events-none absolute top-24 -left-4 z-10 hidden w-[190px] rounded-xl bg-bg-2/95 p-3 shadow-screen backdrop-blur lg:block xl:-left-10">
        <div className="font-mono text-[10.5px] tracking-wider text-ink-3 uppercase">Your keys</div>
        <div className="mt-2 flex gap-1.5">
          {['N', 'Tab', 'F'].map((key) => (
            <span key={key} className="keycap" data-pressed={frame.pressed === key}>
              {key}
            </span>
          ))}
        </div>
        <div className="mt-3 text-[12px] leading-snug text-ink-2">
          <span className="text-[22px] font-medium tracking-tight text-ink">{frame.keystrokes}</span> keys typed
          <br />
          <span className="text-[22px] font-medium tracking-tight text-accent">{charactersWritten}</span> characters written
        </div>
      </div>
      <p className="mt-3 text-center font-mono text-[11px] text-ink-3">Illustrative demo. Timings are targets, not measurements.</p>
    </div>
  )
}
