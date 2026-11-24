import { motion, useMotionValue, useSpring } from 'motion/react'
import { useRef, type ReactNode } from 'react'

const PULL = 0.28

// Lets a button lean toward the pointer while it hovers, then spring back.
export function Magnetic({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const springX = useSpring(x, { stiffness: 260, damping: 18 })
  const springY = useSpring(y, { stiffness: 260, damping: 18 })

  const onMove = (event: React.PointerEvent) => {
    if (event.pointerType !== 'mouse' || !ref.current) return
    const box = ref.current.getBoundingClientRect()
    x.set((event.clientX - (box.left + box.width / 2)) * PULL)
    y.set((event.clientY - (box.top + box.height / 2)) * PULL)
  }
  const reset = () => {
    x.set(0)
    y.set(0)
  }

  return (
    <motion.div
      ref={ref}
      className={`inline-block ${className ?? ''}`}
      style={{ x: springX, y: springY }}
      onPointerMove={onMove}
      onPointerLeave={reset}
    >
      {children}
    </motion.div>
  )
}
