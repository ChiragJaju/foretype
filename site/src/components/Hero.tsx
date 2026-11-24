import { motion } from 'motion/react'
import { ArrowRight, ShieldCheck } from 'lucide-react'
import { useEffect, useState } from 'react'
import { FloatingKeys } from './FloatingKeys'
import { HeroDemo } from './HeroDemo'
import { Magnetic } from './Magnetic'

const GHOST_LINE = 'you type them.'
const TAB_PRESS_AT_MS = 1300
const ACCEPT_AT_MS = 1500
const CHAR_STAGGER_S = 0.022

type HeadlinePhase = 'ghost' | 'pressed' | 'accepted'

// The headline performs the product: line two arrives as ghost text and is accepted with Tab.
function Headline() {
  const [phase, setPhase] = useState<HeadlinePhase>('ghost')
  useEffect(() => {
    const press = setTimeout(() => setPhase('pressed'), TAB_PRESS_AT_MS)
    const accept = setTimeout(() => setPhase('accepted'), ACCEPT_AT_MS)
    return () => {
      clearTimeout(press)
      clearTimeout(accept)
    }
  }, [])
  const accepted = phase === 'accepted'

  return (
    <h1 className="display text-[44px] sm:text-[64px] lg:text-[76px]">
      <span className="block">
        Answers before
        {!accepted && <span className="caret !w-[3px]" />}
      </span>
      <span className="relative block">
        <span className="sr-only">{GHOST_LINE}</span>
        <span aria-hidden>
          {GHOST_LINE.split('').map((char, index) => (
            <motion.span
              key={index}
              className="inline-block whitespace-pre"
              initial={{ color: 'var(--ghost)' }}
              animate={accepted ? { color: 'var(--ink-3)', y: [0, -3, 0] } : { color: 'var(--ghost)' }}
              transition={{ delay: accepted ? index * CHAR_STAGGER_S : 0, duration: 0.35 }}
            >
              {char}
            </motion.span>
          ))}
          {accepted && <span className="caret !w-[3px]" />}
        </span>
        <motion.span
          aria-hidden
          className="keycap absolute -top-1 ml-4 hidden text-[15px] sm:inline-flex"
          data-pressed={phase !== 'ghost'}
          animate={{ opacity: accepted ? 0 : 1, scale: accepted ? 0.6 : 1 }}
          transition={{ delay: accepted ? 0.3 : 0, duration: 0.35 }}
          style={{ height: '2.2em' }}
        >
          ⇥ tab
        </motion.span>
      </span>
    </h1>
  )
}

export function Hero() {
  return (
    <section id="top" className="relative px-4 pt-32 pb-20 sm:px-6 sm:pt-40">
      <FloatingKeys />
      <div className="relative mx-auto max-w-[1240px]">
        <motion.a
          href="#privacy"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="mb-7 inline-flex items-center gap-2 rounded-full bg-bg-2 py-1 pr-3 pl-1 text-[13px] text-ink-2 shadow-ring"
        >
          <span className="rounded-full bg-ink px-2 py-0.5 font-mono text-[10.5px] font-medium tracking-wider text-bg uppercase">Open source</span>
          Local-first autocomplete for macOS
          <ArrowRight size={13} />
        </motion.a>

        <div className="grid items-end gap-8 lg:grid-cols-[1.35fr_1fr] lg:gap-16">
          <Headline />
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-[440px] pb-2"
          >
            <p className="text-[17px] leading-relaxed text-ink-2">
              Foretype reads what's on your screen — the question, the thread, the form — and suggests what you were about to
              write. Every key you press re-ranks it. Press Tab to take it. It runs on your Mac and sends nothing.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Magnetic>
                <a
                  href="#waitlist"
                  className="group inline-flex h-11 items-center gap-2 rounded-[10px] bg-ink px-5 text-[14.5px] font-medium text-bg"
                >
                  Join the Mac waitlist
                  <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
                </a>
              </Magnetic>
              <Magnetic>
                <a
                  href="#privacy"
                  className="inline-flex h-11 items-center gap-2 rounded-[10px] bg-bg-2 px-5 text-[14.5px] font-medium shadow-ring"
                >
                  <ShieldCheck size={15} /> How it stays local
                </a>
              </Magnetic>
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 1.1, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="mt-14 sm:mt-20"
        >
          <HeroDemo />
        </motion.div>
      </div>
    </section>
  )
}
