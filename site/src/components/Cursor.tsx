import { motion, useMotionValue, useSpring } from 'motion/react'
import { useEffect, useState } from 'react'

type CursorMode = 'default' | 'hover' | 'text' | 'label'

const RING_SIZE_PX: Record<CursorMode, number> = { default: 34, hover: 58, text: 0, label: 82 }
const OFFSCREEN_PX = -200

function modeFor(target: Element | null): { mode: CursorMode; label: string } {
  const labelled = target?.closest<HTMLElement>('[data-cursor-label]')
  if (labelled) return { mode: 'label', label: labelled.dataset.cursorLabel ?? '' }
  if (target?.closest('input, textarea, [data-cursor="text"]')) return { mode: 'text', label: '' }
  if (target?.closest('a, button, [data-cursor="hover"]')) return { mode: 'hover', label: '' }
  return { mode: 'default', label: '' }
}

export function Cursor() {
  const [enabled] = useState(
    () => matchMedia('(pointer: fine)').matches && !matchMedia('(prefers-reduced-motion: reduce)').matches,
  )
  const [state, setState] = useState<{ mode: CursorMode; label: string }>({ mode: 'default', label: '' })
  const [pressed, setPressed] = useState(false)
  const x = useMotionValue(OFFSCREEN_PX)
  const y = useMotionValue(OFFSCREEN_PX)
  const ringX = useSpring(x, { stiffness: 380, damping: 32, mass: 0.6 })
  const ringY = useSpring(y, { stiffness: 380, damping: 32, mass: 0.6 })

  useEffect(() => {
    if (!enabled) return
    document.documentElement.classList.add('has-cursor')

    const move = (event: PointerEvent) => {
      x.set(event.clientX)
      y.set(event.clientY)
    }
    const over = (event: PointerEvent) => setState(modeFor(event.target as Element))
    const leave = () => {
      x.set(OFFSCREEN_PX)
      y.set(OFFSCREEN_PX)
    }
    const down = () => setPressed(true)
    const up = () => setPressed(false)

    addEventListener('pointermove', move, { passive: true })
    addEventListener('pointerover', over, { passive: true })
    document.addEventListener('pointerleave', leave)
    addEventListener('pointerdown', down)
    addEventListener('pointerup', up)
    return () => {
      document.documentElement.classList.remove('has-cursor')
      removeEventListener('pointermove', move)
      removeEventListener('pointerover', over)
      document.removeEventListener('pointerleave', leave)
      removeEventListener('pointerdown', down)
      removeEventListener('pointerup', up)
    }
  }, [enabled, x, y])

  if (!enabled) return null
  const { mode, label } = state
  const ring = RING_SIZE_PX[mode] * (pressed ? 0.86 : 1)

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-[100]">
      <motion.div
        className="absolute top-0 left-0 flex items-center justify-center rounded-full border font-mono text-[11px] font-medium tracking-wide uppercase [box-shadow:0_0_22px_-4px_var(--key-glow)]"
        style={{ x: ringX, y: ringY, translateX: '-50%', translateY: '-50%' }}
        animate={{
          width: ring,
          height: ring,
          opacity: mode === 'text' ? 0 : 1,
          backgroundColor: mode === 'label' ? 'var(--ink)' : mode === 'hover' ? 'var(--accent-soft)' : 'rgba(0,0,0,0)',
          borderColor: mode === 'hover' ? 'var(--accent)' : 'var(--line-2)',
        }}
        transition={{ type: 'spring', stiffness: 320, damping: 26 }}
      >
        {mode === 'label' && <span className="text-bg">{label}</span>}
      </motion.div>
      <motion.div
        className="absolute top-0 left-0 rounded-full bg-ink"
        style={{ x, y, translateX: '-50%', translateY: '-50%' }}
        animate={{
          width: mode === 'text' ? 2 : 6,
          height: mode === 'text' ? 24 : 6,
          opacity: mode === 'hover' || mode === 'label' ? 0 : 1,
          backgroundColor: mode === 'text' ? 'var(--accent)' : 'var(--ink)',
        }}
        transition={{ type: 'spring', stiffness: 600, damping: 34 }}
      />
    </div>
  )
}
