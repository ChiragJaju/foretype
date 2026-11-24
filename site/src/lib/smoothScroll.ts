import Lenis from 'lenis'
import { useEffect } from 'react'

const NAV_OFFSET_PX = -72

export function useSmoothScroll() {
  useEffect(() => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const lenis = new Lenis({ autoRaf: true, anchors: { offset: NAV_OFFSET_PX }, lerp: 0.11 })
    return () => lenis.destroy()
  }, [])
}
