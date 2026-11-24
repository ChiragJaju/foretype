const DESIGNS = [
  { id: 'a', href: '/', label: 'A' },
  { id: 'b', href: '/b/', label: 'B' },
] as const

// Review-only control for comparing the two draft designs; remove before launch.
export function DesignSwitch({ current }: { current: 'a' | 'b' }) {
  return (
    <div className="fixed bottom-4 left-4 z-[90] flex items-center gap-1 rounded-full bg-bg-2/90 p-1 pl-3 font-mono text-[11px] shadow-ring backdrop-blur">
      <span className="mr-1 tracking-wider text-ink-3 uppercase">Design</span>
      {DESIGNS.map((design) => (
        <a
          key={design.id}
          href={design.href}
          aria-current={design.id === current ? 'page' : undefined}
          className={`flex h-7 w-7 items-center justify-center rounded-full font-medium ${
            design.id === current ? 'bg-ink text-bg' : 'text-ink-2 hover:text-ink'
          }`}
        >
          {design.label}
        </a>
      ))}
    </div>
  )
}
