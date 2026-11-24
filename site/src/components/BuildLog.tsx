import { Check } from 'lucide-react'
import { useState } from 'react'
import { AREA_SWATCH, AREAS, relativeTime, useActivity, useMilestones, type Activity, type Milestone } from '../lib/activity'
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

function groupByDate(milestones: Milestone[]) {
  const groups = new Map<string, Milestone[]>()
  for (const milestone of milestones) groups.set(milestone.date, [...(groups.get(milestone.date) ?? []), milestone])
  return [...groups]
}

function MilestoneRow({ milestone, last }: { milestone: Milestone; last: boolean }) {
  const done = milestone.status === 'done'
  return (
    <li className="relative grid break-inside-avoid grid-cols-[20px_1fr] gap-3.5 pb-5 last:pb-0">
      {!last && <span aria-hidden className="absolute top-6 bottom-0 left-[9.5px] w-px bg-line-2" />}
      {done ? (
        <span className="mt-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-accent text-accent-ink">
          <Check size={12} strokeWidth={2.4} />
        </span>
      ) : (
        <span className="mt-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-bg-2 shadow-[inset_0_0_0_1.5px_var(--accent)]">
          <span className="h-2 w-2 animate-pulse rounded-full bg-accent" />
        </span>
      )}
      <div className="min-w-0">
        <span className="sr-only">{done ? 'Done: ' : 'In progress: '}</span>
        <h4 className="text-[14.5px] leading-snug font-medium tracking-[-0.005em]">{milestone.title}</h4>
        <p className="mt-1 text-[13.5px] leading-relaxed text-ink-2">{milestone.detail}</p>
        <span className="mt-1.5 inline-flex items-center gap-1.5 font-mono text-[10.5px] tracking-wider text-ink-3 uppercase">
          <span className={`h-2 w-2 rounded-[2px] ${AREA_SWATCH[milestone.area]}`} />
          {milestone.area}
        </span>
      </div>
    </li>
  )
}

function Milestones() {
  const milestones = useMilestones()
  if (milestones.status !== 'ready') return null
  const doneCount = milestones.data.filter((milestone) => milestone.status === 'done').length
  return (
    <div className="rounded-2xl bg-bg-2 p-5 shadow-ring sm:p-6">
      <div className="mb-5 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h3 className="text-[15px] font-medium tracking-[-0.01em]">Milestones</h3>
        <span className="font-mono text-[10.5px] tracking-wider text-ink-3 uppercase">
          {doneCount} of {milestones.data.length} done
        </span>
      </div>
      {groupByDate(milestones.data).map(([date, entries]) => (
        <div key={date}>
          <div className="mb-3 font-mono text-[11px] tracking-wider text-accent uppercase">
            {milestoneDateFormat.format(new Date(`${date}T00:00:00`))}
          </div>
          <ol className="gap-x-12 lg:columns-2">
            {entries.map((milestone, index) => (
              <MilestoneRow key={milestone.title} milestone={milestone} last={index === entries.length - 1} />
            ))}
          </ol>
        </div>
      ))}
    </div>
  )
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
