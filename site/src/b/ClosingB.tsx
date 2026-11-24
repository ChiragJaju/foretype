import { motion } from 'motion/react'
import { useState } from 'react'
import { QUESTIONS } from '../lib/content'
import { emailGhost } from '../lib/predict'
import { Wordmark } from './Chrome'
import { SECTIONS } from './sections'

const TICKER_ITEMS = ['Reads the question', 'Predicts the answer', 'Re-ranks every key', 'Tab to accept', '0 bytes sent', 'Open source']
const APPS = ['Mail', 'Messages', 'Notes', 'Safari', 'Chrome', 'Linear', 'Gmail', 'Superhuman', 'Slack (beta)', 'Notion (beta)', 'Google Docs (beta)']

function TickerRow({ items, inverted, reverse }: { items: string[]; inverted?: boolean; reverse?: boolean }) {
  const doubled = [...items, ...items, ...items, ...items]
  return (
    <div className={`overflow-hidden py-3 ${inverted ? 'bg-ink text-bg' : 'bg-hl text-hl-ink'}`}>
      <div className="flex w-max gap-8 font-mono text-[13px] font-medium tracking-wide uppercase" style={{ animation: `ticker 40s linear infinite${reverse ? ' reverse' : ''}` }}>
        {doubled.map((item, index) => (
          <span key={index} className="flex items-center gap-8 whitespace-nowrap">
            {item}
            <span aria-hidden>✳</span>
          </span>
        ))}
      </div>
    </div>
  )
}

export function Ticker() {
  return (
    <div aria-label="Works in Mail, Messages, Notes, Safari, Chrome and more" className="-rotate-[1.2deg] scale-[1.02]">
      <TickerRow items={TICKER_ITEMS} />
      <TickerRow items={APPS} inverted reverse />
    </div>
  )
}

export function FaqB() {
  return (
    <section className="px-5 py-28 sm:px-10 sm:py-36">
      <div className="mx-auto max-w-[1440px]">
        <span className="label">Questions</span>
        <h2 className="serif mt-5 text-[52px] sm:text-[80px]">
          Fair things <em className="italic">to ask first.</em>
        </h2>
        <dl className="mt-14 grid gap-x-16 gap-y-10 border-t border-line pt-10 md:grid-cols-2">
          {QUESTIONS.map((item, index) => (
            <motion.div
              key={item.q}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: (index % 2) * 0.08, ease: [0.22, 1, 0.36, 1] }}
            >
              <dt className="font-serif text-[28px] leading-tight">{item.q}</dt>
              <dd className="mt-3 text-[15px] leading-relaxed text-ink-2">{item.a}</dd>
            </motion.div>
          ))}
        </dl>
      </div>
    </section>
  )
}

export function JoinB() {
  const [email, setEmail] = useState('')
  const [platform, setPlatform] = useState<'mac' | 'android'>('mac')
  const [joined, setJoined] = useState(false)
  const ghost = emailGhost(email)
  const fieldText = 'font-serif text-[34px] sm:text-[52px]'

  return (
    <section id="join" className="border-t border-line px-5 py-28 sm:px-10 sm:py-40">
      <div className="mx-auto max-w-[1440px]">
        <h2 className="serif text-[84px] sm:text-[180px] lg:text-[220px]">
          Press <em className="marker italic">Tab.</em>
        </h2>
        <p className="mt-6 max-w-[480px] text-[17px] leading-relaxed text-ink-2">
          The Mac beta opens to the waitlist first, together with the source code. Android follows.
        </p>

        {joined ? (
          <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-12 font-serif text-[34px] italic sm:text-[44px]">
            You're on the {platform === 'mac' ? 'Mac' : 'Android'} list. <span className="text-ghost">(Draft site: not stored yet.)</span>
          </motion.p>
        ) : (
          <form
            className="mt-12 max-w-[900px]"
            onSubmit={(event) => {
              event.preventDefault()
              if (email.includes('@')) setJoined(true)
            }}
          >
            <div className="mb-4 flex gap-5 font-mono text-[12px] tracking-wide uppercase">
              {(['mac', 'android'] as const).map((option) => (
                <button key={option} type="button" onClick={() => setPlatform(option)} className={platform === option ? 'marker text-ink' : 'text-ink-3 hover:text-ink-2'}>
                  {option === 'mac' ? 'macOS' : 'Android · soon'}
                </button>
              ))}
            </div>
            <div className="flex items-end gap-4 border-b-2 border-ink pb-2">
              <label className="relative min-w-0 flex-1">
                <span className="sr-only">Email address</span>
                <span aria-hidden className={`${fieldText} pointer-events-none absolute inset-0 overflow-hidden whitespace-pre text-transparent`}>
                  {email}
                  <span className="text-ghost italic">{ghost}</span>
                </span>
                <input
                  type="email"
                  required
                  value={email}
                  placeholder="you@company.com"
                  onChange={(event) => setEmail(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key !== 'Tab' || !ghost) return
                    event.preventDefault()
                    setEmail(email + ghost)
                  }}
                  className={`${fieldText} relative w-full bg-transparent caret-[var(--ink)] outline-none placeholder:text-ghost placeholder:italic dark:caret-[var(--hl)]`}
                />
              </label>
              <button type="submit" className="link-arrow mb-2 shrink-0 text-[16px]">
                Join →
              </button>
            </div>
            <p className="mt-3 text-[13.5px] text-ink-3">
              Type an email and watch the domain arrive. <span className="kbd">tab</span> takes it.
            </p>
          </form>
        )}
      </div>
    </section>
  )
}

export function FooterB() {
  return (
    <footer className="border-t border-line px-5 py-10 sm:px-10">
      <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-6">
        <Wordmark />
        <nav className="flex flex-wrap gap-6 font-mono text-[11.5px] tracking-wide text-ink-2 uppercase">
          {SECTIONS.slice(1, 5).map((section) => (
            <a key={section.id} href={`#${section.id}`} className="hover:text-ink">
              {section.label}
            </a>
          ))}
        </nav>
        <span className="label">© 2026 Foretype</span>
      </div>
    </footer>
  )
}
