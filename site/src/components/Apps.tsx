import { Reveal } from './Reveal'

type AppSupport = { name: string; beta?: boolean }

// Electron and canvas apps expose less text to Accessibility, so they start in beta.
const ROW_ONE: AppSupport[] = [
  { name: 'Mail' },
  { name: 'Messages' },
  { name: 'Notes' },
  { name: 'Safari' },
  { name: 'Chrome' },
  { name: 'Linear' },
  { name: 'Pages' },
  { name: 'Superhuman' },
]
const ROW_TWO: AppSupport[] = [
  { name: 'Slack', beta: true },
  { name: 'Notion', beta: true },
  { name: 'Gmail' },
  { name: 'Reminders' },
  { name: 'Discord', beta: true },
  { name: 'Google Docs', beta: true },
  { name: 'Calendar' },
  { name: 'Figma comments', beta: true },
]

function Row({ apps, reverse }: { apps: AppSupport[]; reverse?: boolean }) {
  const doubled = [...apps, ...apps]
  return (
    <div className="group flex overflow-hidden [mask-image:linear-gradient(90deg,transparent,black_12%,black_88%,transparent)]">
      <div
        className="flex shrink-0 gap-3 pr-3 group-hover:[animation-play-state:paused]"
        style={{ animation: `marquee 38s linear infinite${reverse ? ' reverse' : ''}` }}
      >
        {doubled.map((app, index) => (
          <span
            key={`${app.name}-${index}`}
            className="inline-flex items-center gap-2 rounded-full bg-bg-2 px-4 py-2 text-[14px] whitespace-nowrap shadow-ring"
          >
            <span className={`h-1.5 w-1.5 rounded-full ${app.beta ? 'bg-[#e0a43a]' : 'bg-[#2fae6a]'}`} />
            {app.name}
            {app.beta && <span className="font-mono text-[10px] tracking-wider text-ink-3 uppercase">beta</span>}
          </span>
        ))}
      </div>
    </div>
  )
}

export function Apps() {
  return (
    <section className="py-10">
      <Reveal className="mx-auto mb-8 max-w-[1240px] px-4 sm:px-6">
        <p className="text-center text-[14px] text-ink-2">Built on macOS Accessibility, so it reaches the text fields you already use.</p>
      </Reveal>
      <div className="space-y-3">
        <Row apps={ROW_ONE} />
        <Row apps={ROW_TWO} reverse />
      </div>
    </section>
  )
}
