import { useSyncExternalStore } from 'react'

export const REPO_URL = 'https://github.com/ChiragJaju/foretype'

// Stack order, bottom to top; matches the --area-* palette order validated for adjacent pairs.
export const AREAS = ['app', 'engine', 'site', 'docs', 'infra'] as const
export type Area = (typeof AREAS)[number]

export const AREA_SWATCH: Record<Area, string> = {
  app: 'bg-area-app',
  engine: 'bg-area-engine',
  site: 'bg-area-site',
  docs: 'bg-area-docs',
  infra: 'bg-area-infra',
}

export type DailyActivity = { date: string; commits: number; byArea: Record<Area, number> }
// sha and subject exist only when the repo is public (scripts/activity.mjs --public).
export type LatestCommit = { date: string; area: Area; sha?: string; subject?: string }
export type Activity = {
  generatedAt: string
  repoPublic: boolean
  totals: { commits: number; days: number }
  daily: DailyActivity[]
  latest: LatestCommit[]
}
export type Milestone = { date: string; title: string; detail: string; status: 'done' | 'in-progress'; area: Area }

type Remote<T> = { status: 'loading' } | { status: 'ready'; data: T } | { status: 'unavailable'; error: Error }

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null
const isArea = (value: unknown): value is Area => AREAS.some((area) => area === value)

function isDailyActivity(value: unknown): value is DailyActivity {
  if (!isRecord(value) || typeof value.date !== 'string' || typeof value.commits !== 'number') return false
  const { byArea } = value
  return isRecord(byArea) && AREAS.every((area) => typeof byArea[area] === 'number')
}

function isLatestCommit(value: unknown): value is LatestCommit {
  return isRecord(value) && typeof value.date === 'string' && isArea(value.area)
}

function isActivity(value: unknown): value is Activity {
  if (!isRecord(value) || typeof value.generatedAt !== 'string' || typeof value.repoPublic !== 'boolean') return false
  const { totals, daily, latest } = value
  if (!isRecord(totals) || typeof totals.commits !== 'number' || typeof totals.days !== 'number') return false
  return Array.isArray(daily) && daily.every(isDailyActivity) && Array.isArray(latest) && latest.every(isLatestCommit)
}

function isMilestone(value: unknown): value is Milestone {
  if (!isRecord(value) || !isArea(value.area)) return false
  const hasText = [value.date, value.title, value.detail].every((field) => typeof field === 'string')
  return hasText && (value.status === 'done' || value.status === 'in-progress')
}

const isMilestoneList = (value: unknown): value is Milestone[] => Array.isArray(value) && value.every(isMilestone)

// One fetch per file, shared by every component that reads it.
function createJsonStore<T>(url: string, isValid: (value: unknown) => value is T) {
  let state: Remote<T> = { status: 'loading' }
  let requested = false
  const listeners = new Set<() => void>()

  const settle = (next: Remote<T>) => {
    state = next
    listeners.forEach((notify) => notify())
  }

  async function load() {
    try {
      const response = await fetch(url)
      if (!response.ok) throw new Error(`${url} returned HTTP ${response.status}`)
      const body: unknown = await response.json()
      if (!isValid(body)) throw new Error(`${url} does not match the expected shape`)
      settle({ status: 'ready', data: body })
    } catch (cause) {
      settle({ status: 'unavailable', error: new Error(`Could not load ${url}`, { cause }) })
    }
  }

  function subscribe(notify: () => void) {
    listeners.add(notify)
    if (!requested) {
      requested = true
      void load()
    }
    return () => listeners.delete(notify)
  }

  return function useJsonStore() {
    return useSyncExternalStore(subscribe, () => state, () => state)
  }
}

export const useActivity = createJsonStore('/activity.json', isActivity)
export const useMilestones = createJsonStore('/milestones.json', isMilestoneList)

// Until activity.json says the repo is public, source links lead to the waitlist instead of a GitHub 404.
export function useRepoLink() {
  const activity = useActivity()
  const repoPublic = activity.status === 'ready' && activity.data.repoPublic
  return repoPublic
    ? { repoPublic, href: REPO_URL, target: '_blank', rel: 'noreferrer' }
    : { repoPublic, href: '#waitlist', target: undefined, rel: undefined }
}

const RELATIVE_UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ['day', 86_400_000],
  ['hour', 3_600_000],
  ['minute', 60_000],
]
const relativeFormat = new Intl.RelativeTimeFormat('en', { numeric: 'auto' })

export function relativeTime(isoDate: string, nowMs: number) {
  const elapsedMs = new Date(isoDate).getTime() - nowMs
  for (const [unit, unitMs] of RELATIVE_UNITS) {
    if (Math.abs(elapsedMs) >= unitMs) return relativeFormat.format(Math.round(elapsedMs / unitMs), unit)
  }
  return 'just now'
}
