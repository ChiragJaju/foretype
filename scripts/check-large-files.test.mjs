import assert from 'node:assert/strict'
import { test } from 'node:test'

import { findLargeFiles, MAX_FILE_BYTES } from './check-large-files.mjs'

test('a tracked file over 1 MB fails AGENTS-16, a lockfile does not', () => {
  const sizes = {
    'docs/assets/demo.mov': MAX_FILE_BYTES + 1,
    'site/package-lock.json': MAX_FILE_BYTES * 3,
    'docs/assets/hero.png': MAX_FILE_BYTES,
  }
  const problems = findLargeFiles(Object.keys(sizes), (file) => sizes[file])
  assert.deepEqual(
    problems.map((it) => `${it.file} ${it.rule}`),
    ['docs/assets/demo.mov AGENTS-16'],
  )
})
