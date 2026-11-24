import assert from 'node:assert/strict'
import { test } from 'node:test'

import { findQuarantineProblems } from './check-quarantine.mjs'

const TODAY = new Date(Date.UTC(2030, 0, 10))
const quarantine = (expires) => `QUARANTINE(#12, owner:@maintainer, expires:${expires}) - flaky on the CI runner`
const messages = (text) => findQuarantineProblems('a.swift', text, TODAY).map((it) => `${it.line} ${it.message}`)

test('a disabled or skipped test without a quarantine line fails TEST-8', () => {
  const text = '@Test(.disabled("slow")) func a() {}\nthrow XCTSkip("no model")\nit.skip("x", () => {})\n'
  assert.deepEqual(
    findQuarantineProblems('a.swift', text, TODAY).map((it) => `${it.line} ${it.rule}`),
    ['1 TEST-8', '2 TEST-8', '3 TEST-8'],
  )
})

test('skipIf, todo, only and a Swift .enabled(if: false) without a quarantine line fail TEST-8', () => {
  const text = [
    'test.skipIf(isCI)("x", () => {})',
    'it.skipIf(isCI)("x", () => {})',
    'describe.todo("x")',
    'it.only("x", () => {})',
    '@Test(.enabled(if: false)) func a() {}',
    'it("x", () => {})',
  ].join('\n')
  assert.deepEqual(
    findQuarantineProblems('a.ts', text, TODAY).map((it) => `${it.line} ${it.rule}`),
    ['1 TEST-8', '2 TEST-8', '3 TEST-8', '4 TEST-8', '5 TEST-8'],
  )
})

test('a quarantine on the line or the line above, within 30 days, passes', () => {
  assert.deepEqual(messages(`@Test(.disabled("${quarantine('2030-01-20')}")) func a() {}\n`), [])
  assert.deepEqual(messages(`// ${quarantine('2030-02-09')}\nthrow XCTSkip("no model")\n`), [])
})

test('an expired, too distant or malformed quarantine fails', () => {
  assert.deepEqual(messages(`// ${quarantine('2030-01-09')}\n`), ['1 quarantine expired 2030-01-09; fix the test or delete it'])
  assert.deepEqual(messages(`// ${quarantine('2030-02-10')}\n`), ['1 expires 2030-02-10, over 30 days out'])
  assert.match(messages('// QUARANTINE(owner:@maintainer) - no issue\n')[0], /malformed/)
})
