#!/usr/bin/env node
// Judges only the lines this branch adds (docs/guides/verify.md): cheap text rules on every code file, plus the
// SwiftLint and oxlint findings that land on an added line, warnings included. A missing tool is skipped with a notice.
import { spawnSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { addedLines, changedFiles, resolveBase } from './lib/changed-lines.mjs'
import { finding, isEntry, report } from './lib/findings.mjs'
import { readTools } from './lib/guidelines.mjs'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const CODE_FILE = /\.(?:swift|ts|tsx|js|mjs|cjs|sh|ya?ml)$|^\.githooks\//
const SWIFT_FILE = /^app\/.*\.swift$/
const SITE_FILE = /^site\/src\/.*\.(?:ts|tsx)$/
// This check and its test spell out the patterns they look for.
const OWN_FILES = new Set(['scripts/check-anti-slop.mjs', 'scripts/check-anti-slop.test.mjs'])
const FALLBACK_RULE = 'CODE-25'
const TOOL_MAX_BUFFER_BYTES = 64 << 20

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

/** Keeps the findings whose line the branch added. `added` is Map of path → Set of lines. */
export function keepAdded(findings, added) {
  return findings.filter(({ file, line }) => added.get(file)?.has(line))
}

/** The rule id a tool's own rule maps to in tool-enforcement.json, else CODE-25 (a red check is fixed). */
export function ruleIdFor(toolRules, name, plugin) {
  return toolRules?.[name]?.[0] ?? toolRules?.[plugin]?.[0] ?? FALLBACK_RULE
}

function runTool(command, args, cwd) {
  const run = spawnSync(command, args, { cwd, encoding: 'utf8', maxBuffer: TOOL_MAX_BUFFER_BYTES })
  if (run.error) return null
  return run.stdout
}

function swiftlintFindings(files, toolRules) {
  if (files.length === 0) return { findings: [] }
  const out = runTool('swiftlint', ['lint', '--quiet', '--reporter', 'json', ...files], ROOT)
  if (out === null) return { findings: [], notice: 'swiftlint not installed; its findings on added lines were skipped' }
  const findings = JSON.parse(out || '[]')
    // CODE-15's text rule already reports these on every file kind.
    .filter((it) => it.rule_id !== 'todo')
    .map((it) => finding(path.relative(ROOT, it.file), it.line, ruleIdFor(toolRules, it.rule_id), `swiftlint ${it.rule_id}: ${it.reason}`))
  return { findings }
}

function oxlintFindings(files, toolRules) {
  if (files.length === 0) return { findings: [] }
  const bin = path.join(ROOT, 'site/node_modules/.bin/oxlint')
  if (!existsSync(bin)) return { findings: [], notice: 'site/node_modules missing; oxlint findings on added lines were skipped' }
  const siteRelative = files.map((file) => file.replace(/^site\//, ''))
  const out = runTool(bin, ['--format', 'json', ...siteRelative], path.join(ROOT, 'site'))
  const { diagnostics } = JSON.parse(out)
  const findings = diagnostics.map((it) => {
    const [, plugin, name] = /^([\w-]+)\((.+)\)$/.exec(it.code) ?? [null, null, it.code]
    return finding(
      `site/${it.filename}`,
      it.labels[0]?.span.line ?? 1,
      ruleIdFor(toolRules, name, plugin),
      `oxlint ${it.code}: ${it.message}`,
    )
  })
  return { findings }
}

function main() {
  const base = resolveBase(ROOT)
  if (!base) return report('check-anti-slop', [], 'no origin/main to compare with; nothing judged')
  const files = changedFiles(ROOT, base).filter((file) => CODE_FILE.test(file) && !OWN_FILES.has(file))
  const added = addedLines(ROOT, base, files)
  const textProblems = files.flatMap((file) => {
    const lines = readFileSync(path.join(ROOT, file), 'utf8').split('\n')
    const addedHere = [...(added.get(file) ?? [])].map((number) => ({ number, text: lines[number - 1] ?? '' }))
    return findTextProblems(file, addedHere)
  })
  const tools = readTools(ROOT)
  const swift = swiftlintFindings(
    files.filter((file) => SWIFT_FILE.test(file)),
    tools.swiftlint?.rules,
  )
  const site = oxlintFindings(
    files.filter((file) => SITE_FILE.test(file)),
    tools.oxlint?.rules,
  )
  for (const notice of [swift.notice, site.notice].filter(Boolean)) console.log(`check-anti-slop: ${notice}`)
  const problems = [...textProblems, ...keepAdded([...swift.findings, ...site.findings], added)]
  return report('check-anti-slop', problems, `${files.length} changed code files, no problems on added lines`)
}

if (isEntry(import.meta.url)) process.exitCode = main()
