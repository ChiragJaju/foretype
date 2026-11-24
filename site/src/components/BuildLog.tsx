import { Check, ChevronLeft, ChevronRight, CircleDashed } from 'lucide-react'
import { useState } from 'react'
import {
  AREA_SWATCH,
  AREAS,
  relativeTime,
  useActivity,
  useMilestones,
  type Activity,
  type Milestone,
  type MilestoneStatus,
} from '../lib/activity'
import { useScrollRow, type RowEdges } from '../lib/scrollRow'
import { ActivityChart } from './ActivityChart'
import { CountUp } from './Numbers'
import { Reveal } from './Reveal'

const milestoneDateFormat = new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' })

function Counters({ activity }: { activity: Activity }) {
  const areasTouched = AREAS.filter((area) => activity.daily.some((day) => day.byArea[area] > 0)).length
  const counters = [
    { value: activity.totals.commits, label: 'commits so far' },
    { value: activity.totals.days, label: 'days with commits' },
    { value: areasTouched, label: `of ${AREAS.length} areas active in 30 days` },
  ]
  return (
    <div className="grid h-full grid-cols-3 gap-px overflow-hidden rounded-2xl bg-line shadow-ring lg:grid-cols-1">
      {counters.map((counter) => (
        <div key={counter.label} className="flex flex-col justify-center bg-bg-2 p-4 sm:p-6">
          <div className="text-[32px] leading-none font-medium tracking-[-0.04em] sm:text-[44px]">
            <CountUp to={counter.value} />
          </div>
          <p className="mt-2.5 text-[12.5px] leading-snug text-ink-2 sm:text-[14px]">{counter.label}</p>
        </div>
      ))}
    </div>
  )
}

// Narrower than card padding, so a card snapped to the edge keeps its text unfaded.
const FADE_PX = 28
const STATUS_LABEL: Record<MilestoneStatus, string> = { done: 'Done', 'in-progress': 'In progress', planned: 'Planned' }

function StatusIcon({ status }: { status: MilestoneStatus }) {
  if (status === 'done') {
    return (
      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-accent text-accent-ink">
        <Check size={12} strokeWidth={2.4} />
      </span>
    )
  }
  if (status === 'in-progress') {
    return (
      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-bg-2 shadow-[inset_0_0_0_1.5px_var(--accent)]">
        <span className="h-2 w-2 rounded-full bg-accent motion-safe:animate-pulse" />
      </span>
    )
  }
  return <CircleDashed size={20} strokeWidth={1.6} className="text-ink-3" />
}

function MilestoneCard({ milestone, step }: { milestone: Milestone; step: number }) {
  const planned = milestone.status === 'planned'
  const surface = planned ? 'border border-dashed border-line-2' : 'bg-bg-2 shadow-ring'
  return (
    <li className="shrink-0 basis-[82%] snap-start last:snap-end sm:basis-[46%] lg:basis-[30.5%]">
      <article className={`flex h-full flex-col rounded-2xl p-5 sm:p-6 ${surface}`}>
        <div className="flex items-center justify-between gap-3">
          <span className="flex items-center gap-2 font-mono text-[10.5px] tracking-wider uppercase">
            <StatusIcon status={milestone.status} />
            <span className={milestone.status === 'in-progress' ? 'text-accent' : 'text-ink-3'}>{STATUS_LABEL[milestone.status]}</span>
          </span>
          <span className="font-mono text-[11px] text-ink-3 tabular-nums">{String(step).padStart(2, '0')}</span>
        </div>
        <h4 className={`mt-5 text-[17px] leading-snug font-medium tracking-[-0.01em] ${planned ? 'text-ink-2' : ''}`}>{milestone.title}</h4>
        <p className="mt-2 text-[14px] leading-relaxed text-ink-2">{milestone.detail}</p>
        <div className="mt-auto flex items-center justify-between gap-3 pt-5 font-mono text-[10.5px] tracking-wider text-ink-3 uppercase">
          <span className="inline-flex items-center gap-1.5">
            <span className={`h-2 w-2 rounded-[2px] ${AREA_SWATCH[milestone.area]}`} />
            {milestone.area}
          </span>
          {!planned && <span>{milestoneDateFormat.format(new Date(`${milestone.date}T00:00:00`))}</span>}
        </div>
      </article>
    </li>
  )
}

// Fades only the sides that have more cards behind them.
function edgeFade({ atStart, atEnd }: RowEdges) {
  const left = atStart ? 'black 0' : `transparent 0, black ${FADE_PX}px`
  const right = atEnd ? 'black 100%' : `black calc(100% - ${FADE_PX}px), transparent 100%`
  return `linear-gradient(to right, ${left}, ${right})`
}

function PageButton({ direction, disabled, onPage }: { direction: -1 | 1; disabled: boolean; onPage: (direction: -1 | 1) => void }) {
  const Icon = direction === -1 ? ChevronLeft : ChevronRight
  return (
    <button
      type="button"
      aria-label={direction === -1 ? 'Earlier milestones' : 'Later milestones'}
      disabled={disabled}
      onClick={() => onPage(direction)}
      className="flex h-9 w-9 items-center justify-center rounded-full bg-bg-2 text-ink shadow-ring transition-opacity disabled:opacity-35"
    >
      <Icon size={16} strokeWidth={1.8} />
    </button>
  )
}

function MilestoneCards({ milestones }: { milestones: Milestone[] }) {
  const row = useScrollRow<HTMLOListElement>()
  const doneCount = milestones.filter((milestone) => milestone.status === 'done').length
  const mask = edgeFade(row.edges)
  return (
    <div>
      <div className="mb-5 flex items-center justify-between gap-4">
        <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
          <h3 className="text-[15px] font-medium tracking-[-0.01em]">Milestones</h3>
          <span className="font-mono text-[10.5px] tracking-wider text-ink-3 uppercase">
            {doneCount} of {milestones.length} done
          </span>
        </div>
        <div className="flex shrink-0 gap-2">
          <PageButton direction={-1} disabled={row.edges.atStart} onPage={row.page} />
          <PageButton direction={1} disabled={row.edges.atEnd} onPage={row.page} />
        </div>
      </div>
      <ol
        ref={row.ref}
        onScroll={row.onScroll}
        tabIndex={0}
        aria-label="Milestones, oldest to newest"
        data-lenis-prevent-horizontal
        style={{ maskImage: mask, WebkitMaskImage: mask }}
        className="-mx-3 -my-3 flex snap-x snap-mandatory scroll-px-3 gap-4 overflow-x-auto overscroll-x-contain px-3 py-3 [scrollbar-width:none] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent [&::-webkit-scrollbar]:hidden"
      >
        {milestones.map((milestone, index) => (
          <MilestoneCard key={milestone.title} milestone={milestone} step={index + 1} />
        ))}
      </ol>
    </div>
  )
}

function Milestones() {
  const milestones = useMilestones()
  if (milestones.status !== 'ready') return null
  return <MilestoneCards milestones={milestones.data} />
}

export function BuildLog() {
  const activity = useActivity()
  const [nowMs] = useState(Date.now)

  return (
    <section id="build-log" className="px-4 py-24 sm:px-6 sm:py-32">
      <div className="mx-auto max-w-[1240px]">
        <Reveal className="grid gap-6 lg:grid-cols-[1.35fr_1fr] lg:items-end lg:gap-16">
          <div>
            <div className="eyebrow mb-4">Build log</div>
            <h2 className="display text-[36px] sm:text-[52px]">
              Built in the open.
              <span className="block text-ink-3">Every commit, counted.</span>
            </h2>
          </div>
          <div className="max-w-[440px]">
            <p className="text-[16px] leading-relaxed text-ink-2">
              These numbers come straight from the repository's history and refresh every six hours.
              {activity.status === 'ready' && !activity.data.repoPublic && ' Commit messages show up here once the source is public.'}
            </p>
            <p className="mt-3 font-mono text-[11px] tracking-wider text-ink-3 uppercase">
              {activity.status === 'ready' && `Last updated ${relativeTime(activity.data.generatedAt, nowMs)}`}
              {activity.status === 'unavailable' && 'Commit activity is unavailable right now'}
            </p>
          </div>
        </Reveal>

        {activity.status === 'ready' && (
          <div className="mt-14 grid gap-6 lg:grid-cols-[1.35fr_1fr] lg:gap-8">
            <Reveal className="h-full lg:col-start-2 lg:row-start-1">
              <Counters activity={activity.data} />
            </Reveal>
            <Reveal delay={0.08} className="lg:col-start-1 lg:row-start-1">
              <ActivityChart activity={activity.data} nowMs={nowMs} />
            </Reveal>
          </div>
        )}
        <Reveal delay={0.12} className="mt-6 lg:mt-8">
          <Milestones />
        </Reveal>
      </div>
    </section>
  )
}
