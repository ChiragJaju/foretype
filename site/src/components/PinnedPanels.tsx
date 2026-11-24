import { motion, useMotionValueEvent, useScroll, useTransform } from 'motion/react'
import { useEffect, useRef, useState, type ReactNode } from 'react'

const WIDE_QUERY = '(min-width: 1024px)'

function useWideScreen() {
  const [wide, setWide] = useState(() => matchMedia(WIDE_QUERY).matches)
  useEffect(() => {
    const list = matchMedia(WIDE_QUERY)
    const onChange = () => setWide(list.matches)
    list.addEventListener('change', onChange)
    return () => list.removeEventListener('change', onChange)
  }, [])
  return wide
}

type PinnedPanelsProps = {
  id: string
  count: number
  header: (active: number, wide: boolean) => ReactNode
  panel: (index: number, active: boolean) => ReactNode
}

// On wide screens the section pins and vertical scroll slides the panels sideways;
// on narrow screens the panels simply stack.
export function PinnedPanels({ id, count, header, panel }: PinnedPanelsProps) {
  const wide = useWideScreen()
  const ref = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] })
  const x = useTransform(scrollYProgress, [0, 1], ['0%', `-${((count - 1) / count) * 100}%`])
  const [active, setActive] = useState(0)
  useMotionValueEvent(scrollYProgress, 'change', (value) => setActive(Math.min(count - 1, Math.round(value * (count - 1)))))

  return (
    <section id={id} ref={ref} className="relative" style={{ height: wide ? `${count * 100}vh` : 'auto' }}>
      <div className={wide ? 'sticky top-0 h-screen overflow-hidden' : ''}>
        {header(active, wide)}
        <motion.div
          className={wide ? 'flex h-[calc(100%-6rem)]' : 'flex flex-col'}
          style={wide ? { x, width: `${count * 100}%` } : undefined}
        >
          {Array.from({ length: count }, (_, index) => (
            <div key={index} className="lg:h-full lg:min-w-0 lg:flex-1">
              {panel(index, wide ? index === active : true)}
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
