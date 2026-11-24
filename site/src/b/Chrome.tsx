import { motion, useScroll } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { THEME_REVEAL_MS, useTheme } from '../lib/theme'
import { SECTIONS } from './sections'


export function Wordmark() {
  return (
    <a href="#top" className="flex items-baseline gap-1 font-serif text-[26px] leading-none tracking-[-0.02em] italic">
      Foretype
      <span className="inline-block h-[0.62em] w-[0.36em] translate-y-[1px] bg-hl" />
    </a>
  )
}

// Theme switch whose reveal is a scan line sweeping down the page.
function ThemeSwitch() {
  const { theme, toggle } = useTheme()
  const scan = useRef<HTMLDivElement>(null)

  const onToggle = () => {
    toggle({ reveal: 'wipe' })
    if (matchMedia('(prefers-reduced-motion: reduce)').matches || !document.startViewTransition) return
    scan.current?.animate([{ top: '-6px', opacity: 1 }, { top: '100vh', opacity: 1 }, { top: '100vh', opacity: 0 }], {
      duration: THEME_REVEAL_MS + 80,
      easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
    })
  }

  return (
    <>
      <div ref={scan} aria-hidden className="pointer-events-none fixed inset-x-0 -top-2 z-[95] h-[6px] bg-hl opacity-0 shadow-[0_0_30px_6px_var(--hl)]" />
      <button
        type="button"
        onClick={onToggle}
        aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        className="relative flex rounded-full border border-line-2 p-0.5 font-mono text-[11px] tracking-wide uppercase"
      >
        {(['light', 'dark'] as const).map((option) => (
          <span key={option} className="relative px-2.5 py-1">
            {theme === option && (
              <motion.span layoutId="theme-pill-b" className="absolute inset-0 rounded-full bg-hl" transition={{ type: 'spring', stiffness: 420, damping: 32 }} />
            )}
            <span className={`relative ${theme === option ? 'text-hl-ink' : 'text-ink-3'}`}>{option}</span>
          </span>
        ))}
      </button>
    </>
  )
}

export function TopBar() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-line bg-bg/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between px-5 sm:px-10">
        <Wordmark />
        <nav className="hidden items-center gap-8 font-mono text-[11.5px] tracking-wide text-ink-2 uppercase lg:flex">
          {SECTIONS.slice(1, 5).map((section) => (
            <a key={section.id} href={`#${section.id}`} className="hover:text-ink">
              {section.label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-5">
          <ThemeSwitch />
          <a href="#join" className="link-arrow hidden text-[14px] sm:inline-flex">
            Join waitlist →
          </a>
        </div>
      </div>
    </header>
  )
}

// A left-edge table of contents that tracks the section in view.
export function Rail() {
  const [active, setActive] = useState('top')
  const { scrollYProgress } = useScroll()

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => entries.filter((entry) => entry.isIntersecting).forEach((entry) => setActive(entry.target.id)),
      { rootMargin: '-45% 0px -50% 0px' },
    )
    SECTIONS.forEach((section) => {
      const element = document.getElementById(section.id)
      if (element) observer.observe(element)
    })
    return () => observer.disconnect()
  }, [])

  return (
    <aside className="fixed top-1/2 left-6 z-40 hidden -translate-y-1/2 2xl:block">
      <div className="relative pl-4">
        <div className="absolute top-0 bottom-0 left-0 w-px bg-line" />
        <motion.div className="absolute top-0 left-0 w-px origin-top bg-ink dark:bg-hl" style={{ scaleY: scrollYProgress, height: '100%' }} />
        <ol className="space-y-3 font-mono text-[10.5px] tracking-wide uppercase">
          {SECTIONS.map((section, index) => (
            <li key={section.id}>
              <a href={`#${section.id}`} className={`flex gap-2 transition-colors ${active === section.id ? 'text-ink' : 'text-ink-3 hover:text-ink-2'}`}>
                <span>0{index + 1}</span>
                <span className={active === section.id ? 'marker' : ''}>{section.label}</span>
              </a>
            </li>
          ))}
        </ol>
      </div>
    </aside>
  )
}
