import { useEffect, useRef } from 'react'

type FloatingKey = { label: string; x: number; y: number; depth: number; wide?: boolean; mobile?: boolean }

// Positions are % of the hero; depth scales both parallax and how far a key dodges the pointer.
const KEYS: FloatingKey[] = [
  { label: 'Y', x: 1.5, y: 15, depth: 0.9, mobile: true },
  { label: 'N', x: 90, y: 15, depth: 1.1, mobile: true },
  { label: '⇥ tab', x: 46, y: 39, depth: 0.7, wide: true },
  { label: 'A', x: 8, y: 44, depth: 0.6 },
  { label: 'F', x: 95, y: 36, depth: 1.3 },
  { label: '⌘', x: 2, y: 33, depth: 1.2 },
  { label: '?', x: 70, y: 10, depth: 0.5 },
  { label: '⏎', x: 23, y: 9, depth: 0.8 },
]

const DODGE_RADIUS_PX = 160
const DODGE_STRENGTH_PX = 46
const PARALLAX_PER_PX = 0.12
const EASE_PER_FRAME = 0.12

export function FloatingKeys() {
  const refs = useRef<(HTMLDivElement | null)[]>([])

  useEffect(() => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const pointer = { x: -9999, y: -9999 }
    const offsets = KEYS.map(() => ({ x: 0, y: 0 }))
    const onMove = (event: PointerEvent) => {
      pointer.x = event.clientX
      pointer.y = event.clientY
    }
    addEventListener('pointermove', onMove, { passive: true })

    let frame = 0
    const tick = () => {
      refs.current.forEach((element, index) => {
        if (!element) return
        const key = KEYS[index]
        const box = element.getBoundingClientRect()
        const dx = box.left + box.width / 2 - offsets[index].x - pointer.x
        const dy = box.top + box.height / 2 - offsets[index].y - pointer.y
        const distance = Math.hypot(dx, dy) || 1
        const push = Math.max(0, 1 - distance / DODGE_RADIUS_PX) * DODGE_STRENGTH_PX * key.depth
        const targetX = (dx / distance) * push
        const targetY = (dy / distance) * push - scrollY * PARALLAX_PER_PX * key.depth
        offsets[index].x += (targetX - offsets[index].x) * EASE_PER_FRAME
        offsets[index].y += (targetY - offsets[index].y) * EASE_PER_FRAME
        element.style.transform = `translate3d(${offsets[index].x}px, ${offsets[index].y}px, 0)`
      })
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(frame)
      removeEventListener('pointermove', onMove)
    }
  }, [])

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 hidden sm:block">
      {KEYS.map((key, index) => (
        <div
          key={key.label}
          ref={(element) => {
            refs.current[index] = element
          }}
          className={`absolute will-change-transform ${key.mobile ? '' : 'hidden lg:block'}`}
          style={{ left: `${key.x}%`, top: `${key.y}%` }}
        >
          <span
            className="keycap !h-12 !rounded-[11px] !text-[15px] opacity-80"
            style={{
              minWidth: key.wide ? 86 : 48,
              animation: `bob ${5 + index * 0.7}s ease-in-out ${index * -0.9}s infinite`,
              rotate: `${(index % 2 ? 1 : -1) * (4 + index)}deg`,
            }}
          >
            {key.label}
          </span>
        </div>
      ))}
    </div>
  )
}
