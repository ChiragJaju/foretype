import { useCallback, useLayoutEffect, useRef, useState } from 'react'

export type RowEdges = { atStart: boolean; atEnd: boolean }

// Sub-pixel widths can leave scrollLeft a pixel short of either end.
const EDGE_TOLERANCE_PX = 2

const prefersReducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches

function readEdges(row: HTMLElement): RowEdges {
  const maxScrollLeft = row.scrollWidth - row.clientWidth
  return { atStart: row.scrollLeft <= EDGE_TOLERANCE_PX, atEnd: row.scrollLeft >= maxScrollLeft - EDGE_TOLERANCE_PX }
}

/** A horizontal scroller that opens at its end (the newest item) and pages one view at a time. */
export function useScrollRow<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  const [edges, setEdges] = useState<RowEdges>({ atStart: true, atEnd: true })

  const syncEdges = useCallback(() => {
    const row = ref.current
    if (!row) return
    const next = readEdges(row)
    setEdges((current) => (current.atStart === next.atStart && current.atEnd === next.atEnd ? current : next))
  }, [])

  // Jumps to the end before the first paint, so the newest item shows without a visible scroll.
  useLayoutEffect(() => {
    const row = ref.current
    if (!row) return
    row.scrollLeft = row.scrollWidth
    syncEdges()
    const observer = new ResizeObserver(syncEdges)
    observer.observe(row)
    return () => observer.disconnect()
  }, [syncEdges])

  const page = useCallback((direction: -1 | 1) => {
    const row = ref.current
    if (!row) return
    row.scrollBy({ left: direction * row.clientWidth, behavior: prefersReducedMotion() ? 'auto' : 'smooth' })
  }, [])

  return { ref, edges, page, onScroll: syncEdges }
}
