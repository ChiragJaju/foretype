import assert from 'node:assert/strict'
import { test } from 'node:test'

import { findBudgetProblems, measureFunctions } from './check-budgets.mjs'

const lines = (count, line) => Array.from({ length: count }, () => line).join('\n')

test('a SwiftUI body over 80 code lines fails CODE-22; comments and blank lines do not count', () => {
  const body = (count) => `struct V: View {\n    var body: some View {\n${lines(count, '        Text("x")')}\n    }\n}\n`
  assert.deepEqual(
    findBudgetProblems('a.swift', body(80)).map((it) => it.rule),
    ['CODE-22'],
  )
  assert.deepEqual(findBudgetProblems('a.swift', body(78)), [])
  const padded = `struct V: View {\n    var body: some View {\n${lines(78, '        Text("x")')}\n${lines(30, '        // note')}\n\n    }\n}\n`
  assert.deepEqual(findBudgetProblems('a.swift', padded), [])
})

test('a helper or closure over 50 lines in a .tsx fails CODE-20; a component is left to oxlint', () => {
  const fn = (name, count) => `function ${name}() {\n${lines(count, '  step()')}\n}\n`
  assert.deepEqual(
    findBudgetProblems('a.tsx', fn('buildFrames', 49)).map((it) => it.rule),
    ['CODE-20'],
  )
  assert.deepEqual(findBudgetProblems('a.tsx', fn('HeroDemo', 120)), [])
  const handler = `const onKey = (event) => {\n${lines(49, '  step()')}\n}\n`
  assert.equal(findBudgetProblems('a.tsx', handler)[0].message, 'onKey is 51 lines, over 50; extract a cohesive piece')
})

test('braces inside strings and comments do not end a function early', () => {
  const text = ['function render() {', "  const open = '{'", '  // }', '  const close = `}`', '  return open + close', '}'].join('\n')
  assert.deepEqual(measureFunctions(text), [{ name: 'render', line: 1, length: 5 }])
})
