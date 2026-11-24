#!/usr/bin/env node
// The size budgets no linter config covers (docs/guides/verify.md): a SwiftUI `body` (CODE-22) and a function or
// closure in a `.tsx` file that is not a component (CODE-20). SwiftLint and oxlint own the rest of CODE-18 to CODE-21.
// A length is the code lines from the declaration to its closing bracket; blank and comment-only lines do not count.
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { resolveBase } from './lib/changed-lines.mjs'
import { finding, isEntry, report } from './lib/findings.mjs'
import { listFiles } from './lib/guidelines.mjs'
import { readWaiverSources, selectWaivers } from './lib/pr-waivers.mjs'
import { countCodeLines, lineAt, maskSource, matchingBracket } from './lib/source-text.mjs'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const MAX_SWIFTUI_BODY_LINES = 80
const MAX_FUNCTION_LINES = 50
const SWIFTUI_BODY = /\bvar\s+body\s*:\s*some\s+\w+\s*\{/g
const ARROW_WITH_BLOCK = /=>\s*([{(])/g
const NAMED_FUNCTION = /\bfunction\s*\*?\s*([A-Za-z_$][\w$]*)?\s*(?:<[^>]*>)?\s*\(/g
const DECLARED_NAME = /(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*(?::[^=]*)?=/
const COMPONENT_NAME = /^[A-Z]/

/** Each SwiftUI `body` with its first line and length. */
export function measureSwiftUIBodies(text) {
  const masked = maskSource(text, { swift: true })
  const lines = masked.split('\n')
  return [...masked.matchAll(SWIFTUI_BODY)].flatMap((match) => {
    const open = match.index + match[0].length - 1
    const close = matchingBracket(masked, open)
    if (close === -1) return []
    const first = lineAt(masked, match.index)
    return [{ line: first, length: countCodeLines(lines, first, lineAt(masked, close)) }]
  })
}

/** Each function and arrow closure with a block or parenthesized body: its name (when declared on its line), line and length. */
export function measureFunctions(text) {
  const masked = maskSource(text)
  const lines = masked.split('\n')
  const measure = (start, open, name) => {
    const close = matchingBracket(masked, open)
    if (close === -1) return []
    const first = lineAt(masked, start)
    return [
      {
        name: name ?? DECLARED_NAME.exec(lines[first - 1])?.[1] ?? null,
        line: first,
        length: countCodeLines(lines, first, lineAt(masked, close)),
      },
    ]
  }
  const arrows = [...masked.matchAll(ARROW_WITH_BLOCK)].flatMap((match) => measure(match.index, match.index + match[0].length - 1))
  const functions = [...masked.matchAll(NAMED_FUNCTION)].flatMap((match) => {
    const paramsClose = matchingBracket(masked, match.index + match[0].length - 1)
    const open = paramsClose === -1 ? -1 : masked.indexOf('{', paramsClose)
    return open === -1 ? [] : measure(match.index, open, match[1])
  })
  return [...arrows, ...functions]
}

/** Budget findings for one file. */
export function findBudgetProblems(file, text) {
  if (file.endsWith('.swift'))
    return measureSwiftUIBodies(text)
      .filter(({ length }) => length > MAX_SWIFTUI_BODY_LINES)
      .map(({ line, length }) =>
        finding(file, line, 'CODE-22', `SwiftUI body is ${length} lines, over ${MAX_SWIFTUI_BODY_LINES}; extract a named subview`),
      )
  return measureFunctions(text)
    .filter(({ name, length }) => !(name && COMPONENT_NAME.test(name)) && length > MAX_FUNCTION_LINES)
    .map(({ name, line, length }) =>
      finding(file, line, 'CODE-20', `${name ?? 'a closure'} is ${length} lines, over ${MAX_FUNCTION_LINES}; extract a cohesive piece`),
    )
}

function main() {
  const files = listFiles(ROOT, ['app/*.swift', 'site/src/*.tsx'])
  const problems = files.flatMap((file) => findBudgetProblems(file, readFileSync(path.join(ROOT, file), 'utf8')))
  const base = resolveBase(ROOT)
  const { waived, notices } = selectWaivers('BUDGET-SKIP', readWaiverSources(ROOT, base))
  for (const notice of notices) console.log(`check-budgets: ${notice}`)
  // Solo maintainer: a BUDGET-SKIP has no second approver, so it is reported and honoured, not gated.
  const waivedProblems = problems.filter(({ rule }) => waived.has(rule))
  for (const { file, line, rule } of waivedProblems)
    console.log(`check-budgets: ${file}:${line} over ${rule}, waived by BUDGET-SKIP(${rule}): ${waived.get(rule)}`)
  const failing = problems.filter(({ rule }) => !waived.has(rule))
  return report('check-budgets', failing, `${files.length} files within the SwiftUI body and .tsx function budgets`)
}

if (isEntry(import.meta.url)) process.exitCode = main()
