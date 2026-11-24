import { motion } from 'motion/react'
import { useState } from 'react'
import { AREA_SWATCH, AREAS, relativeTime, type Activity, type DailyActivity } from '../lib/activity'

const PLOT_HEIGHT_PX = 168
const MAX_Y_TICKS = 4
const TICK_STEPS = [1, 2, 5, 10, 20, 50, 100]
const LATEST_SHOWN = 5
// Tooltips near either edge anchor to that edge so they stay inside the card.
const EDGE_COLUMNS = 4
const BAR_STAGGER_S = 0.015

const dayFormat = new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' })
const formatDay = (date: string) => dayFormat.format(new Date(`${date}T00:00:00`))

function yTicks(maxCommits: number) {
  const step = TICK_STEPS.find((candidate) => maxCommits / candidate <= MAX_Y_TICKS) ?? TICK_STEPS[TICK_STEPS.length - 1]
  const top = Math.max(step, Math.ceil(maxCommits / step) * step)
  return Array.from({ length: top / step + 1 }, (_, index) => index * step)
}

function commitsLabel(count: number) {
  return `${count} ${count === 1 ? 'commit' : 'commits'}`
}

function describeDay(day: DailyActivity) {
  const parts = AREAS.filter((area) => day.byArea[area] > 0).map((area) => `${area} ${day.byArea[area]}`)
  return `${formatDay(day.date)}: ${commitsLabel(day.commits)}${parts.length ? ` (${parts.join(', ')})` : ''}`
}

function Legend({ daily }: { daily: DailyActivity[] }) {
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1.5 text-[12.5px] text-ink-2">
      {AREAS.map((area) => {
        const total = daily.reduce((sum, day) => sum + day.byArea[area], 0)
        return (
          <li key={area} className="flex items-center gap-1.5">
            <span className={`h-2.5 w-2.5 rounded-[3px] ${AREA_SWATCH[area]}`} />
            {area}
            <span className="text-ink-3 tabular-nums">{total}</span>
          </li>
        )
      })}
    </ul>
  )
}

type ColumnPosition = { index: number; columnCount: number }

function tooltipAnchor({ index, columnCount }: ColumnPosition) {
  if (index < EDGE_COLUMNS) return 'left-0'
  if (index >= columnCount - EDGE_COLUMNS) return 'right-0'
  return 'left-1/2 -translate-x-1/2'
}

function Tooltip({ day, position }: { day: DailyActivity; position: ColumnPosition }) {
  const anchor = tooltipAnchor(position)
  const activeAreas = AREAS.filter((area) => day.byArea[area] > 0)
  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute bottom-[calc(100%+8px)] z-10 w-max min-w-[132px] rounded-xl bg-bg-2 px-3 py-2.5 text-[12px] shadow-ring ${anchor}`}
    >
      <div className="font-medium text-ink">{formatDay(day.date)}</div>
      <div className="text-ink-2">{day.commits ? commitsLabel(day.commits) : 'No commits'}</div>
      {activeAreas.length > 0 && (
        <ul className="mt-1.5 space-y-0.5 border-t border-line pt-1.5">
          {activeAreas.map((area) => (
            <li key={area} className="flex items-center justify-between gap-4 text-ink-2">
              <span className="flex items-center gap-1.5">
                <span className={`h-2 w-2 rounded-[2px] ${AREA_SWATCH[area]}`} />
                {area}
              </span>
              <span className="text-ink tabular-nums">{day.byArea[area]}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

type DayColumnProps = {
  day: DailyActivity
  position: ColumnPosition
  topTick: number
  active: boolean
  onActivate: (index: number) => void
}

function DayColumn({ day, position, topTick, active, onActivate }: DayColumnProps) {
  const { index } = position
  const barPercent = (day.commits / topTick) * 100
  const stacked = AREAS.filter((area) => day.byArea[area] > 0)
  return (
    <div
      role="img"
      aria-label={describeDay(day)}
      onPointerEnter={() => onActivate(index)}
      className={`relative flex h-full flex-1 items-end justify-center rounded-md transition-colors ${active ? 'bg-bg-3' : ''}`}
    >
      {day.commits > 0 && (
        <motion.div
          className="flex w-[62%] max-w-[24px] origin-bottom flex-col-reverse gap-[2px]"
          style={{ height: `${barPercent}%` }}
          initial={{ scaleY: 0 }}
          whileInView={{ scaleY: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: index * BAR_STAGGER_S, ease: [0.22, 1, 0.36, 1] }}
        >
          {stacked.map((area, position) => (
            <div
              key={area}
              className={`${AREA_SWATCH[area]} ${position === stacked.length - 1 ? 'rounded-t-[4px]' : ''}`}
              style={{ flexGrow: day.byArea[area] }}
            />
          ))}
        </motion.div>
      )}
      {active && <Tooltip day={day} position={position} />}
    </div>
  )
}

function Plot({ daily }: { daily: DailyActivity[] }) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null)
  const ticks = yTicks(Math.max(...daily.map((day) => day.commits)))
  const topTick = ticks[ticks.length - 1]
  const middle = daily[Math.floor(daily.length / 2)]

  return (
    <div className="grid grid-cols-[auto_1fr] gap-x-3">
      <div className="relative w-5 font-mono text-[10.5px] text-ink-3 tabular-nums" style={{ height: PLOT_HEIGHT_PX }}>
        {ticks.map((tick) => (
          <span key={tick} className="absolute right-0 translate-y-1/2" style={{ bottom: `${(tick / topTick) * 100}%` }}>
            {tick}
          </span>
        ))}
      </div>
      <div className="relative" style={{ height: PLOT_HEIGHT_PX }}>
        {ticks.map((tick) => (
          <div key={tick} aria-hidden className="absolute inset-x-0 h-px bg-line" style={{ bottom: `${(tick / topTick) * 100}%` }} />
        ))}
        <div className="absolute inset-0 flex items-end gap-px" onPointerLeave={() => setActiveIndex(null)}>
          {daily.map((day, index) => (
            <DayColumn
              key={day.date}
              day={day}
              position={{ index, columnCount: daily.length }}
              topTick={topTick}
              active={activeIndex === index}
              onActivate={setActiveIndex}
            />
          ))}
        </div>
      </div>
      <div />
      <div aria-hidden className="mt-2 flex justify-between font-mono text-[10.5px] text-ink-3">
        <span>{formatDay(daily[0].date)}</span>
        <span>{formatDay(middle.date)}</span>
        <span>Today</span>
      </div>
    </div>
  )
}

function Latest({ activity, nowMs }: { activity: Activity; nowMs: number }) {
  const shown = activity.latest.slice(0, LATEST_SHOWN)
  if (!shown.length) return null
  return (
    <div className="mt-5 border-t border-line pt-4">
      <div className="mb-2 font-mono text-[10.5px] tracking-wider text-ink-3 uppercase">Latest commits</div>
      <ul className="space-y-1.5 text-[13px]">
        {shown.map((commit, index) => (
          <li key={commit.sha ?? `${commit.date}-${index}`} className="flex items-center gap-2.5 text-ink-2">
            <span className={`h-2 w-2 shrink-0 rounded-[2px] ${AREA_SWATCH[commit.area]}`} />
            <span className="w-12 shrink-0 text-ink">{commit.area}</span>
            {commit.sha && <span className="shrink-0 font-mono text-[11.5px] text-ink-3">{commit.sha}</span>}
            {commit.subject && <span className="min-w-0 truncate">{commit.subject}</span>}
            <span className="ml-auto shrink-0 text-ink-3">{relativeTime(commit.date, nowMs)}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function DataTable({ daily }: { daily: DailyActivity[] }) {
  const activeDays = daily.filter((day) => day.commits > 0)
  return (
    <details className="mt-4">
      <summary className="cursor-pointer font-mono text-[10.5px] tracking-wider text-ink-3 uppercase hover:text-ink">View as table</summary>
      <div className="mt-3 overflow-x-auto">
        <table className="w-full text-left text-[12.5px] tabular-nums">
          <caption className="sr-only">Commits per day by area, last 30 days. Days without commits are left out.</caption>
          <thead className="text-ink-3">
            <tr>
              <th className="py-1 pr-3 font-medium">Day</th>
              <th className="py-1 pr-3 font-medium">Total</th>
              {AREAS.map((area) => (
                <th key={area} className="py-1 pr-3 font-medium">
                  {area}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="text-ink-2">
            {activeDays.map((day) => (
              <tr key={day.date} className="border-t border-line">
                <td className="py-1 pr-3 text-ink">{formatDay(day.date)}</td>
                <td className="py-1 pr-3">{day.commits}</td>
                {AREAS.map((area) => (
                  <td key={area} className="py-1 pr-3">
                    {day.byArea[area]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  )
}

export function ActivityChart({ activity, nowMs }: { activity: Activity; nowMs: number }) {
  return (
    <figure className="rounded-2xl bg-bg-2 p-5 shadow-ring sm:p-6">
      <figcaption className="mb-4 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <span className="text-[15px] font-medium tracking-[-0.01em]">Commits per day, by area</span>
        <span className="font-mono text-[10.5px] tracking-wider text-ink-3 uppercase">Last 30 days</span>
      </figcaption>
      <Legend daily={activity.daily} />
      <div className="mt-6">
        <Plot daily={activity.daily} />
      </div>
      <Latest activity={activity} nowMs={nowMs} />
      <DataTable daily={activity.daily} />
    </figure>
  )
}
