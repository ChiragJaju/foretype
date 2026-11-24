#!/usr/bin/env node
// TEST-8: a skipped or disabled test carries `QUARANTINE(#<issue>, owner:@<handle>, expires:YYYY-MM-DD) - <reason>`
// on its line or the line above, expiring at most 30 days out; an expired or malformed quarantine fails.
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { finding, isEntry, report } from './lib/findings.mjs'
import { listFiles } from './lib/guidelines.mjs'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const MAX_QUARANTINE_DAYS = 30
const DAY_MS = 24 * 60 * 60 * 1000
const SCANNED = ['app/*.swift', 'scripts/*.test.mjs', 'site/src/*.test.ts', 'site/src/*.test.tsx']
// This check and its test spell out the patterns they look for.
const OWN_FILES = new Set(['scripts/check-quarantine.mjs', 'scripts/check-quarantine.test.mjs'])

const SKIP = /\.disabled\(|\bXCTSkip\b|\b(?:it|test|describe)\.skip\b/
const ANNOTATION = /QUARANTINE\(\s*#\d+\s*,\s*owner:\s*@[\w-]+\s*,\s*expires:\s*(\d{4}-\d{2}-\d{2})\s*\)\s*-\s*\S/
const ANNOTATION_START = /QUARANTINE\(/

/** Quarantine problems in one file, judged on `today` (a UTC midnight Date). */
export function findQuarantineProblems(file, text, today) {
  const lines = text.split('\n')
  const annotated = (index) => ANNOTATION.test(lines[index]) || (index > 0 && ANNOTATION.test(lines[index - 1]))
  const unannotated = lines.flatMap((line, index) =>
    SKIP.test(line) && !annotated(index)
      ? [finding(file, index + 1, 'TEST-8', 'a skipped test needs QUARANTINE(#<issue>, owner:@<handle>, expires:YYYY-MM-DD) - <reason>')]
      : [],
  )
  const annotations = lines.flatMap((line, index) => {
    if (!ANNOTATION_START.test(line)) return []
    const expires = ANNOTATION.exec(line)?.[1]
    if (!expires)
      return [finding(file, index + 1, 'TEST-8', 'malformed; QUARANTINE(#<issue>, owner:@<handle>, expires:YYYY-MM-DD) - <reason>')]
    const daysLeft = (Date.parse(`${expires}T00:00:00Z`) - today.getTime()) / DAY_MS
    if (Number.isNaN(daysLeft)) return [finding(file, index + 1, 'TEST-8', `${expires} is not a date`)]
    if (daysLeft < 0) return [finding(file, index + 1, 'TEST-8', `quarantine expired ${expires}; fix the test or delete it`)]
    if (daysLeft > MAX_QUARANTINE_DAYS)
      return [finding(file, index + 1, 'TEST-8', `expires ${expires}, over ${MAX_QUARANTINE_DAYS} days out`)]
    return []
  })
  return [...unannotated, ...annotations]
}

function todayUtc() {
  const now = new Date()
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
}

function main() {
  const files = listFiles(ROOT, SCANNED).filter((file) => !OWN_FILES.has(file))
  const today = todayUtc()
  const problems = files.flatMap((file) => findQuarantineProblems(file, readFileSync(path.join(ROOT, file), 'utf8'), today))
  return report('check-quarantine', problems, `${files.length} test and app files, every skipped test quarantined and current`)
}

if (isEntry(import.meta.url)) process.exitCode = main()
