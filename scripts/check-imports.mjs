#!/usr/bin/env node
// What each Swift module may reach for (docs/guidelines/modules.md, privacy.md): the target graph in Package.swift
// against MOD-2, every `import` against its target's dependencies, Core's system imports, and the network,
// clipboard and telemetry APIs the privacy rules forbid. Comments and strings are ignored.
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { finding, isEntry, report } from './lib/findings.mjs'
import { listFiles } from './lib/guidelines.mjs'
import { lineAt, maskSource, matchingBracket } from './lib/source-text.mjs'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const MANIFEST = 'app/Package.swift'
const TEST_SUPPORT = 'ForetypeTestSupport'

// MOD-2: the dependencies each library and executable target may declare. Test targets are leaves.
const ALLOWED_DEPENDENCIES = {
  ForetypeCore: [],
  ForetypeEngine: ['ForetypeCore', 'llama'],
  ForetypeMac: ['ForetypeCore'],
  ForetypeTestSupport: ['ForetypeCore'],
  ForetypeApp: ['ForetypeCore', 'ForetypeEngine', 'ForetypeMac'],
  'foretype-eval': ['ForetypeCore', 'ForetypeEngine'],
}
const CORE_IMPORTS = new Set(['Foundation', 'os', 'Observation', 'Synchronization', 'CryptoKit', 'Security'])
const LLAMA_HOME = 'app/Sources/ForetypeEngine/LlamaEngine.swift'
const NETWORK_HOME = 'app/Sources/ForetypeEngine/ModelStore.swift'
const CLOCK_HOME = 'app/Sources/ForetypeCore/Contracts/Clock.swift'

const IMPORT = /^[^\S\n]*(?:@\w+[^\S\n]+)*import[^\S\n]+(?:(?:struct|class|enum|protocol|typealias|func|let|var|actor)[^\S\n]+)?(\w+)/gm
const NETWORK_API =
  /\b(?:URLSession\w*|NWConnection|NWListener|NWBrowser|NWPathMonitor|CFStream\w*|CFSocket\w*|\w*WebSocket\w*|WKWebView)\b/g
const NETWORK_MODULES = new Set(['Network', 'WebKit'])
const CLIPBOARD_API = /\b(?:NSPasteboard|UIPasteboard)\b/g
const WALL_CLOCK = /\bDate\(\)|\bContinuousClock\b|\bTask\.sleep\b/g
// PRIV-4: SDKs whose job is to report on the user or check for updates. Matched as module prefixes and package URLs.
const TELEMETRY_SDKS = [
  'Firebase',
  'Crashlytics',
  'Sentry',
  'Bugsnag',
  'Mixpanel',
  'Amplitude',
  'Segment',
  'PostHog',
  'TelemetryDeck',
  'AppCenter',
  'Datadog',
  'NewRelic',
  'Countly',
  'Instabug',
  'Embrace',
  'Sparkle',
]
const isTelemetry = (name) => TELEMETRY_SDKS.some((sdk) => name.toLowerCase().startsWith(sdk.toLowerCase()))

const moduleName = (target) => target.replace(/-/g, '_')

/** Targets in Package.swift: `{ name, kind, dependencies, line }`, from `.target(`, `.executableTarget(`, `.testTarget(`. */
export function parseTargets(manifest) {
  const masked = maskSource(manifest, { swift: true })
  const call = /\.(target|executableTarget|testTarget|binaryTarget)\(/g
  return [...masked.matchAll(call)].flatMap((match) => {
    const open = match.index + match[0].length - 1
    const close = matchingBracket(masked, open)
    const body = manifest.slice(open, close)
    const name = /name:\s*"([^"]+)"/.exec(body)?.[1]
    if (!name) return []
    const list = /dependencies:\s*\[([^\]]*)\]/.exec(body)?.[1] ?? ''
    const dependencies = [...list.matchAll(/"([^"]+)"/g)].map((it) => it[1])
    return [{ name, kind: match[1], dependencies, line: lineAt(manifest, match.index) }]
  })
}

/** The package URLs Package.swift depends on, with their lines. */
function parsePackageUrls(manifest) {
  return [...manifest.matchAll(/\.package\([^)]*url:\s*"([^"]+)"/g)].map((match) => ({
    url: match[1],
    line: lineAt(manifest, match.index),
  }))
}

/** MOD-2, MOD-7, PRIV-4: the declared graph against the allowed one. */
export function findManifestProblems(manifest) {
  const graphProblems = parseTargets(manifest)
    .filter(({ kind }) => kind !== 'testTarget' && kind !== 'binaryTarget')
    .flatMap(({ name, dependencies, line }) => {
      const allowed = ALLOWED_DEPENDENCIES[name]
      if (!allowed)
        return [finding(MANIFEST, line, 'MOD-2', `${name} is not in MOD-2's graph; add it to modules.md and check-imports first`)]
      return dependencies
        .filter((dependency) => !allowed.includes(dependency))
        .map((dependency) =>
          dependency === TEST_SUPPORT
            ? finding(MANIFEST, line, 'MOD-7', `${name} depends on ${TEST_SUPPORT}; only test targets may`)
            : finding(MANIFEST, line, 'MOD-2', `${name} may not depend on ${dependency}; MOD-2 allows ${allowed.join(', ') || 'nothing'}`),
        )
    })
  const telemetry = parsePackageUrls(manifest)
    .filter(({ url }) => isTelemetry(path.posix.basename(url).replace(/\.git$/, '')))
    .map(({ url, line }) => finding(MANIFEST, line, 'PRIV-4', `${url} is a telemetry or update SDK`))
  return [...graphProblems, ...telemetry]
}

/** Each target's own module plus every module it reaches through declared dependencies. */
function reachableModules(targets) {
  const byName = new Map(targets.map((target) => [target.name, target]))
  const reach = (name, seen = new Set()) => {
    for (const dependency of byName.get(name)?.dependencies ?? []) {
      if (seen.has(dependency)) continue
      seen.add(dependency)
      reach(dependency, seen)
    }
    return seen
  }
  return new Map(targets.map((target) => [target.name, new Set([target.name, ...reach(target.name)].map(moduleName))]))
}

/** The target a file belongs to: `app/Sources/<target>/` or `app/Tests/<target>/`, else null. */
function targetOf(file) {
  return /^app\/(?:Sources|Tests)\/([^/]+)\//.exec(file)?.[1] ?? null
}

const hits = (masked, pattern) => [...masked.matchAll(pattern)].map((match) => ({ text: match[0], line: lineAt(masked, match.index) }))

/** Import and API problems in one Swift file. `reachable` maps a target to the modules it may import. */
export function findFileProblems(file, text, reachable, packageModules) {
  const masked = maskSource(text, { swift: true })
  const target = targetOf(file)
  const inCore = file.startsWith('app/Sources/ForetypeCore/')
  const inSources = file.startsWith('app/Sources/')
  const imports = hits(masked, IMPORT).map(({ text: statement, line }) => ({ module: /(\w+)$/.exec(statement)[1], line }))
  const problems = imports.flatMap(({ module, line }) => {
    const found = []
    if (isTelemetry(module)) found.push(finding(file, line, 'PRIV-4', `imports ${module}, a telemetry or update SDK`))
    if (inCore && !CORE_IMPORTS.has(module) && module !== 'ForetypeCore')
      found.push(finding(file, line, 'MOD-1', `ForetypeCore imports only ${[...CORE_IMPORTS].join(', ')}; not ${module}`))
    if (module === 'llama' && file.startsWith('app/Sources/ForetypeEngine/') && file !== LLAMA_HOME)
      found.push(finding(file, line, 'MOD-engine-1', `only ${path.posix.basename(LLAMA_HOME)} imports llama`))
    if (target && packageModules.has(module) && !reachable.get(target)?.has(module))
      found.push(finding(file, line, 'MOD-2', `${target} does not depend on ${module} in Package.swift`))
    if (inSources && NETWORK_MODULES.has(module) && file !== NETWORK_HOME)
      found.push(finding(file, line, 'PRIV-1', `imports ${module}; the only network code is ${NETWORK_HOME}`))
    return found
  })
  const network = inSources && file !== NETWORK_HOME ? hits(masked, NETWORK_API) : []
  const clock = inCore && file !== CLOCK_HOME ? hits(masked, WALL_CLOCK) : []
  return [
    ...problems,
    ...network.map(({ text: api, line }) => finding(file, line, 'PRIV-1', `${api} outside ${NETWORK_HOME}`)),
    ...hits(masked, CLIPBOARD_API).map(({ text: api, line }) =>
      finding(file, line, 'PRIV-2', `${api}: Foretype never touches the clipboard`),
    ),
    ...clock.map(({ text: api, line }) => finding(file, line, 'CONC-10', `${api} in ForetypeCore; read time through MonotonicClock`)),
  ]
}

function main() {
  const manifest = readFileSync(path.join(ROOT, MANIFEST), 'utf8')
  const targets = parseTargets(manifest)
  const reachable = reachableModules(targets)
  const packageModules = new Set(targets.map(({ name }) => moduleName(name)))
  const files = listFiles(ROOT, ['app/*.swift'])
  const problems = [
    ...findManifestProblems(manifest),
    ...files.flatMap((file) => findFileProblems(file, readFileSync(path.join(ROOT, file), 'utf8'), reachable, packageModules)),
  ]
  return report('check-imports', problems, `${targets.length} targets and ${files.length} Swift files keep their imports`)
}

if (isEntry(import.meta.url)) process.exitCode = main()
