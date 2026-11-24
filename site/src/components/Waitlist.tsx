import { motion } from 'motion/react'
import { ArrowRight, Check } from 'lucide-react'
import { useState } from 'react'
import { emailGhost } from '../lib/predict'
import { Logo } from './Nav'
import { Magnetic } from './Magnetic'
import { Reveal } from './Reveal'

type Platform = 'mac' | 'android'

function WaitlistForm() {
  const [email, setEmail] = useState('')
  const [platform, setPlatform] = useState<Platform>('mac')
  const [joined, setJoined] = useState(false)
  const ghost = emailGhost(email)

  if (joined) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className="mx-auto flex max-w-[460px] items-center justify-center gap-3 rounded-2xl bg-bg-2 px-5 py-4 text-[15px] shadow-ring"
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-accent text-accent-ink">
          <Check size={15} />
        </span>
        You're on the {platform === 'mac' ? 'Mac' : 'Android'} list. Draft site: not stored yet.
      </motion.div>
    )
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault()
        if (email.includes('@')) setJoined(true)
      }}
      className="mx-auto max-w-[520px]"
    >
      <div className="mb-3 inline-flex rounded-[10px] bg-bg-3 p-1 text-[13px]">
        {(['mac', 'android'] as const).map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => setPlatform(option)}
            className="relative rounded-[7px] px-3.5 py-1.5 font-medium"
          >
            {platform === option && (
              <motion.span layoutId="platform-pill" className="absolute inset-0 rounded-[7px] bg-bg-2 shadow-ring" transition={{ type: 'spring', stiffness: 400, damping: 32 }} />
            )}
            <span className={`relative ${platform === option ? 'text-ink' : 'text-ink-2'}`}>
              {option === 'mac' ? 'macOS' : 'Android · soon'}
            </span>
          </button>
        ))}
      </div>
      <div className="flex gap-2 rounded-[14px] bg-bg-2 p-1.5 shadow-ring focus-within:shadow-[0_0_0_4px_var(--accent-soft),var(--ring)]">
        <div className="relative min-w-0 flex-1 text-[15px]">
          <span aria-hidden className="pointer-events-none absolute inset-0 flex items-center overflow-hidden px-3 whitespace-pre text-transparent">
            {email}
            <span className="text-ghost">{ghost}</span>
          </span>
          <input
            type="email"
            required
            value={email}
            placeholder="you@company.com"
            aria-label="Email address"
            onChange={(event) => setEmail(event.target.value)}
            onKeyDown={(event) => {
              if (event.key !== 'Tab' || !ghost) return
              event.preventDefault()
              setEmail(email + ghost)
            }}
            className="relative h-11 w-full bg-transparent px-3 caret-accent outline-none placeholder:text-ink-3"
          />
        </div>
        <Magnetic>
          <button type="submit" className="group inline-flex h-11 items-center gap-2 rounded-[10px] bg-ink px-4 text-[14.5px] font-medium text-bg sm:px-5">
            Join
            <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
          </button>
        </Magnetic>
      </div>
      <p className="mt-3 text-[13px] text-ink-3">
        Type your email and watch the domain arrive. <span className="keycap align-middle">tab</span> takes it.
      </p>
    </form>
  )
}

export function Waitlist() {
  return (
    <section id="waitlist" className="relative overflow-hidden px-4 py-28 text-center sm:px-6 sm:py-36">
      <div className="pointer-events-none absolute inset-x-0 top-0 mx-auto h-[560px] max-w-[1000px] bg-[radial-gradient(closest-side,var(--accent-soft),transparent)]" />
      <Reveal className="relative">
        <h2 className="display text-[40px] sm:text-[64px]">
          Stop typing what
          <span className="block text-ink-3">your Mac already knows.</span>
        </h2>
        <p className="mx-auto mt-5 max-w-[460px] text-[16px] leading-relaxed text-ink-2">
          The Mac beta opens to the waitlist first, together with the source code.
        </p>
        <div className="mt-9">
          <WaitlistForm />
        </div>
      </Reveal>
    </section>
  )
}

export function Footer() {
  return (
    <footer className="overflow-hidden px-4 pt-10 sm:px-6">
      <div className="mx-auto flex max-w-[1240px] flex-wrap items-center justify-between gap-4 border-t border-line pt-6 text-[13.5px] text-ink-2">
        <Logo />
        <nav className="flex gap-6">
          <a href="#how" className="hover:text-ink">How it works</a>
          <a href="#privacy" className="hover:text-ink">Privacy</a>
          <a href="#android" className="hover:text-ink">Android</a>
        </nav>
        <span>© 2026 Foretype</span>
      </div>
      <div aria-hidden className="mx-auto mt-10 max-w-[1240px] pb-[0.06em] text-center text-[25vw] leading-[0.95] font-medium tracking-[-0.06em] select-none sm:text-[22vw] lg:text-[290px]">
        <span>Fore</span>
        <span className="text-ghost">type</span>
      </div>
    </footer>
  )
}
