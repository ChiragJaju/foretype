import assert from 'node:assert/strict'
import { test } from 'node:test'

import { readReasonTags, readWaivers, selectWaivers } from './lib/pr-waivers.mjs'

test('a waiver needs an id and a reason on its own line, outside code, quotes and backticks', () => {
  const text = [
    'DOC-SKIP(verify): only a message changed',
    '- DOC-SKIP(contracts): listed is fine',
    'DOC-SKIP(architecture):',
    'DOC-SKIP(architecture)',
    'see `DOC-SKIP(guidelines): example`',
    '> DOC-SKIP(guidelines): quoted',
    '```',
    'DOC-SKIP(guidelines): fenced',
    '```',
  ].join('\n')
  assert.deepEqual(
    [...readWaivers('DOC-SKIP', text)],
    [
      ['verify', 'only a message changed'],
      ['contracts', 'listed is fine'],
    ],
  )
})

test('CONTRACT-CHANGE carries its reason in the parentheses', () => {
  assert.deepEqual(readReasonTags('CONTRACT-CHANGE', 'CONTRACT-CHANGE(add the undo seam)\nCONTRACT-CHANGE()\n'), ['add the undo seam'])
})

test('in a PR run a waiver counts only when the body and a commit both carry it', () => {
  const commits = 'BUDGET-SKIP(CODE-22): the settings form is one screen\nBUDGET-SKIP(CODE-20): table driven\n'
  const prBody = 'BUDGET-SKIP(CODE-22): the settings form is one screen\n'
  const { waived, notices } = selectWaivers('BUDGET-SKIP', { prBody, commits })
  assert.deepEqual([...waived.keys()], ['CODE-22'])
  assert.deepEqual(notices, ['BUDGET-SKIP(CODE-20) is in a commit message only; put it in both'])
  assert.deepEqual([...selectWaivers('BUDGET-SKIP', { prBody: null, commits }).waived.keys()], ['CODE-22', 'CODE-20'])
})
