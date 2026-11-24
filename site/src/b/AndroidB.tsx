import { useInView } from 'motion/react'
import { useEffect, useRef, useState } from 'react'

const ROWS = ['qwertyuiop', 'asdfghjkl', 'zxcvbnm']
const ROW_OFFSET = [0, 14, 43]
const KEY_W = 25.5
const KEY_H = 34
const PITCH = 28.4
const ROW_Y = [404, 446, 488]
const ORIGIN_X = 8

const WORDS = [
  { word: 'thanks', alternatives: ['thank', 'than'] },
  { word: 'sounds', alternatives: ['sound', 'soon'] },
  { word: 'perfect', alternatives: ['perfectly', 'per'] },
]
const LETTER_MS = 280
const HOLD_MS = 1300
const HIT_GROW_PX = 9

const KEY_BOXES: Record<string, { x: number; y: number }> = Object.fromEntries(
  ROWS.flatMap((row, rowIndex) =>
    row.split('').map((letter, column) => [letter, { x: ORIGIN_X + ROW_OFFSET[rowIndex] + column * PITCH, y: ROW_Y[rowIndex] }]),
  ),
)

const centre = (letter: string) => ({ x: KEY_BOXES[letter].x + KEY_W / 2, y: KEY_BOXES[letter].y + KEY_H / 2 })

function useSwipe(running: boolean) {
  const [state, setState] = useState({ wordIndex: 0, letter: 0 })
  useEffect(() => {
    if (!running) return
    const word = WORDS[state.wordIndex].word
    const done = state.letter >= word.length - 1
    const timer = setTimeout(
      () => setState(done ? { wordIndex: (state.wordIndex + 1) % WORDS.length, letter: 0 } : { ...state, letter: state.letter + 1 }),
      done ? HOLD_MS : LETTER_MS,
    )
    return () => clearTimeout(timer)
  }, [running, state])
  return state
}

function Phone({ running }: { running: boolean }) {
  const { wordIndex, letter } = useSwipe(running)
  const { word, alternatives } = WORDS[wordIndex]
  const done = letter >= word.length - 1
  const path = word
    .slice(0, letter + 1)
    .split('')
    .map((char) => centre(char))
    .map((point, index) => `${index ? 'L' : 'M'}${point.x.toFixed(1)} ${point.y.toFixed(1)}`)
    .join(' ')
  const nextLetter = done ? '' : word[letter + 1]

  return (
    <svg viewBox="0 0 300 600" className="h-auto w-full max-w-[340px]" role="img" aria-label="Phone keyboard demo: keys you are about to hit grow larger landing zones">
      <rect x="1" y="1" width="298" height="598" rx="44" fill="var(--band)" stroke="var(--band-line)" strokeWidth="2" />
      <rect x="110" y="16" width="80" height="22" rx="11" fill="var(--bg-3)" opacity="0.4" />

      <g fontFamily="Geist, system-ui, sans-serif" fontSize="13">
        <rect x="20" y="80" width="150" height="38" rx="16" fill="var(--band-line)" />
        <text x="34" y="104" fill="var(--band-ink)">Dinner Thursday?</text>
        <rect x="20" y="300" width="260" height="40" rx="20" fill="none" stroke="var(--band-line)" />
        <text x="36" y="325" fill="var(--band-ink)">
          {word.slice(0, letter + 1)}
          <tspan fill="var(--band-ink-2)" fontStyle="italic">
            {done ? '' : word.slice(letter + 1)}
          </tspan>
        </text>
      </g>

      <g fontFamily="Geist, system-ui, sans-serif" fontSize="12" textAnchor="middle">
        {[alternatives[0], word, alternatives[1]].map((suggestion, index) => (
          <text key={suggestion} x={60 + index * 90} y={372} fill={index === 1 ? 'var(--hl)' : 'var(--band-ink-2)'}>
            {suggestion}
          </text>
        ))}
      </g>

      {Object.entries(KEY_BOXES).map(([char, box]) => {
        const predicted = char === nextLetter
        const grow = predicted ? HIT_GROW_PX : 0
        return (
          <g key={char}>
            <rect
              x={box.x - grow}
              y={box.y - grow}
              width={KEY_W + grow * 2}
              height={KEY_H + grow * 2}
              rx="9"
              fill="var(--hl)"
              fillOpacity={predicted ? 0.18 : 0}
              stroke="var(--hl)"
              strokeOpacity={predicted ? 0.9 : 0}
              strokeDasharray="3 3"
              style={{ transition: 'all 0.25s cubic-bezier(0.22, 1, 0.36, 1)' }}
            />
            <rect x={box.x} y={box.y} width={KEY_W} height={KEY_H} rx="6" fill="var(--band-line)" />
            <text
              x={box.x + KEY_W / 2}
              y={box.y + KEY_H / 2 + 5}
              textAnchor="middle"
              fontFamily="JetBrains Mono, monospace"
              fontSize="13"
              fill="var(--band-ink)"
            >
              {char}
            </text>
          </g>
        )
      })}

      <path d={path} fill="none" stroke="var(--hl)" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" opacity={done ? 0.35 : 0.9} style={{ transition: 'opacity 0.4s' }} />
      <rect x="110" y="576" width="80" height="5" rx="2.5" fill="var(--band-ink-2)" opacity="0.5" />
    </svg>
  )
}

export function AndroidB() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref)
  const reducedMotion = typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches

  return (
    <section id="android" className="bg-band px-5 py-28 text-band-ink sm:px-10 sm:py-36">
      <div className="mx-auto grid max-w-[1440px] items-center gap-14 lg:grid-cols-[1.2fr_1fr] lg:gap-20">
        <div>
          <div className="flex items-center gap-3">
            <span className="label !text-band-ink-2">Up next</span>
            <span className="rounded-full bg-hl px-2.5 py-0.5 font-mono text-[10.5px] font-medium tracking-wider text-hl-ink uppercase">In the lab</span>
          </div>
          <h2 className="serif mt-5 text-[52px] sm:text-[88px]">
            A keyboard for Android. <em className="text-band-ink-2 italic">Swipe sloppy, land exact.</em>
          </h2>
          <div className="mt-10 grid gap-8 sm:grid-cols-2">
            <div>
              <h3 className="font-serif text-[26px] italic">Keys that grow first</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-band-ink-2">
                The letter you are about to press gets a bigger invisible landing zone, sized by what you are likely to say next.
                The dashed box is that zone, made visible.
              </p>
            </div>
            <div>
              <h3 className="font-serif text-[26px] italic">Why a keyboard</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-band-ink-2">
                Phones only let the keyboard itself reshape keys. Android lets us ship one with an on-device model. iPhone
                follows.
              </p>
            </div>
          </div>
          <a href="#join" className="link-arrow mt-10 text-[15px]">
            Get Android early access →
          </a>
        </div>
        <div ref={ref} className="flex justify-center" data-cursor-label="hit targets">
          <Phone running={inView && !reducedMotion} />
        </div>
      </div>
    </section>
  )
}
