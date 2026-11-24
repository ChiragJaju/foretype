import { animate, useInView } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { Reveal } from './Reveal'

const STATS = [
  { value: 56, prefix: 'up to ', suffix: '%', label: 'fewer keystrokes when prediction can see the conversation', note: 'Google SpeakFaster study, 2024' },
  { value: 150, prefix: '~', suffix: ' ms', label: 'target time from focus to suggestion on Apple Silicon', note: 'Design target' },
  { value: 0, prefix: '', suffix: ' bytes', label: 'leave your Mac in local mode', note: 'Verifiable: open-source core' },
  { value: 1, prefix: '', suffix: ' key', label: 'to take a suggestion. Keep typing to ignore it.', note: 'Tab' },
]

function CountUp({ to }: { to: number }) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true })
  const [shown, setShown] = useState(0)
  useEffect(() => {
    if (!inView) return
    const controls = animate(0, to, { duration: 1.4, ease: [0.22, 1, 0.36, 1], onUpdate: (latest) => setShown(Math.round(latest)) })
    return () => controls.stop()
  }, [inView, to])
  return <span ref={ref}>{shown}</span>
}

export function Numbers() {
  return (
    <section className="px-4 py-24 sm:px-6">
      <div className="mx-auto grid max-w-[1240px] gap-px overflow-hidden rounded-2xl bg-line shadow-ring sm:grid-cols-2 lg:grid-cols-4">
        {STATS.map((stat, index) => (
          <Reveal key={stat.label} delay={index * 0.06} className="h-full bg-bg-2 p-6">
            <div className="text-[44px] leading-none font-medium tracking-[-0.04em]">
              <span className="text-[18px] tracking-normal text-ink-3">{stat.prefix}</span>
              <CountUp to={stat.value} />
              <span className="text-[22px] tracking-[-0.02em] text-ink-2">{stat.suffix}</span>
            </div>
            <p className="mt-3 text-[14px] leading-snug text-ink-2">{stat.label}</p>
            <p className="mt-4 font-mono text-[10.5px] tracking-wider text-ink-3 uppercase">{stat.note}</p>
          </Reveal>
        ))}
      </div>
    </section>
  )
}
