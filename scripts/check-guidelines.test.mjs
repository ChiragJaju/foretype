import assert from 'node:assert/strict'
import { mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { test } from 'node:test'

import {
  findDateProblems,
  findDeclarationProblems,
  findDocPathProblems,
  findFormProblems,
  findIdProblems,
  findPointerProblems,
  findSkillProblems,
} from './check-guidelines.mjs'
import { parseDefinitions } from './lib/guidelines.mjs'

const source = (file, text) => ({ file, text, definitions: parseDefinitions(text) })
const rulesOf = (problems) => problems.map((it) => `${it.file}:${it.line} ${it.rule}`)

test('a rule id defined twice is reported at the second definition', () => {
  const problems = findIdProblems([
    source('docs/guidelines/code.md', '**CODE-1. Search first.**\n'),
    source('docs/guidelines/code.md', '\n**CODE-1. Search again.**\n'),
  ])
  assert.deepEqual(rulesOf(problems), ['docs/guidelines/code.md:2 AGENTS-2'])
})

test('a rule in the wrong home is reported: shared ids in their family file, scoped ids in one AGENTS.md', () => {
  const problems = findIdProblems([
    source('docs/guidelines/swift.md', '**CODE-1. Wrong family file.**\n'),
    source('app/Sources/ForetypeCore/AGENTS.md', '**MOD-9. A shared number in a module file.**\n'),
    source('app/Sources/ForetypeMac/AGENTS.md', '**MOD-core-2. Another module’s scope.**\n'),
    source('app/Sources/ForetypeCore/AGENTS.md', '**MOD-core-1. Fine.**\n'),
  ])
  assert.deepEqual(rulesOf(problems), [
    'docs/guidelines/swift.md:1 AGENTS-3',
    'app/Sources/ForetypeCore/AGENTS.md:1 AGENTS-3',
    'app/Sources/ForetypeCore/AGENTS.md:1 AGENTS-3',
  ])
})

test('a definition line in another form, or whose bold does not close the sentence, is reported', () => {
  const text = [
    '**CODE-1. Good rule.** Detail.',
    '',
    '- **CODE-2.** Listed instead of bold.',
    '',
    '**CODE-3. Bold closes early**, then the sentence goes on.',
    '',
    'A paragraph that wraps onto a line',
    'SHA-256. starting like an id is not a definition.',
    '',
    '```',
    '**CODE-9 in a fence is an example**',
    '```',
  ].join('\n')
  assert.deepEqual(rulesOf(findFormProblems([source('docs/guidelines/code.md', text)])), [
    'docs/guidelines/code.md:3 AGENTS-2',
    'docs/guidelines/code.md:5 AGENTS-2',
  ])
})

test('a rule over 60 words is reported', () => {
  const long = `**CODE-1. Short sentence.** ${'word '.repeat(60)}`
  assert.match(findFormProblems([source('docs/guidelines/code.md', long)])[0].message, /63 words/)
})

test('a check naming an undefined id, a stale note, and a rule with neither are reported', () => {
  const declarations = [{ id: 'CODE-99', file: 'scripts/check-x.rules.json', line: 1 }]
  const notes = new Map([['SEC-42', { note: 'review', line: 3 }]])
  const problems = findDeclarationProblems(declarations, notes, new Set(['CODE-1']), 'notes.json')
  assert.deepEqual(rulesOf(problems), ['scripts/check-x.rules.json:1 AGENTS-4', 'notes.json:3 AGENTS-4', 'notes.json:1 AGENTS-4'])
  assert.match(problems[2].message, /CODE-1 has no check and no note/)
})

test('an AGENTS.md needs a CLAUDE.md that is exactly @AGENTS.md', () => {
  const files = { 'a/CLAUDE.md': '@AGENTS.md\n', 'b/CLAUDE.md': '# B\nsee AGENTS.md\n' }
  const problems = findPointerProblems(['a/AGENTS.md', 'b/AGENTS.md', 'c/AGENTS.md'], (file) => files[file] ?? null)
  assert.deepEqual(rulesOf(problems), ['b/CLAUDE.md:1 AGENTS-1', 'c/CLAUDE.md:1 AGENTS-1'])
  assert.match(problems[1].message, /missing/)
})

test('a skill mirror that is a copy, points elsewhere, or has no source is reported', (t) => {
  const root = mkdtempSync(path.join(tmpdir(), 'check-guidelines-'))
  t.after(() => rmSync(root, { recursive: true, force: true }))
  const skill = (name, body = `---\nname: ${name}\ndescription: Does ${name}.\n---\n`) => {
    mkdirSync(path.join(root, '.agents/skills', name), { recursive: true })
    writeFileSync(path.join(root, '.agents/skills', name, 'SKILL.md'), body)
  }
  mkdirSync(path.join(root, '.claude/skills'), { recursive: true })
  skill('linked')
  symlinkSync('../../.agents/skills/linked', path.join(root, '.claude/skills/linked'))
  skill('copied')
  mkdirSync(path.join(root, '.claude/skills/copied'))
  skill('elsewhere')
  symlinkSync('../../.agents/skills/linked', path.join(root, '.claude/skills/elsewhere'))
  symlinkSync('../../.agents/skills/gone', path.join(root, '.claude/skills/orphan'))
  assert.deepEqual(rulesOf(findSkillProblems(root)).sort(), [
    '.claude/skills/copied:1 AGENTS-6',
    '.claude/skills/elsewhere:1 AGENTS-6',
    '.claude/skills/orphan:1 AGENTS-6',
  ])
})

test('a SKILL.md without its name or over 200 lines is reported', (t) => {
  const root = mkdtempSync(path.join(tmpdir(), 'check-guidelines-'))
  t.after(() => rmSync(root, { recursive: true, force: true }))
  mkdirSync(path.join(root, '.agents/skills/long'), { recursive: true })
  mkdirSync(path.join(root, '.claude/skills'), { recursive: true })
  writeFileSync(path.join(root, '.agents/skills/long/SKILL.md'), `---\nname: other\ndescription: x\n---\n${'line\n'.repeat(200)}`)
  symlinkSync('../../.agents/skills/long', path.join(root, '.claude/skills/long'))
  const messages = findSkillProblems(root).map((it) => `${it.rule} ${it.message}`)
  assert.deepEqual(messages, ['AGENTS-7 front matter needs name: long', 'AGENTS-7 204 lines; a skill is at most 200'])
})

test('docs/ and the root hold only the allowlist, and Markdown elsewhere only in its homes', () => {
  const files = [
    'docs/DEVLOG.md',
    'docs/guides/contracts.md',
    'docs/guidelines/enforcement-notes.json',
    'docs/assets/hero.png',
    'docs/plans/next.md',
    'docs/EVAL.md',
    'NOTES.md',
    'CHANGELOG.md',
    'app/HANDOFF.md',
    'app/Sources/ForetypeCore/AGENTS.md',
    '.agents/skills/deslop/SKILL.md',
    'design/desktop/notes.md',
    'site/src/App.tsx',
  ]
  assert.deepEqual(rulesOf(findDocPathProblems(files)), [
    'docs/plans/next.md:1 DOC-1',
    'docs/EVAL.md:1 DOC-1',
    'NOTES.md:1 DOC-1',
    'app/HANDOFF.md:1 AGENTS-11',
  ])
})

test('a dated line is reported outside the history docs and code fences only', () => {
  const dated = 'Shipped on 2026-11-24.\n'
  const problems = findDateProblems([
    { file: 'docs/DEVLOG.md', text: dated },
    { file: 'CHANGELOG.md', text: dated },
    { file: 'docs/guides/contracts.md', text: `Intro.\n${dated}` },
    { file: 'docs/architecture.md', text: `\`\`\`\n${dated}\`\`\`\n` },
    { file: 'docs/guidelines/testing.md', text: 'expires:YYYY-MM-DD\n' },
  ])
  assert.deepEqual(rulesOf(problems), ['docs/guides/contracts.md:2 DOC-2'])
})
