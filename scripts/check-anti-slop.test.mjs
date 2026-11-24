import assert from 'node:assert/strict'
import { test } from 'node:test'

import { findTextProblems, keepAdded, ruleIdFor } from './check-anti-slop.mjs'
import { parseAddedLines } from './lib/changed-lines.mjs'

const rulesOf = (problems) => problems.map((it) => `${it.line} ${it.rule}`)
const numbered = (...texts) => texts.map((text, index) => ({ number: index + 1, text }))

test('follow-up markers and commented-out code markers on added lines are reported', () => {
  const lines = numbered(
    '// TODO: wire this up',
    'let x = 1 // removed',
    '// old:',
    '// Older browsers need this.',
    'const label = "TODO list"',
  )
  assert.deepEqual(rulesOf(findTextProblems('a.swift', lines)), ['1 CODE-15', '2 CODE-15', '3 CODE-15'])
})

test('a disable comment without its rule and a reason is reported, one with both is not', () => {
  const lines = numbered(
    '// swiftlint:disable:next force_unwrapping',
    '// swiftlint:disable:next force_unwrapping - the fixture was just built',
    '// oxlint-disable-next-line no-console',
    '/* eslint-disable */',
    '// oxlint-disable-next-line no-console -- the CLI prints its report',
    'const pattern = /swiftlint:disable|oxlint-disable/',
  )
  assert.deepEqual(rulesOf(findTextProblems('a.ts', lines)), ['1 CODE-25', '3 CODE-25', '4 CODE-25'])
})

test('a lint finding on an unchanged line of a touched file is not judged', () => {
  const diff = ['+++ b/site/src/a.tsx', '@@ -10,0 +11,2 @@', '+one', '+two'].join('\n')
  const findings = [
    { file: 'site/src/a.tsx', line: 3 },
    { file: 'site/src/a.tsx', line: 12 },
  ]
  assert.deepEqual(keepAdded(findings, parseAddedLines(diff)), [{ file: 'site/src/a.tsx', line: 12 }])
})

test('a tool rule takes its id from tool-enforcement.json, by rule then plugin, else CODE-25', () => {
  const rules = { 'max-lines': ['CODE-18'], 'jsx-a11y': ['UI-4'] }
  assert.equal(ruleIdFor(rules, 'max-lines', 'eslint'), 'CODE-18')
  assert.equal(ruleIdFor(rules, 'alt-text', 'jsx-a11y'), 'UI-4')
  assert.equal(ruleIdFor(rules, 'no-debugger', 'eslint'), 'CODE-25')
})
