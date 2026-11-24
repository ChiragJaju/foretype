import { useInView } from 'motion/react'
import { ArrowRight, Grid2x2Check, Smartphone, Sparkles } from 'lucide-react'
import { lazy, Suspense, useRef } from 'react'
import { Magnetic } from './Magnetic'
import { Reveal } from './Reveal'

const KeyboardScene = lazy(() => import('./KeyboardScene'))

const FEATURES = [
  {
    icon: Grid2x2Check,
    title: 'Keys that grow before you hit them',
    body: 'The letter you are about to press gets a bigger invisible landing zone, sized by what you are likely to say next.',
  },
  {
    icon: Sparkles,
    title: 'Sloppy swipes, exact words',
    body: 'The same on-device model reads rough swipes and taps together with the conversation on screen.',
  },
  {
    icon: Smartphone,
    title: 'Why a keyboard, and why Android first',
    body: 'Phones only let the keyboard itself reshape keys. Android lets us ship one with an on-device model; iPhone follows.',
  },
]

export function Android() {
  const sceneRef = useRef<HTMLDivElement>(null)
  const sceneMounted = useInView(sceneRef, { once: true, margin: '300px 0px' })
  const sceneVisible = useInView(sceneRef)

  return (
    <section id="android" className="px-4 py-24 sm:px-6 sm:py-32">
      <div className="mx-auto grid max-w-[1240px] items-center gap-12 lg:grid-cols-[1fr_1.15fr] lg:gap-16">
        <div>
          <Reveal>
            <div className="mb-4 flex items-center gap-3">
              <span className="eyebrow">Up next</span>
              <span className="rounded-full bg-accent-soft px-2.5 py-0.5 font-mono text-[10.5px] font-medium tracking-wider text-accent uppercase">
                In the lab
              </span>
            </div>
            <h2 className="display text-[36px] sm:text-[52px]">
              A keyboard for Android.
              <span className="block text-ink-3">Swipe sloppy, land exact.</span>
            </h2>
          </Reveal>
          <div className="mt-10 space-y-7">
            {FEATURES.map((feature, index) => (
              <Reveal key={feature.title} delay={index * 0.06} className="flex gap-4">
                <feature.icon size={18} strokeWidth={1.6} className="mt-1 shrink-0 text-accent" />
                <div>
                  <h3 className="text-[17px] font-medium tracking-[-0.01em]">{feature.title}</h3>
                  <p className="mt-1 text-[14.5px] leading-relaxed text-ink-2">{feature.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
          <Reveal delay={0.2} className="mt-10">
            <Magnetic>
              <a
                href="#waitlist"
                className="group inline-flex h-11 items-center gap-2 rounded-[10px] bg-bg-2 px-5 text-[14.5px] font-medium shadow-ring"
              >
                Get Android early access
                <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
              </a>
            </Magnetic>
          </Reveal>
        </div>

        <Reveal delay={0.1}>
          <div
            ref={sceneRef}
            data-cursor-label="tilt"
            className="dot-grid relative aspect-[4/3.4] overflow-hidden rounded-[22px] bg-bg-2 shadow-ring"
          >
            <div className="absolute top-4 left-4 z-10 font-mono text-[11px] tracking-wider text-ink-3 uppercase">Hit targets · live</div>
            <Suspense fallback={null}>{sceneMounted && <KeyboardScene active={sceneVisible} />}</Suspense>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
