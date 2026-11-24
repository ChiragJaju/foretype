import { motion } from 'motion/react'

const SPEC_ROWS = [
  { key: 'Model', value: 'Small language model, on-device, Apple Silicon' },
  { key: 'Context source', value: 'macOS Accessibility: text, not pixels' },
  { key: 'Screen capture', value: 'Off by default; fallback for canvas apps only' },
  { key: 'Network', value: 'None in local mode' },
  { key: 'Telemetry', value: 'None. No analytics, no crash reports' },
  { key: 'Source', value: 'Open, published with the beta' },
  { key: 'Blocked by default', value: 'Banking, password managers, 2FA apps, secure fields' },
  { key: 'Retention', value: 'Context dropped when you leave a field' },
  { key: 'Cloud model', value: 'Opt-in, per app, off unless you choose' },
  { key: 'Target latency', value: '~150 ms from focus to first suggestion' },
]

const ROW_STAGGER_S = 0.05

export function DatasheetB() {
  return (
    <section id="datasheet" className="border-y border-line bg-bg-2 px-5 py-28 sm:px-10 sm:py-36">
      <div className="mx-auto grid max-w-[1440px] gap-14 lg:grid-cols-[1fr_1.2fr] lg:gap-20">
        <div>
          <span className="label">Datasheet · privacy</span>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
            className="font-serif text-[220px] leading-[0.85] tracking-[-0.05em] sm:text-[340px] lg:text-[420px]"
          >
            0
          </motion.div>
          <p className="serif -mt-2 max-w-[460px] text-[34px] sm:text-[44px]">
            bytes leave your Mac <em className="marker italic">in local mode.</em>
          </p>
          <p className="mt-6 max-w-[440px] text-[16px] leading-relaxed text-ink-2">
            Something that reads your screen should be something you can read. The core is open source; a network monitor will
            show it making no connections.
          </p>
        </div>

        <dl className="self-end border-t border-ink">
          {SPEC_ROWS.map((row, index) => (
            <motion.div
              key={row.key}
              initial={{ opacity: 0, x: 24 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-5% 0px' }}
              transition={{ duration: 0.6, delay: index * ROW_STAGGER_S, ease: [0.22, 1, 0.36, 1] }}
              className="group grid grid-cols-[140px_1fr] gap-4 border-b border-line py-3.5 sm:grid-cols-[200px_1fr]"
            >
              <dt className="label pt-0.5">{row.key}</dt>
              <dd className="text-[15px] transition-transform duration-300 group-hover:translate-x-1">{row.value}</dd>
            </motion.div>
          ))}
        </dl>
      </div>
    </section>
  )
}
