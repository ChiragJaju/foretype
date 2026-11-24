import { motion, useMotionValue } from 'motion/react'
import { useEffect, useRef, useState } from 'react'

const TRAIL_TEXT = 'answers before you type them · tab · '
const TRAIL_SPACING_PX = 30
const TRAIL_FADE_MS = 900
const IDLE_BLINK_AFTER_MS = 450

type CaretMode = 'caret' | 'mark' | 'label'

function modeFor(target: Element | null): { mode: CaretMode; label: string } {
  const labelled = target?.closest<HTMLElement>('[data-cursor-label]')
  if (labelled) return { mode: 'label', label: labelled.dataset.cursorLabel ?? '' }
  if (target?.closest('a, button')) return { mode: 'mark', label: '' }
  return { mode: 'caret', label: '' }
}

// The pointer is a text caret that leaves a fading line of ghost letters behind it.
export function CaretCursor() {
  const [enabled] = useState(
    () => matchMedia('(pointer: fine)').matches && !matchMedia('(prefers-reduced-motion: reduce)').matches,
  )
  const [state, setState] = useState<{ mode: CaretMode; label: string }>({ mode: 'caret', label: '' })
  const [idle, setIdle] = useState(true)
  const trail = useRef<HTMLDivElement>(null)
  const x = useMotionValue(-200)
  const y = useMotionValue(-200)

  useEffect(() => {
    if (!enabled) return
    document.documentElement.classList.add('has-cursor')

    let last = { x: 0, y: 0 }
    let letterIndex = 0
    let idleTimer = 0
    let overInteractive = false

    const spawnLetter = (px: number, py: number) => {
      const container = trail.current
      if (!container) return
      const letter = document.createElement('span')
      letter.textContent = TRAIL_TEXT[letterIndex % TRAIL_TEXT.length]
      letterIndex += 1
      letter.className = 'absolute font-serif text-[22px] italic text-ghost'
      letter.style.left = `${px + 10}px`
      letter.style.top = `${py - 14}px`
      container.appendChild(letter)
      letter
        .animate([{ opacity: 0.9, transform: 'translateY(0)' }, { opacity: 0, transform: 'translateY(-16px)' }], {
          duration: TRAIL_FADE_MS,
          easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
        })
        .finished.then(() => letter.remove())
    }

    const move = (event: PointerEvent) => {
      x.set(event.clientX)
      y.set(event.clientY)
      setIdle(false)
      clearTimeout(idleTimer)
      idleTimer = window.setTimeout(() => setIdle(true), IDLE_BLINK_AFTER_MS)
      if (overInteractive) return
      if (Math.hypot(event.clientX - last.x, event.clientY - last.y) < TRAIL_SPACING_PX) return
      last = { x: event.clientX, y: event.clientY }
      spawnLetter(event.clientX, event.clientY)
    }
    const over = (event: PointerEvent) => {
      const next = modeFor(event.target as Element)
      overInteractive = next.mode !== 'caret'
      setState(next)
    }

    addEventListener('pointermove', move, { passive: true })
    addEventListener('pointerover', over, { passive: true })
    return () => {
      clearTimeout(idleTimer)
      document.documentElement.classList.remove('has-cursor')
      removeEventListener('pointermove', move)
      removeEventListener('pointerover', over)
    }
  }, [enabled, x, y])

  if (!enabled) return null
  const { mode, label } = state

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-[100]">
      <div ref={trail} className="absolute inset-0 overflow-hidden" />
      <motion.div className="absolute top-0 left-0" style={{ x, y }}>
        <motion.div
          className={`absolute rounded-[2px] ${mode === 'mark' ? 'bg-hl mix-blend-multiply dark:mix-blend-normal dark:opacity-40' : 'bg-ink dark:bg-hl dark:shadow-[0_0_14px_var(--hl)]'}`}
          animate={{
            width: mode === 'mark' ? 46 : 2,
            height: mode === 'mark' ? 24 : 26,
            x: mode === 'mark' ? -23 : -1,
            y: mode === 'mark' ? -12 : -13,
            opacity: mode !== 'mark' && idle ? [1, 0, 1] : 1,
          }}
          transition={{
            width: { type: 'spring', stiffness: 500, damping: 32 },
            height: { type: 'spring', stiffness: 500, damping: 32 },
            opacity: idle && mode !== 'mark' ? { duration: 1, repeat: Infinity, times: [0, 0.5, 1], ease: 'linear' } : { duration: 0.1 },
          }}
        />
        {mode === 'label' && (
          <span className="absolute top-3 left-3 rounded bg-hl px-1.5 py-0.5 font-mono text-[10.5px] font-medium tracking-wide whitespace-nowrap text-hl-ink uppercase">
            {label}
          </span>
        )}
      </motion.div>
    </div>
  )
}
