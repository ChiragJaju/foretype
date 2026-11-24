import assert from 'node:assert/strict'
import { test } from 'node:test'

import { findCurrencyProblems, globToRegExp } from './check-doc-currency.mjs'

const RULES = [
  { id: 'verify', paths: ['scripts/check-*.mjs', '.githooks/**'], except: ['scripts/check-guidelines.mjs'], doc: 'docs/guides/verify.md' },
  { id: 'contracts', paths: ['app/Sources/ForetypeCore/Contracts/**'], doc: 'docs/guides/contracts.md' },
]

test('code changed without its guide fails DOC-3 at the guide', () => {
  const problems = findCurrencyProblems(RULES, ['.githooks/pre-commit'], new Map())
  assert.deepEqual(
    problems.map((it) => `${it.file} ${it.rule}`),
    ['docs/guides/verify.md DOC-3'],
  )
})

test('the guide in the same diff, or a DOC-SKIP for its id, clears the rule', () => {
  assert.deepEqual(findCurrencyProblems(RULES, ['scripts/check-x.mjs', 'docs/guides/verify.md'], new Map()), [])
  assert.deepEqual(findCurrencyProblems(RULES, ['scripts/check-x.mjs'], new Map([['verify', 'internal rename only']])), [])
})

test('tests and excepted paths never fire a rule', () => {
  assert.deepEqual(findCurrencyProblems(RULES, ['scripts/check-x.test.mjs', 'scripts/check-guidelines.mjs'], new Map()), [])
})

test('* stays inside one folder and ** spans folders', () => {
  assert.equal(globToRegExp('scripts/check-*.mjs').test('scripts/lib/check-x.mjs'), false)
  assert.equal(globToRegExp('app/Sources/ForetypeCore/Contracts/**').test('app/Sources/ForetypeCore/Contracts/Seams.swift'), true)
})
