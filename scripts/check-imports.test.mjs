import assert from 'node:assert/strict'
import { test } from 'node:test'

import { findFileProblems, findManifestProblems } from './check-imports.mjs'

const rulesOf = (problems) => problems.map((it) => `${it.line} ${it.rule}`)
const reachable = new Map([
  ['ForetypeCore', new Set(['ForetypeCore'])],
  ['ForetypeMac', new Set(['ForetypeMac', 'ForetypeCore'])],
  ['ForetypeEngine', new Set(['ForetypeEngine', 'ForetypeCore', 'llama'])],
])
const packageModules = new Set(['ForetypeCore', 'ForetypeMac', 'ForetypeEngine', 'llama'])
const check = (file, text) => rulesOf(findFileProblems(file, text, reachable, packageModules))

test('Core importing a UI framework fails MOD-1; its allowed system frameworks pass', () => {
  assert.deepEqual(check('app/Sources/ForetypeCore/Logic/A.swift', 'import Foundation\nimport AppKit\nimport os\n'), ['2 MOD-1'])
})

test('Mac importing Engine fails MOD-2 even though both are package modules', () => {
  assert.deepEqual(check('app/Sources/ForetypeMac/A.swift', 'import ForetypeCore\n@preconcurrency import ForetypeEngine\n'), ['2 MOD-2'])
})

test('llama is imported only by LlamaEngine.swift', () => {
  assert.deepEqual(check('app/Sources/ForetypeEngine/Other.swift', 'import llama\n'), ['1 MOD-engine-1'])
  assert.deepEqual(check('app/Sources/ForetypeEngine/LlamaEngine.swift', 'import llama\n'), [])
})

test('a network API outside ModelStore.swift fails PRIV-1; a comment naming it does not', () => {
  const text = '// URLSession is only in ModelStore\nlet session = URLSession.shared\nimport WebKit\n'
  assert.deepEqual(check('app/Sources/ForetypeMac/A.swift', text), ['3 PRIV-1', '2 PRIV-1'])
  assert.deepEqual(check('app/Sources/ForetypeEngine/ModelStore.swift', 'let session = URLSession.shared\n'), [])
})

test('the clipboard fails PRIV-2 in tests too, and a telemetry SDK fails PRIV-4', () => {
  assert.deepEqual(check('app/Tests/ForetypeMacTests/A.swift', 'let board = NSPasteboard.general\n'), ['1 PRIV-2'])
  assert.deepEqual(check('app/Sources/ForetypeMac/A.swift', 'import FirebaseAnalytics\n'), ['1 PRIV-4'])
})

test('Core reading the wall clock outside SystemClock fails CONC-10', () => {
  assert.deepEqual(check('app/Sources/ForetypeCore/Logic/A.swift', 'let now = Date()\n'), ['1 CONC-10'])
  assert.deepEqual(check('app/Sources/ForetypeCore/Contracts/Clock.swift', 'let origin = ContinuousClock.now\n'), [])
})

test('Package.swift edges outside MOD-2, TestSupport in a library, and a telemetry package are reported', () => {
  const manifest = [
    'let package = Package(',
    '    dependencies: [.package(url: "https://github.com/getsentry/sentry-cocoa", from: "8.0.0")],',
    '    targets: [',
    '        .target(name: "ForetypeMac", dependencies: ["ForetypeCore", "ForetypeEngine"]),',
    '        .target(name: "ForetypeEngine", dependencies: ["ForetypeCore", "ForetypeTestSupport"]),',
    '        .target(name: "ForetypeExtra"),',
    '        .testTarget(name: "ForetypeMacTests", dependencies: ["ForetypeMac", "ForetypeTestSupport"]),',
    '    ]',
    ')',
  ].join('\n')
  assert.deepEqual(rulesOf(findManifestProblems(manifest)), ['4 MOD-2', '5 MOD-7', '6 MOD-2', '2 PRIV-4'])
})
