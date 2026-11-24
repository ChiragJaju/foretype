import { useCallback, useSyncExternalStore } from 'react'
import { flushSync } from 'react-dom'

export type Theme = 'light' | 'dark'

const THEME_REVEAL_MS = 760
const listeners = new Set<() => void>()

function readTheme(): Theme {
  return document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light'
}

function writeTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme
  try {
    localStorage.setItem('theme', theme)
  } catch {
    // Storage can be blocked (private mode); the theme still applies for this visit.
  }
  listeners.forEach((notify) => notify())
}

function subscribe(notify: () => void) {
  listeners.add(notify)
  return () => listeners.delete(notify)
}

type ThemeToggleOptions = { origin?: { x: number; y: number } }

function revealFrames({ origin }: ThemeToggleOptions) {
  const x = origin?.x ?? innerWidth - 40
  const y = origin?.y ?? 32
  const radius = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y))
  return [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`]
}

const prefersReducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches

export function useTheme() {
  const theme = useSyncExternalStore(subscribe, readTheme, () => 'light' as Theme)

  // Reveals the new theme as a circle from the click point.
  const toggle = useCallback((options: ThemeToggleOptions = {}) => {
    const next: Theme = readTheme() === 'dark' ? 'light' : 'dark'
    if (!document.startViewTransition || prefersReducedMotion()) {
      writeTheme(next)
      return
    }
    const transition = document.startViewTransition(() => flushSync(() => writeTheme(next)))
    transition.ready.then(() => {
      document.documentElement.animate(
        { clipPath: revealFrames(options) },
        { duration: THEME_REVEAL_MS, easing: 'cubic-bezier(0.22, 1, 0.36, 1)', pseudoElement: '::view-transition-new(root)' },
      )
    })
  }, [])

  return { theme, toggle }
}
