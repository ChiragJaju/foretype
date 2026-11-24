import { LayoutGroup, motion } from 'motion/react'
import { RotateCcw } from 'lucide-react'
import { useState } from 'react'
import { ghostFor, rank, type Candidate } from '../lib/predict'
import { Reveal } from './Reveal'

type FieldId = 'reply' | 'address'

const FIELDS: Record<FieldId, { label: string; hint: string; candidates: Candidate[]; multiline: boolean }> = {
  reply: {
    label: 'Your reply',
    hint: 'Try typing “n”',
    multiline: true,
    candidates: [
      { text: 'Yes, 3pm works. See you there.', prior: 0.55, tag: 'Accept' },
      { text: "No, I'm out tomorrow. Could we move it to Friday?", prior: 0.25, tag: 'Decline' },
      { text: "Maybe. I'll confirm by noon.", prior: 0.12, tag: 'Hold' },
      { text: "Sure, I'll bring the latest mocks.", prior: 0.08, tag: 'Accept' },
    ],
  },
  address: {
    label: 'Shipping address',
    hint: 'Try typing “F”',
    multiline: false,
    candidates: [
      { text: 'Alder House, 14 Alder Lane, Brooklyn, NY 11201', prior: 0.6, tag: 'Home' },
      { text: 'Foundry Works, Floor 3, 88 Mission St, San Francisco, CA 94105', prior: 0.3, tag: 'Office' },
      { text: '27 Fernhill Road, Austin, TX 78704', prior: 0.1, tag: 'Parents' },
    ],
  },
}

const EMPTY: Record<FieldId, string> = { reply: '', address: '' }
const FIELD_TEXT = 'text-[15px] leading-[1.6]'

function GhostField({
  id,
  value,
  onChange,
  onFocus,
  onAccept,
  onKey,
}: {
  id: FieldId
  value: string
  onChange: (value: string) => void
  onFocus: () => void
  onAccept: (ghost: string) => void
  onKey: () => void
}) {
  const field = FIELDS[id]
  const ghost = ghostFor(value, field.candidates)
  const shared = `${FIELD_TEXT} w-full px-3.5 py-3 whitespace-pre-wrap break-words`

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Tab' && ghost) {
      event.preventDefault()
      onAccept(ghost)
      return
    }
    if (event.key === 'Enter' && !field.multiline) {
      event.preventDefault()
      return
    }
    if (event.key.length === 1 || event.key === 'Backspace') onKey()
  }

  return (
    <label className="block">
      <span className="mb-1.5 flex items-center justify-between text-[13px] text-ink-2">
        {field.label}
        <span className="font-hand text-[18px] text-accent">{field.hint}</span>
      </span>
      <span className="relative block rounded-lg border border-line-2 bg-bg transition-shadow focus-within:border-accent focus-within:shadow-[0_0_0_4px_var(--accent-soft)]">
        <span aria-hidden className={`${shared} pointer-events-none absolute inset-0 text-transparent`}>
          {value}
          <span className="text-ghost">{ghost}</span>
        </span>
        <textarea
          value={value}
          rows={field.multiline ? 3 : 2}
          spellCheck={false}
          autoComplete="off"
          aria-label={field.label}
          onFocus={onFocus}
          onKeyDown={onKeyDown}
          onChange={(event) => onChange(event.target.value)}
          className={`${shared} relative block resize-none bg-transparent text-ink caret-accent outline-none`}
        />
        {ghost && (
          <button
            type="button"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => onAccept(ghost)}
            className="keycap absolute right-2.5 bottom-2.5"
            aria-label="Accept suggestion"
          >
            ⇥ tab
          </button>
        )}
      </span>
    </label>
  )
}

export function Playground() {
  const [values, setValues] = useState(EMPTY)
  const [focused, setFocused] = useState<FieldId>('reply')
  const [keys, setKeys] = useState(0)
  const [accepted, setAccepted] = useState(0)

  const ranked = rank(values[focused], FIELDS[focused].candidates)
  const written = values.reply.length + values.address.length

  const fieldProps = (id: FieldId) => ({
    id,
    value: values[id],
    onChange: (value: string) => setValues((current) => ({ ...current, [id]: value })),
    onFocus: () => setFocused(id),
    onKey: () => setKeys((count) => count + 1),
    onAccept: (ghost: string) => {
      setKeys((count) => count + 1)
      setAccepted((count) => count + ghost.length)
      setValues((current) => ({ ...current, [id]: current[id] + ghost }))
    },
  })

  return (
    <section id="try" className="px-4 py-24 sm:px-6 sm:py-32">
      <div className="mx-auto max-w-[1240px]">
        <Reveal>
          <div className="eyebrow mb-4">Try it</div>
          <h2 className="display max-w-[760px] text-[36px] sm:text-[52px]">
            Type one letter.
            <span className="block text-ink-3">Watch the guess change.</span>
          </h2>
        </Reveal>

        <Reveal delay={0.1} className="mt-12 grid gap-4 lg:grid-cols-[1.4fr_1fr]">
          <div className="rounded-2xl bg-bg-2 p-5 shadow-ring sm:p-7">
            <div className="mb-5 rounded-lg bg-bg-3/60 px-4 py-3 text-[14px] text-ink-2">
              <span className="font-medium text-ink">Priya, Design lead</span> · Slack
              <p className="mt-1">Can you make the 3pm design review tomorrow? Also, where should I ship the prototype?</p>
            </div>
            <div className="space-y-5">
              <GhostField {...fieldProps('reply')} />
              <GhostField {...fieldProps('address')} />
            </div>
            <p className="mt-4 font-mono text-[11px] text-ink-3">
              This demo runs a scripted ranker in your browser. The app uses a local model; neither sends anything.
            </p>
          </div>

          <div className="flex flex-col gap-4">
            <div className="rounded-2xl bg-bg-2 p-5 shadow-ring">
              <div className="flex items-center justify-between font-mono text-[11px] tracking-wider text-ink-3 uppercase">
                <span>Live ranking · {FIELDS[focused].label}</span>
                <span>“{values[focused].slice(-8) || '∅'}”</span>
              </div>
              <LayoutGroup>
                <ul className="mt-3 space-y-1.5">
                  {ranked.map((item, position) => (
                    <motion.li
                      layout
                      key={item.text}
                      transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                      className={`relative overflow-hidden rounded-lg px-3 py-2 text-[13px] ${item.matches ? '' : 'text-ink-3'}`}
                    >
                      <motion.span
                        className="absolute inset-y-0 left-0 rounded-lg bg-accent-soft"
                        animate={{ width: `${Math.round(item.score * 100)}%` }}
                        transition={{ type: 'spring', stiffness: 220, damping: 30 }}
                      />
                      <span className="relative flex items-center justify-between gap-3">
                        <span className={`truncate ${item.matches ? '' : 'line-through decoration-line-2'}`}>
                          <span className="mr-2 font-mono text-[10.5px] text-ink-3 uppercase">{item.tag}</span>
                          {item.text}
                        </span>
                        <span className={`font-mono text-[11px] ${position === 0 && item.matches ? 'text-accent' : 'text-ink-3'}`}>
                          {Math.round(item.score * 100)}%
                        </span>
                      </span>
                    </motion.li>
                  ))}
                </ul>
              </LayoutGroup>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-2xl bg-bg-2 p-5 shadow-ring">
                <div className="font-mono text-[11px] tracking-wider text-ink-3 uppercase">Keys pressed</div>
                <div className="mt-1 text-[40px] leading-none font-medium tracking-[-0.03em]">{keys}</div>
              </div>
              <div className="rounded-2xl bg-bg-2 p-5 shadow-ring">
                <div className="font-mono text-[11px] tracking-wider text-ink-3 uppercase">Characters written</div>
                <div className="mt-1 text-[40px] leading-none font-medium tracking-[-0.03em] text-accent">{written}</div>
              </div>
            </div>
            <div className="flex items-center justify-between rounded-2xl bg-bg-2 px-5 py-4 text-[13.5px] text-ink-2 shadow-ring">
              <span>{accepted ? `${accepted} characters came from Tab.` : 'Press Tab to take a suggestion.'}</span>
              <button
                type="button"
                onClick={() => {
                  setValues(EMPTY)
                  setKeys(0)
                  setAccepted(0)
                }}
                className="inline-flex items-center gap-1.5 text-ink transition-opacity hover:opacity-70"
              >
                <RotateCcw size={13} /> Reset
              </button>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
