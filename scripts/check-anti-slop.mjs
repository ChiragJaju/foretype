#!/usr/bin/env node
// Judges only the lines this branch adds (docs/guides/verify.md) with cheap text rules on every code file. SwiftLint
// and oxlint findings are the Lint job's, on every file.
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { addedLines, changedFiles, reportNoBase, resolveBase } from './lib/changed-lines.mjs'
import { finding, isEntry, report } from './lib/findings.mjs'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const CODE_FILE = /\.(?:swift|ts|tsx|js|mjs|cjs|sh|ya?ml)$|^\.githooks\//
// This check and its test spell out the patterns they look for.
const OWN_FILES = new Set(['scripts/check-anti-slop.mjs', 'scripts/check-anti-slop.test.mjs'])

const COMMENTED_OUT_MARKER = /(?:\/\/|#)\s*(?:removed|old)\s*(?::|$)/i
// Each marker counts only inside a comment, so a check that names one in a string or pattern is not flagged.
const COMMENT = String.raw`(?:\/\/|\/\*|#|^\s*\*)`
const FOLLOW_UP_MARKER = new RegExp(String.raw`${COMMENT}.*\b(?:TODO|FIXME|HACK)\b`)
const SWIFTLINT_DISABLE = new RegExp(String.raw`${COMMENT}.*swiftlint:disable(?::next|:this|:previous)?(.*)$`)
const SWIFTLINT_REASON = /^\s+\w+(?:\s+\w+)*\s+-\s+\S/
const JS_DISABLE = new RegExp(String.raw`${COMMENT}.*(?:eslint|oxlint)-disable(?:-next-line|-line)?(.*)$`)
const JS_REASON = /^\s+\S+.*?\s--\s+\S/

const TEXT_RULES = [
  { rule: 'CODE-15', matches: (text) => COMMENTED_OUT_MARKER.test(text), message: 'a commented-out code marker; delete the old code' },
  { rule: 'CODE-15', matches: (text) => FOLLOW_UP_MARKER.test(text), message: 'TODO, FIXME or HACK; open a GitHub issue instead' },
  {
    rule: 'CODE-25',
    matches: (text) => {
      const rest = SWIFTLINT_DISABLE.exec(text)?.[1]
      return rest !== undefined && !SWIFTLINT_REASON.test(rest)
    },
    message: 'a swiftlint:disable needs its rule and a reason on the same line: `swiftlint:disable:next <rule> - <reason>`',
  },
  {
    rule: 'CODE-25',
    matches: (text) => {
      const rest = JS_DISABLE.exec(text)?.[1]?.replace(/\*\/\s*$/, '')
      return rest !== undefined && !JS_REASON.test(rest)
    },
    message: 'a lint disable needs its rule and a reason: `oxlint-disable-next-line <rule> -- <reason>`',
  },
]

/** Text-rule problems on the given lines of one file: `lines` is `[{ number, text }]`. */
export function findTextProblems(file, lines) {
  return lines.flatMap(({ number, text }) =>
    TEXT_RULES.filter(({ matches }) => matches(text)).map(({ rule, message }) => finding(file, number, rule, message)),
  )
}

function main() {
  const base = resolveBase(ROOT)
  if (!base) return reportNoBase('check-anti-slop')
  const files = changedFiles(ROOT, base).filter((file) => CODE_FILE.test(file) && !OWN_FILES.has(file))
  const added = addedLines(ROOT, base, files)
  const textProblems = files.flatMap((file) => {
    const lines = readFileSync(path.join(ROOT, file), 'utf8').split('\n')
    const addedHere = [...(added.get(file) ?? [])].map((number) => ({ number, text: lines[number - 1] ?? '' }))
    return findTextProblems(file, addedHere)
  })
  return report('check-anti-slop', textProblems, `${files.length} changed code files, no problems on added lines`)
}

if (isEntry(import.meta.url)) process.exitCode = main()
