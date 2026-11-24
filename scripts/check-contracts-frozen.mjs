#!/usr/bin/env node
// MOD-3, MOD-6: a change to the frozen contracts or Threading.swift against the base needs a
// `CONTRACT-CHANGE(<reason>)` waiver and an updated docs/guides/contracts.md in the same diff.
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { changedFiles, resolveBase } from './lib/changed-lines.mjs'
import { finding, isEntry, report } from './lib/findings.mjs'
import { readReasonTags, readWaiverSources, selectWaivers } from './lib/pr-waivers.mjs'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const CONTRACTS_GUIDE = 'docs/guides/contracts.md'
const FROZEN = [
  { rule: 'MOD-3', matches: (file) => file.startsWith('app/Sources/ForetypeCore/Contracts/') },
  { rule: 'MOD-6', matches: (file) => file === 'app/Sources/ForetypeMac/Threading.swift' },
]

/** Problems for a diff: `changed` paths, and the CONTRACT-CHANGE reasons that count. */
export function findContractProblems(changed, reasons) {
  const touched = changed.flatMap((file) => FROZEN.filter(({ matches }) => matches(file)).map(({ rule }) => ({ file, rule })))
  if (touched.length === 0) return []
  const guideUpdated = changed.includes(CONTRACTS_GUIDE)
  const missing = [
    ...(reasons.length > 0 ? [] : ['a CONTRACT-CHANGE(<reason>) line in the PR body and a commit message']),
    ...(guideUpdated ? [] : [`an update to ${CONTRACTS_GUIDE}`]),
  ]
  if (missing.length === 0) return []
  return touched.map(({ file, rule }) => finding(file, 1, rule, `is frozen; changing it needs ${missing.join(' and ')}`))
}

function main() {
  const base = resolveBase(ROOT)
  if (!base) return report('check-contracts-frozen', [], 'no origin/main to compare with; nothing judged')
  const changed = changedFiles(ROOT, base, { deleted: true })
  const { waived, notices } = selectWaivers('CONTRACT-CHANGE', readWaiverSources(ROOT, base), readReasonTags)
  for (const notice of notices) console.log(`check-contracts-frozen: ${notice}`)
  const problems = findContractProblems(changed, [...waived.keys()])
  return report('check-contracts-frozen', problems, 'no frozen file changed without its waiver and guide update')
}

if (isEntry(import.meta.url)) process.exitCode = main()
