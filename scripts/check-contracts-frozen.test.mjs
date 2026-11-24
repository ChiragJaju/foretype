import assert from 'node:assert/strict'
import { test } from 'node:test'

import { findContractProblems } from './check-contracts-frozen.mjs'

const CONTRACT = 'app/Sources/ForetypeCore/Contracts/Seams.swift'
const GUIDE = 'docs/guides/contracts.md'

test('a contract change with neither the waiver nor the guide update fails MOD-3 and names both', () => {
  const [problem] = findContractProblems([CONTRACT], [])
  assert.equal(problem.rule, 'MOD-3')
  assert.match(problem.message, /CONTRACT-CHANGE.*and an update to docs\/guides\/contracts\.md/)
})

test('the waiver alone or the guide alone is not enough', () => {
  assert.equal(findContractProblems([CONTRACT], ['add a seam']).length, 1)
  assert.equal(findContractProblems([CONTRACT, GUIDE], []).length, 1)
})

test('Threading.swift is frozen under MOD-6, and the waiver plus the guide clears it', () => {
  const threading = 'app/Sources/ForetypeMac/Threading.swift'
  assert.equal(findContractProblems([threading], [])[0].rule, 'MOD-6')
  assert.deepEqual(findContractProblems([threading, CONTRACT, GUIDE], ['new executor']), [])
})
