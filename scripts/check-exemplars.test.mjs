import assert from 'node:assert/strict'
import { test } from 'node:test'

import { findExemplarProblems, listExemplars } from './check-exemplars.mjs'

const TABLE = [
  '# ForetypeCore',
  '',
  '## Copy from',
  '',
  '| Need | Exemplar |',
  '| --- | --- |',
  '| A seam | `Contracts/Seams.swift` |',
  '| A fake | `Contracts/Clock.swift` with `../ForetypeTestSupport/ManualClock.swift` |',
  '| A manifest entry | the `llama` target in `app/Package.swift` |',
  '',
  '## Commands',
  '| ignored | `Other.swift` |',
].join('\n')

test('table paths resolve from the AGENTS.md folder, else from the repo root, and only in Copy from', () => {
  const existing = new Set(['app/Sources/ForetypeCore/Contracts/Seams.swift', 'app/Sources/ForetypeTestSupport/ManualClock.swift'])
  const named = listExemplars('app/Sources/ForetypeCore/AGENTS.md', TABLE, (file) => existing.has(file))
  assert.deepEqual(
    named.map((it) => `${it.line} ${it.file}`),
    [
      '7 app/Sources/ForetypeCore/Contracts/Seams.swift',
      '8 Contracts/Clock.swift',
      '8 app/Sources/ForetypeTestSupport/ManualClock.swift',
      '9 app/Package.swift',
    ],
  )
})

test('a missing exemplar fails at its table row, and one with a disable comment fails at the file', () => {
  const missing = findExemplarProblems('a/AGENTS.md', { named: 'Gone.swift', file: 'Gone.swift', line: 7 }, () => null)
  assert.deepEqual(
    missing.map((it) => `${it.file}:${it.line} ${it.rule}`),
    ['a/AGENTS.md:7 AGENTS-14'],
  )
  const disabled = findExemplarProblems(
    'a/AGENTS.md',
    { named: 'A.swift', file: 'A.swift', line: 7 },
    () => '// swiftlint:disable:next force_cast - fixture\n',
  )
  assert.deepEqual(
    disabled.map((it) => `${it.file}:${it.line} ${it.rule}`),
    ['A.swift:1 AGENTS-14'],
  )
})
