import assert from 'node:assert/strict'
import { test } from 'node:test'

import { findTextProblems } from './check-anti-slop.mjs'
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

test('only the lines a diff adds are judged, not the unchanged lines of a touched file', () => {
  const diff = ['+++ b/site/src/a.tsx', '@@ -10,0 +11,2 @@', '+one', '+two'].join('\n')
  assert.deepEqual(parseAddedLines(diff), new Map([['site/src/a.tsx', new Set([11, 12])]]))
})
