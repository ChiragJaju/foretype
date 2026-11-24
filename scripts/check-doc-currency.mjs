#!/usr/bin/env node
// DOC-3: code that changed against the base without the guide that describes it fails, unless the branch carries
// `DOC-SKIP(<id>): <reason>`. The map of code paths to guides is scripts/doc-currency-map.json.
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { changedFiles, reportNoBase, resolveBase } from './lib/changed-lines.mjs'
import { finding, isEntry, report } from './lib/findings.mjs'
import { readWaiverSources, selectWaivers } from './lib/pr-waivers.mjs'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const MAP_FILE = 'scripts/doc-currency-map.json'
// A test describes no behavior a guide states, so it never fires a rule.
const TEST_FILE = /\.test\.mjs$|^app\/Tests\//

/** A glob as a RegExp: `**` spans folders, `*` stays inside one. */
export function globToRegExp(glob) {
  const source = glob
    .split('/')
    .map((segment) => (segment === '**' ? '.*' : segment.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '[^/]*')))
    .join('/')
    .replace(/\.\*\//g, '(?:.*/)?')
  return new RegExp(`^${source}$`)
}

/** One problem per map rule whose code changed while its guide did not and no DOC-SKIP names it. */
export function findCurrencyProblems(rules, changed, waived) {
  const code = changed.filter((file) => !TEST_FILE.test(file))
  return rules.flatMap(({ id, paths, except = [], doc }) => {
    const patterns = paths.map(globToRegExp)
    const triggers = code.filter((file) => patterns.some((it) => it.test(file)) && !except.includes(file))
    if (triggers.length === 0 || changed.includes(doc) || waived.has(id)) return []
    const shown = triggers.slice(0, 3).join(', ') + (triggers.length > 3 ? ` and ${triggers.length - 3} more` : '')
    return [finding(doc, 1, 'DOC-3', `${shown} changed but this guide did not; update it or add DOC-SKIP(${id}): <reason>`)]
  })
}

function main() {
  const base = resolveBase(ROOT)
  if (!base) return reportNoBase('check-doc-currency')
  const { rules } = JSON.parse(readFileSync(path.join(ROOT, MAP_FILE), 'utf8'))
  const changed = changedFiles(ROOT, base, { deleted: true })
  const { waived, notices } = selectWaivers('DOC-SKIP', readWaiverSources(ROOT, base))
  for (const notice of notices) console.log(`check-doc-currency: ${notice}`)
  for (const [id, reason] of waived) console.log(`check-doc-currency: DOC-SKIP(${id}): ${reason}`)
  const problems = findCurrencyProblems(rules, changed, waived)
  return report('check-doc-currency', problems, `${changed.length} changed files, every mapped guide current`)
}

if (isEntry(import.meta.url)) process.exitCode = main()
