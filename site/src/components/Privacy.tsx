import { AnimatePresence, motion, useInView } from 'motion/react'
import { ArrowUpRight, Cloud, Code, Cpu, EyeOff, ShieldBan, WifiOff } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useRepoLink } from '../lib/activity'
import { Reveal } from './Reveal'

const POINTS = [
  { icon: Cpu, title: 'Runs on your Mac', body: 'A small model on Apple Silicon does the predicting. No server sees your drafts.' },
  {
    icon: WifiOff,
    title: 'Zero telemetry',
    body: 'No analytics, no crash pings, no licence calls home. Check it with any network monitor.',
  },
  { icon: Code, title: 'Open-source core', body: 'Read every line that touches your text. Build it yourself if you prefer.' },
  {
    icon: ShieldBan,
    title: 'Blocked by default',
    body: 'Banks, password managers, 2FA apps and secure fields are off-limits from day one.',
  },
  { icon: EyeOff, title: 'Nothing on screen is kept', body: 'Context is read when you focus a field and dropped when you leave it.' },
  {
    icon: Cloud,
    title: 'Cloud only if you flip it',
    body: 'Want a bigger model for long replies? Turn it on per app. Off unless you choose.',
  },
]

const TRAFFIC = [
  { app: 'Mail', host: 'imap.mail.me.com', bytes: '12.4 KB' },
  { app: 'Slack', host: 'wss-primary.slack.com', bytes: '3.1 KB' },
  { app: 'Safari', host: 'github.com', bytes: '88.0 KB' },
  { app: 'Linear', host: 'api.linear.app', bytes: '6.7 KB' },
  { app: 'Notes', host: 'gateway.icloud.com', bytes: '1.2 KB' },
]

const LOG_INTERVAL_MS = 1400
const VISIBLE_LINES = 7

type LogLine = { id: number; time: string; app: string; host: string; bytes: string; local: boolean }

function stamp(seconds: number) {
  const total = 9 * 3600 + 41 * 60 + seconds
  const pad = (value: number) => String(value).padStart(2, '0')
  return `${pad(Math.floor(total / 3600))}:${pad(Math.floor(total / 60) % 60)}:${pad(total % 60)}`
}

// Alternates a real-looking app connection with Foretype's (empty) one.
function lineAt(index: number): LogLine {
  const time = stamp(index * 2)
  if (index % 2 === 1) return { id: index, time, app: 'foretype', host: 'no connection', bytes: '0 B', local: true }
  const traffic = TRAFFIC[(index / 2) % TRAFFIC.length]
  return { id: index, time, ...traffic, local: false }
}

function NetworkLog() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref)
  const [count, setCount] = useState(VISIBLE_LINES)
  useEffect(() => {
    if (!inView || matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const timer = setInterval(() => setCount((value) => value + 1), LOG_INTERVAL_MS)
    return () => clearInterval(timer)
  }, [inView])
  const lines = Array.from({ length: VISIBLE_LINES }, (_, offset) => lineAt(count - VISIBLE_LINES + offset))

  return (
    <div ref={ref} className="overflow-hidden rounded-2xl border border-band-line bg-band-2 font-mono text-[11.5px]">
      <div className="flex items-center justify-between border-b border-band-line px-4 py-3 text-band-ink-2">
        <span>Network monitor · outbound</span>
        <span className="rounded bg-band px-1.5 py-0.5 text-[10px] tracking-wider uppercase">Illustrative</span>
      </div>
      <ul className="px-2 py-2">
        <AnimatePresence initial={false}>
          {lines.map((line) => (
            <motion.li
              key={line.id}
              layout
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className={`grid grid-cols-[64px_72px_1fr_auto] gap-3 rounded-md px-2 py-1.5 ${line.local ? 'bg-[color-mix(in_oklab,var(--accent)_14%,transparent)] text-band-ink' : 'text-band-ink-2'}`}
            >
              <span>{line.time}</span>
              <span className={line.local ? 'text-accent' : ''}>{line.app}</span>
              <span className="truncate">{line.host}</span>
              <span>{line.bytes}</span>
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>
      <div className="flex items-center justify-between border-t border-band-line px-4 py-3">
        <span className="text-band-ink-2">foretype · total sent today</span>
        <span className="text-[13px] text-band-ink">0 bytes</span>
      </div>
    </div>
  )
}

const SOURCE_CARD_COPY = {
  public: { title: 'Read the code on GitHub', body: 'Star the repo to follow along, or build it yourself.' },
  private: { title: 'The source goes public with the beta', body: 'Join the waitlist to get the repo link first.' },
}

function SourceCard() {
  const { repoPublic, ...link } = useRepoLink()
  const copy = repoPublic ? SOURCE_CARD_COPY.public : SOURCE_CARD_COPY.private
  return (
    <a
      id="open-source"
      {...link}
      className="group flex items-center justify-between rounded-2xl border border-band-line px-5 py-4 transition-colors hover:bg-band-2"
    >
      <span>
        <span className="block text-[15px] font-medium">{copy.title}</span>
        <span className="text-[13.5px] text-band-ink-2">{copy.body}</span>
      </span>
      <ArrowUpRight size={18} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
    </a>
  )
}

export function Privacy() {
  return (
    <section id="privacy" className="px-3 sm:px-4">
      <div className="mx-auto max-w-[1400px] overflow-hidden rounded-[28px] bg-band px-5 py-20 text-band-ink sm:px-10 sm:py-28 lg:px-16">
        <div className="mx-auto max-w-[1240px]">
          <Reveal className="grid gap-6 lg:grid-cols-[1.35fr_1fr] lg:items-end lg:gap-16">
            <div>
              <div className="eyebrow mb-4">Private by design</div>
              <h2 className="display text-[36px] sm:text-[52px]">
                Local by default.
                <span className="block text-band-ink-2">Open so you can check.</span>
              </h2>
            </div>
            <p className="max-w-[440px] text-[16px] leading-relaxed text-band-ink-2">
              Something that reads your screen should be something you can read. The core is open source, and in local mode it makes no
              network calls at all.
            </p>
          </Reveal>

          <div className="mt-14 grid gap-10 lg:grid-cols-[1.35fr_1fr] lg:gap-16">
            <div className="grid gap-x-8 gap-y-8 sm:grid-cols-2">
              {POINTS.map((point, index) => (
                <Reveal key={point.title} delay={index * 0.05}>
                  <point.icon size={18} strokeWidth={1.6} className="text-accent" />
                  <h3 className="mt-3 text-[17px] font-medium tracking-[-0.01em]">{point.title}</h3>
                  <p className="mt-1.5 text-[14.5px] leading-relaxed text-band-ink-2">{point.body}</p>
                </Reveal>
              ))}
            </div>
            <Reveal delay={0.15} className="flex flex-col gap-4">
              <NetworkLog />
              <SourceCard />
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  )
}
