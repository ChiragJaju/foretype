import { AnimatePresence, motion, useMotionValueEvent, useScroll } from 'motion/react'
import { Moon, Sun } from 'lucide-react'
import { useState } from 'react'
import { useRepoLink } from '../lib/activity'
import { useTheme } from '../lib/theme'
import { Magnetic } from './Magnetic'

const LINKS = [
  { href: '#how', label: 'How it works' },
  { href: '#try', label: 'Try it' },
  { href: '#privacy', label: 'Privacy' },
  { href: '#build-log', label: 'Build log' },
  { href: '#android', label: 'Android' },
]

const SCROLLED_AFTER_PX = 12

export function Logo() {
  return (
    <a href="#top" className="flex items-center gap-2 text-[15px] font-medium tracking-[-0.01em]">
      <svg width="22" height="22" viewBox="0 0 32 32" aria-hidden>
        <rect width="32" height="32" rx="8" className="fill-ink" />
        <rect x="9" y="8" width="2.5" height="16" rx="1.25" className="fill-bg" />
        <path d="M15 16h9" className="stroke-accent" strokeWidth="2.5" strokeLinecap="round" strokeDasharray="1 4" />
      </svg>
      Foretype
    </a>
  )
}

function ThemeToggle() {
  const { theme, toggle } = useTheme()
  const dark = theme === 'dark'
  return (
    <button
      type="button"
      aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
      onClick={(event) => {
        const box = event.currentTarget.getBoundingClientRect()
        toggle({ origin: { x: box.left + box.width / 2, y: box.top + box.height / 2 } })
      }}
      className="keycap relative !h-9 !w-9 !rounded-[9px] !p-0 active:translate-y-[2px]"
    >
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={theme}
          initial={{ rotate: -90, scale: 0.4, opacity: 0 }}
          animate={{ rotate: 0, scale: 1, opacity: 1 }}
          exit={{ rotate: 90, scale: 0.4, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          className="flex"
        >
          {dark ? <Moon size={15} strokeWidth={1.8} /> : <Sun size={15} strokeWidth={1.8} />}
        </motion.span>
      </AnimatePresence>
    </button>
  )
}

function SourceLink() {
  const { repoPublic, ...link } = useRepoLink()
  if (repoPublic) {
    return (
      <a {...link} className="transition-colors hover:text-ink">
        GitHub
      </a>
    )
  }
  return (
    <a {...link} title="Source opens with the beta" className="flex items-center gap-1.5 transition-colors hover:text-ink">
      Source
      <span className="rounded bg-bg-3 px-1 py-px font-mono text-[10px] tracking-wider text-ink-3 uppercase">beta</span>
    </a>
  )
}

export function Nav() {
  const { scrollY } = useScroll()
  const [scrolled, setScrolled] = useState(false)
  useMotionValueEvent(scrollY, 'change', (value) => setScrolled(value > SCROLLED_AFTER_PX))

  return (
    <header className="fixed inset-x-0 top-0 z-50 px-4 pt-3 sm:px-6">
      <nav
        className={`mx-auto flex h-14 max-w-[1240px] items-center justify-between rounded-2xl px-3 transition-[background-color,box-shadow,backdrop-filter] duration-500 sm:px-4 ${
          scrolled ? 'bg-bg/75 shadow-ring backdrop-blur-xl' : ''
        }`}
      >
        <Logo />
        <div className="hidden items-center gap-7 text-[14px] text-ink-2 md:flex">
          {LINKS.map((link) => (
            <a key={link.href} href={link.href} className="transition-colors hover:text-ink">
              {link.label}
            </a>
          ))}
          <SourceLink />
        </div>
        <div className="flex items-center gap-2.5">
          <ThemeToggle />
          <Magnetic>
            <a
              href="#waitlist"
              className="inline-flex h-9 items-center rounded-[9px] bg-ink px-3.5 text-[13.5px] font-medium text-bg transition-transform active:scale-[0.97]"
            >
              Join waitlist
            </a>
          </Magnetic>
        </div>
      </nav>
    </header>
  )
}
