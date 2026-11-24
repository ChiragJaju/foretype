import { motion } from 'motion/react'
import type { ReactNode } from 'react'

const REVEAL_OFFSET_PX = 24

export function Reveal({ children, delay = 0, className }: { children: ReactNode; delay?: number; className?: string }) {
  return (
    <motion.div
      className={`min-w-0 ${className ?? ''}`}
      initial={{ opacity: 0, y: REVEAL_OFFSET_PX, filter: 'blur(6px)' }}
      whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      viewport={{ once: true, margin: '-12% 0px' }}
      transition={{ duration: 0.8, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  )
}
