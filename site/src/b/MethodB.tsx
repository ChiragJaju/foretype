import { motion } from 'motion/react'
import { useEffect, useState, type ReactNode } from 'react'
import { PinnedPanels } from '../components/PinnedPanels'

const DRAFT = 'Yes — see you at 8.'
const DRAFT_MS_PER_CHAR = 55

function ReadVisual({ active }: { active: boolean }) {
  return (
    <div className="rounded-sm border border-line bg-bg-2 p-6 text-[17px] leading-relaxed">
      <div className="label mb-4">Mail · AXStaticText</div>
      <p className="text-ink-2">
        Hey! <span className="marker text-ink" style={{ '--marker': active ? '100%' : '0%', transitionDelay: '0.2s', transitionDuration: '1s' }}>Are you free for dinner Thursday at 8?</span>{' '}
        Also, <span className="marker text-ink" style={{ '--marker': active ? '100%' : '0%', transitionDelay: '0.9s', transitionDuration: '1s' }}>which address should I send the invite to?</span>
      </p>
      <div className="mt-6 grid grid-cols-3 gap-3 font-mono text-[11px] text-ink-3">
        <span>source: Accessibility</span>
        <span>pixels read: 0</span>
        <span>kept after blur: no</span>
      </div>
    </div>
  )
}

function DraftVisual({ active }: { active: boolean }) {
  const [shown, setShown] = useState(0)
  useEffect(() => {
    if (!active) return
    const timer = setInterval(() => setShown((count) => (count >= DRAFT.length ? count : count + 1)), DRAFT_MS_PER_CHAR)
    return () => clearInterval(timer)
  }, [active])
  return (
    <div className="rounded-sm border border-line bg-bg-2 p-6">
      <div className="label mb-4 flex justify-between">
        <span>On-device model</span>
        <span>{Math.round((shown / DRAFT.length) * 142)} ms</span>
      </div>
      <p className="min-h-[2.2em] font-serif text-[40px] leading-tight italic sm:text-[48px]">
        <span className="caret-b" />
        <span className="text-ghost">{DRAFT.slice(0, shown)}</span>
      </p>
    </div>
  )
}

const BRANCHES = [
  { key: 'Y', answer: 'Yes — see you at 8.' },
  { key: 'N', answer: "No, Thursday's packed. Friday?" },
  { key: 'M', answer: 'Maybe — let me check tonight.' },
]

function FollowVisual({ active }: { active: boolean }) {
  const [branch, setBranch] = useState(0)
  useEffect(() => {
    if (!active) return
    const timer = setInterval(() => setBranch((index) => (index + 1) % BRANCHES.length), 1400)
    return () => clearInterval(timer)
  }, [active])
  return (
    <div className="rounded-sm border border-line bg-bg-2 p-6">
      <div className="label mb-5">Key → answer</div>
      <div className="grid grid-cols-[auto_1fr] items-center gap-x-5 gap-y-3">
        {BRANCHES.map((item, index) => {
          const on = index === branch
          return (
            <div key={item.key} className="contents">
              <span className={`kbd !h-9 !min-w-9 !text-[14px] transition-colors ${on ? '!border-ink !bg-hl !text-hl-ink' : ''}`}>{item.key}</span>
              <span className={`font-serif text-[26px] transition-colors duration-300 sm:text-[30px] ${on ? 'text-ink' : 'text-ghost'}`}>
                {item.answer}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

const PANELS: { title: string; italic: string; body: string; visual: (active: boolean) => ReactNode }[] = [
  {
    title: 'It reads',
    italic: 'the question.',
    body: 'Click into a field and Foretype asks macOS for the text around it through the Accessibility API: the thread, the labels, the ask. Text, never screenshots by default.',
    visual: (active) => <ReadVisual active={active} />,
  },
  {
    title: 'It drafts',
    italic: 'the answer.',
    body: 'A small model on your Mac writes the reply you were about to type, in your voice, before your first key. No round trip, no server.',
    visual: (active) => <DraftVisual key={String(active)} active={active} />,
  },
  {
    title: 'It follows',
    italic: 'your keys.',
    body: 'Every key re-ranks the guesses. Type N and yes becomes no. Press Tab to take it, or keep typing and it gets out of the way.',
    visual: (active) => <FollowVisual active={active} />,
  },
]

export function MethodB() {
  return (
    <PinnedPanels
      id="method"
      count={PANELS.length}
      header={(active, wide) => (
        <div className="flex items-center justify-between px-5 pt-24 sm:px-10">
          <span className="label">Method · three steps</span>
          {wide && (
            <span className="label flex gap-2">
              {PANELS.map((panel, index) => (
                <span key={panel.title} className={`h-1.5 w-8 rounded-full transition-colors ${index === active ? 'bg-ink dark:bg-hl' : 'bg-line-2'}`} />
              ))}
            </span>
          )}
        </div>
      )}
      panel={(index, active) => {
        const panel = PANELS[index]
        return (
          <div className="grid h-full content-center gap-10 px-5 py-14 sm:px-10 lg:grid-cols-[1fr_1fr] lg:gap-16 lg:py-0">
            <div>
              <div className="font-serif text-[120px] leading-none text-ghost italic sm:text-[180px]">0{index + 1}</div>
              <h2 className="serif mt-4 text-[52px] sm:text-[80px]">
                {panel.title} <em className="italic">{panel.italic}</em>
              </h2>
              <p className="mt-6 max-w-[460px] text-[16.5px] leading-relaxed text-ink-2">{panel.body}</p>
            </div>
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            >
              {panel.visual(active)}
            </motion.div>
          </div>
        )
      }}
    />
  )
}
